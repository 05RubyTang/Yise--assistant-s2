import { createContext, useContext, useReducer, useEffect, useRef, useState } from 'react';
import { ALL_SHINIES } from './data/plans';
import { supabase } from './supabase';

const STORAGE_KEY = 'roco-shiny-helper';
const USERNAME_KEY = 'lk_username';

// ─── 确保 localStorage 里始终有用户名（App 启动时立即执行）───────────────────
function ensureUsername() {
  if (!localStorage.getItem(USERNAME_KEY)) {
    const suffix = Math.floor(1000 + Math.random() * 9000);
    localStorage.setItem(USERNAME_KEY, `小洛克${suffix}`);
  }
}
ensureUsername();

// ─── 默认 state 结构 ──────────────────────────────────────────────────────────
function buildDefaultState() {
  const spirits = {};
  ALL_SHINIES.forEach(name => {
    spirits[name] = { obtained: false, obtainedFrom: null, obtainedAt: null };
  });
  return {
    spirits,
    fruitProgress: {},
    activeTasks: [],
    completedTasks: [],
    userPlanConfig: [],   // 用户自定义方案列表
    ownedFruits: [],      // 已拥有的果实名称列表（果实攻略页标记）
  };
}

// ─── 从 localStorage 读取（离线 / 首屏用）──────────────────────────────────────
function getLocalState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // 兼容旧版单任务数据：迁移 activeTask → activeTasks
      if (parsed.activeTask && !parsed.activeTasks) {
        parsed.activeTasks = [parsed.activeTask];
        delete parsed.activeTask;
      }
      if (!parsed.activeTasks) parsed.activeTasks = [];

      // 与默认值合并：确保新增字段对旧数据自动补全
      const defaults = buildDefaultState();
      return {
        ...defaults,          // 先铺默认值（兜底所有新增顶层字段）
        ...parsed,            // 再用旧数据覆盖（保留已有内容）
        spirits: {
          ...defaults.spirits,  // 新增精灵用默认值（obtained: false）
          ...parsed.spirits,    // 旧精灵数据保留
        },
      };
    }
  } catch {}
  return buildDefaultState();
}

// ─── 辅助：更新 activeTasks 中指定 planId 的任务 ─────────────────────────────
function updateTask(tasks, planId, updater) {
  return tasks.map(t => t.planId === planId ? updater(t) : t);
}

