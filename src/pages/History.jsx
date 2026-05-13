import { useState, useEffect } from 'react';
import { useStore } from '../store';
import { PLANS, inferPoolType, POOL_TYPE_CONFIG, getBallBySpirit, getBallByPlan, getAttrIdBySpirit } from '../data/plans';
import PlanIcon from '../components/PlanIcon';
import SpiritAvatar from '../components/SpiritAvatar';
import ShieldDots from '../components/ShieldDots';

// 模块加载时计算一次，每次 Vite 重新构建值变化 → 强制浏览器放弃旧缓存
const _HERO_CARD_V = Date.now();

// poolType → 出货池图片文件名映射（attr/offpool 都指向属系池图）
const POOL_IMG = { family: 'pool-family', attr: 'pool-attr', offpool: 'pool-attr', world: 'pool-world', pool: 'pool-family' };

function formatDateTime(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} · ${hh}:${mi}`;
}

/** 解析 input 字符串为非负整数，无效则返回 null */
function parseNonNeg(str) {
  const n = parseInt(str.trim(), 10);
  return (str.trim() !== '' && !isNaN(n) && n >= 0) ? n : null;
}

function getStarRating(breakCount) {
  if (breakCount == null) return null;
  if (breakCount <= 10) return { stars: 5, label: '超级欧皇', color: '#C8830A' };
  if (breakCount <= 20) return { stars: 4, label: '欧皇',     color: '#C8830A' };
  if (breakCount <= 40) return { stars: 3, label: '正常发挥', color: '#4B9C46' };
  if (breakCount <= 55) return { stars: 2, label: '有点非',   color: '#8B4BB8' };
  if (breakCount <= 79) return { stars: 1, label: '非酋',     color: '#D4560A' };
  return { stars: 0, label: '极限保底', color: '#C8351A' };
}

function Stars({ count, color }) {
  return (
    <span style={{ color, fontSize: 13, letterSpacing: 1 }}>
      {'★'.repeat(count)}{'☆'.repeat(5 - count)}
    </span>
  );
}

function DetailRow({ label, children }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      justifyContent: 'space-between',
      padding: '8px 0',
      borderBottom: '1px solid rgba(103,93,83,0.1)',
    }}>
      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 4 }}>
        {children}
      </span>
    </div>
  );
}

// ─── 刷取详情全页面（History 版） ────────────────────────────────────────────

function TaskDetailPage({ task, onBack, userPlanConfig }) {
  useEffect(() => {
    document.body.classList.add('hide-scrollbar');
    return () => document.body.classList.remove('hide-scrollbar');
  }, []);

  const base = import.meta.env.BASE_URL;
  const plan = PLANS.find(p => p.id === task.planId)
    || (userPlanConfig || []).find(p => p.id === task.planId) || null;
  const isManual = task.resultType === 'manual';
  const isSuccess = task.resultType !== 'abandoned';
  const poolType = isSuccess && !isManual ? inferPoolType(task, plan) : null;
  const poolCfg  = poolType ? (POOL_TYPE_CONFIG[poolType] || POOL_TYPE_CONFIG.world) : null;
  const breakdowns = task.breakdowns || {};
  const polluted = breakdowns.polluted || 0;
  const original = breakdowns.original || 0;
  const shiny    = breakdowns.shiny    || 0;
  const hasShieldBreaks = task.shieldBreaks && task.shieldBreaks.length > 0;

  // ── 三池进度快照（从 shieldBreaks 的 pool 字段聚合，旧数据可能无 pool 字段）──
  const poolSnapshot = (() => {
    if (!hasShieldBreaks) return null;
    let family = 0, attr = 0, world = 0, unknown = 0;
    for (const b of task.shieldBreaks) {
      if (b.pool === 'family') family++;
      else if (b.pool === 'attr') attr++;
      else if (b.pool === 'world') world++;
      else if (b.result === 'polluted' || b.result === 'original' || b.result === 'jelly') unknown++;
    }
    // 全无 pool 字段（纯旧数据）则不展示快照，避免全显示 0 误导用户
    if (family === 0 && attr === 0 && world === 0 && unknown > 0) return null;
    return { family, attr, world };
  })();
  // 属性球跟随方案的果实精灵（spiritA），而非出货精灵的属性
  // 例：菊花梨方案（萌系）全程抓菊花梨消耗美妙球，即便最终出货的是治愈兔（火系）
  const ballInfo = getBallByPlan(plan) || (task.resultSpirit ? getBallBySpirit(task.resultSpirit) : null);
  const attrId = task.resultSpirit ? getAttrIdBySpirit(task.resultSpirit) : null;
  const isFamilyPool = poolType === 'family';

  // 欧非称号图片（仅非手动且有破盾数时展示）
  const luckImg = (() => {
    if (isManual || task.shieldBreakCount == null) return null;
    const n = task.shieldBreakCount;
    if (n <= 10) return 'luck-1.webp'; // 锦鲤本鲤
    if (n <= 22) return 'luck-2.webp'; // 欧皇附体
    if (n <= 35) return 'luck-3.webp'; // 略有天赋
    if (n <= 52) return 'luck-4.webp'; // 世界平均
    if (n <= 64) return 'luck-5.webp'; // 望穿秋水
    if (n <= 74) return 'luck-6.webp'; // 非酋觉醒
    return             'luck-7.webp';  // 保底战士
  })();

  return (
    /* ── 最外层：fixed 全屏容器，flex 纵向 ── */
    <div style={{
      position: 'fixed', inset: 0,
      display: 'flex', flexDirection: 'column',
      background: '#EBC858',
      overflow: 'hidden',
    }}>
      {/* 背景图层（absolute，随容器大小） */}
      <img
        src={`${base}detail-bg.webp?v=20260510b`}
        alt="" aria-hidden
        style={{
          position: 'absolute', top: 0, left: '50%',
          transform: 'translateX(-50%)',
          width: '96%', height: '100%',
          objectFit: 'fill',
          zIndex: 0, pointerEvents: 'none',
        }}
      />

      {/* ── 固定顶部区（不随滚动变化） ── */}
      <div style={{ position: 'relative', zIndex: 1, flexShrink: 0 }}>
        {/* 顶部导航栏 */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px 10px', gap: 8 }}>
          <button
            onClick={onBack}
            style={{
              background: 'none', border: 'none', borderRadius: 20,
              padding: '6px 14px 6px 10px',
              display: 'flex', alignItems: 'center', gap: 4,
              cursor: 'pointer', fontFamily: 'var(--font-body)',
            }}
          >
            <img src={`${base}back-icon.webp`} alt="" style={{ width: 20, height: 20 }} />
            <span style={{ fontSize: 13, fontWeight: 800, color: '#2B2A2E' }}>返回</span>
          </button>
          <span style={{ flex: 1, textAlign: 'center', fontSize: 16, fontWeight: 900, color: '#2B2A2E', fontFamily: 'var(--font-display)' }}>
            刷取详情
          </span>
          <div style={{ width: 70 }} />
        </div>

        {/* Hero Card */}
        {isSuccess && (
          <div style={{ margin: '0 16px 0', borderRadius: 20, position: 'relative', aspectRatio: '916 / 498', overflow: 'visible' }}>
            <img src={`${base}detail-hero-card.webp?v=${_HERO_CARD_V}`} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill', borderRadius: 20 }} />
            <div style={{ position: 'absolute', inset: 0, zIndex: 1, display: 'flex', alignItems: 'stretch' }}>
              {/* 左：精灵图 */}
              <div style={{ width: 140, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px 4px', marginLeft: 12, position: 'relative' }}>
                <SpiritAvatar bare name={task.resultSpirit} obtained size={118} />
                {/* 欧非称号贴片：精灵图左下角，突破卡片边界 */}
                {luckImg && (
                  <img
                    src={`${base}${luckImg}`}
                    alt=""
                    style={{
                      position: 'absolute',
                      bottom: 5,
                      left: -10,
                      width: 114,
                      objectFit: 'contain',
                      zIndex: 10,
                      pointerEvents: 'none',
                    }}
                  />
                )}
              </div>
              {/* 右：信息区 */}
              <div style={{ flex: 1, padding: '18px 14px 16px 8px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8, position: 'relative', zIndex: 1 }}>
                {/* 属系 icon + 精灵名 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#fff', border: '3px solid #fff', boxShadow: '3px 2px 0 rgba(19,19,19,1)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                    {attrId
                      ? <img src={`${base}attrs/${attrId}.webp`} alt={attrId} style={{ width: 24, height: 24, objectFit: 'contain' }} />
                      : <span style={{ fontSize: 14 }}>★</span>
                    }
                  </div>
                  <span className="font-spirit" style={{ fontSize: 26, fontWeight: 700, color: '#EEE7D7', textShadow: '3px 4px 0 rgba(0,0,0,0.93)', lineHeight: 1.2 }}>{task.resultSpirit}</span>
                </div>
                {/* 方案名 + 出货池 tag */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  {plan && <span style={{ fontSize: 14, fontWeight: 500, color: '#EEE7D7', fontFamily: 'var(--font-body)', textShadow: '0 4px 4px rgba(0,0,0,0.25)' }}>{plan.type}方案</span>}
                  {isManual && <span style={{ display: 'inline-block', background: '#8B7355', color: '#EEE7D7', fontSize: 11, fontWeight: 900, padding: '2px 7px', borderRadius: '7px 7px 7px 0', boxShadow: '3px 4px 0 rgba(0,0,0,1)', fontFamily: 'var(--font-body)' }}>手动补录</span>}
                  {!isManual && poolType && POOL_IMG[poolType] && (
                    <img
                      src={`${base}${POOL_IMG[poolType]}.webp`}
                      alt={poolType}
                      style={{ height: 22, objectFit: 'contain' }}
                    />
                  )}
                </div>
                {/* 保底进度 */}
                {!isManual && task.shieldBreakCount != null && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <img src={`${base}icon-progress.webp`} alt="" style={{ width: 18, height: 18, objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
                    <span style={{ fontSize: 13, fontWeight: 400, color: '#EEE7D7', fontFamily: 'var(--font-body)', textShadow: '0 4px 4px rgba(0,0,0,0.25)' }}>保底进度</span>
                    <span className="font-subtitle" style={{ fontSize: 20, fontWeight: 700, color: '#F8D25E', textShadow: '4px 4px 0 rgba(35,35,35,0.91)', marginLeft: 2 }}>{task.shieldBreakCount}/80</span>
                  </div>
                )}
                {/* 消耗球数 */}
                {task.ballsUsed != null && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <img src={`${base}icon-balls.webp`} alt="" style={{ width: 18, height: 18, objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
                    <span style={{ fontSize: 13, fontWeight: 400, color: '#EEE7D7', fontFamily: 'var(--font-body)', textShadow: '0 4px 4px rgba(0,0,0,0.25)' }}>消耗球数</span>
                    <span className="font-subtitle" style={{ fontSize: 20, fontWeight: 700, color: '#F8D25E', textShadow: '4px 4px 0 rgba(35,35,35,0.91)', marginLeft: 2 }}>{task.ballsUsed}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>{/* 固定顶部区结束 */}

      {/* ── 可滚动底部区 ── */}
      <div className="page-container" style={{
        position: 'relative', zIndex: 1,
        flex: 1,
        paddingTop: 0, paddingBottom: 24,
      }}>
        {/* 球数明细卡 */}
        {(task.ballsUsed != null || task.ballsUsedByType) && (
          <div style={{ margin: '0 16px 12px', borderRadius: 18, overflow: 'hidden', position: 'relative' }}>
            <div style={{ padding: '0 16px 14px' }}>
              <div className="font-subtitle" style={{ fontSize: 14, fontWeight: 800, color: '#675D53', letterSpacing: 0.8, marginBottom: 8 }}>消耗球数明细</div>
              <div style={{ height: 1, background: '#D3CFC8', marginBottom: 12 }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
                {/* 高级球 */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, borderRight: '1px solid #D3CFC8', paddingRight: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <img src={`${base}ball-adv.webp`} alt="高级球" style={{ width: 25, height: 25, objectFit: 'contain', flexShrink: 0 }} />
                    <span className="font-subtitle" style={{ fontSize: 28, fontWeight: 900, color: '#AE54DC', lineHeight: 1 }}>
                      {task.ballsUsedByType?.adv ?? (task.ballsUsedByType == null && task.ballsUsed != null ? task.ballsUsed : 0)}
                    </span>
                  </div>
                  <div className="font-subtitle" style={{ fontSize: 12, color: '#675D53', fontWeight: 700 }}>高级球</div>
                </div>
                {/* 赛季球 */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, borderRight: '1px solid #D3CFC8', paddingLeft: 8, paddingRight: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <img src={`${base}ball-sea.webp`} alt="赛季球" style={{ width: 25, height: 25, objectFit: 'contain', flexShrink: 0 }} />
                    <span className="font-subtitle" style={{ fontSize: 28, fontWeight: 900, color: '#7E57C2', lineHeight: 1 }}>
                      {task.ballsUsedByType?.sea ?? 0}
                    </span>
                  </div>
                  <div className="font-subtitle" style={{ fontSize: 12, color: '#675D53', fontWeight: 700 }}>赛季球</div>
                </div>
                {/* 属性球 */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, paddingLeft: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    {ballInfo
                      ? <img src={`${base}${ballInfo.file}`} alt={ballInfo.label} style={{ width: 25, height: 25, objectFit: 'contain', flexShrink: 0 }} />
                      : <div style={{ width: 25, height: 25, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>⚾</div>
                    }
                    <span className="font-subtitle" style={{ fontSize: 28, fontWeight: 900, color: '#5B9CF6', lineHeight: 1 }}>
                      {task.ballsUsedByType?.att ?? 0}
                    </span>
                  </div>
                  <div className="font-subtitle" style={{ fontSize: 12, color: '#675D53', fontWeight: 700 }}>{ballInfo?.label ?? '属性球'}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── 三池进度快照卡 ── */}
        {poolSnapshot && (
          <div style={{ margin: '0 16px 12px', borderRadius: 18, overflow: 'hidden', position: 'relative' }}>
            <div style={{ padding: '0 16px 14px' }}>
              <div style={{ marginBottom: 10 }}>
                <span className="font-subtitle" style={{ fontSize: 14, fontWeight: 800, color: '#675D53', letterSpacing: 0.8 }}>本次刷取中各池累计数</span>
                <div style={{ fontSize: 10, color: '#9B8F84', fontWeight: 500, marginTop: 2 }}>
                  本次刷取期间各池实际触发次数（非实时保底进度，仅作留念参考）
                </div>
              </div>
              <div style={{ height: 1, background: '#D3CFC8', marginBottom: 12 }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {[
                  { key: 'family', label: '家族池', cap: 80, color: '#C8830A', tagBg: '#FFF3CC', border: '#C8A020' },
                  { key: 'attr',   label: '系别池', cap: 80, color: '#7E4E00', tagBg: '#FFE8B0', border: '#D4940A' },
                  { key: 'world',  label: '世界池', cap: 80, color: '#5B3A9E', tagBg: '#EFE0FF', border: '#9B6DD4' },
                ].map(({ key, label, cap, color, tagBg, border }) => {
                  const val = poolSnapshot[key];
                  const pct = Math.min(100, Math.round((val / cap) * 100));
                  const isShinyPool = (
                    (key === 'family' && (poolType === 'family' || poolType === 'pool')) ||
                    key === poolType
                  );
                  return (
                    <div key={key} style={{
                      background: tagBg,
                      border: `1.5px solid ${border}`,
                      borderRadius: 12,
                      padding: '10px 10px 8px',
                      position: 'relative',
                      textAlign: 'center',
                    }}>
                      {/* 出货池角标 */}
                      {isShinyPool && (
                        <div style={{
                          position: 'absolute', top: 5, right: 6,
                          fontSize: 11, lineHeight: 1,
                          filter: 'drop-shadow(0 0 3px rgba(251,200,57,0.9))',
                        }}>✨</div>
                      )}
                      <div style={{ fontSize: 10, fontWeight: 700, color, marginBottom: 4 }}>{label}</div>
                      {/* 进度条 */}
                      <div style={{
                        height: 5, borderRadius: 3,
                        background: 'rgba(103,93,83,0.15)',
                        marginBottom: 5, overflow: 'hidden',
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${pct}%`,
                          borderRadius: 3,
                          background: color,
                          transition: 'width 0.3s',
                        }} />
                      </div>
                      <div className="font-subtitle" style={{ fontSize: 18, fontWeight: 900, color, lineHeight: 1 }}>{val}</div>
                      <div style={{ fontSize: 10, color: '#9B8F84', marginTop: 2 }}>/ {cap} 次</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 触发污染记录卡 */}
        {hasShieldBreaks && (
          <div style={{ margin: '0 16px 12px', borderRadius: 18, overflow: 'hidden', position: 'relative' }}>
            <div style={{ padding: '0 16px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span className="font-subtitle" style={{ fontSize: 14, fontWeight: 800, color: '#675D53', letterSpacing: 0.8 }}>触发污染记录</span>
                <div style={{ display: 'flex', gap: 8, fontSize: 10, fontWeight: 700 }}>
                  <span style={{ color: 'var(--success)' }}>原色×{original}</span>
                  <span style={{ color: 'var(--polluted)' }}>污染×{polluted}</span>
                  {shiny > 0 && <span style={{ color: 'var(--gold)' }}>异色×{shiny}</span>}
                </div>
              </div>
              <div style={{ height: 1, background: '#D3CFC8', marginBottom: 12 }} />
              <ShieldDots breaks={task.shieldBreaks} max={task.shieldBreakCount || task.shieldBreaks.length} />
            </div>
          </div>
        )}

        {/* 备注 */}
        {task.note && (
          <div style={{ margin: '0 16px 12px', background: 'rgba(43,42,46,0.06)', borderRadius: 12, padding: '10px 14px' }}>
            <span style={{ fontSize: 11, color: '#675D53', fontWeight: 600 }}>备注：{task.note}</span>
          </div>
        )}
      </div>{/* 可滚动区结束 */}
    </div>
  );
}

