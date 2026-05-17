import { createContext, useContext, useReducer, useEffect, useMemo, useRef, useState } from 'react';
import { ALL_SHINIES, classifyPool, computePoolCounts, PLANS, resolveShinyKey, FRUIT_ATTR, getAttrByAnyName, getPlanFruitsArray } from './data/plans';
import { DEFAULT_SEASON } from './data/seasons';
import { supabase } from './supabase';

const STORAGE_KEY = 'roco-shiny-helper';
const USERNAME_KEY = 'lk_username';
const DIRTY_KEY = 'roco-sync-dirty';

// ─── 设备 ID：每台浏览器唯一，写入 localStorage 后永久保留 ──────────────────
// 仅用于追踪数据来源设备，不影响任何业务逻辑
const DEVICE_ID = (() => {
  let id = localStorage.getItem('lk_device_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('lk_device_id', id);
  }
  return id;
})();

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
    abandonedPlanIds: [], // 已主动删除的 activeTasks planId 墓碑（防止刷新后从云端复活）
    completedTasks: [],
    userPlanConfig: [],   // 用户自定义方案列表
    ownedFruits: [],      // 已拥有的果实名称列表（果实攻略页标记）
    customFruits: [],     // 用户自建果实（果实攻略页 / 自定义方案输入新果实时同步生成）
                          // 每条：{ fruit, spirit, attrs:[中文系名], attrId, unlock, tip, source, fromPlanId, createdAt, updatedAt, deleted?, deletedAt? }
    // ── 三池保底计数器（全局） ───────────────────────────────────────────────
    // attrPools: { [attrId]: number }  各属性的系别池累计计数
    // worldPool: number                世界池全局累计计数
    attrPools: {},
    worldPool: 0,
    // ── 赛季相关 ─────────────────────────────────────────────────────────
    currentSeason: DEFAULT_SEASON,  // 当前选中的赛季（'S1' | 'S2'）
    battlePassSpirits: {},          // 战令异色标记 { '雪怪': { obtained: true, obtainedAt: '...' } }
    // ── 数据迁移标记 ──────────────────────────────────────────────────────
    _migratedToSeasons: false,      // 旧数据迁移完成标记（幂等保障）
  };
}

