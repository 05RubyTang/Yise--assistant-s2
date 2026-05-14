import { useState } from 'react';
import { useStore } from '../store';

const base = import.meta.env.BASE_URL;
import { PLANS, getShinisByAttr } from '../data/plans';
import PlanCard from '../components/PlanCard';
import PlanIcon from '../components/PlanIcon';
import SpiritAvatar from '../components/SpiritAvatar';
import { FruitLine } from '../components/FruitTag';
import SeasonSwitcher from '../components/SeasonSwitcher';

/* ─── picker 模式：弹出方案选择 sheet ─────────────────────────────────────── */
function PlanSubPicker({ basePlan, userPlans, onSelect, onClose }) {
  const options = [
    { id: basePlan.id, label: `${basePlan.type}（推荐）`, fruitA: basePlan.fruitA, fruitB: basePlan.fruitB, isDefault: true },
    ...userPlans.map(p => ({ id: p.id, label: p.label, fruitA: p.fruitA, fruitB: p.fruitB, isDefault: false })),
  ];
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200 }} />
      <div style={{
        position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 201,
        background: 'var(--card)', borderRadius: '18px 18px 0 0',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.18)',
        display: 'flex', flexDirection: 'column', maxHeight: '70%',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--divider)' }} />
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '2px 16px 10px', borderBottom: '1.5px solid var(--divider)',
        }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 900, fontFamily: 'var(--font-display)', color: 'var(--text)' }}>选择具体方案</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>检测到你有 {userPlans.length} 套自定义方案</div>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', fontSize: 18, color: 'var(--text-muted)', cursor: 'pointer', padding: '0 4px' }}>✕</button>
        </div>
        <div style={{ overflowY: 'auto', flex: 1, padding: '8px 0 20px' }}>
          {options.map(opt => (
            <button key={opt.id} onClick={() => onSelect(opt.id)} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              width: '100%', padding: '12px 16px', border: 'none',
              background: 'transparent', borderBottom: '1px solid var(--divider)',
              cursor: 'pointer', textAlign: 'left',
            }}>
              <PlanIcon plan={basePlan} size={20} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', fontFamily: 'var(--font-display)' }}>{opt.label}</span>
                  {!opt.isDefault && (
                    <span style={{ fontSize: 9, fontWeight: 800, padding: '1px 6px', borderRadius: 10, background: 'rgba(103,93,83,0.12)', color: 'var(--text-muted)', border: '1px solid rgba(103,93,83,0.2)' }}>自定义</span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  <FruitLine fruitA={opt.fruitA} fruitB={opt.fruitB} size={13} />
                </div>
              </div>
              <span style={{ fontSize: 16, color: 'var(--text-muted)', flexShrink: 0 }}>›</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

/* ─── 工具函数 ─────────────────────────────────────────────────────────────── */

/** 判断一个方案的果实条件是否已满足（fruitA/fruitB 是否均在 ownedFruits 中） */
function isFruitReady(plan, ownedFruits) {
  const owned = new Set(ownedFruits || []);
  if (!plan.fruitA) return true; // 无果实信息视为满足
  const aOk = owned.has(plan.fruitA);
  const bOk = !plan.fruitB || owned.has(plan.fruitB);
  return aOk && bOk;
}

/** 果实未集齐标记 */
function FruitMissingBadge() {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      fontSize: 9, fontWeight: 800,
      color: '#B05800',
      background: 'rgba(200,100,0,0.10)',
      border: '1px solid rgba(200,100,0,0.25)',
      borderRadius: 6, padding: '1px 6px',
      whiteSpace: 'nowrap', flexShrink: 0,
    }}>
      🌰 果实未集齐
    </span>
  );
}

function calcPlanAvgBreaks(planId, completedTasks) {
  if (!completedTasks?.length) return null;
  const relevant = completedTasks.filter(t => t.planId === planId && t.resultType !== 'abandoned' && t.shieldBreakCount != null);
  if (!relevant.length) return null;
  const avg = relevant.reduce((s, t) => s + t.shieldBreakCount, 0) / relevant.length;
  return { avg: Math.round(avg * 10) / 10, count: relevant.length };
}

function calcAttrAvgBreaks(attrId, userPlans, completedTasks) {
  if (!completedTasks?.length) return null;
  const userPlanIds = (userPlans || []).filter(p => p.attrId === attrId).map(p => p.id);
  const allIds = new Set([attrId, ...userPlanIds]);
  const relevant = completedTasks.filter(t => allIds.has(t.planId) && t.resultType !== 'abandoned' && t.shieldBreakCount != null);
  if (!relevant.length) return null;
  const avg = relevant.reduce((s, t) => s + t.shieldBreakCount, 0) / relevant.length;
  return { avg: Math.round(avg * 10) / 10, count: relevant.length };
}

// 判断属性方案的状态
function getPlanStatus(plan, spirits, activeTasks) {
  const shinies = getShinisByAttr(plan.id);
  const obtainedCount = shinies.filter(s => spirits[s]?.obtained).length;
  if (shinies.length > 0 && obtainedCount === shinies.length) return 'done';
  if ((activeTasks || []).some(t => t.planId === plan.id)) return 'active';
  return 'idle';
}

// 判断赛季方案的状态
function getSeasonPlanStatus(plan, spirits, activeTasks) {
  const allObtained = plan.shinies.length > 0 && plan.shinies.every(n => spirits[n]?.obtained);
  if (allObtained) return 'done';
  if ((activeTasks || []).some(t => t.planId === plan.id)) return 'active';
  return 'idle';
}

/* ─── 状态视觉配置 ─────────────────────────────────────────────────────────── */
const STATUS_CFG = {
  active: { label: '刷取中', bg: '#C8830A', dotColor: '#FBF7EC', tagBg: 'rgba(251,247,236,0.25)', tagColor: '#FBF7EC', tagBorder: 'rgba(251,247,236,0.4)' },
  done:   { label: '已完成', bg: '#4B9C46', dotColor: '#FBF7EC', tagBg: 'rgba(251,247,236,0.25)', tagColor: '#FBF7EC', tagBorder: 'rgba(251,247,236,0.4)' },
  idle:   { label: '未开始', bg: '#2B2A2E', dotColor: 'rgba(251,247,236,0.4)', tagBg: 'rgba(251,247,236,0.12)', tagColor: 'rgba(251,247,236,0.6)', tagBorder: 'rgba(251,247,236,0.2)' },
};

