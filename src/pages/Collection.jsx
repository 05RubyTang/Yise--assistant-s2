import { useState } from 'react';
import { useStore } from '../store';
import { PLANS, ATTR_SHINIES, SEASON_SHINIES, findPlansForSpirit, SPECIAL_FORMS, resolveShinyKey, S1_PLANS, S2_PLANS } from '../data/plans';
import SpiritAvatar from '../components/SpiritAvatar';
import PlanIcon from '../components/PlanIcon';
import { getWikiSpiritImg } from '../data/spirits-wiki';
import { getWikiFruitImg } from '../data/fruits-wiki';
import { LOCAL_SPIRIT_FILES, LOCAL_FRUIT_FILES } from '../data/local-assets';
import SeasonSwitcher from '../components/SeasonSwitcher';

const base = import.meta.env.BASE_URL;

// 精灵名 → 本地图片文件名映射
const SPIRIT_IMG_FILE = { '柴渣虫': '燃薪虫' };

// S2 战令精灵列表
const S2_BATTLE_PASS_SPIRITS = ['雪怪', '爆焰喷喷'];

// 获取指定赛季的精灵列表
function getSpiritsBySeason(season) {
  const seasonPlans = season === 'S1' ? S1_PLANS : S2_PLANS;
  const seasonShinies = [];
  const attrShinies = [];
  const battlePassShinies = season === 'S2' ? S2_BATTLE_PASS_SPIRITS : [];

  seasonPlans.forEach(plan => {
    if (plan.shinies && plan.shinies.length > 0) {
      const isSeasonalPlan = plan.season === true || plan.category === 'seasonal';
      if (isSeasonalPlan) {
        seasonShinies.push(...plan.shinies);
      } else {
        attrShinies.push(...plan.shinies);
      }
    }
  });

  return {
    all: [...new Set([...seasonShinies, ...attrShinies, ...battlePassShinies])],
    seasonal: [...new Set(seasonShinies)],
    attr: [...new Set(attrShinies)],
    battlePass: battlePassShinies,
  };
}

// 判断某精灵属于哪类（基于赛季）
function getSpiritTag(name, season) {
  const spiritsByseason = getSpiritsBySeason(season);
  if (spiritsByseason.battlePass.includes(name)) return 'battlePass';
  if (spiritsByseason.seasonal.includes(name)) return 'adventure';
  if (spiritsByseason.attr.includes(name)) return 'attr';
  return 'attr'; // fallback
}

// 获取某只图鉴精灵的获取记录。
// 走"图鉴点亮放宽"同款归一化策略：把每条记录的 resultSpirit 用 resolveShinyKey
// 转成"该家族在图鉴里的代表名"再与当前精灵 name 比对。
// 这样无论用户当时填的是"燃薪虫"还是"柴渣虫"，"柴渣虫"详情页都能聚合到所有同家族记录。
function getSpiritRecords(name, state) {
  const targetKey = resolveShinyKey(name);
  return (state.completedTasks || [])
    .filter(t => {
      if (!t || !t.resultSpirit) return false;
      if (t.resultType === 'abandoned') return false;
      return resolveShinyKey(t.resultSpirit) === targetKey;
    })
    .map(t => ({
      taskId: t.id,
      planId: t.planId,
      shieldBreakCount: t.shieldBreakCount,
      ballsUsed: t.ballsUsed,
      completedAt: t.completedAt,
      // familyAlias：仅当用户填的名字与图鉴代表名不一致时才有值
      // 用于在 RecordRow 上额外标注"实际填写：xxx"，避免用户困惑
      familyAlias: t.resultSpirit !== name ? t.resultSpirit : null,
    }));
}