// ─── Reducer（保持不变）──────────────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {
    case 'START_TASK': {
      if (state.activeTasks.some(t => t.planId === action.planId)) {
        return state;
      }
      // ballMode: 'simple' | 'byType'
      // simple 模式：ballStart(number), ballRestocks[{amount, time}]
      // byType 模式：ballStartByType({adv,sea,att}), ballRestocks[{adv,sea,att,time}]
      const newTask = {
        id: 'task_' + Date.now(),
        planId: action.planId,
        status: 'in_progress',
        startTime: new Date().toISOString(),
        shieldBreaks: [],
        shieldBreakCount: 0,
        failedBreaks: 0,
        ballMode: action.ballMode || 'simple',
        ballStart: action.ballStart ?? null,           // simple 模式总数
        ballStartByType: action.ballStartByType ?? null, // byType 模式 {adv,sea,att}
        ballRestocks: [],   // simple: [{amount,time}]  byType: [{adv,sea,att,time}]
      };
      return {
        ...state,
        activeTasks: [...state.activeTasks, newTask],
      };
    }
    case 'RECORD_BREAK': {
      // jelly（果冻/星辰虫）：记录色块供展示，但不增加保底计数
      const isJelly = action.result === 'jelly';
      const newBreak = {
        index: 0,
        result: action.result,
        // spiritName 可选：'original'/'polluted' 记录具体精灵，'shiny'/'jelly' 可为空
        ...(action.spiritName ? { spiritName: action.spiritName } : {}),
        time: new Date().toISOString(),
      };
      return {
        ...state,
        activeTasks: updateTask(state.activeTasks, action.planId, task => {
          // jelly 不占保底序号（index 使用当前 count，不自增）
          newBreak.index = isJelly ? task.shieldBreakCount : task.shieldBreakCount + 1;
          return {
            ...task,
            shieldBreaks: [...task.shieldBreaks, newBreak],
            shieldBreakCount: isJelly ? task.shieldBreakCount : task.shieldBreakCount + 1,
          };
        }),
      };
    }
    case 'RECORD_FAILED_BREAK': {
      return {
        ...state,
        activeTasks: updateTask(state.activeTasks, action.planId, task => ({
          ...task,
          failedBreaks: task.failedBreaks + 1,
        })),
      };
    }
    case 'UNDO_BREAK': {
      return {
        ...state,
        activeTasks: updateTask(state.activeTasks, action.planId, task => {
          if (task.shieldBreaks.length === 0) return task;
          const lastBreak = task.shieldBreaks[task.shieldBreaks.length - 1];
          const isJelly = lastBreak?.result === 'jelly';
          return {
            ...task,
            shieldBreaks: task.shieldBreaks.slice(0, -1),
            // jelly 不占保底计数，撤销时也不减
            shieldBreakCount: isJelly ? task.shieldBreakCount : task.shieldBreakCount - 1,
          };
        }),
      };
    }
    case 'SET_TASK_BALLS': {
      // 用户最新填入的球数据覆盖 task（无论 task 是新建还是已有）
      // 同时清空 ballRestocks，因为起始数据变了，之前的补球记录不再准确
      return {
        ...state,
        activeTasks: updateTask(state.activeTasks, action.planId, task => ({
          ...task,
          ballMode: action.ballMode || 'simple',
          ballStart: action.ballMode === 'byType' ? null : (action.ballStart ?? null),
          ballStartByType: action.ballMode === 'byType' ? (action.ballStartByType ?? null) : null,
          ballRestocks: [],
        })),
      };
    }
    case 'ADD_BALL_RESTOCK': {
      return {
        ...state,
        activeTasks: updateTask(state.activeTasks, action.planId, task => ({
          ...task,
          ballRestocks: [...(task.ballRestocks || []), task.ballMode === 'byType'
            // byType: { adv, sea, att, time }
            ? { adv: action.adv || 0, sea: action.sea || 0, att: action.att || 0, time: new Date().toISOString() }
            // simple: { amount, time }
            : { amount: action.amount || 0, time: new Date().toISOString() }
          ],
        })),
      };
    }
    case 'UNDO_BALL_RESTOCK': {
      return {
        ...state,
        activeTasks: updateTask(state.activeTasks, action.planId, task => {
          const restocks = task.ballRestocks || [];
          if (restocks.length === 0) return task;
          return { ...task, ballRestocks: restocks.slice(0, -1) };
        }),
      };
    }
    case 'COMPLETE_TASK': {
      const task = state.activeTasks.find(t => t.planId === action.planId);
      if (!task) return state;
      const breakdowns = { original: 0, polluted: 0, shiny: 0 };
      task.shieldBreaks.forEach(b => { breakdowns[b.result]++; });
      // 计算咕噜球消耗（兼容 simple / byType）
      let ballsUsed = null;
      let ballsUsedByType = null;
      if (task.ballMode === 'byType') {
        const bst = task.ballStartByType || { adv: 0, sea: 0, att: 0 };
        const bet = action.ballEndByType;       // { adv, sea, att }
        if (bet) {
          const restByType = (task.ballRestocks || []).reduce(
            (s, r) => ({ adv: s.adv + (r.adv || 0), sea: s.sea + (r.sea || 0), att: s.att + (r.att || 0) }),
            { adv: 0, sea: 0, att: 0 }
          );
          ballsUsedByType = {
            adv: bst.adv + restByType.adv - (bet.adv || 0),
            sea: bst.sea + restByType.sea - (bet.sea || 0),
            att: bst.att + restByType.att - (bet.att || 0),
          };
          ballsUsed = ballsUsedByType.adv + ballsUsedByType.sea + ballsUsedByType.att;
        }
      } else {
        const ballStart = task.ballStart;
        const ballEnd = action.ballEnd;
        const restockTotal = (task.ballRestocks || []).reduce((s, r) => s + (r.amount || 0), 0);
        ballsUsed = (ballStart != null && ballEnd != null) ? ballStart + restockTotal - ballEnd : null;
      }
      const ballStart = task.ballMode === 'byType' ? null : task.ballStart;
      const ballEnd = task.ballMode === 'byType' ? null : action.ballEnd;
      const completed = {
        id: task.id,
        planId: task.planId,
        resultSpirit: action.spiritName,
        resultType: action.resultType || (action.isPool ? 'pool' : 'offpool'),
        shieldBreakCount: task.shieldBreakCount,
        breakdowns,
        ballMode: task.ballMode || 'simple',
        ballsUsed,
        ...(ballsUsedByType ? { ballsUsedByType } : {}),
        completedAt: new Date().toISOString(),
      };
      const newSpirits = { ...state.spirits };
      if (action.spiritName && newSpirits[action.spiritName]) {
        newSpirits[action.spiritName] = {
          obtained: true,
          obtainedFrom: task.planId,
          obtainedAt: new Date().toISOString(),
        };
      }
      return {
        ...state,
        spirits: newSpirits,
        activeTasks: state.activeTasks.filter(t => t.planId !== action.planId),
        completedTasks: [completed, ...state.completedTasks],
      };
    }
    case 'COMPLETE_AND_CONTINUE': {
      const task = state.activeTasks.find(t => t.planId === action.planId);
      if (!task) return state;
      const breakdowns = { original: 0, polluted: 0, shiny: 0 };
      task.shieldBreaks.forEach(b => { breakdowns[b.result]++; });
      // 计算咕噜球消耗（兼容 simple / byType）
      let cac_ballsUsed = null;
      let cac_ballsUsedByType = null;
      let nextBallStart = null;
      let nextBallStartByType = null;
      if (task.ballMode === 'byType') {
        const bst = task.ballStartByType || { adv: 0, sea: 0, att: 0 };
        const bet = action.ballEndByType;
        if (bet) {
          const restByType = (task.ballRestocks || []).reduce(
            (s, r) => ({ adv: s.adv + (r.adv || 0), sea: s.sea + (r.sea || 0), att: s.att + (r.att || 0) }),
            { adv: 0, sea: 0, att: 0 }
          );
          cac_ballsUsedByType = {
            adv: bst.adv + restByType.adv - (bet.adv || 0),
            sea: bst.sea + restByType.sea - (bet.sea || 0),
            att: bst.att + restByType.att - (bet.att || 0),
          };
          cac_ballsUsed = cac_ballsUsedByType.adv + cac_ballsUsedByType.sea + cac_ballsUsedByType.att;
          nextBallStartByType = { adv: bet.adv || 0, sea: bet.sea || 0, att: bet.att || 0 };
        }
      } else {
        const ballStart = task.ballStart;
        const ballEnd = action.ballEnd;
        const restockTotal = (task.ballRestocks || []).reduce((s, r) => s + (r.amount || 0), 0);
        cac_ballsUsed = (ballStart != null && ballEnd != null) ? ballStart + restockTotal - ballEnd : null;
        nextBallStart = ballEnd ?? null;
      }
      const completed = {
        id: task.id,
        planId: task.planId,
        resultSpirit: action.spiritName,
        resultType: action.resultType || (action.isPool ? 'pool' : 'offpool'),
        shieldBreakCount: task.shieldBreakCount,
        breakdowns,
        ballMode: task.ballMode || 'simple',
        ballsUsed: cac_ballsUsed,
        ...(cac_ballsUsedByType ? { ballsUsedByType: cac_ballsUsedByType } : {}),
        completedAt: new Date().toISOString(),
      };
      const newSpirits = { ...state.spirits };
      if (action.spiritName && newSpirits[action.spiritName]) {
        newSpirits[action.spiritName] = {
          obtained: true,
          obtainedFrom: task.planId,
          obtainedAt: new Date().toISOString(),
        };
      }
      const resetBreaks = !!action.resetBreaks;
      return {
        ...state,
        spirits: newSpirits,
        activeTasks: updateTask(state.activeTasks, action.planId, t => ({
          ...t,
          id: 'task_' + Date.now(),
          shieldBreaks: resetBreaks ? [] : t.shieldBreaks,
          shieldBreakCount: resetBreaks ? 0 : t.shieldBreakCount,
          failedBreaks: 0,
          startTime: new Date().toISOString(),
          // 继续刷：上轮剩余作为新的开始
          ballStart: task.ballMode === 'byType' ? null : nextBallStart,
          ballStartByType: task.ballMode === 'byType' ? nextBallStartByType : null,
          ballRestocks: [],
        })),
        completedTasks: [completed, ...state.completedTasks],
      };
    }
    case 'ABANDON_TASK': {
      const task = state.activeTasks.find(t => t.planId === action.planId);
      if (!task) return state;
      if (task.shieldBreakCount === 0) {
        return {
          ...state,
          activeTasks: state.activeTasks.filter(t => t.planId !== action.planId),
        };
      }
      const breakdowns = { original: 0, polluted: 0, shiny: 0 };
      task.shieldBreaks.forEach(b => { breakdowns[b.result]++; });
      const abandoned = {
        id: task.id,
        planId: task.planId,
        resultSpirit: null,
        resultType: 'abandoned',
        shieldBreakCount: task.shieldBreakCount,
        breakdowns,
        completedAt: new Date().toISOString(),
      };
      return {
        ...state,
        activeTasks: state.activeTasks.filter(t => t.planId !== action.planId),
        completedTasks: [abandoned, ...state.completedTasks],
      };
    }
    case 'UPDATE_COMPLETED_BALLS': {
      return {
        ...state,
        completedTasks: state.completedTasks.map(t =>
          t.id === action.taskId ? { ...t, ballsUsed: action.ballsUsed } : t
        ),
      };
    }
    case 'UPDATE_COMPLETED_STATS': {
      return {
        ...state,
        completedTasks: state.completedTasks.map(t => {
          if (t.id !== action.taskId) return t;
          return {
            ...t,
            shieldBreakCount: action.shieldBreakCount ?? t.shieldBreakCount,
            ballsUsed: action.ballsUsed,
            breakdowns: {
              ...t.breakdowns,
              polluted: action.polluted ?? (t.breakdowns?.polluted || 0),
              original: action.original ?? (t.breakdowns?.original || 0),
            },
          };
        }),
      };
    }
    case 'DELETE_COMPLETED_TASK': {
      const taskToDelete = state.completedTasks.find(t => t.id === action.taskId);
      if (!taskToDelete) return state;
      const newCompleted = state.completedTasks.filter(t => t.id !== action.taskId);
      let newSpirits = state.spirits;
      const spiritName = taskToDelete.resultSpirit;
      if (spiritName && taskToDelete.resultType !== 'abandoned') {
        const stillHasRecord = newCompleted.some(
          t => t.resultSpirit === spiritName && t.resultType !== 'abandoned'
        );
        if (!stillHasRecord && state.spirits[spiritName]?.obtained) {
          newSpirits = {
            ...state.spirits,
            [spiritName]: {
              ...state.spirits[spiritName],
              obtained: false,
              obtainedAt: null,
              obtainedFrom: null,
            },
          };
        }
      }
      return {
        ...state,
        spirits: newSpirits,
        completedTasks: newCompleted,
      };
    }
    case 'UPDATE_FRUIT_PROGRESS': {
      return {
        ...state,
        fruitProgress: {
          ...state.fruitProgress,
          [action.key]: action.value,
        },
      };
    }
    case 'TOGGLE_SPIRIT': {
      const s = state.spirits[action.name];
      if (!s) return state;
      return {
        ...state,
        spirits: {
          ...state.spirits,
          [action.name]: {
            ...s,
            obtained: !s.obtained,
            obtainedAt: !s.obtained ? new Date().toISOString() : null,
          },
        },
      };
    }
    case 'SAVE_USER_PLAN': {
      // action.plan: { id?, attrId, label, fruitA, spiritA, fruitB, spiritB }
      const plan = action.plan;
      const existing = (state.userPlanConfig || []).find(p => p.id === plan.id);
      if (existing) {
        // 更新
        return {
          ...state,
          userPlanConfig: state.userPlanConfig.map(p =>
            p.id === plan.id ? { ...p, ...plan, updatedAt: new Date().toISOString() } : p
          ),
        };
      } else {
        // 新建
        const newPlan = {
          ...plan,
          id: plan.id || `user_plan_${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        return {
          ...state,
          userPlanConfig: [...(state.userPlanConfig || []), newPlan],
        };
      }
    }
    case 'DELETE_USER_PLAN': {
      return {
        ...state,
        userPlanConfig: (state.userPlanConfig || []).filter(p => p.id !== action.id),
      };
    }
    case 'TOGGLE_OWNED_FRUIT': {
      const owned = state.ownedFruits || [];
      const hasIt = owned.includes(action.fruit);
      return {
        ...state,
        ownedFruits: hasIt
          ? owned.filter(f => f !== action.fruit)
          : [...owned, action.fruit],
      };
    }
    case 'SET_OWNED_FRUITS': {
      // action.fruits: string[]（传空数组即为全清）
      return { ...state, ownedFruits: action.fruits };
    }
    case 'ADD_MANUAL_SHINY': {
      // action.spiritName: 精灵名（必填）
      // action.planId: 方案ID（选填）
      // action.resultType: 'pool'|'offpool'|'manual'
      // action.shieldBreakCount: 触发次数（选填）
      // action.breakdowns: { polluted, original, shiny }（选填）
      // action.ballsUsed: 球数（选填）
      // action.completedAt: 时间（选填）
      const newRecord = {
        id: 'manual_' + Date.now(),
        planId: action.planId ?? null,
        resultSpirit: action.spiritName,
        resultType: action.resultType ?? 'manual',
        shieldBreakCount: action.shieldBreakCount ?? null,
        breakdowns: action.breakdowns ?? { original: 0, polluted: 0, shiny: 0 },
        ballsUsed: action.ballsUsed ?? null,
        ...(action.ballsUsedByType ? { ballsUsedByType: action.ballsUsedByType } : {}),
        completedAt: action.completedAt || new Date().toISOString(),
      };
      const newSpirits = { ...state.spirits };
      if (action.spiritName && newSpirits[action.spiritName]) {
        newSpirits[action.spiritName] = {
          ...newSpirits[action.spiritName],
          obtained: true,
          obtainedFrom: 'manual',
          obtainedAt: newRecord.completedAt,
        };
      }
      return {
        ...state,
        spirits: newSpirits,
        completedTasks: [newRecord, ...state.completedTasks],
      };
    }
    // 内部 action：用云端数据覆盖本地（初始化时使用）
    case '_HYDRATE_FROM_CLOUD': {
      return action.data;
    }
    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────
const StoreContext = createContext(null);

// ─── 工具：从 state + localStorage 计算用户统计 meta 字段 ────────────────────
function buildUserMeta(state) {
  const yise_count = Object.values(state.spirits || {}).filter(s => s.obtained).length;
  const total_breaks = (state.completedTasks || []).reduce(
    (sum, t) => sum + (t.shieldBreakCount || 0), 0
  );
  const platform = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? 'mobile' : 'desktop';
  const avatar    = localStorage.getItem('lk_user_avatar') || null;
  const user_name = localStorage.getItem('lk_username')    || null;
  return { yise_count, total_breaks, platform, avatar, user_name };
}

// ─── 工具：合并本地 + 云端数据（取并集，永不丢失任何一条记录）────────────────
function mergeStates(local, cloud) {
  const defaults = buildDefaultState();

  // completedTasks：按 id 去重，取并集，按时间降序排列
  const taskMap = new Map();
  [...(cloud.completedTasks || []), ...(local.completedTasks || [])].forEach(t => {
    if (!taskMap.has(t.id)) taskMap.set(t.id, t);
  });
  const completedTasks = [...taskMap.values()].sort(
    (a, b) => new Date(b.completedAt) - new Date(a.completedAt)
  );

  // activeTasks：以本地为准（进行中的任务只在当前设备有意义）
  const activeTasks = local.activeTasks || [];

  // spirits：任意一边 obtained=true 则视为已获得，取最早的 obtainedAt
  const allSpiritKeys = new Set([
    ...Object.keys(defaults.spirits),
    ...Object.keys(local.spirits || {}),
    ...Object.keys(cloud.spirits || {}),
  ]);
  const spirits = {};
  allSpiritKeys.forEach(name => {
    const l = local.spirits?.[name]  || { obtained: false };
    const c = cloud.spirits?.[name]  || { obtained: false };
    if (l.obtained || c.obtained) {
      // 两边都有获得记录 → 取最早的时间；只有一边有 → 用那边的信息
      const lTime = l.obtainedAt ? new Date(l.obtainedAt) : Infinity;
      const cTime = c.obtainedAt ? new Date(c.obtainedAt) : Infinity;
      const winner = lTime <= cTime ? l : c;
      spirits[name] = { obtained: true, obtainedFrom: winner.obtainedFrom, obtainedAt: winner.obtainedAt };
    } else {
      spirits[name] = { obtained: false, obtainedFrom: null, obtainedAt: null };
    }
  });

  // fruitProgress：两边取 key 并集，值相同时保留，不同时取较大值
  const fruitProgress = { ...(cloud.fruitProgress || {}), ...(local.fruitProgress || {}) };
  Object.keys(cloud.fruitProgress || {}).forEach(k => {
    const lv = local.fruitProgress?.[k];
    const cv = cloud.fruitProgress[k];
    if (lv !== undefined) {
      fruitProgress[k] = typeof lv === 'number' && typeof cv === 'number'
        ? Math.max(lv, cv) : lv;
    }
  });

  // userPlanConfig：按 id 去重，本地版本优先（本地编辑时间更新）
  const planMap = new Map();
  [...(cloud.userPlanConfig || []), ...(local.userPlanConfig || [])].forEach(p => {
    if (!planMap.has(p.id)) planMap.set(p.id, p);
    else {
      // 同 id 取 updatedAt 更新的那个
      const existing = planMap.get(p.id);
      if (p.updatedAt && (!existing.updatedAt || p.updatedAt > existing.updatedAt)) {
        planMap.set(p.id, p);
      }
    }
  });
  const userPlanConfig = [...planMap.values()];

  // ownedFruits：两边取并集（任意一边标记过就保留）
  const localOwned = new Set(local.ownedFruits || []);
  const cloudOwned = new Set(cloud.ownedFruits || []);
  const ownedFruits = [...new Set([...localOwned, ...cloudOwned])];

  return { spirits, fruitProgress, activeTasks, completedTasks, userPlanConfig, ownedFruits };
}

// ─── 工具：从云端拉取并水合数据（始终合并，不丢弃任何一方数据）─────────────
async function hydrateFromCloud(uid, dispatch, localFallback) {
  const { data: row, error } = await supabase
    .from('user_data')
    .select('data, avatar, user_name')
    .eq('user_id', uid)
    .maybeSingle();

  if (error) throw error;

  const localData = localFallback || getLocalState();

  // 还原云端的 avatar / user_name 到 localStorage（换设备恢复用）
  if (row?.avatar) localStorage.setItem('lk_user_avatar', row.avatar);
  if (row?.user_name && !localStorage.getItem('lk_username')) {
    localStorage.setItem('lk_username', row.user_name);
  }

  let cloudData = row?.data;

  // ── 同邮箱多账号合并 ─────────────────────────────────────────────────────
  // 同一用户可能在多个设备分别绑定/找回，产生多条 user_id 不同但 email 相同的行。
  // 无论当前 email uid 是否已有数据，都查出所有关联行并取数据并集，
  // 确保不同设备的异色记录全部合并进来，不因 limit(1) 或条件判断而丢失。
  //
  // 命中条件（OR）：
  //   user_email = email         ← 之前绑定/同步时写入
  //   pending_bind_email = email ← forceSyncNow 写入，标记"待合并"
  //
  // 合并后清除 pending_bind_email 标记，防止下次重复合并。
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const email = session?.user?.email;
    if (email) {
      const { data: relatedRows } = await supabase
        .from('user_data')
        .select('user_id, data, avatar, user_name, pending_bind_email')
        .or(`user_email.eq.${email},pending_bind_email.eq.${email}`)
        .neq('user_id', uid);           // 排除当前 uid 自身

      if (relatedRows?.length > 0) {
        let mergedCount = 0;
        for (const relRow of relatedRows) {
          const rd = relRow?.data;
          if (rd && (rd.spirits || rd.completedTasks)) {
            // 每行数据逐一与 cloudData 取并集（mergeStates 完全幂等）
            cloudData = cloudData
              ? mergeStates(rd, cloudData)
              : rd;
            mergedCount++;
            if (!row?.avatar && relRow.avatar) {
              localStorage.setItem('lk_user_avatar', relRow.avatar);
            }
            if (!localStorage.getItem('lk_username') && relRow.user_name) {
              localStorage.setItem('lk_username', relRow.user_name);
            }
          }
          // 有 pending 标记的行，合并后清除（避免重复合并）
          if (relRow.pending_bind_email) {
            supabase
              .from('user_data')
              .update({ pending_bind_email: null })
              .eq('user_id', relRow.user_id)
              .then(({ error: clearErr }) => {
                if (clearErr) console.warn('[Supabase] 清除 pending_bind_email 失败:', clearErr.message);
              });
          }
        }
        if (mergedCount > 0) {
          console.log(`[Supabase] 同邮箱多账号合并：共合并 ${mergedCount} 条关联数据`);
        }
      }
    }
  } catch (e) {
    console.warn('[Supabase] 同邮箱多账号合并查询失败:', e.message);
  }

  if (cloudData && (cloudData.spirits || cloudData.completedTasks)) {
    // 云端有数据 → 与本地合并，取并集
    if (cloudData.activeTask && !cloudData.activeTasks) {
      cloudData.activeTasks = [cloudData.activeTask];
      delete cloudData.activeTask;
    }
    if (!cloudData.activeTasks) cloudData.activeTasks = [];

    const merged = mergeStates(localData, cloudData);
    dispatch({ type: '_HYDRATE_FROM_CLOUD', data: merged });
    // 把合并结果写到新 uid 下
    try {
      const meta = buildUserMeta(merged);
      await supabase.from('user_data').upsert({
        user_id: uid,
        data: merged,
        updated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        last_active_at: new Date().toISOString(),
        ...meta,
      }, { onConflict: 'user_id' });
    } catch (e) {
      console.warn('[Supabase] 写入合并数据失败:', e.message);
    }
    return 'merged';
  } else {
    // 云端无有效数据 → 上传本地数据
    const meta = buildUserMeta(localData);
    await supabase.from('user_data').upsert({
      user_id: uid,
      data: localData,
      updated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      last_active_at: new Date().toISOString(),
      ...meta,
    }, { onConflict: 'user_id' });
    return 'uploaded';
  }
}

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, getLocalState);
  // 云同步状态：'idle' | 'syncing' | 'ready' | 'offline'
  const [syncStatus, setSyncStatus] = useState('idle');
  // 当前登录的用户 ID（匿名或正式账号）
  const [userId, setUserId] = useState(null);
  // 当前 session 的 user 对象（供 Profile 等读取 email）
  const [authUser, setAuthUser] = useState(null);
  // 是否已完成初始化（防止初始化前的 state 变更触发误写）
  const [initialized, setInitialized] = useState(false);
  // 用 ref 持有最新 userId，避免 onAuthStateChange 闭包过期问题
  const userIdRef = useRef(null);
  // init 是否已经完成（区分 SDK 启动时的自动 SIGNED_IN 与用户操作触发的）
  const initDoneRef = useRef(false);
  // 待执行的登录模式：'normal'（找回/绑定，合并本地数据）| 'switch'（切换账号，不合并）
  const pendingAuthModeRef = useRef('normal');
  // 绑定/登录成功后弹出的全局 Toast
  // { type: 'bind' | 'login' | 'switch', email: string } | null
  const [authToast, setAuthToast] = useState(null);

  // ── 初始化：匿名登录 + 拉取云端数据 ────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function init() {
      setSyncStatus('syncing');
      try {
        // 1. 获取已有 session
        let { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          // ── magic link 竞态保护 ─────────────────────────────────────────
          // implicit 流的 access_token 在 URL hash 里，Supabase SDK 需要一点时间
          // 解析并存入 localStorage。若此时 getSession() 返回 null 就直接调用
          // signInAnonymously()，会覆盖 magic link 的 session，导致绑定失败。
          // 检测到 hash 中有 access_token 时，轮询等待（最多 3 秒）再决定是否匿名登录。
          const hashHasToken = window.location.hash.includes('access_token');
          if (hashHasToken) {
            for (let i = 0; i < 6 && !session; i++) {
              await new Promise(r => setTimeout(r, 500));
              if (cancelled) return;
              const { data: { session: s } } = await supabase.auth.getSession();
              if (s) session = s;
            }
          }

          // 等待后仍无 session（或没有 magic link）→ 正常匿名登录
          if (!session) {
            const { data, error } = await supabase.auth.signInAnonymously();
            if (error) throw error;
            session = data.session;
          }
        }
        if (cancelled) return;

        const uid = session.user.id;
        userIdRef.current = uid;
        setUserId(uid);
        setAuthUser(session.user);

        // 2. 从云端拉取或上传数据
        await hydrateFromCloud(uid, dispatch, getLocalState());
        setSyncStatus('ready');

        // 3. 上报本次活跃时间（不管用户有没有操作，打开 App 就算活跃）
        supabase.from('user_data').upsert({
          user_id: uid,
          last_active_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' }).then(({ error }) => {
          if (error) console.warn('[Supabase] 活跃上报失败:', error.message);
        });
      } catch (err) {
        console.warn('[Supabase] 初始化失败，降级为本地模式:', err.message);
        setSyncStatus('offline');
      } finally {
        if (!cancelled) {
          setInitialized(true);
          initDoneRef.current = true;
        }
      }
    }

    init();
    return () => { cancelled = true; };
  }, []);

  // ── Auth 状态监听：只挂载一次，处理邮件链接点击后的登录/升级事件 ──────────
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const uid = session?.user?.id ?? null;
        const prevUid = userIdRef.current;

        // INITIAL_SESSION：App 冷启动时 SDK 恢复 session
        // 如果 init() 还没完成就先到这里，补设 authUser（PKCE 流下尤其重要）
        if (event === 'INITIAL_SESSION') {
          if (session?.user && !initDoneRef.current) {
            setAuthUser(session.user);
            userIdRef.current = uid;
            setUserId(uid);
          }
          return;
        }

        // USER_UPDATED：匿名账号绑定邮箱确认（uid 不变，email 被填上）
        if (event === 'USER_UPDATED') {
          // init 未完成时跳过，让 init() 的 getSession 兜底处理最终态
          if (!session || !initDoneRef.current) return;
          const newEmail = session.user.email;
          setAuthUser(session.user);
          // 仅当 email 是新出现的（之前是匿名）才弹 Toast，并写入云端用户信息
          if (newEmail && !authUser?.email) {
            setAuthToast({ type: 'bind', email: newEmail });
            // 绑定成功：写入 user_email / user_name / avatar
            const avatar    = localStorage.getItem('lk_user_avatar') || null;
            const user_name = localStorage.getItem('lk_username')    || null;
            supabase.from('user_data').upsert({
              user_id: uid,
              user_email: newEmail,
              user_name,
              avatar,
              updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id' }).then(({ error }) => {
              if (error) console.warn('[Supabase] 更新用户信息失败:', error.message);
            });
          }
          return;
        }

        // SIGNED_IN：OTP 魔法链接登录
        if (event === 'SIGNED_IN') {
          if (!session) return;
          // init 未完成时跳过，避免与 init() 并发执行 hydrateFromCloud
          if (!initDoneRef.current) return;

          // uid 相同 = 同设备同账号
          if (uid === prevUid) {
            if (session.user.email && !authUser?.email) {
              setAuthUser(session.user);
              setAuthToast({ type: 'bind', email: session.user.email });
              // 写入 user_email / user_name / avatar
              const avatar    = localStorage.getItem('lk_user_avatar') || null;
              const user_name = localStorage.getItem('lk_username')    || null;
              supabase.from('user_data').upsert({
                user_id: uid,
                user_email: session.user.email,
                user_name,
                avatar,
                updated_at: new Date().toISOString(),
              }, { onConflict: 'user_id' }).then(({ error }) => {
                if (error) console.warn('[Supabase] 更新用户信息失败:', error.message);
              });
            }
            return;
          }

          // uid 不同 = 换设备 OTP 登录 / 邮件找回 / 切换账号
          const isSwitching = pendingAuthModeRef.current === 'switch';
          pendingAuthModeRef.current = 'normal'; // 消费后立即重置
          setAuthUser(session.user);
          setUserId(uid);
          userIdRef.current = uid;
          setSyncStatus('syncing');
          try {
            // 切换账号：传空的默认 state 作为 localFallback，不把当前设备数据合并进新账号
            // 找回账号：传当前本地数据，确保合并时不丢本地记录
            await hydrateFromCloud(
              uid, dispatch,
              isSwitching ? buildDefaultState() : getLocalState()
            );
            setSyncStatus('ready');
            if (session.user.email) {
              setAuthToast({ type: isSwitching ? 'switch' : 'login', email: session.user.email });
              // 更新 user_email + last_active_at（user_name/avatar 已由 hydrateFromCloud 处理）
              supabase.from('user_data').upsert({
                user_id: uid,
                user_email: session.user.email,
                last_active_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }, { onConflict: 'user_id' }).then(({ error }) => {
                if (error) console.warn('[Supabase] 更新用户信息失败:', error.message);
              });
            }
          } catch (err) {
            console.warn('[Supabase] auth 事件同步失败:', err.message);
            setSyncStatus('offline');
          }
          return;
        }

        if (event === 'SIGNED_OUT') {
          setAuthUser(null);
          setUserId(null);
          userIdRef.current = null;
          setSyncStatus('offline');
        }
      }
    );

    return () => subscription.unsubscribe();
  // authUser 加入依赖，确保闭包里读到最新值
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser]);

  // ── 持久化：state 变更时同步写 localStorage + 云端 ────────────────────────
  useEffect(() => {
    // 写 localStorage（离线缓存，始终执行）
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

    // 初始化完成 + 有用户 ID + 不是离线模式 → 异步写云端
    if (!initialized || !userId || syncStatus === 'offline') return;

    const meta = buildUserMeta(state);
    supabase
      .from('user_data')
      .upsert({
        user_id: userId,
        data: state,
        updated_at: new Date().toISOString(),
        last_active_at: new Date().toISOString(),
        // 若 authUser 已有邮箱也一并同步（冗余保险）
        ...(authUser?.email ? { user_email: authUser.email } : {}),
        ...meta,
      }, { onConflict: 'user_id' })
      .then(({ error }) => {
        if (error) console.warn('[Supabase] 同步失败:', error.message);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, initialized, userId, syncStatus]);

  // ── 强制立即同步（绑定邮箱前调用，确保云端有数据）─────────────────────────
  // email: 用户即将绑定/登录的邮箱，同时写入 user_email + pending_bind_email
  //        供跨浏览器兜底查询（新 uid 登录后按邮箱反查旧数据）
  // 返回 Promise<'ok'>，失败时直接 throw（调用方自行处理）
  const forceSyncNow = async (email) => {
    // 直接从 Supabase 拿最新 session，不依赖 React state（init 可能尚未完成）
    const { data: { session } } = await supabase.auth.getSession();
    const uid = session?.user?.id || userId;
    if (!uid) throw new Error('尚未获得用户身份，请稍候几秒后重试');

    // 直接从 localStorage 读最新持久化数据，确保拿到的是最新状态
    let currentState = state;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) currentState = JSON.parse(raw);
    } catch { /* 解析失败保留 React state */ }

    const meta = buildUserMeta(currentState);
    const { error } = await supabase
      .from('user_data')
      .upsert({
        user_id: uid,
        data: currentState,
        updated_at: new Date().toISOString(),
        last_active_at: new Date().toISOString(),
        // 写入目标邮箱：user_email 和 pending_bind_email 双保险
        // 新 uid 登录后，hydrateFromCloud 按 user_email 反查此行并合并数据
        ...(email ? { user_email: email, pending_bind_email: email } : {}),
        ...meta,
      }, { onConflict: 'user_id' });

    if (error) throw new Error(`数据备份失败：${error.message}`);
    return 'ok';
  };

  // ── 设置下次登录的模式（BindEmailModal 在发 OTP 前调用）─────────────────────
  // 'normal'：找回/绑定，合并当前设备本地数据
  // 'switch'：切换账号，仅加载目标账号云端数据，不合并当前设备数据
  const setAuthMode = (mode) => { pendingAuthModeRef.current = mode; };

  return (
    <StoreContext.Provider value={{ state, dispatch, syncStatus, userId, authUser, authToast, clearAuthToast: () => setAuthToast(null), forceSyncNow, setAuthMode }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  return useContext(StoreContext);
}