/* ─── 方案卡（属性混抓）── 点击直接进二级页 ─────────────────────────────────── */
function AttrPlanCard({ plan, userPlans, spirits, completedTasks, activeTasks, onClick, pinned, fruitReady }) {
  const shinies = getShinisByAttr(plan.id);
  const obtainedCount = shinies.filter(s => spirits[s]?.obtained).length;
  const allObtained = shinies.length > 0 && obtainedCount === shinies.length;
  const status = getPlanStatus(plan, spirits, activeTasks);
  const avgInfo = calcAttrAvgBreaks(plan.id, userPlans, completedTasks);
  const myUserPlans = (userPlans || []).filter(p => p.attrId === plan.id);
  // 积累属系池辅助方案（noShiny && attrId 指向该属系）
  const poolPlansForAttr = PLANS.filter(p => p.noShiny && p.attrId === plan.id);
  const totalPlanCount = 1 + poolPlansForAttr.length + myUserPlans.length;
  const isNoShiny = !!plan.noShiny; // 目标精灵无异色，用于积累属系池

  // noShiny 方案的「可产出异色」进度（用 poolShinies 替代 shinies）
  const poolShinies = plan.poolShinies || [];
  const poolObtainedCount = poolShinies.filter(n => spirits[n]?.obtained).length;
  const poolAllObtained = poolShinies.length > 0 && poolObtainedCount === poolShinies.length;

  // 有 poolShinies 的 noShiny 方案，用 pool 进度决定头部颜色
  const effectiveAllObtained = isNoShiny ? poolAllObtained : allObtained;
  const headerBg = status === 'active' ? '#C8830A' : effectiveAllObtained ? '#4B9C46' : '#2B2A2E';

  return (
    <div
      className="plan-card"
      onClick={onClick}
      style={{
        borderColor: status === 'active' ? '#C8830A' : effectiveAllObtained ? '#4B9C46' : '#675D53',
        boxShadow: status === 'active' ? '0 2px 0 #C8830A' : effectiveAllObtained ? '0 2px 0 #4B9C46' : '0 2px 0 #675D53',
        padding: 0, overflow: 'hidden', background: '#FBF7EC', cursor: 'pointer',
      }}
    >
      {/* 表头 */}
      <div style={{ background: headerBg, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <PlanIcon plan={plan} size={28} style={{ flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 15, fontWeight: 900, fontFamily: 'var(--font-display)', color: '#FBF7EC', letterSpacing: 0.5, lineHeight: 1.2 }}>
              {plan.type}
            </span>
          </div>
          <div style={{ fontSize: 10, color: 'rgba(251,247,236,0.65)', marginTop: 2 }}>
            {isNoShiny ? '积累属系池 · 精灵无异色' : (() => {
              const parts = [];
              if (poolPlansForAttr.length > 0) parts.push(`${poolPlansForAttr.length} 套积累池`);
              if (myUserPlans.length > 0) parts.push(`${myUserPlans.length} 套自定义`);
              return `${totalPlanCount} 套方案${parts.length > 0 ? `（含 ${parts.join('、')}）` : ''}`;
            })()}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <div style={{ textAlign: 'right' }}>
            {status === 'active' && (
              <div style={{ fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 20, background: 'rgba(251,247,236,0.25)', color: '#FBF7EC', border: '1px solid rgba(251,247,236,0.4)', marginBottom: 4, display: 'inline-block' }}>刷取中</div>
            )}
            {/* 数字进度：noShiny 用 poolShinies 进度，普通用 shinies 进度 */}
            {isNoShiny
              ? poolShinies.length > 0
                ? (
                  <div style={{ lineHeight: 1 }}>
                    <span className="font-subtitle" style={{ fontSize: 16, fontWeight: 900, color: '#FBF7EC' }}>{poolObtainedCount}</span><span style={{ fontSize: 10, fontWeight: 400, color: 'rgba(251,247,236,0.7)', marginLeft: 1 }}>/{poolShinies.length}</span>
                  </div>
                )
                : <div style={{ fontSize: 9, color: 'rgba(251,247,236,0.6)', fontStyle: 'italic' }}>无异色</div>
              : (
                <div style={{ lineHeight: 1 }}>
                  <span className="font-subtitle" style={{ fontSize: 16, fontWeight: 900, color: '#FBF7EC' }}>{obtainedCount}</span><span style={{ fontSize: 10, fontWeight: 400, color: 'rgba(251,247,236,0.7)', marginLeft: 1 }}>/{shinies.length}</span>
                </div>
              )
            }
            {effectiveAllObtained && <div style={{ fontSize: 9, color: '#FBF7EC', fontWeight: 700, marginTop: 2 }}>✓ 全收集</div>}
          </div>
          <span style={{ fontSize: 16, color: 'rgba(251,247,236,0.7)' }}>›</span>
        </div>
      </div>

      {/* 内容区 */}
      <div style={{ padding: '10px 14px 12px' }}>
        {/* 推荐果实 + 平均破盾 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: isNoShiny ? 4 : 10 }}>
          <div style={{ flex: 1, minWidth: 0, fontSize: 11, color: 'var(--text-light)' }}>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, marginRight: 4 }}>果实：</span>
            <FruitLine fruitA={plan.fruitA} fruitB={plan.fruitB} size={14} />
          </div>
          {!fruitReady && <FruitMissingBadge />}
          {!isNoShiny && fruitReady && (avgInfo
            ? <span style={{ fontSize: 9, color: '#8B5C00', fontWeight: 700, flexShrink: 0 }}>均 <span className="font-subtitle" style={{ fontSize: 11 }}>{avgInfo.avg}</span> 次破盾</span>
            : <span style={{ fontSize: 9, color: 'var(--text-muted)', fontStyle: 'italic', flexShrink: 0 }}>暂无记录</span>
          )}
        </div>
        {/* 精灵头像（有异色才展示）或 积累池说明 */}
        {isNoShiny ? (
          plan.poolShinies?.length > 0 ? (
            <div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 5, fontWeight: 600 }}>
                可产出：
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                {plan.poolShinies.map(name => (
                  <SpiritAvatar key={name} name={name} obtained={spirits[name]?.obtained} size={36} />
                ))}
                <span style={{
                  marginLeft: 'auto', fontSize: 11,
                  color: status === 'active' ? 'var(--cta)' : 'var(--text-muted)',
                  fontWeight: status === 'active' ? 700 : 600,
                }}>
                  {status === 'active' ? '继续刷取 →' : '查看详情 →'}
                </span>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              使用此精灵果实可持续积累属系池权重，提升同系别异色出货概率
              <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
                {status === 'active' ? '继续刷取 →' : '点击开始 →'}
              </span>
            </div>
          )
        ) : (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            {plan.shinies.map(name => (
              <SpiritAvatar key={name} name={name} obtained={spirits[name]?.obtained} size={36} />
            ))}
            <span style={{
              marginLeft: 'auto', fontSize: 11,
              color: status === 'active' ? 'var(--cta)' : 'var(--text-muted)',
              fontWeight: status === 'active' ? 700 : 600,
            }}>
              {status === 'active' ? '继续刷取 →' : '查看详情 →'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
/* ─── 方案卡（赛季奇遇）── 点击直接进二级页 ──────────────────────────────────── */
function SeasonPlanCard({ plan, spirits, completedTasks, activeTasks, onClick, subtitle, fruitReady }) {
  const status = getSeasonPlanStatus(plan, spirits, activeTasks);
  const avgInfo = calcPlanAvgBreaks(plan.id, completedTasks);
  const allObtained = plan.shinies.length > 0 && plan.shinies.every(n => spirits[n]?.obtained);
  const obtainedCount = plan.shinies.filter(n => spirits[n]?.obtained).length;

  const headerBg = status === 'active' ? '#C8830A' : allObtained ? '#4B9C46' : '#2B2A2E';

  return (
    <div
      className="plan-card"
      onClick={onClick}
      style={{
        borderColor: status === 'active' ? '#C8830A' : allObtained ? '#4B9C46' : '#675D53',
        boxShadow: status === 'active' ? '0 2px 0 #C8830A' : allObtained ? '0 2px 0 #4B9C46' : '0 2px 0 #675D53',
        padding: 0, overflow: 'hidden', background: '#FBF7EC', cursor: 'pointer',
      }}
    >
      {/* 表头 */}
      <div style={{ background: headerBg, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <PlanIcon plan={plan} size={28} style={{ flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 900, fontFamily: 'var(--font-display)', color: '#FBF7EC', letterSpacing: 0.5, lineHeight: 1.2 }}>
            {plan.type}
          </div>
          <div style={{ fontSize: 10, color: 'rgba(251,247,236,0.65)', marginTop: 2 }}>{subtitle || '赛季奇遇 · 单果实刷取'}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <div style={{ textAlign: 'right' }}>
            {status === 'active' && (
              <div style={{ fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 20, background: 'rgba(251,247,236,0.25)', color: '#FBF7EC', border: '1px solid rgba(251,247,236,0.4)', marginBottom: 4, display: 'inline-block' }}>刷取中</div>
            )}
            <div style={{ lineHeight: 1 }}>
              <span className="font-subtitle" style={{ fontSize: 16, fontWeight: 900, color: '#FBF7EC' }}>{obtainedCount}</span><span style={{ fontSize: 10, fontWeight: 400, color: 'rgba(251,247,236,0.7)', marginLeft: 1 }}>/{plan.shinies.length}</span>
            </div>
            {allObtained && <div style={{ fontSize: 9, color: '#FBF7EC', fontWeight: 700, marginTop: 2 }}>✓ 已获得</div>}
          </div>
          <span style={{ fontSize: 16, color: 'rgba(251,247,236,0.7)' }}>›</span>
        </div>
      </div>

      {/* 内容区 */}
      <div style={{ padding: '10px 14px 12px' }}>
        {/* 果实行 + 平均破盾 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{ flex: 1, minWidth: 0, fontSize: 11, color: 'var(--text-light)' }}>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, marginRight: 4 }}>果实：</span>
            <FruitLine fruitA={plan.fruitA} fruitB={null} size={14} />
          </div>
          {!fruitReady && <FruitMissingBadge />}
          {fruitReady && (avgInfo
            ? <span style={{ fontSize: 9, color: '#8B5C00', fontWeight: 700, flexShrink: 0 }}>均 <span className="font-subtitle" style={{ fontSize: 11 }}>{avgInfo.avg}</span> 次破盾</span>
            : <span style={{ fontSize: 9, color: 'var(--text-muted)', fontStyle: 'italic', flexShrink: 0 }}>暂无记录</span>
          )}
        </div>
        {/* 精灵头像 + 查看详情文字 */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          {plan.shinies.map(name => (
            <SpiritAvatar key={name} name={name} obtained={spirits[name]?.obtained} size={36} />
          ))}
          <span style={{
            marginLeft: 'auto', fontSize: 11,
            color: status === 'active' ? 'var(--cta)' : 'var(--text-muted)',
            fontWeight: status === 'active' ? 700 : 600,
          }}>
            {status === 'active' ? '继续刷取 →' : '查看详情 →'}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── 筛选项（与 picker 分类保持一致） ──────────────────────────────────────── */
const FILTERS = [
  { key: 'all',    label: '全部' },
  { key: 'attr',   label: '属性混抓' },
  { key: 'season', label: '单刷奇遇' },
  { key: 'single', label: '单刷异色' },
  { key: 'custom', label: '自定义' },
];

/* ─── 属系筛选选项 ────────────────────────────────────────────────────────────── */
const ATTR_OPTIONS = [
  { key: 'all',      label: '全部属系',  img: null,        color: null },
  { key: 'fire',     label: '火系',      img: '火系.png',   color: '#E8733A' },
  { key: 'ice',      label: '冰系',      img: '冰系.png',   color: '#42A5F5' },
  { key: 'electric', label: '电系',      img: '电系.png',   color: '#FDD835' },
  { key: 'phantom',  label: '幻系',      img: '幻系.png',   color: '#AB47BC' },
  { key: 'grass',    label: '草系',      img: '草系.png',   color: '#66BB6A' },
  { key: 'evil',     label: '恶系',      img: '恶系.png',   color: '#5D4037' },
  { key: 'ghost',    label: '幽系',      img: '幽系.png',   color: '#7E57C2' },
  { key: 'mech',     label: '机械系',    img: '机械系.png', color: '#78909C' },
  { key: 'light',    label: '光系',      img: '光系.png',   color: '#FFB300' },
  { key: 'cute',     label: '萌系',      img: '萌系.png',   color: '#E91E8C' },
  { key: 'water',    label: '水系',      img: '水系.png',   color: '#1565C0' },
];

/** 从 plan.iconImg（如 ${base}attrs/fire.png）提取属系 key */
function getPlanAttr(plan) {
  const m = (plan.iconImg || '').match(/attrs\/(\w+)\.png/);
  return m ? m[1] : null;
}

/* ─── 主页面 ─────────────────────────────────────────────────────────────────── */
export default function PlanList({ navigate, mode = 'library', goBack }) {
  const { state } = useStore();
  const currentSeason = state.currentSeason || 'S2';
  const [filter, setFilter] = useState('all');
  // 已确认生效的筛选状态
  const [fruitFilter, setFruitFilter] = useState('all'); // 'all' | 'ready' | 'missing'
  const [attrFilter, setAttrFilter]   = useState('all'); // 'all' | 'fire' | 'ice' | ...
  // 筛选弹窗开关 + 弹窗内临时状态（点确认才同步到上面）
  const [showFilterModal, setShowFilterModal]       = useState(false);
  const [tempFruitFilter, setTempFruitFilter]       = useState('all');
  const [tempAttrFilter,  setTempAttrFilter]        = useState('all');
  const [pickerTab, setPickerTab] = useState('all');

  const openFilterModal  = () => { setTempFruitFilter(fruitFilter); setTempAttrFilter(attrFilter); setShowFilterModal(true); };
  const confirmFilter    = () => { setFruitFilter(tempFruitFilter); setAttrFilter(tempAttrFilter); setShowFilterModal(false); };
  const resetTempFilters = () => { setTempFruitFilter('all'); setTempAttrFilter('all'); };
  const activeFilterCount = (fruitFilter !== 'all' ? 1 : 0) + (attrFilter !== 'all' ? 1 : 0);

  // ─── 按赛季筛选方案 ───────────────────────────────────────────────────────
  // 判断是否为赛季奇遇方案：S1 用 season: true，S2 用 category: 'seasonal'
  const isSeasonalPlan = (p) => p.season === true || p.category === 'seasonal';

  // 筛选当前赛季的方案
  const currentSeasonPlans = PLANS.filter(p => p.season === currentSeason);

  // noShiny 且有 attrId 的方案归属父属系二级页，不在主列表独立展示
  const attrPlans        = currentSeasonPlans.filter(p => !isSeasonalPlan(p) && !p.singleSpirit && !(p.noShiny && p.attrId));
  const seasonPlans      = currentSeasonPlans.filter(p => isSeasonalPlan(p));
  const singleSpiritPlans = currentSeasonPlans.filter(p => p.singleSpirit);

  // 已拥有果实
  const ownedFruits = state.ownedFruits || [];

  // 计算每类方案的状态 + 果实是否集齐
  const attrWithStatus = attrPlans.map(p => ({
    plan: p,
    status: getPlanStatus(p, state.spirits, state.activeTasks),
    fruitReady: isFruitReady(p, ownedFruits),
  }));
  const seasonWithStatus = seasonPlans.map(p => ({
    plan: p,
    status: getSeasonPlanStatus(p, state.spirits, state.activeTasks),
    fruitReady: isFruitReady(p, ownedFruits),
  }));
  const singleWithStatus = singleSpiritPlans.map(p => ({
    plan: p,
    status: getSeasonPlanStatus(p, state.spirits, state.activeTasks),
    fruitReady: isFruitReady(p, ownedFruits),
  }));

  const allWithStatus = [...attrWithStatus, ...seasonWithStatus, ...singleWithStatus];

  // 顶部总览统计（含单刷异色）
  const activeCount = allWithStatus.filter(x => x.status === 'active').length;
  const doneCount   = allWithStatus.filter(x => x.status === 'done').length;
  const idleCount   = allWithStatus.filter(x => x.status === 'idle').length;

  // 用户自定义方案
  const userPlans = (state.userPlanConfig || []).filter(p => !p.deleted);

  // 进行中的 planId（固定置顶）
  const activePlanIds = new Set((state.activeTasks || []).map(t => t.planId));

  // 排序：进行中 → 未开始(果实齐) → 未开始(果实缺) → 已完成
  const sortKey = ({ status, fruitReady }) => {
    if (status === 'active') return 0;
    if (status === 'idle' && fruitReady)  return 1;
    if (status === 'idle' && !fruitReady) return 2;
    return 3; // done
  };
  // 二维筛选：果实收录 + 属系
  const applyFilters = (arr) => arr.filter(x => {
    if (fruitFilter === 'ready'   && !x.fruitReady) return false;
    if (fruitFilter === 'missing' &&  x.fruitReady) return false;
    if (attrFilter !== 'all' && getPlanAttr(x.plan) !== attrFilter) return false;
    return true;
  });
  const sortedAttr   = applyFilters([...attrWithStatus].sort((a, b) => sortKey(a) - sortKey(b)));
  const sortedSeason = applyFilters([...seasonWithStatus].sort((a, b) => sortKey(a) - sortKey(b)));
  const sortedSingle = applyFilters([...singleWithStatus].sort((a, b) => sortKey(a) - sortKey(b)));

  // 自定义方案二维筛选（属系维度：有 iconImg 则匹配，否则不过滤）
  const userPlansWithFruit = userPlans.map(p => ({ plan: p, fruitReady: isFruitReady(p, ownedFruits) }));
  const filteredUserPlans  = applyFilters(userPlansWithFruit).map(x => x.plan);

  // library 模式分类显示控制
  const showAttr      = filter === 'all' || filter === 'attr';
  const showSeason    = filter === 'all' || filter === 'season';
  const showSingle    = filter === 'all' || filter === 'single';
  const showCustomLib = filter === 'all' || filter === 'custom';

  // picker 模式：带 tab 筛选的选方案页
  if (mode === 'picker') {
    const PICKER_TABS = [
      { key: 'all',     label: '全部' },
      { key: 'attr',    label: '属性混抓' },
      { key: 'season',  label: '单刷奇遇' },
      { key: 'single',  label: '单刷异色' },
      { key: 'custom',  label: '自定义方案' },
    ];

    const showAttr   = pickerTab === 'all' || pickerTab === 'attr';
    const showSeason = pickerTab === 'all' || pickerTab === 'season';
    const showSingle = pickerTab === 'all' || pickerTab === 'single';
    const showCustom = pickerTab === 'all' || pickerTab === 'custom';

    return (
      <div style={{ position: 'relative', paddingBottom: 24 }}>
        {/* 页头 */}
        <div style={{ padding: '20px 16px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
          {goBack && (
            <button className="back-btn" onClick={goBack} style={{ marginRight: 4 }}>
              <img src={`${import.meta.env.BASE_URL}back-icon.webp`} alt="返回" />
            </button>
          )}
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--text)', fontFamily: 'var(--font-display)' }}>选择刷取方案</div>
            <div style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 4, fontWeight: 600 }}>选一套方案，开始新的刷取</div>
          </div>
        </div>

        {/* ── Tab 筛选栏 ── */}
        <div style={{ display: 'flex', gap: 6, padding: '0 16px 12px', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {PICKER_TABS.map(t => {
            const isActive = pickerTab === t.key;
            const isCustomTab = t.key === 'custom';
            const baseStyle = {
              flexShrink: 0, padding: '5px 12px', borderRadius: 20,
              fontSize: 12, fontWeight: isActive ? 800 : 600,
              fontFamily: 'var(--font-body)', cursor: 'pointer', transition: 'all 0.15s',
              border: isActive ? '2px solid var(--text)' : '1.5px solid var(--divider)',
              background: isActive ? 'var(--text)' : 'var(--card)',
              color: isActive ? 'var(--bg)' : 'var(--text-muted)',
            };
            const customStyle = isCustomTab && isActive
              ? { background: '#7E57C2', border: '2px solid #7E57C2', color: '#fff' }
              : isCustomTab
              ? { background: 'rgba(126,87,194,0.08)', border: '1.5px solid rgba(126,87,194,0.35)', color: '#7E57C2' }
              : {};
            return (
              <button key={t.key} onClick={() => setPickerTab(t.key)}
                style={{ ...baseStyle, ...customStyle }}>
                {t.label}
              </button>
            );
          })}
        </div>

        {/* ── 属性混抓 ── */}
        {showAttr && (
          <>
            {pickerTab === 'all' && (
              <div style={{ padding: '0 16px 7px', fontSize: 12, fontWeight: 800, color: 'var(--text-muted)' }}>属性混抓</div>
            )}
            {attrPlans.map(plan => (
              plan.noShiny ? (
                // noShiny 方案（水系/萌系）用 AttrPlanCard，正确读取 poolShinies
                <AttrPlanCard
                  key={plan.id}
                  plan={plan}
                  userPlans={state.userPlanConfig}
                  spirits={state.spirits}
                  completedTasks={state.completedTasks}
                  activeTasks={state.activeTasks}
                  pinned={activePlanIds.has(plan.id)}
                  onClick={() => navigate('checklist', { planId: plan.id, basePlanId: plan.id })}
                />
              ) : (
                <div key={plan.id} style={{ padding: '0 16px 0' }}>
                  <PlanCard
                    plan={plan} spirits={state.spirits}
                    isActive={activePlanIds.has(plan.id)}
                    completedTasks={state.completedTasks}
                    onClick={() => navigate('checklist', { planId: plan.id, basePlanId: plan.id })}
                  />
                </div>
              )
            ))}
          </>
        )}

        {/* ── 单刷奇遇（赛季） ── */}
        {showSeason && (
          <>
            {pickerTab === 'all' && (
              <div style={{ padding: showAttr ? '8px 16px 7px' : '0 16px 7px', fontSize: 12, fontWeight: 800, color: 'var(--text-muted)' }}>单刷奇遇</div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 8px', padding: '0 16px' }}>
              {seasonPlans.map(plan => (
                <PlanCard key={plan.id} plan={plan} spirits={state.spirits}
                  isActive={activePlanIds.has(plan.id)} compact
                  completedTasks={state.completedTasks}
                  onClick={() => navigate('checklist', { planId: plan.id })}
                />
              ))}
            </div>
          </>
        )}

        {/* ── 单刷异色（普通异色单刷） ── */}
        {showSingle && (
          <>
            {pickerTab === 'all' && (
              <div style={{ padding: (showAttr || showSeason) ? '8px 16px 7px' : '0 16px 7px', fontSize: 12, fontWeight: 800, color: 'var(--text-muted)' }}>单刷异色</div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 8px', padding: '0 16px' }}>
              {singleSpiritPlans.map(plan => (
                <PlanCard key={plan.id} plan={plan} spirits={state.spirits}
                  isActive={activePlanIds.has(plan.id)} compact
                  completedTasks={state.completedTasks}
                  onClick={() => navigate('checklist', { planId: plan.id })}
                />
              ))}
            </div>
          </>
        )}

        {/* ── 自定义方案 ── */}
        {showCustom && (
          <>
            {pickerTab === 'all' && (
              <div style={{ padding: (showAttr || showSeason || showSingle) ? '8px 16px 7px' : '0 16px 7px', fontSize: 12, fontWeight: 800, color: 'var(--text-muted)' }}>自定义方案</div>
            )}
            {/* 已有的自定义方案列表 */}
            {userPlans.length > 0 && (
              <div style={{ padding: '0 16px' }}>
                {userPlans.map(plan => {
                  const isActive = activePlanIds.has(plan.id);
                  return (
                  <div
                    key={plan.id}
                    className="plan-card"
                    onClick={() => isActive
                      ? navigate('recorder', { planId: plan.id })
                      : navigate('checklist', { planId: plan.id })
                    }
                    style={{
                      borderColor: isActive ? '#C8830A' : '#675D53',
                      boxShadow: isActive ? '0 2px 0 #C8830A' : '0 2px 0 #675D53',
                      padding: 0, overflow: 'hidden', background: '#FBF7EC', cursor: 'pointer',
                      marginBottom: 8,
                    }}
                  >
                    <div style={{
                      background: isActive ? '#C8830A' : '#2B2A2E',
                      padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                      <PlanIcon plan={plan} size={20} />
                      <span style={{
                        flex: 1, fontSize: 13, fontWeight: 900,
                        fontFamily: 'var(--font-display)', color: '#FBF7EC',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>{plan.label || plan.type || '自定义方案'}</span>
                      {isActive && (
                        <span style={{
                          fontSize: 9, fontWeight: 800, padding: '1px 6px', borderRadius: 20,
                          background: 'rgba(251,247,236,0.25)', color: '#FBF7EC',
                          border: '1px solid rgba(251,247,236,0.4)', flexShrink: 0,
                        }}>刷取中</span>
                      )}
                    </div>
                    <div style={{ padding: '8px 12px 10px' }}>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 5 }}>
                        <FruitLine fruitA={plan.fruitA} fruitB={plan.fruitB} size={13} />
                      </div>
                      <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap' }}>
                        {plan.shinies?.slice(0, 4).map(name => (
                          <SpiritAvatar key={name} name={name} obtained={state.spirits[name]?.obtained} size={32} showName={false} />
                        ))}
                        <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-muted)' }}>
                          {isActive ? '继续刷取 →' : '点击开始 →'}
                        </span>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
            {/* 新建自定义方案入口 */}
            <div style={{ padding: userPlans.length > 0 ? '4px 16px 0' : '0 16px 0' }}>
              <div
                className="plan-card"
                onClick={() => navigate('customChecklist')}
                style={{
                  borderColor: '#675D53', boxShadow: '0 2px 0 #675D53',
                  padding: 0, overflow: 'hidden', background: '#FBF7EC', cursor: 'pointer',
                }}
              >
                <div style={{ background: '#7E57C2', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: 8, flexShrink: 0,
                    background: 'rgba(255,255,255,0.18)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
                  }}>✏️</div>
                  <span style={{ flex: 1, fontSize: 14, fontWeight: 900, fontFamily: 'var(--font-display)', color: '#fff', letterSpacing: 0.5 }}>
                    新建自定义方案
                  </span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', fontWeight: 600 }}>点击填写 →</span>
                </div>
                <div style={{ padding: '8px 14px 10px' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>手动填写果实组合，适合使用非标准方案的情况</div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // ── library 模式（主流程）──
  return (
    <>
    <div style={{ paddingBottom: 24 }}>

      {/* ── 赛季切换器 ── */}
      <div style={{ padding: '20px 16px 12px' }}>
        <SeasonSwitcher />
      </div>

      {/* ── 顶部总览数据模块（含标题+说明） ── */}
      <div style={{
        margin: '14px 16px 14px',
        background: 'var(--card)',
        border: '1.5px solid var(--card-border)',
        borderRadius: 'var(--radius-sm)',
        boxShadow: 'var(--shadow-card)',
        padding: '12px 14px',
        position: 'relative',
        overflow: 'visible',
      }}>
        {/* 右上角装饰图（向上超出卡片） */}
        <img
          src={`${base}plan-deco.webp`}
          alt="" aria-hidden="true"
          style={{
            position: 'absolute',
            top: -20,
            right: -4,
            height: 40,
            width: 'auto',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        />
        {/* 页面标题 + 说明 */}
        <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src={`${base}icon-fruit-plan.webp`} alt="" aria-hidden="true" style={{ width: 36, height: 36, objectFit: 'contain', flexShrink: 0 }} />
          <div>
            <div className="font-subtitle" style={{ fontSize: 16, fontWeight: 900, color: 'var(--text)', marginBottom: 2 }}>果实方案库</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>查看和管理你的果实方案</div>
          </div>
        </div>
        {/* 分隔线 */}
        <div style={{ height: 1, background: 'var(--divider)', margin: '0 0 10px' }} />
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10 }}>整体进度</div>
        <div style={{ display: 'flex', gap: 0 }}>
          {/* 已完成 */}
          <div style={{ flex: 1, textAlign: 'center', borderRight: '1px solid var(--divider)' }}>
            <div style={{ lineHeight: 1.2 }}><span className="font-subtitle" style={{ fontSize: 20, fontWeight: 900, color: 'var(--success)' }}>{doneCount}</span></div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, marginTop: 3 }}>已完成</div>
          </div>
          {/* 刷取中 */}
          <div style={{ flex: 1, textAlign: 'center', borderRight: '1px solid var(--divider)' }}>
            <div style={{ lineHeight: 1.2 }}><span className="font-subtitle" style={{ fontSize: 20, fontWeight: 900, color: '#C8830A' }}>{activeCount}</span></div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, marginTop: 3 }}>刷取中</div>
          </div>
          {/* 待开始 */}
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ lineHeight: 1.2 }}><span className="font-subtitle" style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-light)' }}>{idleCount}</span></div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, marginTop: 3 }}>待开始</div>
          </div>
        </div>
      </div>

      {/* ── 筛选栏第一行：方案分类 ── */}
      <div style={{ display: 'flex', gap: 6, padding: '0 16px 8px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {FILTERS.map(f => {
          const active = filter === f.key;
          const isCustom = f.key === 'custom';
          // 各分类计数（受果实筛选影响）
          const count = f.key === 'all'
            ? sortedAttr.length + sortedSeason.length + sortedSingle.length + filteredUserPlans.length
            : f.key === 'attr'   ? sortedAttr.length
            : f.key === 'season' ? sortedSeason.length
            : f.key === 'single' ? sortedSingle.length
            : filteredUserPlans.length; // custom
          const customActiveStyle = isCustom && active
            ? { background: '#7E57C2', border: '2px solid #7E57C2', color: '#fff' }
            : isCustom && !active
            ? { background: 'rgba(126,87,194,0.08)', border: '1.5px solid rgba(126,87,194,0.35)', color: '#7E57C2' }
            : {};
          return (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{
              flexShrink: 0, padding: '5px 12px',
              border: active ? '2px solid var(--text)' : '1.5px solid var(--divider)',
              borderRadius: 20,
              background: active ? 'var(--text)' : 'var(--card)',
              color: active ? 'var(--bg)' : 'var(--text-muted)',
              fontSize: 12, fontWeight: active ? 800 : 600,
              fontFamily: 'var(--font-body)', cursor: 'pointer', transition: 'all 0.15s',
              ...customActiveStyle,
            }}>
              {f.label}
              <span style={{ fontSize: 10, marginLeft: 4, opacity: 0.7 }}>({count})</span>
            </button>
          );
        })}
      </div>

      {/* ── 第二行：高级筛选入口按钮 ── */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '0 16px 12px', gap: 8 }}>
        {/* 当前生效的筛选摘要标签 */}
        {activeFilterCount > 0 && (
          <div style={{ display: 'flex', gap: 5, flex: 1, flexWrap: 'wrap' }}>
            {fruitFilter !== 'all' && (
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20,
                background: fruitFilter === 'ready' ? 'rgba(75,156,70,0.12)' : 'rgba(176,88,0,0.10)',
                color: fruitFilter === 'ready' ? '#4B9C46' : '#B05800',
                border: `1px solid ${fruitFilter === 'ready' ? 'rgba(75,156,70,0.35)' : 'rgba(176,88,0,0.3)'}`,
              }}>
                {fruitFilter === 'ready' ? '✓ 果实已集齐' : '✗ 果实未集齐'}
              </span>
            )}
            {attrFilter !== 'all' && (() => {
              const opt = ATTR_OPTIONS.find(o => o.key === attrFilter);
              return opt ? (
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20,
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  background: opt.color ? `${opt.color}18` : 'rgba(103,93,83,0.1)',
                  color: opt.color || 'var(--text-muted)',
                  border: `1px solid ${opt.color ? `${opt.color}55` : 'var(--divider)'}`,
                }}>
                  {opt.img && <img src={`${import.meta.env.BASE_URL}attrs18/${opt.img}`} alt="" style={{ width: 14, height: 14, objectFit: 'contain' }} />}
                  {opt.label}
                </span>
              ) : null;
            })()}
          </div>
        )}
        {activeFilterCount === 0 && (
          <span style={{ flex: 1, fontSize: 11, color: 'var(--text-muted)', opacity: 0.6 }}>可按属系 / 果实收录情况筛选</span>
        )}
        {/* 筛选按钮 */}
        <button onClick={openFilterModal} style={{
          flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5,
          padding: '5px 12px', borderRadius: 20, cursor: 'pointer',
          fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-body)',
          border: activeFilterCount > 0 ? '2px solid var(--text)' : '1.5px solid var(--divider)',
          background: activeFilterCount > 0 ? 'var(--text)' : 'var(--card)',
          color: activeFilterCount > 0 ? 'var(--bg)' : 'var(--text-muted)',
          transition: 'all 0.15s',
          position: 'relative',
        }}>
          ⚙ 筛选
          {activeFilterCount > 0 && (
            <span style={{
              fontSize: 9, fontWeight: 900,
              background: '#C8830A', color: '#fff',
              borderRadius: '50%', width: 14, height: 14,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}>{activeFilterCount}</span>
          )}
        </button>
      </div>

      {/* ── 自定义方案区块（全部模式下置顶） ── */}
      {showCustomLib && (
        <>
          <div style={{ padding: '0 16px 7px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)' }}>自定义方案</span>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', opacity: 0.6 }}>{filteredUserPlans.length} 个</span>
          </div>
          {/* 已有自定义方案列表 */}
          {filteredUserPlans.length > 0 && (
            <div style={{ padding: '0 16px' }}>
              {filteredUserPlans.map(plan => {
                const isActive = activePlanIds.has(plan.id);
                return (
                <div
                  key={plan.id}
                  className="plan-card"
                  onClick={() => isActive
                    ? navigate('recorder', { planId: plan.id })
                    : navigate('checklist', { planId: plan.id })
                  }
                  style={{
                    borderColor: isActive ? '#C8830A' : '#675D53',
                    boxShadow: isActive ? '0 2px 0 #C8830A' : '0 2px 0 #675D53',
                    padding: 0, overflow: 'hidden', background: '#FBF7EC', cursor: 'pointer',
                    marginBottom: 8,
                  }}
                >
                  <div style={{
                    background: isActive ? '#C8830A' : '#2B2A2E',
                    padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <PlanIcon plan={plan} size={20} />
                    <span style={{
                      flex: 1, fontSize: 13, fontWeight: 900,
                      fontFamily: 'var(--font-display)', color: '#FBF7EC',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{plan.label || plan.type || '自定义方案'}</span>
                    {isActive && (
                      <span style={{
                        fontSize: 9, fontWeight: 800, padding: '1px 6px', borderRadius: 20,
                        background: 'rgba(251,247,236,0.25)', color: '#FBF7EC',
                        border: '1px solid rgba(251,247,236,0.4)', flexShrink: 0,
                      }}>刷取中</span>
                    )}
                  </div>
                  <div style={{ padding: '8px 12px 10px' }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 5 }}>
                      <FruitLine fruitA={plan.fruitA} fruitB={plan.fruitB} size={13} />
                    </div>
                    <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap' }}>
                      {plan.shinies?.slice(0, 4).map(name => (
                        <SpiritAvatar key={name} name={name} obtained={state.spirits[name]?.obtained} size={32} showName={false} />
                      ))}
                      <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-muted)' }}>
                        {isActive ? '继续刷取 →' : '点击开始 →'}
                      </span>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          )}
          {/* 新建自定义方案入口 */}
          {userPlans.length === 0 && filter === 'custom' && (
            <div style={{ textAlign: 'center', padding: '16px 16px 8px', color: 'var(--text-muted)', fontSize: 13 }}>
              还没有自定义方案，点击下方新建吧
            </div>
          )}
          {/* 果实筛选后无结果时提示 */}
          {userPlans.length > 0 && filteredUserPlans.length === 0 && (
            <div style={{ textAlign: 'center', padding: '12px 16px 4px', color: 'var(--text-muted)', fontSize: 12 }}>
              当前果实筛选下无符合条件的自定义方案
            </div>
          )}
          <div style={{ padding: filteredUserPlans.length > 0 ? '4px 16px 0' : '0 16px 0' }}>
            <div
              className="plan-card"
              onClick={() => navigate('customChecklist', { saveOnly: true })}
              style={{
                borderColor: '#675D53', boxShadow: '0 2px 0 #675D53',
                padding: 0, overflow: 'hidden', background: '#FBF7EC', cursor: 'pointer',
              }}
            >
              <div style={{ background: '#7E57C2', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                  background: 'rgba(255,255,255,0.18)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                }}>✏️</div>
                <span style={{ flex: 1, fontSize: 15, fontWeight: 900, fontFamily: 'var(--font-display)', color: '#fff', letterSpacing: 0.5 }}>
                  新建自定义方案
                </span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', fontWeight: 600 }}>点击填写 →</span>
              </div>
              <div style={{ padding: '10px 14px 12px' }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.7 }}>
                  手动填写果实组合，适合使用非标准方案的情况
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── 属性混抓方案列表 ── */}
      {showAttr && sortedAttr.length > 0 && (
        <>
          <div style={{ padding: `${showCustomLib ? '10px' : '0'} 16px 7px`, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)' }}>属性混抓</span>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', opacity: 0.6 }}>{sortedAttr.length} 个</span>
          </div>
          {sortedAttr.map(({ plan, fruitReady }) => (
            <AttrPlanCard
              key={plan.id}
              plan={plan}
              userPlans={state.userPlanConfig}
              spirits={state.spirits}
              completedTasks={state.completedTasks}
              activeTasks={state.activeTasks}
              pinned={activePlanIds.has(plan.id)}
              fruitReady={fruitReady}
              onClick={() => navigate('attrPlanDetail', { planId: plan.id })}
            />
          ))}
        </>
      )}

      {/* ── 单刷奇遇方案列表 ── */}
      {showSeason && sortedSeason.length > 0 && (
        <>
          <div style={{ padding: `${showAttr || showCustomLib ? '10px' : '0'} 16px 7px`, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)' }}>单刷奇遇</span>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', opacity: 0.6 }}>{sortedSeason.length} 个</span>
          </div>
          {sortedSeason.map(({ plan, fruitReady }) => (
            <SeasonPlanCard
              key={plan.id}
              plan={plan}
              spirits={state.spirits}
              completedTasks={state.completedTasks}
              activeTasks={state.activeTasks}
              fruitReady={fruitReady}
              onClick={() => navigate('checklist', { planId: plan.id })}
            />
          ))}
        </>
      )}

      {/* ── 单刷异色方案列表 ── */}
      {showSingle && sortedSingle.length > 0 && (
        <>
          <div style={{ padding: `${showAttr || showSeason || showCustomLib ? '10px' : '0'} 16px 7px`, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)' }}>单刷异色</span>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', opacity: 0.6 }}>{sortedSingle.length} 个</span>
          </div>
          {sortedSingle.map(({ plan, fruitReady }) => (
            <SeasonPlanCard
              key={plan.id}
              plan={plan}
              spirits={state.spirits}
              completedTasks={state.completedTasks}
              activeTasks={state.activeTasks}
              fruitReady={fruitReady}
              subtitle="单刷异色 · 专属果实"
              onClick={() => navigate('checklist', { planId: plan.id })}
            />
          ))}
        </>
      )}

      {/* ── 全部筛选后无结果提示 ── */}
      {sortedAttr.length === 0 && sortedSeason.length === 0 && sortedSingle.length === 0 && filteredUserPlans.length === 0 && activeFilterCount > 0 && (
        <div style={{ textAlign: 'center', padding: '32px 24px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🔍</div>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>没有符合条件的方案</div>
          <div style={{ fontSize: 11, opacity: 0.7 }}>尝试调整筛选条件</div>
          <button onClick={() => { setFruitFilter('all'); setAttrFilter('all'); }} style={{
            marginTop: 12, padding: '6px 16px', borderRadius: 20, border: '1.5px solid var(--divider)',
            background: 'var(--card)', color: 'var(--text-muted)', fontSize: 12, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'var(--font-body)',
          }}>清除筛选</button>
        </div>
      )}

    </div>

    {/* ── 高级筛选弹窗（挂在 Fragment 内，fixed 定位脱离文档流） ── */}
    {showFilterModal && (
      <>
        {/* 遮罩 */}
        <div
          onClick={() => setShowFilterModal(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {/* 居中弹窗（阻止点击冒泡到遮罩） */}
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: 'relative', zIndex: 301,
              background: 'var(--card)', borderRadius: 20,
              boxShadow: '0 8px 40px rgba(0,0,0,0.22)',
              display: 'flex', flexDirection: 'column',
              width: 'min(92vw, 380px)', maxHeight: '80dvh',
            }}
          >
          {/* 标题栏 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 16px 12px', borderBottom: '1px solid var(--divider)' }}>
            <div style={{ fontSize: 15, fontWeight: 900, color: 'var(--text)', fontFamily: 'var(--font-display)' }}>⚙ 方案筛选</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button onClick={resetTempFilters} style={{ border: 'none', background: 'transparent', fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 700, fontFamily: 'var(--font-body)' }}>重置</button>
              <button onClick={() => setShowFilterModal(false)} style={{ border: 'none', background: 'transparent', fontSize: 16, color: 'var(--text-muted)', cursor: 'pointer', lineHeight: 1, padding: '0 2px' }}>✕</button>
            </div>
          </div>

          {/* 内容区（可滚动） */}
          <div style={{ overflowY: 'auto', flex: 1, padding: '16px 16px 8px' }}>

            {/* ── 维度1：果实收录情况 ── */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 10, letterSpacing: 0.5 }}>🌰 果实收录情况</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[
                  { key: 'all',     label: '全部',         color: null },
                  { key: 'ready',   label: '✓ 已收录齐全', color: '#4B9C46' },
                  { key: 'missing', label: '✗ 未收录齐全', color: '#B05800' },
                ].map(f => {
                  const active = tempFruitFilter === f.key;
                  return (
                    <button key={f.key} onClick={() => setTempFruitFilter(f.key)} style={{
                      padding: '6px 14px', borderRadius: 20, cursor: 'pointer',
                      fontSize: 12, fontWeight: active ? 800 : 600,
                      fontFamily: 'var(--font-body)', transition: 'all 0.15s',
                      border: active
                        ? `2px solid ${f.color || 'var(--text)'}`
                        : '1.5px solid var(--divider)',
                      background: active
                        ? (f.color || 'var(--text)')
                        : 'var(--card)',
                      color: active ? '#fff' : 'var(--text-muted)',
                    }}>
                      {f.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── 维度2：方案属系 ── */}
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 10, letterSpacing: 0.5 }}>🌈 方案属系</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {ATTR_OPTIONS.map(opt => {
                  const active = tempAttrFilter === opt.key;
                  return (
                    <button key={opt.key} onClick={() => setTempAttrFilter(opt.key)} style={{
                      padding: '6px 12px', borderRadius: 20, cursor: 'pointer',
                      fontSize: 12, fontWeight: active ? 800 : 600,
                      fontFamily: 'var(--font-body)', transition: 'all 0.15s',
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      border: active
                        ? `2px solid ${opt.color || 'var(--text)'}`
                        : '1.5px solid var(--divider)',
                      background: active
                        ? (opt.color || 'var(--text)')
                        : 'var(--card)',
                      color: active
                        ? (opt.key === 'electric' ? '#2B2A2E' : '#fff')
                        : 'var(--text-muted)',
                    }}>
                      {opt.img
                        ? <img src={`${import.meta.env.BASE_URL}attrs18/${opt.img}`} alt="" style={{ width: 16, height: 16, objectFit: 'contain' }} />
                        : '🌟'
                      }
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* 底部确认按钮 */}
          <div style={{ padding: '12px 16px 16px', borderTop: '1px solid var(--divider)' }}>
            <button onClick={confirmFilter} style={{
              width: '100%', padding: '12px', borderRadius: 12,
              background: 'var(--text)', color: 'var(--bg)',
              fontSize: 14, fontWeight: 900, fontFamily: 'var(--font-display)',
              border: 'none', cursor: 'pointer', letterSpacing: 0.5,
            }}>
              确认筛选
            </button>
          </div>
          </div>{/* 弹窗容器结束 */}
        </div>{/* 遮罩结束 */}
      </>
    )}
    </>
  );
}