// 支持 wiki 兜底的果实图卡
function FruitImg({ name, size = 60 }) {
  const hasLocal = LOCAL_FRUIT_FILES.has(name);
  const localSrc = hasLocal ? `${base}fruits/${encodeURIComponent(name)}.png?v=3` : null;
  const rawWikiSrc = getWikiFruitImg(name);
  // v=3 用于破除浏览器对旧 wiki CDN URL 的缓存（果实图标 URL 有过变更）
  const wikiSrc = rawWikiSrc ? `${rawWikiSrc}?v=3` : null;
  const [src, setSrc] = useState(localSrc || wikiSrc || '');
  const [triedWiki, setTriedWiki] = useState(!hasLocal);

  const handleError = (e) => {
    if (!triedWiki && wikiSrc) { setTriedWiki(true); setSrc(wikiSrc); }
    else { e.target.style.opacity = 0.15; }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
      <div style={{
        width: size, height: size, borderRadius: 10,
        background: '#F7F7F7', border: '1.5px solid rgba(103,93,83,0.14)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}>
        <img src={src} alt={name} loading="lazy"
          style={{ width: size - 8, height: size - 8, objectFit: 'contain' }}
          onError={handleError} />
      </div>
      <span style={{
        fontSize: 9, color: 'var(--text-muted)', fontWeight: 600,
        textAlign: 'center', maxWidth: size + 8,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>{name}</span>
    </div>
  );
}

// 支持 wiki 兜底的精灵图卡
function SpiritImg({ name, size = 60 }) {
  const fileName = SPIRIT_IMG_FILE[name] || name;
  const hasLocal = LOCAL_SPIRIT_FILES.has(fileName);
  const localSrc = hasLocal ? `${base}spirits/${encodeURIComponent(fileName)}.png?v=2` : null;
  const wikiSrc = getWikiSpiritImg(name);
  const [src, setSrc] = useState(localSrc || wikiSrc || '');
  const [triedWiki, setTriedWiki] = useState(!hasLocal);

  const handleError = (e) => {
    if (!triedWiki && wikiSrc) { setTriedWiki(true); setSrc(wikiSrc); }
    else { e.target.style.opacity = 0.15; }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
      <div style={{
        width: size, height: size, borderRadius: 10,
        background: '#F7F7F7', border: '1.5px solid rgba(103,93,83,0.14)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}>
        <img src={src} alt={name} loading="lazy"
          style={{ width: size - 8, height: size - 8, objectFit: 'contain' }}
          onError={handleError} />
      </div>
      <span style={{
        fontSize: 9, color: 'var(--text-muted)', fontWeight: 600,
        textAlign: 'center', maxWidth: size + 8,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>{name}</span>
    </div>
  );
}

// ─── 攻略卡（升级版：区分属性池/单刷池）──────────────────────────────────────
function PlanInfo({ plan, currentSeason }) {
  const relatedForms = SPECIAL_FORMS.filter(f => f.planIds.includes(plan.id));
  const isSeasonPlan = !!plan.season;
  const isNoShiny = !!plan.noShiny;

  // 判断是否为单刷池（无 fruitB）还是属性池（有 fruitB）
  const isSingleFruit = !plan.fruitB;

  // 根据当前赛季过滤精灵列表
  const filterShiniesBySeason = (shinies) => {
    if (!shinies || !currentSeason) return shinies || [];
    const seasonSpirits = getSpiritsBySeason(currentSeason);
    return shinies.filter(name => seasonSpirits.all.includes(name));
  };

  // = 右侧展示的精灵：noShiny 方案用 poolShinies，普通方案用 shinies（赛季过滤）
  const rawShinies = isNoShiny
    ? (plan.poolShinies || [])
    : (plan.shinies || []);
  const visibleShinies = filterShiniesBySeason(rawShinies);

  // 标签文字与颜色
  const poolLabel = isSeasonPlan
    ? '赛季单刷池'
    : isNoShiny ? '积累属系池'
    : isSingleFruit ? '单刷池' : '属性池';
  const poolColor = isSeasonPlan
    ? { bg: 'rgba(244,143,177,0.12)', border: 'rgba(244,143,177,0.4)', text: '#C0568A' }
    : isNoShiny
      ? { bg: 'rgba(255,193,7,0.1)', border: 'rgba(255,193,7,0.35)', text: '#9A7208' }
      : isSingleFruit
        ? { bg: 'rgba(91,156,246,0.1)', border: 'rgba(91,156,246,0.3)', text: '#4A80D0' }
        : { bg: 'rgba(103,170,92,0.1)', border: 'rgba(103,170,92,0.3)', text: '#4A8C40' };

  return (
    <div style={{
      background: 'var(--card-inner)', borderRadius: 12,
      padding: '10px 12px 12px', marginBottom: 8,
    }}>
      {/* 顶部：属性图标 + 方案名 + 池子类型标签 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
        <div style={{
          width: 26, height: 26, borderRadius: 6, background: '#F0E8D5',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, overflow: 'hidden', padding: 3,
        }}>
          <PlanIcon plan={plan} size={18} />
        </div>
        <span style={{ fontSize: 13, fontWeight: 800, flexShrink: 0 }}>
          {plan.season ? (plan.type || '') : `${plan.label || plan.type || '自定义'}方案`}
        </span>
        {/* 池子类型 tag */}
        <span style={{
          fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 20,
          background: poolColor.bg, color: poolColor.text,
          border: `1px solid ${poolColor.border}`, flexShrink: 0,
        }}>{poolLabel}</span>

        {/* 积累属系池方案专属：回顾价格高 tag */}
        {isNoShiny && (
          <span style={{
            fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 20,
            background: 'rgba(255,193,7,0.18)', color: '#B8860B',
            border: '1px solid rgba(255,193,7,0.5)', flexShrink: 0,
          }}>回顾价格高</span>
        )}

        {/* 同池精灵文字提示（非赛季、非单刷、非积累属系池方案）*/}
        {!isSeasonPlan && !plan.singleSpirit && !isNoShiny && visibleShinies.length > 0 && (
          <span style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.4 }}>
            同池：{visibleShinies.join('、')}
          </span>
        )}
      </div>

      {/* 果实公式：fruitA [+ fruitB] ＝ 精灵列表 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'nowrap', overflowX: 'auto', paddingBottom: 2 }}>
        {plan.fruitA && <FruitImg name={plan.fruitA} size={56} />}
        {plan.fruitB && (
          <>
            <span style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-muted)', flexShrink: 0 }}>+</span>
            <FruitImg name={plan.fruitB} size={56} />
          </>
        )}
        <span style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-muted)', flexShrink: 0 }}>＝</span>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'nowrap' }}>
          {visibleShinies.length > 0
            ? visibleShinies.map(n => <SpiritImg key={n} name={n} size={56} />)
            : <span style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                {isNoShiny ? '积累属系池权重' : (visibleShinies?.join('、') || '—')}
              </span>
          }
        </div>
      </div>

      {/* 赛季庇护所 */}
      {plan.season && plan.sanctuary && (
        <div style={{
          marginTop: 10, padding: '7px 10px', borderRadius: 8,
          background: 'rgba(91,156,246,0.07)', border: '1px solid rgba(91,156,246,0.2)',
          fontSize: 11, lineHeight: 1.6, color: 'var(--text-muted)',
        }}>
          <span style={{ color: '#5B9CF6', fontWeight: 800 }}>📍 推荐放置庇护所：</span>
          <span style={{ color: 'var(--text)', fontWeight: 700 }}>{plan.sanctuary}</span>
          {plan.sanctuaryTip && (
            <span style={{ color: 'var(--text-muted)' }}>（{plan.sanctuaryTip}）</span>
          )}
        </div>
      )}

      {/* 特殊形态庇护所 */}
      {relatedForms.map((form, i) => (
        <div key={i} style={{
          marginTop: 8, padding: '8px 10px', borderRadius: 8,
          background: 'rgba(156,111,224,0.06)', border: '1px solid rgba(156,111,224,0.22)',
          fontSize: 11, lineHeight: 1.7,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3, flexWrap: 'wrap' }}>
            <span style={{
              fontSize: 9, fontWeight: 800, padding: '1px 6px', borderRadius: 6,
              background: 'rgba(156,111,224,0.15)', color: '#9C6FE0',
              border: '1px solid rgba(156,111,224,0.3)',
            }}>🌰 特殊形态</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#2B2A2E' }}>{form.spirit}</span>
            <span style={{ color: 'var(--text-muted)' }}>→</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#9C6FE0' }}>{form.hiddenForm}</span>
          </div>
          <div style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
            <span style={{ color: '#5B9CF6', fontWeight: 700 }}>📍 推荐庇护所：</span>
            <span style={{ color: 'var(--text)', fontWeight: 700 }}>{form.sanctuary}</span>
          </div>
          <div style={{ color: 'var(--text-muted)', marginTop: 2 }}>
            将{form.acornDesc}放入此底护所，可解锁隐藏形态
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── 获取记录行 ───────────────────────────────────────────────────────────────
function RecordRow({ rec, index }) {
  const { dispatch, state } = useStore();
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState(rec.ballsUsed != null ? String(rec.ballsUsed) : '');
  // 同时在内置方案和用户自定义方案中查找（自定义方案 id 形如 user_plan_xxx）
  const plan = PLANS.find(p => p.id === rec.planId)
    || (state.userPlanConfig || []).find(p => p.id === rec.planId);

  const handleSave = () => {
    const val = inputVal.trim();
    const num = val ? parseInt(val, 10) : null;
    dispatch({
      type: 'UPDATE_COMPLETED_BALLS',
      taskId: rec.taskId,
      ballsUsed: (num != null && !isNaN(num) && num >= 0) ? num : null,
    });
    setEditing(false);
  };

  if (editing) {
    return (
      <div style={{ padding: '10px 0', borderTop: '1px solid var(--divider)' }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          {plan && <PlanIcon plan={plan} size={14} />}
          第{index + 1}次 · {plan?.type} · {rec.shieldBreakCount}次触发污染
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="number" inputMode="numeric"
            value={inputVal} onChange={e => setInputVal(e.target.value)}
            placeholder="消耗球数" autoFocus
            className="input-field" style={{ flex: 1 }} />
          <button onClick={handleSave} style={{
            flexShrink: 0, padding: '10px 14px', border: '2px solid #2B2A2E',
            borderRadius: 'var(--radius-sm)', background: '#2B2A2E', color: '#FBF7EC',
            fontSize: 12, fontWeight: 800, fontFamily: 'var(--font-body)', cursor: 'pointer',
            boxShadow: '0 2px 0 #111014',
          }}>保存</button>
          <button onClick={() => setEditing(false)} style={{
            flexShrink: 0, padding: '10px 10px', border: '1.5px solid rgba(103,93,83,0.3)',
            borderRadius: 'var(--radius-sm)', background: '#FBF7EC',
            color: 'var(--text-light)', fontSize: 12, fontFamily: 'var(--font-body)', cursor: 'pointer',
          }}>取消</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      padding: '10px 0', borderTop: '1px solid var(--divider)',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-light)' }}>
          {plan && <PlanIcon plan={plan} size={14} />}
          第{index + 1}次 · {plan?.type}
        </span>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--cta)' }}>
          {rec.shieldBreakCount}次触发污染
        </span>
        {rec.ballsUsed != null
          ? <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>{rec.ballsUsed} 咕噜球</span>
          : <span style={{ fontSize: 11, fontStyle: 'italic', color: 'rgba(160,144,128,0.7)' }}>待输入消耗咕噜球数量</span>
        }
        {/* 当用户填写的名字是同家族的进化形态而非图鉴代表名时，标注实际填写 */}
        {rec.familyAlias && (
          <span style={{ fontSize: 10, color: 'var(--text-muted)', fontStyle: 'italic' }}>
            实际填写：{rec.familyAlias}
          </span>
        )}
      </div>
      <button onClick={() => setEditing(true)} style={{
        flexShrink: 0, border: '1px solid rgba(103,93,83,0.25)', background: 'var(--card-inner)',
        borderRadius: 4, padding: '4px 10px', fontSize: 10,
        color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'var(--font-body)',
      }}>编辑</button>
    </div>
  );
}

// ─── 筛选项配置 ───────────────────────────────────────────────────────────────
const FILTERS = [
  { key: 'all',       label: '全部' },
  { key: 'obtained',  label: '已获得' },
  { key: 'missing',   label: '未获得' },
  { key: 'adventure', label: '奇遇异色' },
  { key: 'attr',      label: '普通异色' },
];

// ─── 主页面 ───────────────────────────────────────────────────────────────────
export default function Collection() {
  const { state, dispatch } = useStore();
  const currentSeason = state.currentSeason || 'S2';
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);

  // 获取当前赛季的精灵列表
  const spiritsByseason = getSpiritsBySeason(currentSeason);
  const ALL_SPIRITS = spiritsByseason.all;
  const SEASON_SHINIES = spiritsByseason.seasonal;
  const ATTR_SHINIES = spiritsByseason.attr;
  const BATTLE_PASS_SHINIES = spiritsByseason.battlePass;

  // 统计
  const totalCount  = ALL_SPIRITS.length;
  const obtainedCount = ALL_SPIRITS.filter(n => state.spirits[n]?.obtained).length;
  const battlePassObtained = BATTLE_PASS_SHINIES.filter(n => state.battlePassSpirits?.[n]?.obtained).length;
  const pct = totalCount > 0 ? Math.round((obtainedCount / totalCount) * 100) : 0;

  const attrObtained    = ATTR_SHINIES.filter(n => state.spirits[n]?.obtained).length;
  const seasonObtained  = SEASON_SHINIES.filter(n => state.spirits[n]?.obtained).length;

  // 按筛选条件过滤
  const visibleSpirits = ALL_SPIRITS.filter(name => {
    const obtained = !!state.spirits[name]?.obtained;
    const tag = getSpiritTag(name, currentSeason);
    if (filter === 'obtained')  return obtained;
    if (filter === 'missing')   return !obtained;
    if (filter === 'adventure') return tag === 'adventure';
    if (filter === 'attr')      return tag === 'attr';
    if (filter === 'battlePass') return tag === 'battlePass';
    return true;
  });

  const selectedPlans   = selected ? findPlansForSpirit(selected) : [];
  const selectedRecords = selected ? getSpiritRecords(selected, state) : [];
  const selectedTag     = selected ? getSpiritTag(selected, currentSeason) : null;
  const isBattlePassSpirit = selected && BATTLE_PASS_SHINIES.includes(selected);

  return (
    <div style={{ paddingBottom: 28 }}>

      {/* ── 赛季切换器 ── */}
      <div style={{ padding: '16px 16px 12px' }}>
        <SeasonSwitcher />
      </div>

      {/* ── 收集进度条（含标题+说明） ── */}
      <div style={{ margin: '0 16px 14px', padding: '12px 14px', background: 'var(--card)', border: '1.5px solid var(--card-border)', borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-card)' }}>
        {/* 活动标题 + 说明 */}
        <div style={{ marginBottom: 10 }}>
          <div className="font-subtitle" style={{ fontSize: 16, fontWeight: 900, color: 'var(--text)', marginBottom: 3 }}>
            {currentSeason === 'S1' ? 'S1 暗夜时光 · 异色&奇遇' : 'S2 狂欢怪谈 · 异色&奇遇'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.7 }}>
            {currentSeason === 'S1'
              ? '属性果实循环产出异色精灵；赛季奇遇精灵需完成第六章赛季任务后刷取'
              : '单刷专属果实可获得对应异色；赛季奇遇精灵需完成 S2 赛季任务'
            }
          </div>
        </div>
        {/* 分隔线 */}
        <div style={{ height: 1, background: 'var(--divider)', margin: '0 0 10px' }} />
        {/* 总进度 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 7 }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text)' }}>收集进度</span>
          {obtainedCount === totalCount
            ? <span style={{ fontSize: 13, fontWeight: 900, color: 'var(--success)', fontFamily: 'var(--font-body)' }}>✓ 全收！</span>
            : <span className="font-subtitle" style={{ fontSize: 13, fontWeight: 900, color: 'var(--cta)' }}>{obtainedCount} / {totalCount}</span>
          }
        </div>
        <div style={{ height: 7, borderRadius: 99, background: 'rgba(103,93,83,0.1)', overflow: 'hidden', marginBottom: 10 }}>
          <div style={{
            height: '100%', borderRadius: 99,
            width: `${pct}%`,
            background: obtainedCount === totalCount
              ? 'var(--success)'
              : 'linear-gradient(90deg, var(--cta), #E8733A)',
            transition: 'width 0.5s ease',
          }} />
        </div>
        {/* 分类小计 */}
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{
              fontSize: 8, fontWeight: 800, padding: '1px 5px', borderRadius: 20,
              background: 'rgba(244,143,177,0.13)', color: '#C0568A',
              border: '1px solid rgba(244,143,177,0.35)',
            }}>奇遇异色</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>
              {seasonObtained}/{SEASON_SHINIES.length}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{
              fontSize: 8, fontWeight: 800, padding: '1px 5px', borderRadius: 20,
              background: 'rgba(103,170,92,0.12)', color: '#4A8C40',
              border: '1px solid rgba(103,170,92,0.3)',
            }}>普通异色</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>
              {attrObtained}/{ATTR_SHINIES.length}
            </span>
          </div>
        </div>
      </div>

      {/* ── 筛选栏 ── */}
      <div style={{
        display: 'flex', gap: 6, padding: '0 16px 12px',
        overflowX: 'auto', scrollbarWidth: 'none',
      }}>
        {FILTERS.map(f => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                flexShrink: 0,
                padding: '5px 12px',
                border: active ? '2px solid var(--text)' : '1.5px solid var(--divider)',
                borderRadius: 20,
                background: active ? 'var(--text)' : 'var(--card)',
                color: active ? 'var(--bg)' : 'var(--text-muted)',
                fontSize: 12, fontWeight: active ? 800 : 600,
                fontFamily: 'var(--font-body)',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >{f.label}</button>
          );
        })}
      </div>

      {/* ── 精灵图鉴网格 ── */}
      {visibleSpirits.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)', fontSize: 13 }}>
          暂无符合条件的精灵
        </div>
      ) : (
        <div className="collection-grid">
          {visibleSpirits.map(name => {
            const isBattlePass = BATTLE_PASS_SHINIES.includes(name);
            const isObtained = isBattlePass
              ? !!state.battlePassSpirits?.[name]?.obtained
              : !!state.spirits[name]?.obtained;
            const tag = getSpiritTag(name, currentSeason);
            return (
              <div
                key={name}
                className="collection-item"
                onClick={() => setSelected(name)}
                style={{ position: 'relative' }}
              >
                {/* 精灵立绘（未获得灰阶）*/}
                <div style={{ position: 'relative', width: 58, height: 58, flexShrink: 0 }}>
                  <SpiritAvatar
                    name={name}
                    obtained={isObtained}
                    size={58}
                    showName={false}
                    bare
                  />
                  {/* 战令图标 */}
                  {isBattlePass && (
                    <span style={{
                      position: 'absolute', top: -2, left: -2,
                      fontSize: 11, lineHeight: 1,
                    }}>💎</span>
                  )}
                  {/* 已获得 ✓ 角标 */}
                  {isObtained && (
                    <span style={{
                      position: 'absolute', bottom: 0, right: 0,
                      fontSize: 9, fontWeight: 900, lineHeight: 1,
                      background: '#4B9C46', color: '#fff',
                      borderRadius: '50%', width: 15, height: 15,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>✓</span>
                  )}
                  {/* 未获得 锁 图标 */}
                  {!isObtained && (
                    <span style={{
                      position: 'absolute', bottom: 0, right: 0,
                      fontSize: 9, lineHeight: 1,
                      background: 'rgba(43,42,46,0.55)', color: 'rgba(255,255,255,0.8)',
                      borderRadius: '50%', width: 15, height: 15,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>🔒</span>
                  )}
                </div>

                {/* 精灵名 */}
                <div className="font-spirit" style={{
                  fontSize: 10, fontWeight: 800,
                  color: isObtained ? 'var(--text)' : 'var(--text-muted)',
                  textAlign: 'center', lineHeight: 1.2,
                  width: '100%', overflow: 'hidden',
                  textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  padding: '0 2px',
                }}>{name}</div>

                {/* 类型小 tag */}
                <span style={{
                  fontSize: 8, fontWeight: 700,
                  padding: '1px 5px', borderRadius: 20,
                  ...(tag === 'battlePass'
                    ? { background: 'rgba(255,193,7,0.15)', color: '#F57C00', border: '1px solid rgba(255,193,7,0.4)' }
                    : tag === 'adventure'
                    ? { background: 'rgba(244,143,177,0.15)', color: '#C0568A', border: '1px solid rgba(244,143,177,0.4)' }
                    : { background: 'rgba(103,170,92,0.13)', color: '#4A8C40', border: '1px solid rgba(103,170,92,0.3)' }
                  ),
                }}>
                  {tag === 'battlePass' ? '战令' : tag === 'adventure' ? '奇遇' : '异色'}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* ── 精灵详情弹窗 ── */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-content modal-content--fixed" onClick={e => e.stopPropagation()}>
            {/* 弹窗把手（固定在顶部，不随内容滚动）*/}
            <div style={{ flexShrink: 0, padding: '0 16px', position: 'relative' }}>
              <div className="modal-handle" />
              <button
                onClick={() => setSelected(null)}
                style={{
                  position: 'absolute', top: -2, right: 16,
                  border: '1.5px solid rgba(103,93,83,0.3)', background: 'var(--card-inner)',
                  borderRadius: '50%', width: 28, height: 28, fontSize: 14,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--text-light)', cursor: 'pointer', padding: 0, flexShrink: 0,
                }}
              >✕</button>
            </div>

            {/* 可滚动内容区（弹窗外框固定，只有此区域滚动）*/}
            <div className="modal-body">
              {/* 头部：头像 + 名字 + 状态 + tag */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, paddingRight: 36 }}>
                <SpiritAvatar name={selected} obtained={state.spirits[selected]?.obtained} size={60} showName={false} />
                <div>
                  <div className="font-spirit" style={{ fontSize: 18, fontWeight: 900, marginBottom: 5 }}>
                    {selected}
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* 获取状态 */}
                    <span style={{
                      display: 'inline-block', fontSize: 11, fontWeight: 700,
                      padding: '2px 10px', borderRadius: 20,
                      ...(state.spirits[selected]?.obtained
                        ? { background: 'var(--success-dim)', color: 'var(--success)', border: '1.5px solid rgba(75,156,70,0.3)' }
                        : { background: 'var(--card-inner)', color: 'var(--text-muted)', border: '1px solid var(--divider)' })
                    }}>
                      {state.spirits[selected]?.obtained ? '✓ 已获得' : '🔒 未获得'}
                    </span>
                    {/* 类型 tag */}
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                      ...(selectedTag === 'battlePass'
                        ? { background: 'rgba(255,193,7,0.15)', color: '#F57C00', border: '1px solid rgba(255,193,7,0.4)' }
                        : selectedTag === 'adventure'
                        ? { background: 'rgba(244,143,177,0.15)', color: '#C0568A', border: '1px solid rgba(244,143,177,0.4)' }
                        : { background: 'rgba(103,170,92,0.13)', color: '#4A8C40', border: '1px solid rgba(103,170,92,0.3)' }
                      ),
                    }}>
                      {selectedTag === 'battlePass' ? '💎 战令专属' : selectedTag === 'adventure' ? '赛季奇遇' : '赛季异色'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 战令标记功能 */}
              {isBattlePassSpirit && (
                <div style={{
                  marginBottom: 16,
                  padding: '12px',
                  background: 'rgba(255,193,7,0.08)',
                  border: '1.5px solid rgba(255,193,7,0.25)',
                  borderRadius: 8,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 16 }}>💎</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#F57C00' }}>
                      {currentSeason} 通行证专属异色
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10, lineHeight: 1.6 }}>
                    购买 {currentSeason} 通行证后即可直接获得，无需刷取
                  </div>
                  {!state.battlePassSpirits?.[selected]?.obtained ? (
                    <button
                      onClick={() => dispatch({ type: 'MARK_BATTLE_PASS_OBTAINED', spiritName: selected })}
                      style={{
                        width: '100%',
                        padding: '8px 16px',
                        border: '1.5px solid rgba(255,193,7,0.4)',
                        borderRadius: 8,
                        background: 'linear-gradient(135deg, #FFB300 0%, #F57C00 100%)',
                        color: '#fff',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      ✓ 标记已获得
                    </button>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#4B9C46' }}>
                        ✓ 已标记为获得
                      </span>
                      <button
                        onClick={() => dispatch({ type: 'UNMARK_BATTLE_PASS_OBTAINED', spiritName: selected })}
                        style={{
                          padding: '4px 12px',
                          border: '1.5px solid rgba(103,93,83,0.25)',
                          borderRadius: 6,
                          background: 'var(--card)',
                          color: 'var(--text-muted)',
                          fontSize: 10,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        取消标记
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* 刷取攻略标题 */}
              {!isBattlePassSpirit && (
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-light)', marginBottom: 8, letterSpacing: 0.5 }}>
                  刷取攻略
                </div>
              )}

              {/* 所有关联方案：积累属系池方案优先（战令精灵不显示） */}
              {!isBattlePassSpirit && (
                selectedPlans.length > 0
                  ? [...selectedPlans]
                      .sort((a, b) => (b.noShiny ? 1 : 0) - (a.noShiny ? 1 : 0))
                      .map(plan => <PlanInfo key={plan.id} plan={plan} currentSeason={currentSeason} />)
                  : <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: 12 }}>暂无攻略数据</div>
              )}

              {/* 获取记录（战令精灵不显示） */}
              {!isBattlePassSpirit && selectedRecords.length > 0 && (
                <>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-light)', margin: '12px 0 4px', letterSpacing: 0.5 }}>
                    获取记录
                  </div>
                  {selectedRecords.map((rec, i) => (
                    <RecordRow key={rec.taskId} rec={rec} index={i} />
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
