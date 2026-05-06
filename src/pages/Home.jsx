import { useStore } from '../store';
import { PLANS } from '../data/plans';
import ProgressBar from '../components/ProgressBar';
import PlanIcon from '../components/PlanIcon';
import SpiritAvatar from '../components/SpiritAvatar';

/** 从 completedTasks 中提取最近获得的异色精灵（去重，最多2只） */
function getRecentShinies(state) {
  const seen = new Set();
  const result = [];
  for (const t of state.completedTasks || []) {
    if (t.resultType === 'abandoned' || !t.resultSpirit) continue;
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
  const { state } = useStore();
  const tasks = state.activeTasks || [];
  const recentShinies = getRecentShinies(state);
  const hasRecentShinies = recentShinies.length > 0;

  return (
    <div style={{ paddingBottom: 16 }}>
      {/* 顶部 hero 区域：标题 + 小洛克装饰 */}
      <div style={{ position: 'relative', padding: '36px 16px 0', minHeight: 90 }}>
        {/* logo 靠左，右边留出 110px 给小洛克 */}
        <img
          src={`${import.meta.env.BASE_URL}app-title.png`}
          alt="小洛克的刷异色助手"
          style={{ height: 42, maxWidth: 'calc(100% - 110px)', objectFit: 'contain', objectPosition: 'left', display: 'block' }}
        />
        {/* 副标题 */}
        <div style={{
          padding: '6px 0 14px',
          fontSize: 12, color: 'var(--text-light)', letterSpacing: 2, fontWeight: 600,
        }}>
          用耐心换来独一无二的伙伴
        </div>
        {/* 小洛克：绝对定位右上角，完整显示在屏幕内 */}
        <img
          src={`${import.meta.env.BASE_URL}xiaoluoke.png`}
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
                src={`${import.meta.env.BASE_URL}dimo-bg.png`}
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
            src={`${import.meta.env.BASE_URL}section-title-banner.png`}
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
          iconImg: rawPlan.iconImg || attrBase?.iconImg || null,
          icon:    rawPlan.icon    || attrBase?.icon    || '✨',
          fruitA:  rawPlan.fruitA  || '',
          fruitB:  rawPlan.fruitB  || '',
        };
        const remaining = 80 - task.shieldBreakCount;
        return (
          <div key={task.planId} className="card active-task-card animate-in" style={{ animationDelay: `${idx * 0.06}s` }}>
            <div className="active-task-info">
              {/* 属性图标格 */}
              <div style={{
                width: 44, height: 44, borderRadius: 11,
                background: '#F0E8D5',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, overflow: 'hidden', padding: 4,
              }}>
                <PlanIcon plan={plan} size={32} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <span className="active-task-badge">刷取中</span>
                  <span style={{ fontWeight: 800, fontSize: 14 }}>{plan.type}方案</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {plan.fruitA}{plan.fruitB ? ` + ${plan.fruitB}` : ''}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: 'var(--text-light)', fontWeight: 600 }}>触发污染保底进度</span>
                <span style={{ fontSize: 14, fontWeight: 900, color: 'var(--cta)' }}>
                  {task.shieldBreakCount}
                  <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: 12 }}>/80</span>
                </span>
              </div>
              <ProgressBar current={task.shieldBreakCount} total={80} color="var(--cta)" />
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5, textAlign: 'right' }}>
                还差 <span style={{ fontWeight: 700, color: 'var(--text)' }}>{remaining}</span> 次触发保底
              </div>
            </div>

            <button
              className="btn btn-primary"
              style={{ margin: 0, width: '100%', padding: '13px', fontSize: 14 }}
              onClick={() => navigate('recorder', { planId: task.planId })}
            >
              继续刷取 →
            </button>
          </div>
        );
      })}

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
          src={`${import.meta.env.BASE_URL}btn-start.png`}
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
