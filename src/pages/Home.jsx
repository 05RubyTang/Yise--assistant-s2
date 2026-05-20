import { useState } from 'react';
import { useStore } from '../store';
import { PLANS, getPlanAttrId, classifyPool, computeFamilyPool, getPlanMainPool, resolvePlanIconImg } from '../data/plans';
import ProgressBar from '../components/ProgressBar';
import PlanIcon from '../components/PlanIcon';
import SpiritAvatar from '../components/SpiritAvatar';
import SeasonSwitcher from '../components/SeasonSwitcher';

/** 从 completedTasks 中提取最近获得的异色精灵（去重，最多2只，仅当前赛季） */
function getRecentShinies(state) {
  const season = state.currentSeason;
  const seen = new Set();
  const result = [];
  for (const t of state.completedTasks || []) {
    if (t.resultType === 'abandoned' || !t.resultSpirit) continue;
    // 仅展示当前赛季的出货记录
    if (season && t.season && t.season !== season) continue;
    if (seen.has(t.resultSpirit)) continue;
    seen.add(t.resultSpirit);
    result.push(t);
    if (result.length >= 2) break;
  }
  return result;
}

/** 格式化捕捉时间 */
function formatCaptureTime(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  const M = d.getMonth() + 1;
  const D = d.getDate();
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${M}月${D}日 ${h}:${m}`;
}

/** 单只最近精灵卡片 */
function RecentSpiritCard({ task }) {
  const plan = PLANS.find(p => p.id === task.planId);
  const isShiny = task.resultType !== 'offpool';

  return (
    <div style={{
      background: '#F0E8D5',
      borderRadius: 12,
      padding: '10px 10px 8px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 6,
      flex: '1 1 0',
      minWidth: 0,
      position: 'relative',
    }}>
      {/* NEW tag */}
      <span style={{
        position: 'absolute', top: 6, right: 6,
        fontSize: 8, fontWeight: 900, letterSpacing: 0.5,
        padding: '2px 5px', borderRadius: 6,
        background: '#E8321A', color: '#fff',
        lineHeight: 1.4,
      }}>NEW</span>

      {/* 精灵头像 */}
      <SpiritAvatar name={task.resultSpirit} obtained size={52} showName={false} />

      {/* 精灵名 */}
      <div style={{
        fontSize: 11, fontWeight: 800, color: '#2B2A2E',
        textAlign: 'center', lineHeight: 1.2,
        width: '100%', overflow: 'hidden',
        textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>{task.resultSpirit}</div>

      {/* 小标签行 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%', alignItems: 'center' }}>
        {/* 异色/奇遇 */}
        <span style={{
          fontSize: 9, fontWeight: 800,
          padding: '2px 7px', borderRadius: 20,
          background: isShiny ? 'rgba(251,200,57,0.25)' : 'rgba(139,75,184,0.12)',
          color: isShiny ? '#C8830A' : '#8B4BB8',
          border: `1px solid ${isShiny ? 'rgba(200,131,10,0.35)' : 'rgba(139,75,184,0.3)'}`,
          letterSpacing: 0.3,
        }}>{isShiny ? '✦ 异色精灵' : '✦ 奇遇精灵'}</span>

        {/* 捕捉时间 */}
        {task.completedAt && (
          <span style={{ fontSize: 9, color: '#9E8E80', fontWeight: 600 }}>
            🕐 {formatCaptureTime(task.completedAt)}
          </span>
        )}
      </div>
    </div>
  );
}

export default function Home({ navigate }) {
  const { state, poolCounts } = useStore();
  const currentSeason = state.currentSeason;
  // 只展示当前赛季的进行中任务（主区域）
  const tasks = (state.activeTasks || []).filter(t => !currentSeason || !t.season || t.season === currentSeason);
  // 其他赛季还有进行中任务（用于折叠提示）
  const otherSeasonTasks = (state.activeTasks || []).filter(t => t.season && t.season !== currentSeason);
  const [otherExpanded, setOtherExpanded] = useState(false);
  const recentShinies = getRecentShinies(state);
  const hasRecentShinies = recentShinies.length > 0;

  return (
    <div style={{ paddingBottom: 16 }}>
      {/* 顶部 hero 区域：标题 + 赛季切换 + 小洛克装饰 */}
      <div style={{ position: 'relative', padding: '36px 16px 0', minHeight: 90 }}>
        {/* logo 靠左，右边留出 110px 给小洛克 */}
        <img
          src={`${import.meta.env.BASE_URL}app-title.webp`}
          alt="小洛克的刷异色助手"
          style={{ height: 42, maxWidth: 'calc(100% - 110px)', objectFit: 'contain', objectPosition: 'left', display: 'block' }}
        />
        {/* 副标题 */}
        <div style={{
          padding: '6px 0 10px',
          fontSize: 12, color: 'var(--text-light)', letterSpacing: 2, fontWeight: 600,
        }}>
          用耐心换来独一无二的伙伴
        </div>
        {/* 赛季切换器：嵌在 hero 区底部，右侧避开小洛克 */}
        <div style={{ maxWidth: 'calc(100% - 110px)', paddingBottom: 14 }}>
          <SeasonSwitcher />
        </div>
        {/* 小洛克：绝对定位右上角，完整显示在屏幕内 */}
        <img
          src={`${import.meta.env.BASE_URL}xiaoluoke.webp`}
          alt="小洛克"
          style={{
            position: 'absolute',
            right: 0,
            top: 28,
            width: 110,
            objectFit: 'contain',
            pointerEvents: 'none',
            zIndex: 2,
          }}
        />
      </div>

      {/* 新加入的伙伴（有数据才展示） */}
      {hasRecentShinies && (
        <div className="animate-in" style={{
          margin: '0 16px 16px',
          position: 'relative',
          // 用 filter drop-shadow 代替 box-shadow，配合 SVG 异形卡片
          filter: 'drop-shadow(1px 6px 1px rgba(147,143,139,0.9))',
        }}>
          {/* SVG 卡片底板（异形：大圆角矩形 减去 3个椭圆弧） */}
          <svg
            aria-hidden="true"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}
            preserveAspectRatio="none"
            viewBox="0 0 320 180"
          >
            <defs>
              {/* 主圆角矩形 */}
              <clipPath id="cardClip">
                <rect x="0" y="0" width="320" height="180" rx="16" ry="16"/>
              </clipPath>
            </defs>
            {/* 主卡片填色 */}
            <rect x="0" y="0" width="320" height="180" rx="16" ry="16" fill="#FCF7EB"/>
            {/* 卡片描边 */}
            <rect x="1" y="1" width="318" height="178" rx="15.5" ry="15.5" fill="none" stroke="#726551" strokeWidth="2"/>

            {/* 星形装饰 49（右上大星，圆角 11px）*/}
            <path d="M258,18 L261,28 L272,28 L264,34 L267,44 L258,38 L249,44 L252,34 L244,28 L255,28 Z"
              fill="none" stroke="#F5ECE5" strokeWidth="4" strokeLinejoin="round"/>
            {/* 星形装饰 50（左下中星，圆角 11px）*/}
            <path d="M52,148 L54.5,155 L62,155 L56,159.5 L58.5,167 L52,162.5 L45.5,167 L48,159.5 L42,155 L49.5,155 Z"
              fill="none" stroke="#F5ECE5" strokeWidth="4" strokeLinejoin="round"/>
            {/* 星形装饰 51（右下小星，圆角 4px）*/}
            <path d="M284,148 L285.5,153 L291,153 L286.5,156.5 L288,162 L284,159 L280,162 L281.5,156.5 L277,153 L282.5,153 Z"
              fill="none" stroke="#F5ECE5" strokeWidth="2.5" strokeLinejoin="round"/>
          </svg>

          {/* 内容层 */}
          <div style={{ position: 'relative', zIndex: 1, padding: '14px 14px 16px' }}>
            <div style={{
              fontSize: 16, fontWeight: 900, color: '#2B2A2E',
              marginBottom: 10, letterSpacing: 0.5,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              fontFamily: 'var(--font-display)',
            }}>
              <img
                src={`${import.meta.env.BASE_URL}dimo-bg.webp`}
                alt="" aria-hidden="true"
                style={{ width: 22, height: 22, objectFit: 'contain', filter: 'brightness(0)', opacity: 0.75, flexShrink: 0 }}
              />
              最新加入的伙伴
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {recentShinies.map(t => (
                <RecentSpiritCard key={t.id} task={t} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 进行中任务标题 */}
      {tasks.length > 0 && (
        <div style={{
          position: 'relative',
          margin: '4px 16px 8px',
          height: 40,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <img
            src={`${import.meta.env.BASE_URL}section-title-banner.webp`}
            alt=""
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              objectFit: 'fill',
              pointerEvents: 'none',
            }}
          />
          <span style={{
            position: 'relative', zIndex: 1,
            fontSize: 14, fontWeight: 900,
            color: '#FBC839', fontFamily: 'var(--font-display)',
            letterSpacing: 2,
          }}>进行中的刷取</span>
        </div>
      )}

      {/* 进行中任务卡片 */}
      {tasks.map((task, idx) => {
        const rawPlan = PLANS.find(p => p.id === task.planId)
          || (state.userPlanConfig || []).find(p => p.id === task.planId);
        if (!rawPlan) return null;
        // 自定义方案继承基础属性方案的图标
        const attrBase = rawPlan.attrId ? PLANS.find(p => p.id === rawPlan.attrId) : null;
        const plan = {
          ...rawPlan,
          type:    rawPlan.type    || rawPlan.label || '自定义方案',
          iconImg: resolvePlanIconImg(rawPlan, attrBase),
          icon:    rawPlan.icon    || attrBase?.icon    || '✨',
          fruitA:  rawPlan.fruitA  || '',
          fruitB:  rawPlan.fruitB  || '',
        };

        // ── 三池进度数据（从事件流派生） ─────────────────────────────────────
        const attrId      = getPlanAttrId(plan);
        const mainPool    = getPlanMainPool(plan); // 'family' | 'attr' | 'world'
        const familyCount = computeFamilyPool(task, plan);
        const attrCount   = attrId ? ((poolCounts?.attrPools || {})[attrId] || 0) : 0;
        const worldCount  = poolCounts?.worldPool || 0;
        // 本任务在系别/世界池的贡献（用于标注「继承 X + 本次 Y」）
        const resolvePool = (b) => b.pool ?? (
          b.result === 'polluted' && b.spiritName ? classifyPool(b.spiritName, plan) : null
        );
        const taskAttrCount  = attrId
          ? (task.shieldBreaks || []).filter(b => resolvePool(b) === 'attr').length
          : 0;
        const taskWorldCount = (task.shieldBreaks || []).filter(b => resolvePool(b) === 'world').length;
        const inheritAttrCount  = Math.max(0, attrCount - taskAttrCount);
        const inheritWorldCount = Math.max(0, worldCount - taskWorldCount);
        const familyRemain = Math.max(0, 80 - familyCount);
        const attrRemain   = Math.max(0, 80 - attrCount);
        const worldRemain  = Math.max(0, 80 - worldCount);

        return (
          <div key={task.planId} className="animate-in" style={{
            position: 'relative',
            margin: '0 16px 16px',
            borderRadius: 16,
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            animationDelay: `${idx * 0.06}s`,
          }}>
            {/* 深色头部 */}
            <div style={{
              background: '#2B2A2E',
              padding: '12px 14px',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 11,
                background: 'rgba(255,255,255,0.13)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, overflow: 'hidden', padding: 4,
              }}>
                <PlanIcon plan={plan} size={32} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, flexWrap: 'wrap' }}>
                  <span className="active-task-badge">刷取中</span>
                  {task.season && (
                    <span style={{
                      fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 10,
                      background: task.season === 'S2' ? 'rgba(232,115,58,0.25)' : 'rgba(139,115,85,0.25)',
                      color: task.season === 'S2' ? '#E8733A' : '#C4A882',
                      border: `1px solid ${task.season === 'S2' ? 'rgba(232,115,58,0.5)' : 'rgba(139,115,85,0.45)'}`,
                      lineHeight: 1.4,
                    }}>
                      {task.season === 'S1' ? '🌙 S1' : '🎪 S2'}
                    </span>
                  )}
                  <span style={{ fontWeight: 800, fontSize: 14, color: '#fff' }}>{plan.type}方案</span>
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>
                  {plan.fruitA}{plan.fruitB ? ` + ${plan.fruitB}` : ''}
                </div>
              </div>
            </div>

            {/* 浅色体：三池进度 */}
            <div style={{ background: '#FCF7EB', padding: '12px 14px 16px' }}>
              {/* 标题行 */}
              <div style={{ fontSize: 11, color: 'var(--text-light)', fontWeight: 700, marginBottom: 8, letterSpacing: 0.5 }}>
                保底进度
              </div>

              {/* 家族池（仅单刷方案时为主池显示） */}
              {mainPool === 'family' && (
                <div style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#2B2A2E', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#C8830A', display: 'inline-block' }}/>
                      家族池
                      <span style={{ fontSize: 10, fontWeight: 500, color: '#9E8E80' }}>（本任务）</span>
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 900, color: '#C8830A' }}>
                      {familyCount}<span style={{ color: '#9E8E80', fontWeight: 400, fontSize: 11 }}>/80</span>
                      {familyRemain > 0 && <span style={{ fontSize: 10, color: '#9E8E80', fontWeight: 500 }}> 还差{familyRemain}</span>}
                    </span>
                  </div>
                  <ProgressBar current={familyCount} total={80} color="#C8830A" />
                </div>
              )}

              {/* 系别池（同属混刷为主池；单刷时作为次要池小字显示） */}
              {(mainPool === 'attr' || mainPool === 'family') && attrId && (
                <div style={{ marginBottom: mainPool === 'attr' ? 8 : 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: mainPool === 'attr' ? 3 : 2 }}>
                    <span style={{ fontSize: mainPool === 'attr' ? 11 : 10, fontWeight: 700, color: mainPool === 'attr' ? '#2B2A2E' : '#9E8E80', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: mainPool === 'attr' ? 8 : 6, height: mainPool === 'attr' ? 8 : 6, borderRadius: '50%', background: '#E8A020', display: 'inline-block' }}/>
                      系别池
                      {mainPool === 'attr'
                        ? <span style={{ fontSize: 10, fontWeight: 500, color: '#9E8E80' }}>（全局·本属性）</span>
                        : <span style={{ fontSize: 10, fontWeight: 500, color: '#9E8E80' }}>（次要）</span>
                      }
                    </span>
                    <span style={{ fontSize: mainPool === 'attr' ? 12 : 11, fontWeight: 900, color: '#E8A020' }}>
                      {inheritAttrCount > 0
                        ? <span style={{ fontSize: 10, color: '#9E8E80', fontWeight: 400 }}>继承{inheritAttrCount}+本次{taskAttrCount}=</span>
                        : null
                      }
                      {attrCount}<span style={{ color: '#9E8E80', fontWeight: 400, fontSize: 10 }}>/80</span>
                      {attrRemain > 0 && <span style={{ fontSize: 10, color: '#9E8E80', fontWeight: 500 }}> 差{attrRemain}</span>}
                    </span>
                  </div>
                  {mainPool === 'attr' && <ProgressBar current={attrCount} total={80} color="#E8A020" />}
                </div>
              )}

              {/* 世界池（跨属混刷为主池；其他情况作为次要池小字显示） */}
              {(mainPool === 'world') && (
                <div style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#2B2A2E', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#7E57C2', display: 'inline-block' }}/>
                      世界池
                      <span style={{ fontSize: 10, fontWeight: 500, color: '#9E8E80' }}>（全局·共享）</span>
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 900, color: '#7E57C2' }}>
                      {worldCount}<span style={{ color: '#9E8E80', fontWeight: 400, fontSize: 11 }}>/80</span>
                      {worldRemain > 0 && <span style={{ fontSize: 10, color: '#9E8E80', fontWeight: 500 }}> 还差{worldRemain}</span>}
                    </span>
                  </div>
                  <ProgressBar current={worldCount} total={80} color="#7E57C2" />
                </div>
              )}
              {/* 世界池次要显示（单刷/同属混刷时） */}
              {mainPool !== 'world' && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#9E8E80', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#7E57C2', display: 'inline-block' }}/>
                      世界池<span style={{ fontWeight: 400 }}>（次要）</span>
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#7E57C2' }}>
                      {inheritWorldCount > 0
                        ? <span style={{ fontSize: 10, color: '#9E8E80', fontWeight: 400 }}>继承{inheritWorldCount}+本次{taskWorldCount}=</span>
                        : null
                      }
                      {worldCount}<span style={{ color: '#9E8E80', fontWeight: 400, fontSize: 10 }}>/80</span>
                      {worldRemain > 0 && <span style={{ fontSize: 10, color: '#9E8E80', fontWeight: 400 }}> 差{worldRemain}</span>}
                    </span>
                  </div>
                </div>
              )}
              {/* 跨属混刷：世界池为主池，也展示系别池和家族池次要信息 */}
              {mainPool === 'world' && (
                <div style={{ marginBottom: 12, display: 'flex', gap: 12 }}>
                  {attrId && (
                    <span style={{ fontSize: 10, color: '#9E8E80', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#E8A020', display: 'inline-block', flexShrink: 0 }}/>
                      系别池 {inheritAttrCount > 0 ? `${inheritAttrCount}+${taskAttrCount}=` : ''}{attrCount}/80
                    </span>
                  )}
                </div>
              )}

              <button
                className="btn btn-primary"
                style={{ width: '100%', margin: 0, padding: '13px', fontSize: 14 }}
                onClick={() => navigate('recorder', { planId: task.planId })}
              >
                继续刷取 →
              </button>
            </div>
          </div>
        );
      })}

      {/* ── 其他赛季进行中（折叠区） ── */}
      {otherSeasonTasks.length > 0 && (
        <div style={{ margin: '0 16px 16px' }}>
          {/* 折叠触发行 */}
          <button
            onClick={() => setOtherExpanded(v => !v)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 8,
              background: 'none', border: 'none', padding: '8px 0', cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <span style={{
              flex: 1, fontSize: 12, fontWeight: 700, color: 'var(--text-muted)',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span style={{
                fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 10,
                background: 'rgba(139,115,85,0.15)',
                color: '#8B7355',
                border: '1px solid rgba(139,115,85,0.35)',
              }}>
                {otherSeasonTasks[0]?.season || 'S1'} 历史赛季
              </span>
              还有 {otherSeasonTasks.length} 个进行中的刷取
            </span>
            <span style={{
              fontSize: 12, color: 'var(--text-muted)',
              transform: otherExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
              display: 'inline-block', lineHeight: 1,
            }}>▾</span>
          </button>

          {/* 折叠内容 */}
          {otherExpanded && otherSeasonTasks.map((task, idx) => {
            const rawPlan = PLANS.find(p => p.id === task.planId)
              || (state.userPlanConfig || []).find(p => p.id === task.planId);
            if (!rawPlan) return null;
            const attrBase = rawPlan.attrId ? PLANS.find(p => p.id === rawPlan.attrId) : null;
            const plan = {
              ...rawPlan,
              type:    rawPlan.type    || rawPlan.label || '自定义方案',
              iconImg: resolvePlanIconImg(rawPlan, attrBase),
              icon:    rawPlan.icon    || attrBase?.icon    || '✨',
              fruitA:  rawPlan.fruitA  || '',
              fruitB:  rawPlan.fruitB  || '',
            };
            return (
              <div key={task.planId} style={{
                borderRadius: 12, overflow: 'hidden',
                border: '1.5px solid rgba(139,115,85,0.3)',
                marginBottom: idx < otherSeasonTasks.length - 1 ? 8 : 0,
                opacity: 0.82,
              }}>
                {/* 头部 */}
                <div style={{
                  background: '#4A4640',
                  padding: '10px 14px',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 9,
                    background: 'rgba(255,255,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, overflow: 'hidden', padding: 3,
                  }}>
                    <PlanIcon plan={plan} size={26} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2, flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 10,
                        background: 'rgba(139,115,85,0.35)', color: '#D4BFA0',
                        border: '1px solid rgba(139,115,85,0.5)',
                      }}>🌙 {task.season}</span>
                      <span style={{ fontWeight: 800, fontSize: 13, color: '#F0E8D5' }}>{plan.type}方案</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(240,232,213,0.5)' }}>
                      {plan.fruitA}{plan.fruitB ? ` + ${plan.fruitB}` : ''}
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('recorder', { planId: task.planId })}
                    style={{
                      flexShrink: 0, padding: '6px 12px', borderRadius: 8,
                      background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
                      color: '#F0E8D5', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    继续 →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 开始新刷取 */}
      <button
        className="animate-in"
        onClick={() => navigate('planPicker')}
        style={{
          display: 'block',
          background: 'none', border: 'none', padding: '0',
          width: '100%', cursor: 'pointer',
          transition: 'transform 0.15s',
          textAlign: 'center',
        }}
        onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
        onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
        onTouchStart={e => e.currentTarget.style.transform = 'scale(0.97)'}
        onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        <img
          src={`${import.meta.env.BASE_URL}btn-start.webp`}
          alt="开始新的刷取"
          style={{ width: 200, height: 'auto', display: 'inline-block' }}
        />
      </button>

      {tasks.length === 0 && (
        <p style={{
          textAlign: 'center', padding: '6px 24px 0',
          fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.8,
        }}>
          在眠枭庇护所放好果实后，开始记录触发污染进度
        </p>
      )}
    </div>
  );
}