// ─── 数据迁移：为旧版 S1 数据补全 season 字段（幂等，仅执行一次）──────────────
// 触发条件：_migratedToSeasons 不为 true 的本地存量数据
// 策略：
//   - activeTasks：缺 season 的任务补 'S1'（S1 时期遗留任务）
//   - completedTasks：缺 season 的任务补 'S1'
//   - spirits：保持不变（spirits 对象本身无需 season 字段）
//   - currentSeason：保持原值不覆盖（用户自己选择的赛季状态）
// 注意：不强制把 currentSeason 改为 S2，让用户自行切换
function migrateLegacyData(state) {
  if (state._migratedToSeasons) return state;

  let changed = false;

  // activeTasks：补 season 字段（仅当 season 是合法字符串时才跳过；旧数据中 season 可能是 true）
  const activeTasks = (state.activeTasks || []).map(task => {
    if (typeof task.season === 'string' && task.season) return task;
    changed = true;
    return { ...task, season: 'S1' };
  });

  // completedTasks：补 season 字段（同上，修复旧数据中 season: true 的情况）
  const completedTasks = (state.completedTasks || []).map(task => {
    if (typeof task.season === 'string' && task.season) return task;
    changed = true;
    return { ...task, season: 'S1' };
  });

  // 标记迁移完成（幂等保障）
  return {
    ...state,
    activeTasks,
    completedTasks,
    _migratedToSeasons: true,
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
      if (!Array.isArray(parsed.abandonedPlanIds)) parsed.abandonedPlanIds = [];

      // 与默认值合并：确保新增字段对旧数据自动补全
      const defaults = buildDefaultState();
      // 过滤掉存量的 abandoned 记录（已废弃，不再写入，存量需清理）
      if (Array.isArray(parsed.completedTasks)) {
        parsed.completedTasks = parsed.completedTasks.filter(t => t.resultType !== 'abandoned');
      }
      const merged = {
        ...defaults,          // 先铺默认值（兜底所有新增顶层字段）
        ...parsed,            // 再用旧数据覆盖（保留已有内容）
        spirits: {
          ...defaults.spirits,  // 新增精灵用默认值（obtained: false）
          ...parsed.spirits,    // 旧精灵数据保留
        },
      };
      // 数据迁移：为旧版 S1 数据补全 season 字段（幂等）
      return migrateLegacyData(merged);
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
        season: action.season || 'S1',               // 赛季标记（兜底 S1 兼容旧数据）
        status: 'in_progress',
        startTime: new Date().toISOString(),
        shieldBreaks: [],
        shieldBreakCount: 0,
        failedBreaks: 0,
        ballMode: action.ballMode || 'simple',
        ballStart: action.ballStart ?? null,           // simple 模式总数
        ballStartByType: action.ballStartByType ?? null, // byType 模式 {adv,sea,att}
        ballRestocks: [],   // simple: [{amount,time}]  byType: [{adv,sea,att,time}]
        pauseSegments: [],  // 暂停计球历史段：simple [{consumed,time}] / byType [{adv,sea,att,time}]
        familyPool: 0,      // 家族池保底计数（绑定本任务，出货或完成后归零）
      };
      return {
        ...state,
        activeTasks: [...state.activeTasks, newTask],
      };
    }
    case 'RECORD_BREAK': {
      // jelly（果冻/星辰虫）：记录色块供展示，但不增加保底计数
      const isJelly = action.result === 'jelly';

      // ── 三池归属判定 ─────────────────────────────────────────────────────────
      // 破盾后不论出现原色/污染/异色精灵，都算触发一次噩梦，均计入对应池保底进度。
      // 只有「触发失败（逃跑/战败）」和 shiny（已出货）不计入池保底。
      // jelly（果冻/星辰虫）固定归世界池，不占保底序号（shieldBreakCount 不自增）。
      let breakPool = null;
      if ((action.result === 'polluted' || action.result === 'original') && action.spiritName) {
        // 同时查内置方案和用户自定义方案（自定义方案 id 形如 user_plan_xxx）
        const plan = PLANS.find(p => p.id === action.planId)
          || (state.userPlanConfig || []).find(p => p.id === action.planId);
        breakPool = classifyPool(action.spiritName, plan);
      } else if (action.result === 'jelly') {
        breakPool = 'world';
      }

      const newBreak = {
        index: 0,
        result: action.result,
        // spiritName 可选：'original'/'polluted' 记录具体精灵，'shiny'/'jelly' 可为空
        ...(action.spiritName ? { spiritName: action.spiritName } : {}),
        // pool 字段：polluted 时写入归属池，其他为 null（不存储 null key）
        ...(breakPool ? { pool: breakPool } : {}),
        time: new Date().toISOString(),
      };

      return {
        ...state,
        // 三池计数不再增量维护，改由 computePoolCounts 从事件流派生
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
      // 三池计数由事件流派生，撤销只需删除最后一条 shieldBreaks 记录即可
      const undoTask = state.activeTasks.find(t => t.planId === action.planId);
      if (!undoTask || undoTask.shieldBreaks.length === 0) return state;
      const lastBreak = undoTask.shieldBreaks[undoTask.shieldBreaks.length - 1];
      const isUndoJelly = lastBreak?.result === 'jelly';

      return {
        ...state,
        activeTasks: updateTask(state.activeTasks, action.planId, task => ({
          ...task,
          shieldBreaks: task.shieldBreaks.slice(0, -1),
          // jelly 不占保底计数，撤销时也不减
          shieldBreakCount: isUndoJelly ? task.shieldBreakCount : task.shieldBreakCount - 1,
        })),
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
    // 暂停计球：结算本段消耗，重置起始球数，任务保持进行中
    case 'PAUSE_BALL_SEGMENT': {
      return {
        ...state,
        activeTasks: updateTask(state.activeTasks, action.planId, task => {
          const restocks = task.ballRestocks || [];
          let consumed = null;
          let consumedByType = null;
          if (task.ballMode === 'byType') {
            const bst = task.ballStartByType || { adv: 0, sea: 0, att: 0 };
            const restByType = restocks.reduce(
              (s, r) => ({ adv: s.adv + (r.adv || 0), sea: s.sea + (r.sea || 0), att: s.att + (r.att || 0) }),
              { adv: 0, sea: 0, att: 0 }
            );
            const cur = action.currentByType || { adv: 0, sea: 0, att: 0 };
            consumedByType = {
              adv: bst.adv + restByType.adv - (cur.adv || 0),
              sea: bst.sea + restByType.sea - (cur.sea || 0),
              att: bst.att + restByType.att - (cur.att || 0),
            };
            consumed = consumedByType.adv + consumedByType.sea + consumedByType.att;
          } else {
            const restockTotal = restocks.reduce((s, r) => s + (r.amount || 0), 0);
            const cur = action.current ?? null;
            consumed = (task.ballStart != null && cur != null) ? task.ballStart + restockTotal - cur : null;
          }
          const seg = task.ballMode === 'byType'
            ? { ...consumedByType, consumed, time: new Date().toISOString() }
            : { consumed, time: new Date().toISOString() };
          return {
            ...task,
            // 重置为暂停时填入的当前球数，作为下段起点
            ballStart: task.ballMode === 'byType' ? null : (action.current ?? null),
            ballStartByType: task.ballMode === 'byType' ? (action.currentByType ?? null) : null,
            ballRestocks: [],
            pauseSegments: [...(task.pauseSegments || []), seg],
          };
        }),
      };
    }
    // 手动修改开始球数（不清空 ballRestocks / pauseSegments）
    case 'UPDATE_BALL_START': {
      return {
        ...state,
        activeTasks: updateTask(state.activeTasks, action.planId, task => ({
          ...task,
          ballStart: action.ballMode === 'byType' ? task.ballStart : (action.ballStart ?? task.ballStart),
          ballStartByType: action.ballMode === 'byType' ? (action.ballStartByType ?? task.ballStartByType) : task.ballStartByType,
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
      // 历史暂停段消耗
      const pauseSegs = task.pauseSegments || [];
      const pauseTotal = pauseSegs.reduce((s, seg) => s + (seg.consumed || 0), 0);
      if (task.ballMode === 'byType') {
        const bst = task.ballStartByType || { adv: 0, sea: 0, att: 0 };
        const bet = action.ballEndByType;       // { adv, sea, att }
        if (bet) {
          const restByType = (task.ballRestocks || []).reduce(
            (s, r) => ({ adv: s.adv + (r.adv || 0), sea: s.sea + (r.sea || 0), att: s.att + (r.att || 0) }),
            { adv: 0, sea: 0, att: 0 }
          );
          const curSegByType = {
            adv: bst.adv + restByType.adv - (bet.adv || 0),
            sea: bst.sea + restByType.sea - (bet.sea || 0),
            att: bst.att + restByType.att - (bet.att || 0),
          };
          // 加上历史段
          const pauseByType = pauseSegs.reduce(
            (s, seg) => ({ adv: s.adv + (seg.adv || 0), sea: s.sea + (seg.sea || 0), att: s.att + (seg.att || 0) }),
            { adv: 0, sea: 0, att: 0 }
          );
          ballsUsedByType = {
            adv: curSegByType.adv + pauseByType.adv,
            sea: curSegByType.sea + pauseByType.sea,
            att: curSegByType.att + pauseByType.att,
          };
          ballsUsed = ballsUsedByType.adv + ballsUsedByType.sea + ballsUsedByType.att;
        }
      } else {
        const ballStart = task.ballStart;
        const ballEnd = action.ballEnd;
        const restockTotal = (task.ballRestocks || []).reduce((s, r) => s + (r.amount || 0), 0);
        const curSeg = (ballStart != null && ballEnd != null) ? ballStart + restockTotal - ballEnd : null;
        ballsUsed = curSeg != null ? curSeg + pauseTotal : (pauseTotal > 0 ? pauseTotal : null);
      }
      const ballStart = task.ballMode === 'byType' ? null : task.ballStart;
      const ballEnd = task.ballMode === 'byType' ? null : action.ballEnd;
      const completed = {
        id: task.id,
        planId: task.planId,
        season: task.season || 'S1',                  // 继承 task 的赛季标记（兜底 S1）
        resultSpirit: action.spiritName,
        resultType: action.resultType || (action.isPool ? 'pool' : 'offpool'),
        shieldBreakCount: task.shieldBreakCount,
        breakdowns,
        shieldBreaks: task.shieldBreaks || [],
        ballMode: task.ballMode || 'simple',
        ballsUsed,
        ...(ballsUsedByType ? { ballsUsedByType } : {}),
        completedAt: new Date().toISOString(),
      };
      const newSpirits = { ...state.spirits };
      // 图鉴点亮放宽：用户填的名字可能是同家族的进化前/后形态，
      // 用 resolveShinyKey 归一化到图鉴里的代表异色名（找不到则保留原名）
      const shinyKeyForComplete = resolveShinyKey(action.spiritName);
      if (shinyKeyForComplete && newSpirits[shinyKeyForComplete]) {
        newSpirits[shinyKeyForComplete] = {
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
      const cac_pauseSegs = task.pauseSegments || [];
      const cac_pauseTotal = cac_pauseSegs.reduce((s, seg) => s + (seg.consumed || 0), 0);
      if (task.ballMode === 'byType') {
        const bst = task.ballStartByType || { adv: 0, sea: 0, att: 0 };
        const bet = action.ballEndByType;
        if (bet) {
          const restByType = (task.ballRestocks || []).reduce(
            (s, r) => ({ adv: s.adv + (r.adv || 0), sea: s.sea + (r.sea || 0), att: s.att + (r.att || 0) }),
            { adv: 0, sea: 0, att: 0 }
          );
          const curSegByType = {
            adv: bst.adv + restByType.adv - (bet.adv || 0),
            sea: bst.sea + restByType.sea - (bet.sea || 0),
            att: bst.att + restByType.att - (bet.att || 0),
          };
          const pauseByType = cac_pauseSegs.reduce(
            (s, seg) => ({ adv: s.adv + (seg.adv || 0), sea: s.sea + (seg.sea || 0), att: s.att + (seg.att || 0) }),
            { adv: 0, sea: 0, att: 0 }
          );
          cac_ballsUsedByType = {
            adv: curSegByType.adv + pauseByType.adv,
            sea: curSegByType.sea + pauseByType.sea,
            att: curSegByType.att + pauseByType.att,
          };
          cac_ballsUsed = cac_ballsUsedByType.adv + cac_ballsUsedByType.sea + cac_ballsUsedByType.att;
          nextBallStartByType = { adv: bet.adv || 0, sea: bet.sea || 0, att: bet.att || 0 };
        }
      } else {
        const ballStart = task.ballStart;
        const ballEnd = action.ballEnd;
        const restockTotal = (task.ballRestocks || []).reduce((s, r) => s + (r.amount || 0), 0);
        const curSeg = (ballStart != null && ballEnd != null) ? ballStart + restockTotal - ballEnd : null;
        cac_ballsUsed = curSeg != null ? curSeg + cac_pauseTotal : (cac_pauseTotal > 0 ? cac_pauseTotal : null);
        nextBallStart = ballEnd ?? null;
      }
      // 提前声明，completed 快照和 activeTask 过滤均需要
      const resetBreaks = !!action.resetBreaks;
      // 选择性清零：只移除出货池（action.resultType）的 breaks，另外两池进度保留。
      // resetBreaks=true（用户手动选择「三池全清」）时清空全部。
      const poolToClear = action.resultType; // 'family' | 'attr' | 'world'

      // ── completedTask 快照的 shieldBreaks 存储策略 ──────────────────────────
      // 两层设计：任务快照 vs 实时各池（computePoolCounts）
      //   - COMPLETE_TASK（正常结束）：全量存储，无双计风险（activeTask 已移除）
      //   - COMPLETE_AND_CONTINUE + resetBreaks=true（全清继续）：全量存储，activeTask 被清空无双计风险
      //   - COMPLETE_AND_CONTINUE + resetBreaks=false（选择性清零继续）：
      //       只存出货池（poolToClear）的 breaks，其余池 breaks 已继承到新 activeTask。
      //       若全量存储，computePoolCounts 会对世界池/属性池 breaks 双计。
      const completedShieldBreaks = resetBreaks
        ? (task.shieldBreaks || [])          // 全清模式：快照完整保留（无继承，无双计）
        : (task.shieldBreaks || []).filter(b => !b.pool || b.pool === poolToClear);
                                              // 选择性清零：只保留出货池 breaks，其余已在新 activeTask

      const completed = {
        id: task.id,
        planId: task.planId,
        season: task.season || 'S1',                  // 继承 task 的赛季标记（兜底 S1）
        resultSpirit: action.spiritName,
        resultType: action.resultType || (action.isPool ? 'pool' : 'offpool'),
        shieldBreakCount: task.shieldBreakCount,
        breakdowns,
        shieldBreaks: completedShieldBreaks,
        ballMode: task.ballMode || 'simple',
        ballsUsed: cac_ballsUsed,
        ...(cac_ballsUsedByType ? { ballsUsedByType: cac_ballsUsedByType } : {}),
        completedAt: new Date().toISOString(),
        hasContinuation: true, // 此任务「继续刷」：computePoolCounts 跳过其 breaks 避免双计（双重保障）
      };
      const newSpirits = { ...state.spirits };
      // 图鉴点亮放宽：归一化到家族代表异色名
      const shinyKeyForCAC = resolveShinyKey(action.spiritName);
      if (shinyKeyForCAC && newSpirits[shinyKeyForCAC]) {
        newSpirits[shinyKeyForCAC] = {
          obtained: true,
          obtainedFrom: task.planId,
          obtainedAt: new Date().toISOString(),
        };
      }
      const nextShieldBreaks = resetBreaks
        ? []
        : task.shieldBreaks.filter(b => !b.pool || b.pool !== poolToClear);
      // shieldBreakCount 从剩余 breaks 重新计算（jelly 不占保底序号）
      const nextShieldBreakCount = nextShieldBreaks.filter(b => b.result !== 'jelly').length;
      return {
        ...state,
        spirits: newSpirits,
        activeTasks: updateTask(state.activeTasks, action.planId, t => ({
          ...t,
          id: 'task_' + Date.now(),
          shieldBreaks: nextShieldBreaks,
          shieldBreakCount: nextShieldBreakCount,
          failedBreaks: 0,
          startTime: new Date().toISOString(),
          // 继续刷：上轮剩余作为新的开始
          ballStart: task.ballMode === 'byType' ? null : nextBallStart,
          ballStartByType: task.ballMode === 'byType' ? nextBallStartByType : null,
          ballRestocks: [],
          pauseSegments: [],
          // 各池进度：出货池已通过过滤 nextShieldBreaks 归零，另外两池 breaks 保留自然延续
        })),
        completedTasks: [completed, ...state.completedTasks],
      };
    }
    case 'ABANDON_TASK': {
      const task = state.activeTasks.find(t => t.planId === action.planId);
      if (!task) return state;
      // 无论破盾次数多少，一律静默删除，不写入 completedTasks
      // 同时将 planId 写入墓碑列表，防止刷新后 mergeStates 从云端把任务复活
      const prevAbandoned = Array.isArray(state.abandonedPlanIds) ? state.abandonedPlanIds : [];
      const abandonedPlanIds = action.planId
        ? [...new Set([...prevAbandoned, action.planId])]
        : prevAbandoned;
      return {
        ...state,
        activeTasks: state.activeTasks.filter(t => t.planId !== action.planId),
        abandonedPlanIds,
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
          // 分球明细：如果传入了 ballsUsedByType 则更新，否则保留原值
          const newByType = action.ballsUsedByType !== undefined
            ? action.ballsUsedByType
            : t.ballsUsedByType;
          return {
            ...t,
            shieldBreakCount: action.shieldBreakCount ?? t.shieldBreakCount,
            ballsUsed: action.ballsUsed,
            ...(newByType ? { ballsUsedByType: newByType } : { ballsUsedByType: undefined }),
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
        // 图鉴点亮放宽：判断"是否还存在同家族记录"，避免误关图鉴
        // 把当前删掉的记录和剩余记录都归一化到家族代表名再比较
        const shinyKeyToDelete = resolveShinyKey(spiritName);
        const stillHasRecord = newCompleted.some(
          t => t.resultType !== 'abandoned'
            && t.resultSpirit
            && resolveShinyKey(t.resultSpirit) === shinyKeyToDelete
        );
        if (!stillHasRecord && state.spirits[shinyKeyToDelete]?.obtained) {
          newSpirits = {
            ...state.spirits,
            [shinyKeyToDelete]: {
              ...state.spirits[shinyKeyToDelete],
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
      // 墓碑标记：不直接移除，而是标记 deleted=true + deletedAt
      // 防止 mergeStates 在刷新时从云端把已删方案"并集"回来
      return {
        ...state,
        userPlanConfig: (state.userPlanConfig || []).map(p =>
          p.id === action.id
            ? { ...p, deleted: true, deletedAt: new Date().toISOString() }
            : p
        ),
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
    // ── 自建果实：upsert 语义 ──────────────────────────────────────────────────
    // action: { fruit, spirit, attrs:[中文系名], attrId, unlock?, tip?, source?, fromPlanId? }
    // 若 fruit 已是内置果实（FRUIT_ATTR 命中）→ 直接跳过保护内置数据
    // 若 fruit 已存在于 customFruits → 同 fruit 升级（updatedAt 刷新；deleted 复活）
    // 否则新增条目
    case 'ADD_CUSTOM_FRUIT': {
      if (!action.fruit) return state;
      // 保护内置：内置果实禁止被自建数据覆盖
      if (Object.prototype.hasOwnProperty.call(FRUIT_ATTR, action.fruit)) return state;
      const list = state.customFruits || [];
      const now = new Date().toISOString();
      const exist = list.find(c => c.fruit === action.fruit);
      const patch = {
        fruit: action.fruit,
        spirit: action.spirit ?? exist?.spirit ?? '',
        attrs: Array.isArray(action.attrs) ? action.attrs : (exist?.attrs ?? []),
        attrId: action.attrId ?? exist?.attrId ?? null,
        unlock: action.unlock ?? exist?.unlock ?? '自定义',
        tip: action.tip ?? exist?.tip ?? '',
        source: action.source ?? exist?.source ?? 'manual',  // 'manual' 用户手建 / 'plan' 方案同步
        fromPlanId: action.fromPlanId ?? exist?.fromPlanId ?? null,
      };
      if (exist) {
        return {
          ...state,
          customFruits: list.map(c =>
            c.fruit === action.fruit
              ? { ...c, ...patch, deleted: false, deletedAt: null, updatedAt: now }
              : c
          ),
        };
      }
      return {
        ...state,
        customFruits: [...list, { ...patch, createdAt: now, updatedAt: now }],
      };
    }
    case 'UPDATE_CUSTOM_FRUIT': {
      // action: { fruit, patch: {...} } —— 按 fruit name 定位修改
      if (!action.fruit) return state;
      const list = state.customFruits || [];
      if (!list.some(c => c.fruit === action.fruit)) return state;
      const now = new Date().toISOString();
      return {
        ...state,
        customFruits: list.map(c =>
          c.fruit === action.fruit
            ? { ...c, ...(action.patch || {}), updatedAt: now }
            : c
        ),
      };
    }
    case 'DELETE_CUSTOM_FRUIT': {
      // 墓碑式删除：保留对象但置 deleted=true，避免 mergeStates 复活
      if (!action.fruit) return state;
      const list = state.customFruits || [];
      const now = new Date().toISOString();
      return {
        ...state,
        customFruits: list.map(c =>
          c.fruit === action.fruit
            ? { ...c, deleted: true, deletedAt: now, updatedAt: now }
            : c
        ),
      };
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
      // 图鉴点亮放宽：归一化到家族代表异色名
      const shinyKeyForManual = resolveShinyKey(action.spiritName);
      if (shinyKeyForManual && newSpirits[shinyKeyForManual]) {
        newSpirits[shinyKeyForManual] = {
          ...newSpirits[shinyKeyForManual],
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
    // 启动 / 云端拉取后调用一次：根据 completedTasks 反推应点亮的图鉴格子
    // 用于把"图鉴点亮放宽"策略追溯应用到历史已记录的异色，包括：
    //   - 用户在本次需求上线之前填的、已存在于本地/云端的 completedTasks
    //   - 跨设备合并过来的历史记录
    // 完全幂等：已点亮的格子不会被重复写，未涉及的格子保持原状。
    // 注意：只追加点亮（obtained=false → true），不会反向关闭，避免误伤。
    case 'RECONCILE_SHINIES': {
      const newSpirits = { ...state.spirits };
      let changed = 0;
      (state.completedTasks || []).forEach(t => {
        if (!t || !t.resultSpirit) return;
        if (t.resultType === 'abandoned') return;
        const key = resolveShinyKey(t.resultSpirit);
        if (!key) return;
        const cur = newSpirits[key];
        if (!cur) return;            // 不在图鉴里的精灵跳过
        if (cur.obtained) return;    // 已经点亮过，无需重复写
        newSpirits[key] = {
          ...cur,
          obtained: true,
          obtainedFrom: cur.obtainedFrom || t.planId || 'reconcile',
          obtainedAt: cur.obtainedAt || t.completedAt || new Date().toISOString(),
        };
        changed++;
      });
      if (changed === 0) return state;
      return { ...state, spirits: newSpirits };
    }
    // 存量补全：把自定义方案里引用过、但尚未写入 customFruits 的果实自动补进去。
    // 触发时机：userPlanConfig 变化时（启动、hydrate 合并、新增/删除方案均会触发）。
    // 完全幂等：已在 customFruits 中的果实（含 deleted 墓碑）会被跳过，不重复写入。
    // 内置果实（FRUIT_ATTR 命中）也跳过——保护内置数据不被自建条目覆盖。
    case 'RECONCILE_CUSTOM_FRUITS': {
      const existingFruitNames = new Set(
        (state.customFruits || []).map(c => c.fruit)
      );
      const now = new Date().toISOString();
      const toAdd = [];

      (state.userPlanConfig || [])
        .filter(p => !p.deleted)
        .forEach(plan => {
          [plan.fruitA, plan.fruitB].forEach(fruitName => {
            if (!fruitName) return;
            // 内置果实不建自建条目
            if (Object.prototype.hasOwnProperty.call(FRUIT_ATTR, fruitName)) return;
            // 已有记录（含已删除的墓碑）→ 不再重复写
            if (existingFruitNames.has(fruitName)) return;
            // 去重：同一果实多个方案引用时只添加一次
            if (toAdd.some(c => c.fruit === fruitName)) return;
            // 反查属性 ID
            const attrId = getAttrByAnyName(fruitName) || null;
            toAdd.push({
              fruit: fruitName,
              spirit: fruitName.endsWith('果实') ? fruitName.slice(0, -2) : fruitName,
              attrs: [],       // customFruitToEntry 会按 attrId 自动补全中文属性名
              attrId,
              unlock: '自定义',
              tip: '',
              source: 'plan',
              fromPlanId: plan.id,
              createdAt: now,
              updatedAt: now,
            });
          });
        });

      if (toAdd.length === 0) return state;
      return {
        ...state,
        customFruits: [...(state.customFruits || []), ...toAdd],
      };
    }
    case 'SWITCH_SEASON': {
      return {
        ...state,
        currentSeason: action.season,
      };
    }
    case 'MARK_BATTLE_PASS_OBTAINED': {
      const now = new Date().toISOString();
      return {
        ...state,
        battlePassSpirits: {
          ...state.battlePassSpirits,
          [action.spiritName]: {
            obtained: true,
            obtainedAt: now,
          },
        },
      };
    }
    case 'UNMARK_BATTLE_PASS_OBTAINED': {
      const newBattlePassSpirits = { ...state.battlePassSpirits };
      delete newBattlePassSpirits[action.spiritName];
      return {
        ...state,
        battlePassSpirits: newBattlePassSpirits,
      };
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

// ─── 工具：构造精简版 state（data 列，去掉 shieldBreaks 以减小体积）────────────
function buildSlimState(state) {
  return {
    ...state,
    completedTasks: (state.completedTasks || []).map(t => {
      // eslint-disable-next-line no-unused-vars
      const { shieldBreaks, ...rest } = t;
      return rest;
    }),
  };
}

// ─── 工具：构造 active_tasks_summary 列（Supabase 可读的刷取中快照）────────────
// 每条包含 planId + 当前保底次数 + 开始时间，供后台直接观察用户进度
// 不含 shieldBreaks 详情（数据量大，已存在 data 列中）
function buildActiveTasksSummary(state) {
  return (state.activeTasks || []).map(t => ({
    planId: t.planId,
    breaks: t.shieldBreakCount ?? 0,
    startTime: t.startTime ?? null,
  }));
}

// ─── 工具：构造 completed_tasks_full 列数据（含完整 shieldBreaks）────────────
// 只存有 shieldBreaks 记录的任务，节省空间；无 shieldBreaks 的任务不重复存储。
function buildFullTasks(state) {
  return (state.completedTasks || []).filter(
    t => Array.isArray(t.shieldBreaks) && t.shieldBreaks.length > 0
  );
}

// ─── 工具：把 completed_tasks_full 里的 shieldBreaks 回注进 completedTasks ────
// 调用时机：hydrateFromCloud 读到数据库数据后，合并前先还原完整数据
function injectShieldBreaks(completedTasks, fullTasks) {
  if (!fullTasks?.length) return completedTasks || [];
  const fullMap = new Map(fullTasks.map(t => [t.id, t.shieldBreaks]));
  return (completedTasks || []).map(t => {
    const breaks = fullMap.get(t.id);
    // 若 data 列里已有 shieldBreaks（旧代码写的），优先保留；否则从 full 列回注
    if (breaks && !t.shieldBreaks?.length) {
      return { ...t, shieldBreaks: breaks };
    }
    return t;
  });
}

// ─── 工具：合并本地 + 云端数据（取并集，永不丢失任何一条记录）────────────────
  // ── shieldBreaks 真正合并工具 ──────────────────────────────────────────────
  // 按 index 去重，两边都有同一 index 时本地优先（本地是当前设备最新记录）
  // 两边独有的 break 都保留，确保一条破盾记录都不丢
  function mergeBreaksArrays(localBreaks, cloudBreaks) {
    if (!cloudBreaks?.length) return localBreaks || [];
    if (!localBreaks?.length) return cloudBreaks;
    const breakMap = new Map(cloudBreaks.map(b => [b.index, b]));
    // 本地覆盖云端（本地最新）
    localBreaks.forEach(b => breakMap.set(b.index, b));
    return [...breakMap.values()].sort((a, b) => a.index - b.index);
  }

function mergeStates(local, cloud) {
  const defaults = buildDefaultState();

  // completedTasks：按 id 取并集，每条记录两边都保留
  // 合并策略：
  //   本地基础字段优先（本地是当前设备最新编辑的来源）
  //   云端有而本地没有的任务 → 全量补入（跨设备数据不丢）
  //   shieldBreaks → 两边真正合并（按 index 去重，本地优先），一条破盾记录都不丢
  const taskMap = new Map();

  // 先放本地（基础字段以本地为准）
  (local.completedTasks || []).forEach(t => taskMap.set(t.id, t));

  // 再处理云端：云端有而本地没有的补入；同 id 则合并 shieldBreaks
  (cloud.completedTasks || []).forEach(cloudTask => {
    if (!taskMap.has(cloudTask.id)) {
      // 云端独有 → 直接补入
      taskMap.set(cloudTask.id, cloudTask);
    } else {
      // 同 id 两边都有 → 本地基础字段保留，shieldBreaks 两边真正合并
      const localTask = taskMap.get(cloudTask.id);
      const mergedBreaks = mergeBreaksArrays(localTask.shieldBreaks, cloudTask.shieldBreaks);
      taskMap.set(cloudTask.id, { ...localTask, shieldBreaks: mergedBreaks });
    }
  });

  const completedTasks = [...taskMap.values()].sort(
    (a, b) => new Date(b.completedAt) - new Date(a.completedAt)
  );

  // activeTasks：按 planId 取并集，进行中的任务两边都保留
  // 本地有的 planId → 用本地（当前刷球现场，数据最新）
  // 本地没有但云端有 → 从云端恢复（换设备继续进行中任务）
  // 同 planId 两边都有 → 本地优先，同时合并 shieldBreaks 确保破盾记录不丢
  // abandonedPlanIds：本地主动删除的任务墓碑，云端同 planId 的任务不再补入（防刷新复活）
  const localAbandonedIds = new Set([
    ...(Array.isArray(local.abandonedPlanIds) ? local.abandonedPlanIds : []),
    ...(Array.isArray(cloud.abandonedPlanIds) ? cloud.abandonedPlanIds : []),
  ]);
  const localActiveMap = new Map((local.activeTasks || []).map(t => [t.planId, t]));
  const activeTasks = (local.activeTasks || []).map(localTask => {
    const cloudTask = (cloud.activeTasks || []).find(c => c.planId === localTask.planId);
    if (!cloudTask) return localTask;
    // 同 planId：本地基础字段优先，shieldBreaks 两边合并
    return {
      ...localTask,
      shieldBreaks: mergeBreaksArrays(localTask.shieldBreaks, cloudTask.shieldBreaks),
    };
  });
  // 云端有而本地没有的进行中任务 → 补入（已被墓碑标记的跳过，防止刷新后复活）
  for (const cloudTask of (cloud.activeTasks || [])) {
    if (!localActiveMap.has(cloudTask.planId) && !localAbandonedIds.has(cloudTask.planId)) {
      activeTasks.push(cloudTask);
    }
  }
  // abandonedPlanIds：两边取并集（任一设备删除的任务，所有设备都不再恢复）
  const abandonedPlanIds = [...localAbandonedIds];

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

  // userPlanConfig：按 id 去重，deleted 墓碑优先，否则取 updatedAt 更新的那个
  // 规则：任一侧标记 deleted=true，则该方案视为已删除，不复活
  const planMap = new Map();
  [...(cloud.userPlanConfig || []), ...(local.userPlanConfig || [])].forEach(p => {
    if (!planMap.has(p.id)) {
      planMap.set(p.id, p);
    } else {
      const existing = planMap.get(p.id);
      // 任一侧有 deleted 标记 → 保留 deleted 的那个（墓碑不可逆）
      if (p.deleted || existing.deleted) {
        const winner = p.deleted ? p : existing;
        planMap.set(p.id, winner);
      } else {
        // 两侧都未删除 → 取 updatedAt 更新的那个
        if (p.updatedAt && (!existing.updatedAt || p.updatedAt > existing.updatedAt)) {
          planMap.set(p.id, p);
        }
      }
    }
  });
  const userPlanConfig = [...planMap.values()];

  // ownedFruits：两边取并集（任意一边标记过就保留）
  const localOwned = new Set(local.ownedFruits || []);
  const cloudOwned = new Set(cloud.ownedFruits || []);
  const ownedFruits = [...new Set([...localOwned, ...cloudOwned])];

  // customFruits：按 fruit name 去重
  // 规则：任一侧 deleted=true → 保留 deleted（墓碑不可逆）
  //       两侧都未删除 → 取 updatedAt 较新的那个
  const fruitMap = new Map();
  [...(cloud.customFruits || []), ...(local.customFruits || [])].forEach(c => {
    if (!c || !c.fruit) return;
    const existing = fruitMap.get(c.fruit);
    if (!existing) {
      fruitMap.set(c.fruit, c);
      return;
    }
    if (c.deleted || existing.deleted) {
      const winner = c.deleted ? c : existing;
      fruitMap.set(c.fruit, winner);
      return;
    }
    if (c.updatedAt && (!existing.updatedAt || c.updatedAt > existing.updatedAt)) {
      fruitMap.set(c.fruit, c);
    }
  });
  const customFruits = [...fruitMap.values()];

  // attrPools / worldPool：字段废弃（改由事件流派生），合并时不再维护。
  // 保留在 return 中是为了让旧数据反序列化后字段仍存在，不触发 undefined 报错。
  const attrPools = {};
  const worldPool = 0;

  // 赛季相关：本地优先（本地 currentSeason 是用户当前选择的状态）
  const currentSeason = local.currentSeason || cloud.currentSeason || defaults.currentSeason;
  // battlePassSpirits：两边取并集（任意一边标记的战令异色都保留）
  const battlePassSpirits = {
    ...(cloud.battlePassSpirits || {}),
    ...(local.battlePassSpirits || {}),   // 本地覆盖云端（本地为最新）
  };
  // _migratedToSeasons：两边任一为 true 则标记为已迁移
  const _migratedToSeasons = !!(local._migratedToSeasons || cloud._migratedToSeasons);

  return {
    spirits, fruitProgress, activeTasks, abandonedPlanIds, completedTasks,
    userPlanConfig, ownedFruits, customFruits, attrPools, worldPool,
    currentSeason, battlePassSpirits, _migratedToSeasons,
  };
}

// ─── 工具：从云端拉取并水合数据（始终合并，不丢弃任何一方数据）─────────────
// 写 lk_username 到 localStorage 并发自定义事件（同 Tab 内 useUsername hook 可以响应）
// overwrite=true：云端有历史名字时直接覆盖本地（登录/找回场景，优先尊重用户历史昵称）
// overwrite=false（默认）：本地已有值则跳过（新用户首次拉取，不覆盖已随机生成的名字）
function setLocalUsername(name, overwrite = false) {
  if (!name) return;
  if (!overwrite && localStorage.getItem('lk_username')) return;
  localStorage.setItem('lk_username', name);
  window.dispatchEvent(new StorageEvent('storage', {
    key: 'lk_username',
    newValue: name,
    storageArea: localStorage,
  }));
}

// overwriteUserMeta:
//   true  → 换设备/找回账号场景（SIGNED_IN uid 变化），云端名字/头像直接覆盖本地
//   false → 普通启动场景（init()），本地已有名字则保留，不让云端旧值覆盖用户最近改的名
async function hydrateFromCloud(uid, dispatch, localFallback, overwriteUserMeta = false) {
  // 同时读取 data（精简版）和 completed_tasks_full（含 shieldBreaks 的完整版）
  const { data: row, error } = await supabase
    .from('user_data')
    .select('data, avatar, user_name, completed_tasks_full')
    .eq('user_id', uid)
    .maybeSingle();

  if (error) throw error;

  const localData = localFallback || getLocalState();

  // 还原云端的 avatar / user_name 到 localStorage
  // overwriteUserMeta=true（换设备/找回）：直接覆盖，恢复用户历史昵称
  // overwriteUserMeta=false（普通启动）：本地已有名字就保留，尊重用户在本设备上的最新改名
  if (row?.avatar) {
    if (overwriteUserMeta || !localStorage.getItem('lk_user_avatar')) {
      localStorage.setItem('lk_user_avatar', row.avatar);
    }
  }
  setLocalUsername(row?.user_name, overwriteUserMeta);

  let cloudData = row?.data;

  // 把 completed_tasks_full 里的 shieldBreaks 回注进 cloudData.completedTasks
  if (cloudData && row?.completed_tasks_full?.length) {
    cloudData = {
      ...cloudData,
      completedTasks: injectShieldBreaks(cloudData.completedTasks, row.completed_tasks_full),
    };
  }

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
        .select('user_id, data, completed_tasks_full, avatar, user_name, pending_bind_email')
        .or(`user_email.eq.${email},pending_bind_email.eq.${email}`)
        .neq('user_id', uid);           // 排除当前 uid 自身

      if (relatedRows?.length > 0) {
        let mergedCount = 0;
        for (const relRow of relatedRows) {
          let rd = relRow?.data;
          // Fix: 只要 rd 存在（哪怕 spirits/completedTasks 为空对象），
          // 或者有 completed_tasks_full，都应参与合并，不能因字段为空就跳过整行。
          // 之前的条件 (rd.spirits || rd.completedTasks) 会在孤儿行 data 结构异常时
          // 跳过该行，导致云端有效数据被忽略，最终被本地空数据覆盖。
          const hasRelData = rd != null || relRow.completed_tasks_full?.length > 0;
          if (hasRelData) {
            rd = rd || {};
            // 回注该行的 shieldBreaks
            if (relRow.completed_tasks_full?.length) {
              rd = {
                ...rd,
                completedTasks: injectShieldBreaks(rd.completedTasks || [], relRow.completed_tasks_full),
              };
            }
            // 每行数据逐一与 cloudData 取并集（mergeStates 完全幂等）
            // 以 cloudData 为"local"（更新的主行），rd 为"cloud"（待合并的孤儿行）
            cloudData = cloudData
              ? mergeStates(cloudData, rd)
              : rd;
            mergedCount++;
            if (relRow.avatar) {
              if (overwriteUserMeta || !localStorage.getItem('lk_user_avatar')) {
                localStorage.setItem('lk_user_avatar', relRow.avatar);
              }
            }
            // 关联行的昵称也遵循同一覆盖策略
            setLocalUsername(relRow.user_name, overwriteUserMeta);
          }
          // 合并完成后：只清 pending_bind_email（临时待合并标记），不碰 user_email。
          // user_email 是该账号的永久邮箱标识，清掉后未来跨设备合并就找不到这行了。
          // 匿名临时行（UID_B）的完整清理由 SIGNED_IN 事件在 OTP 登录后统一 delete 处理。
          supabase
            .from('user_data')
            .update({ pending_bind_email: null })
            .eq('user_id', relRow.user_id)
            .then(({ error: clearErr }) => {
              if (clearErr) console.warn('[Supabase] 清除孤儿行 pending_bind_email 失败:', clearErr.message);
              else console.log(`[Supabase] 已清除孤儿行 ${relRow.user_id} 的 pending_bind_email`);
            });
        }
        if (mergedCount > 0) {
          console.log(`[Supabase] 同邮箱多账号合并：共合并 ${mergedCount} 条关联数据`);
        }
      }
    }
  } catch (e) {
    console.warn('[Supabase] 同邮箱多账号合并查询失败:', e.message);
  }

  // Fix: 只要 cloudData 不为 null 就视为云端有数据，不再要求 spirits/completedTasks 非空。
  // 之前的条件在孤儿行合并后 cloudData 存在但字段为空对象时会走 else 分支，
  // 把本地（可能为空）的数据上传覆盖了合并后的云端数据。
  if (cloudData != null) {
    // 云端有数据 → 与本地合并，取并集
    if (cloudData.activeTask && !cloudData.activeTasks) {
      cloudData.activeTasks = [cloudData.activeTask];
      delete cloudData.activeTask;
    }
    if (!cloudData.activeTasks) cloudData.activeTasks = [];

    const mergedRaw = mergeStates(localData, cloudData);
    // 清理存量 abandoned 记录（已废弃类型，不应再出现在刷取记录里）
    // 同时执行数据迁移：为旧版 S1 数据补全 season 字段（幂等）
    const mergedFiltered = {
      ...mergedRaw,
      completedTasks: (mergedRaw.completedTasks || []).filter(t => t.resultType !== 'abandoned'),
    };
    const merged = migrateLegacyData(mergedFiltered);
    dispatch({ type: '_HYDRATE_FROM_CLOUD', data: merged });
    // 把合并结果写到新 uid 下（data 列精简，completed_tasks_full 列存完整 shieldBreaks）
    try {
      const meta = buildUserMeta(merged);
      await supabase.from('user_data').upsert({
        user_id: uid,
        device_id: DEVICE_ID,
        data: buildSlimState(merged),
        completed_tasks_full: buildFullTasks(merged),
        active_tasks_summary: buildActiveTasksSummary(merged),
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
    // 云端无有效数据 → 上传本地数据（同样过滤 abandoned）
    const cleanLocal = {
      ...localData,
      completedTasks: (localData.completedTasks || []).filter(t => t.resultType !== 'abandoned'),
    };
    const meta = buildUserMeta(cleanLocal);
    await supabase.from('user_data').upsert({
      user_id: uid,
      device_id: DEVICE_ID,
      data: buildSlimState(cleanLocal),
      completed_tasks_full: buildFullTasks(cleanLocal),
      active_tasks_summary: buildActiveTasksSummary(localData),
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
  // 检测到脏标记，待初始化完成后补传数据
  const pendingDirtySync = useRef(false);
  // 绑定/登录成功后弹出的全局 Toast
  // { type: 'bind' | 'login' | 'switch' | 'offline' | 'syncError', email?: string } | null
  const [authToast, setAuthToast] = useState(null);
  // 最近一次云端同步结果，供 Profile 页展示动态状态
  // { status: 'pending' | 'success' | 'fail', time: Date } | null
  const [lastSyncResult, setLastSyncResult] = useState(null);
  // 持久化失败重试：记录失败次数和定时器 ID
  const syncRetryCountRef = useRef(0);
  const syncRetryTimerRef = useRef(null);
  // 供 visibilitychange 等外部调用：触发一次立即云端同步（读最新 state）
  // 由持久化 effect 在条件满足时注入，条件不满足时为 null（offline / 未初始化）
  const doSyncNowRef = useRef(null);
  // offline 模式下的后台重连：记录重试次数、定时器 ID、当前 attemptReconnect 函数引用
  const offlineRetryCountRef = useRef(0);
  const offlineRetryTimerRef = useRef(null);
  // retryOfflineNow() 调用时通过此 ref 直接触发最新的 attemptReconnect
  const attemptReconnectRef = useRef(null);
  // 用 ref 持有最新 authUser，供 onAuthStateChange 闭包读取最新值
  // 避免 useEffect 依赖 authUser 导致 subscription 被反复 unsubscribe/重注册
  const authUserRef = useRef(null);

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
        authUserRef.current = session.user;
        setUserId(uid);
        setAuthUser(session.user);

        // 2. 从云端拉取或上传数据
        // overwriteUserMeta=false：普通启动，本地已有昵称时不覆盖（保留用户最近改的名）
        await hydrateFromCloud(uid, dispatch, getLocalState(), false);
        setSyncStatus('ready');

        // 2.5. 检查脏标记：上次关闭页面时可能有未上传的数据
        // 不在此处直接调用（此时 initialized 尚未置 true，doSyncNowRef 尚未注入）
        // 通过 pendingDirtySync ref 传递信号，由持久化 effect 在初始化完成后触发补传
        const wasDirty = localStorage.getItem(DIRTY_KEY) === 'true';
        if (wasDirty) {
          console.log('[Supabase] 检测到上次关闭时有未同步数据，将在初始化完成后补传');
          pendingDirtySync.current = true;
        }

        // 3. 上报本次活跃时间（不管用户有没有操作，打开 App 就算活跃）
        supabase.from('user_data').upsert({
          user_id: uid,
          device_id: DEVICE_ID,
          last_active_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' }).then(({ error }) => {
          if (error) console.warn('[Supabase] 活跃上报失败:', error.message);
        });
      } catch (err) {
        console.warn('[Supabase] 初始化失败，降级为本地模式:', err.message);
        setSyncStatus('offline');
        // 提示用户当前处于本地模式，数据暂不同步
        setAuthToast({ type: 'offline' });
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

  // ── Auth 状态监听：只挂载一次（[] 依赖），用 authUserRef 读最新 authUser ──────
  // 重要：不能把 authUser state 加入依赖——每次 authUser 变化都会导致
  // subscription 被 unsubscribe 再重新注册，注册瞬间 SDK 可能重放当前 session
  // 事件，造成竞态覆盖数据（尤其是 uid 判断错误导致 dispatch 空数据）。
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const uid = session?.user?.id ?? null;
        const prevUid = userIdRef.current;

        // INITIAL_SESSION：App 冷启动时 SDK 恢复 session
        // 如果 init() 还没完成就先到这里，补设 authUser（PKCE 流下尤其重要）
        if (event === 'INITIAL_SESSION') {
          if (session?.user && !initDoneRef.current) {
            authUserRef.current = session.user;
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
          // 先读旧值判断是否是"新绑定邮箱"，再更新 ref
          const prevEmail = authUserRef.current?.email;
          authUserRef.current = session.user;
          setAuthUser(session.user);
          // prevEmail 为空说明之前是匿名账号，现在才第一次绑上邮箱
          if (newEmail && !prevEmail) {
            setAuthToast({ type: 'bind', email: newEmail });
            const avatar    = localStorage.getItem('lk_user_avatar') || null;
            const user_name = localStorage.getItem('lk_username')    || null;
            supabase.from('user_data').upsert({
              user_id: uid,
              device_id: DEVICE_ID,
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

        // SIGNED_IN：OTP 验证码登录
        if (event === 'SIGNED_IN') {
          if (!session) return;
          // init 未完成时跳过，避免与 init() 并发执行 hydrateFromCloud
          if (!initDoneRef.current) return;

          // uid 相同 = 同设备同账号（匿名升级为正式账号，或重复登录）
          if (uid === prevUid) {
            // 用 ref 读最新值，不用 React state authUser（闭包里可能是旧值）
            if (session.user.email && !authUserRef.current?.email) {
              authUserRef.current = session.user;
              setAuthUser(session.user);
              setAuthToast({ type: 'bind', email: session.user.email });
              const avatar    = localStorage.getItem('lk_user_avatar') || null;
              const user_name = localStorage.getItem('lk_username')    || null;
              supabase.from('user_data').upsert({
                user_id: uid,
                device_id: DEVICE_ID,
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
          // 记录 prevUid：OTP 登录成功后需要清理此匿名临时行
          const anonUidToClean = (!isSwitching && prevUid) ? prevUid : null;
          authUserRef.current = session.user;
          setAuthUser(session.user);
          setUserId(uid);
          userIdRef.current = uid;
          setSyncStatus('syncing');
          try {
            // overwriteUserMeta=true：uid 变化 = 换设备/找回账号，云端昵称直接覆盖本地
            await hydrateFromCloud(
              uid, dispatch,
              isSwitching ? buildDefaultState() : getLocalState(),
              true
            );
            setSyncStatus('ready');
            if (session.user.email) {
              setAuthToast({ type: isSwitching ? 'switch' : 'login', email: session.user.email });
              supabase.from('user_data').upsert({
                user_id: uid,
                device_id: DEVICE_ID,
                user_email: session.user.email,
                last_active_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }, { onConflict: 'user_id' }).then(({ error }) => {
                if (error) console.warn('[Supabase] 更新用户信息失败:', error.message);
              });
            }
            // OTP 登录成功后，删除匿名临时行（UID_B）。
            // 匿名 uid 完成了"搭桥"使命，数据已合并进正式 uid，行本身不再需要。
            // 注意：切换账号（isSwitching）时不删，因为 prevUid 是另一个正式账号。
            if (anonUidToClean) {
              supabase.from('user_data').delete()
                .eq('user_id', anonUidToClean)
                .then(({ error: delErr }) => {
                  if (delErr) console.warn('[Supabase] 清理匿名临时行失败:', delErr.message);
                  else console.log('[Supabase] 已删除匿名临时行:', anonUidToClean);
                });
            }
          } catch (err) {
            console.warn('[Supabase] auth 事件同步失败:', err.message);
            setSyncStatus('offline');
          }
          return;
        }

        if (event === 'SIGNED_OUT') {
          authUserRef.current = null;
          setAuthUser(null);
          setUserId(null);
          userIdRef.current = null;
          setSyncStatus('offline');
        }
      }
    );

    return () => subscription.unsubscribe();
  // 故意只在挂载时执行一次，内部通过 ref 读取最新值，避免重复注册带来的竞态
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 图鉴点亮回填：根据 completedTasks 反推应点亮的图鉴格子 ──────────────────
  // 用途：把"图鉴点亮放宽（同家族即点亮）"策略追溯应用到历史已记录的异色，
  // 包括用户在本次需求上线之前填的、本地或云端已存在的 completedTasks。
  // 触发时机：completedTasks 引用变化（启动加载本地、云端 hydrate、合并孤儿行、
  // 新增记录、删除记录都会换新数组），整个过程完全幂等：
  //   - reducer 内部判断到无变化会直接 return state，不会触发持久化死循环
  //   - 只追加点亮（false → true），不会反向关闭，避免覆盖用户在图鉴页手动取消的状态
  useEffect(() => {
    if (!state.completedTasks || state.completedTasks.length === 0) return;
    dispatch({ type: 'RECONCILE_SHINIES' });
  }, [state.completedTasks]);

  // ── 存量自定义方案果实补全：userPlanConfig 变化时自动把孤儿果实写入 customFruits ──
  // 场景：用户在「果实攻略自建果实」功能上线前就创建了自定义方案，方案里引用的
  // 非内置果实（fruitA / fruitB）未被写入 customFruits，攻略页无法展示它们。
  // 触发时机：userPlanConfig 引用变化（启动加载本地、云端 hydrate、新增/删除方案）。
  // 幂等保证：reducer 内部检查 customFruits 已有记录时直接跳过，不会重复写入。
  useEffect(() => {
    if (!state.userPlanConfig || state.userPlanConfig.length === 0) return;
    dispatch({ type: 'RECONCILE_CUSTOM_FRUITS' });
  }, [state.userPlanConfig]);

  // ── 持久化：state 变更时同步写 localStorage + 云端 ────────────────────────
  useEffect(() => {
    // 写 localStorage（离线缓存，始终执行，保留完整 shieldBreaks 供本地读取）
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

    // 初始化完成 + 有用户 ID + 不是离线模式 → 异步写云端
    if (!initialized || !userId || syncStatus === 'offline') {
      doSyncNowRef.current = null; // 条件不满足时清空，防止 visibilitychange 误调
      return;
    }

    // state 变化 = 本次有新数据需要同步 → 重置重试计数，取消上次的重试定时器
    if (syncRetryTimerRef.current) {
      clearTimeout(syncRetryTimerRef.current);
      syncRetryTimerRef.current = null;
    }
    syncRetryCountRef.current = 0;

    // 构建一次上传快照（捕获当前 state / userId / authUserRef，供重试闭包使用）
    const snapshot = {
      user_id: userId,
      device_id: DEVICE_ID,
      data: buildSlimState(state),
      completed_tasks_full: buildFullTasks(state),
      active_tasks_summary: buildActiveTasksSummary(state),
      ...buildUserMeta(state),
      ...(authUserRef.current?.email ? { user_email: authUserRef.current.email } : {}),
    };

    // 实际执行上传，失败时按指数退避调度重试（最多 3 次：30s / 60s / 120s）
    // isFirstCall=true：首次调用（非重试），先置 pending 让 Profile 感知同步进行中
    function doUpsert(isFirstCall = false) {
      if (isFirstCall) setLastSyncResult({ status: 'pending', time: new Date() });
      // 上传前同步写脏标记，确保页面关闭时数据未丢失可在下次启动时补传
      localStorage.setItem(DIRTY_KEY, 'true');
      supabase
        .from('user_data')
        .upsert({
          ...snapshot,
          updated_at: new Date().toISOString(),
          last_active_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })
        .then(({ error }) => {
          if (!error) {
            // 成功：清除重试状态、脏标记，更新最近同步结果
            syncRetryCountRef.current = 0;
            localStorage.removeItem(DIRTY_KEY);
            setLastSyncResult({ status: 'success', time: new Date() });
            return;
          }
          console.warn('[Supabase] 同步失败:', error.message);
          const attempt = syncRetryCountRef.current;
          if (attempt >= 3) {
            // 已重试 3 次仍失败：给用户轻提示，更新最近同步结果
            console.warn('[Supabase] 重试耗尽，数据暂存本地');
            setLastSyncResult({ status: 'fail', time: new Date() });
            setAuthToast({ type: 'syncError' });
            return;
          }
          // 指数退避：30s → 60s → 120s
          const delayMs = 30_000 * Math.pow(2, attempt);
          console.warn(`[Supabase] 将在 ${delayMs / 1000}s 后重试（第 ${attempt + 1} 次）`);
          syncRetryCountRef.current += 1;
          syncRetryTimerRef.current = setTimeout(doUpsert, delayMs);
        });
    }

    // 把 doUpsert 暴露给 visibilitychange 监听器，以便页面切后台时能主动触发
    doSyncNowRef.current = doUpsert;

    // 检查启动时的脏数据补传信号（init() 检测到脏标记时设置）
    // 此时 initialized=true 且 doSyncNowRef 已注入，可以安全触发补传
    if (pendingDirtySync.current) {
      pendingDirtySync.current = false;
      console.log('[Supabase] 初始化完成，执行脏数据补传');
      doUpsert(true);
      return;
    }

    doUpsert(true); // 首次调用，置 pending

    // 组件卸载时清除未执行的重试定时器
    return () => {
      if (syncRetryTimerRef.current) {
        clearTimeout(syncRetryTimerRef.current);
        syncRetryTimerRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, initialized, userId, syncStatus]);

  // ── 保底同步：页面切到后台 / 用户关闭 Tab 时立即触发一次云端写入 ────────────
  // 解决「用户记录完数据直接关闭页面，异步写还没发出」的数据丢失场景
  useEffect(() => {
    function onVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        // 读最新的 doUpsert（由持久化 effect 注入，offline 时为 null）
        doSyncNowRef.current?.();
        console.log('[Supabase] visibilitychange → hidden，触发保底同步');
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []); // 只挂载一次，通过 ref 读最新 doUpsert

  // ── offline 后台静默重连：syncStatus 变为 'offline' 时后台不停尝试恢复同步 ───
  // 退避策略：30s → 60s → 120s → 300s，之后每 5 分钟试一次，直到成功为止
  // 第 2 次仍失败 → 弹 networkWarn Toast，告知用户并提供手动重试入口
  // 成功后静默恢复（无 Toast），因为用户可能根本没意识到曾经离线
  useEffect(() => {
    // 不在 offline 状态：清除定时器，重置计数
    if (syncStatus !== 'offline') {
      if (offlineRetryTimerRef.current) {
        clearTimeout(offlineRetryTimerRef.current);
        offlineRetryTimerRef.current = null;
      }
      offlineRetryCountRef.current = 0;
      return;
    }

    // 退避延迟表（秒）：第 0 次 30s，第 1 次 60s，之后保持 60s
    const DELAYS_SEC = [30, 60];
    // 第 2 次失败后弹 networkWarn Toast（30s + 60s ≈ 持续离线 ~1.5 分钟）
    const WARN_AFTER = 2;

    async function attemptReconnect() {
      console.log(`[Supabase] offline 重连尝试 #${offlineRetryCountRef.current + 1}`);
      try {
        // 1. 先检查 session 是否可用（如果网络还断就会直接抛错）
        const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
        if (sessionErr) throw sessionErr;
        if (!session) throw new Error('no session');

        const uid = session.user.id;

        // 2. 重连成功后用 hydrateFromCloud 拉取云端数据并与本地合并后写回
        // 不能直接 upsert 本地数据：本地可能是空（换设备后 offline），会覆盖云端正确数据
        await hydrateFromCloud(uid, dispatch, getLocalState(), false);

        // 3. 成功！更新 React state，持久化 effect 之后会自动正常运作
        console.log('[Supabase] offline 重连成功，恢复同步');
        userIdRef.current = uid;
        authUserRef.current = session.user;
        setUserId(uid);
        setAuthUser(session.user);
        setSyncStatus('ready');
        // 静默恢复，不打扰用户
      } catch (err) {
        // 仍然无法连通，记录次数后调度下一次重试
        const attempt = offlineRetryCountRef.current;
        offlineRetryCountRef.current += 1;

        // 第 WARN_AFTER 次失败时，推送 networkWarn 提示（只推一次，之后继续静默重试）
        if (attempt + 1 === WARN_AFTER) {
          console.warn('[Supabase] offline 重连失败 2 次，推送网络异常提示');
          setAuthToast({ type: 'networkWarn' });
        }

        const delaySec = DELAYS_SEC[Math.min(attempt, DELAYS_SEC.length - 1)];
        console.warn(`[Supabase] offline 重连失败（${err.message}），${delaySec}s 后再试`);
        offlineRetryTimerRef.current = setTimeout(attemptReconnect, delaySec * 1000);
      }
    }

    // 把 attemptReconnect 挂到 ref，供 retryOfflineNow 立即调用
    attemptReconnectRef.current = attemptReconnect;

    // 首次进入 offline：延迟 30s 后开始第一次尝试
    offlineRetryTimerRef.current = setTimeout(attemptReconnect, DELAYS_SEC[0] * 1000);

    return () => {
      if (offlineRetryTimerRef.current) {
        clearTimeout(offlineRetryTimerRef.current);
        offlineRetryTimerRef.current = null;
      }
      attemptReconnectRef.current = null;
    };
  // syncStatus 变化时重新评估，其余依赖通过 ref / 闭包读取最新值
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncStatus]);

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
        device_id: DEVICE_ID,
        // data 列：精简版，forceSyncNow 也同步去掉 shieldBreaks
        data: buildSlimState(currentState),
        completed_tasks_full: buildFullTasks(currentState),
        active_tasks_summary: buildActiveTasksSummary(currentState),
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

  // ── 立即重试 offline 重连（networkWarn Toast 的「重试连接」按钮调用）──────────
  // 清零计数器、取消当前定时器、立即发起一次重连尝试
  const retryOfflineNow = () => {
    if (syncStatus !== 'offline') return;
    offlineRetryCountRef.current = 0;
    if (offlineRetryTimerRef.current) {
      clearTimeout(offlineRetryTimerRef.current);
      offlineRetryTimerRef.current = null;
    }
    attemptReconnectRef.current?.();
  };

  // ── 手动触发一次 Supabase 同步（Profile 页「同步失败，点击重试」按钮调用）──
  // 无论在线/离线，都先置 pending 给用户即时反馈，再触发实际的云端操作：
  //   在线 → 直接调 doUpsert 写 Supabase
  //   离线 → 调 retryOfflineNow 重新尝试连接 Supabase
  const retrySyncNow = () => {
    setLastSyncResult({ status: 'pending', time: new Date() });
    if (syncStatus === 'offline') {
      retryOfflineNow();
    } else {
      doSyncNowRef.current?.();
    }
  };

  // ── Profile 主动探查 Supabase 同步状态（进入「我的」主页时调用）────────────
  // 无论在线/离线，都先置 pending，再触发一次实际的 Supabase 操作，
  // 让用户看到「同步中…→ 已同步 ✓ / 同步失败」的完整反馈。
  //   在线 → doSyncNowRef 触发 upsert
  //   离线 → retryOfflineNow 尝试重连 Supabase（成功后自动 upsert）
  const pingSync = () => {
    setLastSyncResult({ status: 'pending', time: new Date() });
    if (syncStatus === 'offline') {
      retryOfflineNow();
    } else if (doSyncNowRef.current) {
      doSyncNowRef.current();
    }
  };

  // ── 三池保底计数（从事件流实时派生，随 activeTasks / completedTasks 自动更新）──
  const allPlans = useMemo(() => [
    ...PLANS,
    ...(state.userPlanConfig || []).filter(p => !p.deleted),
  ], [state.userPlanConfig]);

  // 统计 activeTasks 和 completedTasks 中未清零的池：属性池和世界池跨任务全局累积
  // 按当前赛季过滤 completedTasks，避免 S1 历史保底进度污染 S2 显示
  const poolCounts = useMemo(() =>
    computePoolCounts(state.activeTasks, state.completedTasks, allPlans, state.currentSeason),
    [state.activeTasks, state.completedTasks, allPlans, state.currentSeason]
  );

  return (
    <StoreContext.Provider value={{ state, dispatch, syncStatus, userId, authUser, authToast, clearAuthToast: () => setAuthToast(null), forceSyncNow, setAuthMode, retryOfflineNow, lastSyncResult, retrySyncNow, pingSync, poolCounts }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  return useContext(StoreContext);
}