/** 单次刷取历史卡片 */
function HistoryCard({ task, index, userPlanConfig, onDetail }) {
  const { dispatch } = useStore();
  const plan = PLANS.find(p => p.id === task.planId)
    || (userPlanConfig || []).find(p => p.id === task.planId) || null;
  const isSuccess = task.resultType !== 'abandoned';
  // 三池类型（兼容旧数据：pool/offpool 会通过 inferPoolType 重新推断）
  const poolType = isSuccess ? inferPoolType(task, plan) : null;
  const poolCfg  = poolType ? (POOL_TYPE_CONFIG[poolType] || POOL_TYPE_CONFIG.world) : null;
  const breakdowns = task.breakdowns || {};
  const polluted = breakdowns.polluted || 0;
  const original = breakdowns.original || 0;
  const shiny = breakdowns.shiny || 0;

  // ---- 编辑态 ----
  const [editing, setEditing] = useState(false);
  const [inputs, setInputs] = useState({
    shieldBreakCount: '',
    polluted: '',
    original: '',
    ballsUsed: '',
    adv: '',
    sea: '',
    att: '',
  });
  // ---- 删除确认态 ----
  const [confirmDelete, setConfirmDelete] = useState(false);
  // ---- 分球明细展开态 ----
  const [showBallDetail, setShowBallDetail] = useState(false);

  const openEdit = () => {
    setConfirmDelete(false);
    setInputs({
      shieldBreakCount: task.shieldBreakCount != null ? String(task.shieldBreakCount) : '',
      polluted: String(polluted),
      original: String(original),
      ballsUsed: task.ballsUsed != null ? String(task.ballsUsed) : '',
      adv: task.ballsUsedByType?.adv != null ? String(task.ballsUsedByType.adv) : '',
      sea: task.ballsUsedByType?.sea != null ? String(task.ballsUsedByType.sea) : '',
      att: task.ballsUsedByType?.att != null ? String(task.ballsUsedByType.att) : '',
    });
    setEditing(true);
  };

  const handleSave = () => {
    const sbc = parseNonNeg(inputs.shieldBreakCount);
    const pol = parseNonNeg(inputs.polluted);
    const ori = parseNonNeg(inputs.original);
    const adv = parseNonNeg(inputs.adv), sea = parseNonNeg(inputs.sea), att = parseNonNeg(inputs.att);
    const hasDetail = adv != null && sea != null && att != null;
    const bal = hasDetail ? adv + sea + att : parseNonNeg(inputs.ballsUsed);
    const ballsUsedByType = hasDetail ? { adv, sea, att } : undefined;
    dispatch({
      type: 'UPDATE_COMPLETED_STATS',
      taskId: task.id,
      shieldBreakCount: sbc ?? task.shieldBreakCount,
      polluted: pol ?? polluted,
      original: ori ?? original,
      ballsUsed: bal,
      ballsUsedByType,
    });
    setEditing(false);
  };

  const handleDelete = () => {
    dispatch({ type: 'DELETE_COMPLETED_TASK', taskId: task.id });
  };

  const setField = (field, val) => setInputs(prev => ({ ...prev, [field]: val }));

  return (
    <div className="card animate-in" style={{ animationDelay: `${index * 0.04}s` }}>
      {/* 顶部行：精灵头像 + 名称 + 时间 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        {/* 精灵图 or 方案属性图标 */}
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: '#F0E8D5', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
        }}>
          {isSuccess
            ? <SpiritAvatar name={task.resultSpirit} obtained size={44} showName={false} />
            : plan ? <PlanIcon plan={plan} size={30} /> : <span style={{ fontSize: 22 }}>?</span>
          }
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* 精灵名 / 中断标题 */}
          {isSuccess ? (
            <div className="font-spirit" style={{
              fontSize: 15, fontWeight: 900,
              color: '#2B2A2E',
              marginBottom: 3,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {task.resultSpirit}
            </div>
          ) : (
            <div style={{
              fontSize: 15, fontWeight: 900, fontFamily: 'var(--font-display)',
              color: '#A09080',
              marginBottom: 3,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {`${plan?.type || '?'}方案 · 未完成`}
            </div>
          )}
          {/* 时间 */}
          <div style={{ fontSize: 11, color: '#A09080', fontWeight: 500 }}>
            {formatDateTime(task.completedAt)}
          </div>
        </div>

        {/* 编辑 & 删除按钮组 */}
        <button
          onClick={editing ? () => setEditing(false) : openEdit}
          style={{
            flexShrink: 0,
            border: editing ? '1px solid rgba(103,93,83,0.3)' : '1px solid rgba(103,93,83,0.25)',
            background: editing ? '#F0E8D5' : 'var(--card-inner)',
            borderRadius: 6,
            padding: '4px 10px', fontSize: 10, fontWeight: 700,
            color: 'var(--text-muted)',
            cursor: 'pointer', fontFamily: 'var(--font-body)',
          }}
        >{editing ? '✕ 取消' : '✎ 编辑'}</button>
        <button
          onClick={() => { setEditing(false); setConfirmDelete(v => !v); }}
          style={{
            flexShrink: 0,
            border: confirmDelete ? '1px solid rgba(200,53,26,0.5)' : '1px solid rgba(200,53,26,0.25)',
            background: confirmDelete ? '#FFF2EF' : 'var(--card-inner)',
            borderRadius: 6,
            padding: '4px 10px', fontSize: 10, fontWeight: 700,
            color: '#C8351A',
            cursor: 'pointer', fontFamily: 'var(--font-body)',
          }}
        >🗑</button>
      </div>

      {/* ---- 删除确认条 ---- */}
      {confirmDelete && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#FFF2EF', borderRadius: 8, padding: '8px 12px', marginBottom: 10,
          border: '1px solid rgba(200,53,26,0.2)',
        }}>
          <span style={{ fontSize: 11, color: '#C8351A', fontWeight: 700 }}>
            确定删除这条记录？{isSuccess && task.resultSpirit ? `（若无其他「${task.resultSpirit}」记录，将恢复为未解锁）` : ''}
          </span>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginLeft: 8 }}>
            <button onClick={handleDelete} style={{
              padding: '4px 12px', borderRadius: 6,
              border: '1.5px solid #C8351A', background: '#C8351A', color: '#fff',
              fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'var(--font-body)',
            }}>删除</button>
            <button onClick={() => setConfirmDelete(false)} style={{
              padding: '4px 10px', borderRadius: 6,
              border: '1px solid rgba(103,93,83,0.25)', background: 'var(--card-inner)', color: 'var(--text-muted)',
              fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)',
            }}>取消</button>
          </div>
        </div>
      )}

      {/* 出货标签横幅（仅成功时） */}
      {isSuccess && poolCfg && (
        <div style={{
          background: poolCfg.bg,
          borderRadius: 8, padding: '6px 12px', marginBottom: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 6,
        }}>
          {plan && poolType === 'family' && (
            <PlanIcon plan={plan} size={16} style={{ filter: 'brightness(2)' }} />
          )}
          <span style={{
            fontSize: 12, fontWeight: 800, color: poolCfg.color,
            fontFamily: 'var(--font-display)', letterSpacing: 1,
          }}>
            {poolType === 'family'
              ? `${plan?.type || ''}方案 · ${poolCfg.label}`
              : poolCfg.label}
          </span>
        </div>
      )}

      {/* 数据网格 */}
      <>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1.4fr',
          background: '#F0E8D5', borderRadius: task.ballsUsedByType && showBallDetail ? '10px 10px 0 0' : 10,
          overflow: 'hidden', marginBottom: task.ballsUsedByType && showBallDetail ? 0 : 8,
        }}>
          {[
            { label: '触发污染次数', value: task.shieldBreakCount, color: '#D4560A' },
            { label: '污染精灵', value: polluted, color: '#8B4BB8' },
            { label: '原色精灵', value: original, color: '#4B9C46' },
          ].map((item, i) => (
            <div key={i} style={{
              padding: '10px 4px', textAlign: 'center',
              borderRight: '1px solid rgba(103,93,83,0.12)',
            }}>
              <div className="font-subtitle" style={{ fontSize: 17, fontWeight: 900, color: item.color, lineHeight: 1 }}>
                {item.value}
              </div>
              <div style={{ fontSize: 9, color: '#A09080', marginTop: 4, fontWeight: 600 }}>{item.label}</div>
            </div>
          ))}
          {/* 消耗球数格子 */}
          <div style={{ padding: '10px 8px', textAlign: 'center' }}>
            <div className="font-subtitle" style={{ fontSize: 17, fontWeight: 900, color: '#2B2A2E', lineHeight: 1 }}>
              {task.ballsUsed != null ? task.ballsUsed : '—'}
            </div>
            <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              <span style={{ fontSize: 9, color: '#A09080', fontWeight: 600 }}>消耗球数</span>
              {task.ballsUsedByType && (
                <button
                  onClick={() => setShowBallDetail(v => !v)}
                  style={{
                    border: 'none', background: 'none',
                    fontSize: 9, fontWeight: 700, color: '#5B9CF6',
                    cursor: 'pointer', padding: '1px 3px', borderRadius: 3,
                    lineHeight: 1.2, flexShrink: 0,
                  }}
                >
                  {showBallDetail ? '收起▴' : '明细▾'}
                </button>
              )}
            </div>
          </div>
        </div>
        {/* 分球明细展开区 */}
        {task.ballsUsedByType && showBallDetail && (
          <div style={{
            background: '#EDE4D0', borderRadius: '0 0 10px 10px',
            padding: '8px 12px', marginBottom: 8,
            display: 'flex', justifyContent: 'space-around', alignItems: 'center',
            borderTop: '1px solid rgba(103,93,83,0.12)',
          }}>
            {[
              { label: '高级球', val: task.ballsUsedByType.adv, color: '#C8830A' },
              { label: '赛季球', val: task.ballsUsedByType.sea, color: '#7E57C2' },
              { label: '属性球', val: task.ballsUsedByType.att, color: '#5B9CF6' },
            ].map(({ label, val, color }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div className="font-subtitle" style={{ fontSize: 14, fontWeight: 900, color, lineHeight: 1 }}>
                  {val ?? 0}
                </div>
                <div style={{ fontSize: 9, color: '#A09080', marginTop: 3, fontWeight: 600 }}>{label}</div>
              </div>
            ))}
          </div>
        )}
      </>

      {/* ---- 编辑面板 ---- */}
      {editing && (
        <div style={{
          background: '#F0E8D5', borderRadius: 10,
          padding: '12px 12px 10px', marginBottom: 8,
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: 0.5 }}>
            修改数据
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 10px', marginBottom: 8 }}>
            {[
              { field: 'shieldBreakCount', label: '触发污染次数',   placeholder: '次数',           color: '#D4560A' },
              { field: 'polluted',         label: '污染精灵',       placeholder: '只',             color: '#8B4BB8' },
              { field: 'original',         label: '原色精灵',       placeholder: '只',             color: '#4B9C46' },
              { field: 'ballsUsed',        label: '消耗球数（总）', placeholder: '三格都填时自动算', color: '#2B2A2E' },
            ].map(({ field, label, placeholder, color }) => (
              <div key={field}>
                <div style={{ fontSize: 9, fontWeight: 700, color, marginBottom: 4 }}>{label}</div>
                <input
                  type="number" inputMode="numeric" min="0"
                  value={inputs[field]}
                  onChange={e => setField(field, e.target.value)}
                  placeholder={placeholder}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    padding: '7px 10px', borderRadius: 7,
                    border: `1.5px solid ${color}44`,
                    background: '#FBF7EC',
                    fontSize: 13, fontWeight: 800, fontFamily: 'var(--font-display)',
                    color: color, outline: 'none',
                  }}
                />
              </div>
            ))}
          </div>
          {/* 分球明细编辑区 */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#675D53', marginBottom: 6, letterSpacing: 0.5 }}>
              分球明细（填写后自动覆盖总球数）
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 8px' }}>
              {[
                { field: 'adv', label: '高级球', color: '#AE54DC' },
                { field: 'sea', label: '赛季球', color: '#7E57C2' },
                { field: 'att', label: '属性球', color: '#5B9CF6' },
              ].map(({ field, label, color }) => (
                <div key={field}>
                  <div style={{ fontSize: 9, fontWeight: 700, color, marginBottom: 4 }}>{label}</div>
                  <input
                    type="number" inputMode="numeric" min="0"
                    value={inputs[field]}
                    onChange={e => setField(field, e.target.value)}
                    placeholder="0"
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      padding: '7px 10px', borderRadius: 7,
                      border: `1.5px solid ${color}44`,
                      background: '#FBF7EC',
                      fontSize: 13, fontWeight: 800, fontFamily: 'var(--font-display)',
                      color, outline: 'none',
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
          <button onClick={handleSave} style={{
            width: '100%',
            padding: '10px 0',
            border: '2px solid #2B2A2E', borderRadius: 'var(--radius-sm)',
            background: '#2B2A2E', color: '#FBF7EC',
            fontSize: 12, fontWeight: 800, fontFamily: 'var(--font-body)', cursor: 'pointer',
            boxShadow: '0 2px 0 #111014',
          }}>保存修改</button>
        </div>
      )}

      {/* 查看详情按钮 */}
      {onDetail && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onDetail}
            style={{
              flexShrink: 0,
              border: '1px solid rgba(91,156,246,0.4)',
              background: 'rgba(91,156,246,0.06)',
              borderRadius: 20, padding: '2px 10px',
              fontSize: 10, fontWeight: 700, color: '#5B9CF6',
              cursor: 'pointer', fontFamily: 'var(--font-body)',
              whiteSpace: 'nowrap',
            }}
          >查看详情 →</button>
        </div>
      )}
    </div>
  );
}

