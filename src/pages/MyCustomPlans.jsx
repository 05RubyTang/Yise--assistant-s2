import { useStore } from '../store';
import SpiritAvatar from '../components/SpiritAvatar';
import PlanIcon from '../components/PlanIcon';
import { FruitLine } from '../components/FruitTag';

function formatDate(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function MyCustomPlans({ goBack }) {
  const { state } = useStore();
  const userPlans = state.userPlanConfig || [];
  const completedTasks = state.completedTasks || [];

  // 只展示用户自定义方案（有 id 的）
  // 对每个方案：聚合成功出货记录
  const planStats = userPlans.map(plan => {
    const planTasks = completedTasks.filter(
      t => t.planId === plan.id && t.resultType !== 'abandoned'
    );
    const spirits = planTasks
      .map(t => t.resultSpirit)
      .filter(Boolean);
    // 去重精灵名但保留所有出货记录
    const latestTask = planTasks.length > 0
      ? planTasks.reduce((a, b) =>
          new Date(a.completedAt) > new Date(b.completedAt) ? a : b
        )
      : null;
    return { plan, planTasks, spirits, latestTask };
  });

  // 有抓宠记录的排在前面，按最新出货时间倒序
  const sorted = [...planStats].sort((a, b) => {
    if (a.planTasks.length === 0 && b.planTasks.length === 0) return 0;
    if (a.planTasks.length === 0) return 1;
    if (b.planTasks.length === 0) return -1;
    return new Date(b.latestTask.completedAt) - new Date(a.latestTask.completedAt);
  });

  return (
    <div className="page">
      {/* 页头 */}
      <div className="page-header">
        <button
          onClick={goBack}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '4px 8px 4px 0', fontSize: 18, color: 'var(--text)',
            display: 'flex', alignItems: 'center',
            fontFamily: 'var(--font-body)', fontWeight: 700,
          }}
        ><img src={`${import.meta.env.BASE_URL}back-icon.png`} alt="返回" style={{ width: 36, height: 36 }} /></button>
        <h2 style={{ flex: 1 }}>我的自定义方案</h2>
      </div>

      {/* 空状态 */}
      {userPlans.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🧪</div>
          <div className="empty-state-text">
            还没有自定义方案<br />
            去「方案」页新建一个吧
          </div>
        </div>
      ) : (
        <div style={{ paddingBottom: 24 }}>
          {/* 汇总栏 */}
          <div className="card animate-in" style={{ padding: 0, overflow: 'hidden', margin: '0 16px 12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
              {[
                {
                  label: '自定义方案',
                  value: userPlans.length,
                  unit: '个',
                  color: '#2B2A2E',
                  bg: 'transparent',
                },
                {
                  label: '已出货',
                  value: planStats.reduce((s, p) => s + p.planTasks.length, 0),
                  unit: '次',
                  color: '#4B9C46',
                  bg: 'rgba(75,156,70,0.06)',
                },
                {
                  label: '抓到精灵',
                  value: new Set(
                    planStats.flatMap(p => p.spirits)
                  ).size,
                  unit: '种',
                  color: '#C8830A',
                  bg: 'rgba(200,131,10,0.06)',
                },
              ].map((stat, i) => (
                <div key={i} style={{
                  padding: '14px 10px', textAlign: 'center',
                  borderRight: i < 2 ? '1px solid var(--divider)' : 'none',
                  background: stat.bg,
                }}>
                  <div style={{
                    fontSize: 22, fontWeight: 900, color: stat.color,
                    lineHeight: 1, fontFamily: 'var(--font-display)',
                  }}>
                    {stat.value}
                    <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', marginLeft: 1 }}>
                      {stat.unit}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5, fontWeight: 600 }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 方案卡片列表 */}
          {sorted.map(({ plan, planTasks, spirits, latestTask }, idx) => (
            <div
              key={plan.id}
              className="card animate-in"
              style={{ animationDelay: `${idx * 0.04}s` }}
            >
              {/* 卡头：方案名 + 属性图标 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                  background: '#F0E8D5',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden',
                }}>
                  <PlanIcon plan={plan} size={28} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* 方案名：优先用 label，兜底 type */}
                  <div style={{
                    fontSize: 15, fontWeight: 900, color: '#2B2A2E',
                    fontFamily: 'var(--font-display)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {plan.label || plan.type || '自定义方案'}
                  </div>
                  {/* 果实信息 */}
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3, marginBottom: 1 }}>
                    <FruitLine fruitA={plan.fruitA} fruitB={plan.fruitB} size={13} />
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1, fontWeight: 500 }}>
                    {latestTask
                      ? `最近出货 ${formatDate(latestTask.completedAt)}`
                      : '暂无出货记录'}
                  </div>
                </div>
                {/* 出货次数徽章 */}
                <div style={{
                  flexShrink: 0,
                  background: planTasks.length > 0 ? '#2B2A2E' : 'rgba(103,93,83,0.08)',
                  color: planTasks.length > 0 ? '#FBF7EC' : 'var(--text-muted)',
                  borderRadius: 20, padding: '3px 10px',
                  fontSize: 11, fontWeight: 800, fontFamily: 'var(--font-display)',
                }}>
                  {planTasks.length} 次
                </div>
              </div>

              {/* 精灵头像列 */}
              {planTasks.length > 0 ? (
                <>
                  <div style={{
                    fontSize: 10, fontWeight: 700, color: 'var(--text-muted)',
                    letterSpacing: 0.5, marginBottom: 8,
                  }}>
                    抓到的精灵
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {/* 按精灵名聚合，显示次数 */}
                    {(() => {
                      const countMap = {};
                      planTasks.forEach(t => {
                        if (t.resultSpirit) {
                          countMap[t.resultSpirit] = (countMap[t.resultSpirit] || 0) + 1;
                        }
                      });
                      return Object.entries(countMap).map(([name, count]) => (
                        <div key={name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                          <SpiritAvatar name={name} obtained size={44} showName={false} />
                          <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 700, textAlign: 'center', maxWidth: 52, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {name}
                          </div>
                          {count > 1 && (
                            <div style={{
                              fontSize: 9, fontWeight: 800,
                              color: '#C8830A',
                              marginTop: -2,
                            }}>×{count}</div>
                          )}
                        </div>
                      ));
                    })()}
                  </div>

                  {/* 数据小格 */}
                  <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                    background: '#F0E8D5', borderRadius: 10,
                    overflow: 'hidden', marginTop: 10,
                  }}>
                    {[
                      {
                        label: '出货次数',
                        value: planTasks.length,
                        color: '#2B2A2E',
                      },
                      {
                        label: '平均破盾',
                        value: (() => {
                          const valid = planTasks.filter(t => t.shieldBreakCount != null);
                          if (valid.length === 0) return '—';
                          return Math.round(valid.reduce((s, t) => s + t.shieldBreakCount, 0) / valid.length);
                        })(),
                        color: '#D4560A',
                      },
                      {
                        label: '精灵种类',
                        value: new Set(planTasks.map(t => t.resultSpirit).filter(Boolean)).size,
                        color: '#8B4BB8',
                      },
                    ].map((item, i) => (
                      <div key={i} style={{
                        padding: '10px 4px', textAlign: 'center',
                        borderRight: i < 2 ? '1px solid rgba(103,93,83,0.12)' : 'none',
                      }}>
                        <div style={{
                          fontSize: 17, fontWeight: 900, color: item.color,
                          lineHeight: 1, fontFamily: 'var(--font-display)',
                        }}>{item.value}</div>
                        <div style={{ fontSize: 9, color: '#A09080', marginTop: 4, fontWeight: 600 }}>
                          {item.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{
                  padding: '12px 0 4px',
                  fontSize: 11, color: 'var(--text-muted)', fontWeight: 500,
                  textAlign: 'center',
                }}>
                  还没有用这个方案抓到过异色
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