export default function History() {
  const { state } = useStore();
  const tasks = state.completedTasks || [];
  const userPlanConfig = state.userPlanConfig || [];
  const [detailTask, setDetailTask] = useState(null);
  const successTasks = tasks.filter(t => t.resultType !== 'abandoned');
  const totalShiny = successTasks.length;
  const normalSuccessTasks = successTasks.filter(t => t.resultType !== 'manual' && t.shieldBreakCount != null);
  const avgBreaks = normalSuccessTasks.length > 0
    ? Math.round(normalSuccessTasks.reduce((s, t) => s + t.shieldBreakCount, 0) / normalSuccessTasks.length)
    : 0;

  const openDetail = (task) => setDetailTask(task);
  const closeDetail = () => setDetailTask(null);

  // 详情全页面覆盖
  if (detailTask) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 900, overflowY: 'auto' }}>
        <TaskDetailPage
          task={detailTask}
          onBack={closeDetail}
          userPlanConfig={userPlanConfig}
        />
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 24 }}>
      {/* 标题 */}
      <div style={{ padding: '20px 16px 10px' }}>
        <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--text)', fontFamily: 'var(--font-display)' }}>历史记录</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, fontWeight: 600 }}>
          共 {tasks.length} 次记录 · {totalShiny} 次出货
        </div>
      </div>

      {/* 汇总统计卡 */}
      {tasks.length > 0 && (
        <div className="card animate-in" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {[
              { label: '成功出货', value: totalShiny, unit: '次', color: '#4B9C46', bg: 'rgba(75,156,70,0.06)' },
              { label: '平均触发污染', value: normalSuccessTasks.length > 0 ? avgBreaks : '—', unit: normalSuccessTasks.length > 0 ? '次' : '', color: '#C8830A', bg: 'rgba(200,131,10,0.06)' },
              { label: '中断次数', value: tasks.length - totalShiny, unit: '次', color: '#A09080', bg: 'transparent' },
            ].map((stat, i) => (
              <div key={i} style={{
                padding: '14px 10px', textAlign: 'center',
                borderRight: i < 2 ? '1px solid var(--divider)' : 'none',
                background: stat.bg,
              }}>
                <div className="font-subtitle" style={{ fontSize: 22, fontWeight: 900, color: stat.color, lineHeight: 1 }}>
                  {stat.value}
                  <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', marginLeft: 1, fontFamily: 'var(--font-body)' }}>{stat.unit}</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5, fontWeight: 600 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 空状态 */}
      {tasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-text">
            暂无刷取记录<br />开始第一次刷取后，记录将显示在这里
          </div>
        </div>
      ) : (
        <>
          <div style={{ margin: '4px 16px 6px', fontSize: 11, color: 'var(--text-light)', fontWeight: 700, letterSpacing: 1 }}>
            ▼ 最近记录
          </div>
          {tasks.map((task, i) => (
            <HistoryCard
              key={task.id || i} task={task} index={i}
              userPlanConfig={userPlanConfig}
              onDetail={task.resultType !== 'abandoned' ? () => openDetail(task) : null}
            />
          ))}
        </>
      )}
    </div>
  );
}
