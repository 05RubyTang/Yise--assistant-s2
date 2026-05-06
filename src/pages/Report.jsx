import { useState } from 'react';
import { useStore } from '../store';
import { PLANS, POOL_TYPE_CONFIG } from '../data/plans';
import SpiritAvatar from '../components/SpiritAvatar';
import PlanIcon from '../components/PlanIcon';

// 精灵名 → 图片文件名映射（文件名与精灵名不一致时使用）
const SPIRIT_IMG_FILE = { '柴渣虫': '燃薪虫' };

function getStarRating(breakCount) {
  if (breakCount <= 10) return { stars: 5, label: '超级欧皇', color: '#C8830A' };
  if (breakCount <= 20) return { stars: 4, label: '欧皇',     color: '#C8830A' };
  if (breakCount <= 40) return { stars: 3, label: '正常发挥', color: '#4B9C46' };
  if (breakCount <= 55) return { stars: 2, label: '有点非',   color: '#8B4BB8' };
  if (breakCount <= 79) return { stars: 1, label: '非酋',     color: '#D4560A' };
  return { stars: 0, label: '极限保底', color: '#C8351A' };
}

// 星级渲染
function Stars({ count, color }) {
  return (
    <span style={{ color, fontSize: 14, letterSpacing: 1 }}>
      {'★'.repeat(count)}{'☆'.repeat(5 - count)}
    </span>
  );
}

// 数据行
function Row({ label, children }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      justifyContent: 'space-between',
      padding: '9px 0',
      borderBottom: '1px solid rgba(103,93,83,0.1)',
    }}>
      <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 5 }}>
        {children}
      </span>
    </div>
  );
}

export default function Report({ planId, spiritName, resultType, navigate }) {
  const { state, dispatch } = useStore();
  const rawPlan = PLANS.find(p => p.id === planId)
    || (state.userPlanConfig || []).find(p => p.id === planId);
  // 标准化：自定义方案继承基础属性方案的图标
  const attrBase = rawPlan?.attrId ? PLANS.find(p => p.id === rawPlan.attrId) : null;
  const plan = rawPlan ? {
    ...rawPlan,
    type:    rawPlan.type    || rawPlan.label || '自定义方案',
    shinies: Array.isArray(rawPlan.shinies) ? rawPlan.shinies : [],
    iconImg: rawPlan.iconImg || attrBase?.iconImg || null,
    icon:    rawPlan.icon    || attrBase?.icon    || '✨',
  } : {
    // planId 找不到时的最终兜底（不应发生，但保证页面不白屏）
    id: planId, type: '自定义方案', shinies: [],
    fruitA: '', fruitB: '', iconImg: null, icon: '✨',
  };
  const task = (state.activeTasks || []).find(t => t.planId === planId);
  // simple 模式：一个 input
  const [ballInput, setBallInput] = useState('');
  // byType 模式：三个 input
  const [ballEndAdv, setBallEndAdv] = useState('');
  const [ballEndSea, setBallEndSea] = useState('');
  const [ballEndAtt, setBallEndAtt] = useState('');

  // task 为 null 时才真正 return null（plan 现在永不为 null）
  if (!task) return null;

  const breakdowns = { original: 0, polluted: 0, shiny: 0 };
  task.shieldBreaks.forEach(b => { breakdowns[b.result]++; });
  const rating = getStarRating(task.shieldBreakCount);

  const ballMode = task.ballMode || 'simple';
  const ballRestocks = task.ballRestocks || [];

  // simple 模式计算
  // 兼容旧 task（无 ballStart 字段）：有补球记录也视为「已配置」
  const hasBallStart = ballMode === 'byType'
    ? (task.ballStartByType != null || ballRestocks.length > 0)
    : (task.ballStart != null || ballRestocks.length > 0);
  const restockTotal = ballRestocks.reduce((s, r) => s + (r.amount || 0), 0);
  const ballEnd = ballInput.trim() ? parseInt(ballInput.trim(), 10) : null;
  const ballsUsed = (ballMode === 'simple' && hasBallStart && ballEnd != null && !isNaN(ballEnd))
    ? task.ballStart + restockTotal - ballEnd
    : null;

  // byType 模式计算
  const bst = task.ballStartByType || { adv: 0, sea: 0, att: 0 };
  const restByType = ballRestocks.reduce(
    (s, r) => ({ adv: s.adv + (r.adv || 0), sea: s.sea + (r.sea || 0), att: s.att + (r.att || 0) }),
    { adv: 0, sea: 0, att: 0 }
  );
  const bet = {
    adv: ballEndAdv.trim() ? parseInt(ballEndAdv.trim(), 10) : null,
    sea: ballEndSea.trim() ? parseInt(ballEndSea.trim(), 10) : null,
    att: ballEndAtt.trim() ? parseInt(ballEndAtt.trim(), 10) : null,
  };
  const hasByTypeEnd = bet.adv != null || bet.sea != null || bet.att != null;
  const ballsUsedByType = (ballMode === 'byType' && hasBallStart && hasByTypeEnd) ? {
    adv: bst.adv + restByType.adv - (bet.adv ?? 0),
    sea: bst.sea + restByType.sea - (bet.sea ?? 0),
    att: bst.att + restByType.att - (bet.att ?? 0),
  } : null;
  const ballsUsedByTypeTotal = ballsUsedByType
    ? ballsUsedByType.adv + ballsUsedByType.sea + ballsUsedByType.att
    : null;

  const handleSave = () => {
    if (ballMode === 'byType') {
      dispatch({ type: 'COMPLETE_TASK', planId, spiritName, resultType,
        ballEndByType: hasByTypeEnd ? { adv: bet.adv ?? 0, sea: bet.sea ?? 0, att: bet.att ?? 0 } : null });
    } else {
      dispatch({ type: 'COMPLETE_TASK', planId, spiritName, resultType,
        ballEnd: (ballEnd && !isNaN(ballEnd)) ? ballEnd : null });
    }
    navigate('home');
  };
  const handleContinue = (resetBreaks) => {
    if (ballMode === 'byType') {
      dispatch({ type: 'COMPLETE_AND_CONTINUE', planId, spiritName, resultType, resetBreaks,
        ballEndByType: hasByTypeEnd ? { adv: bet.adv ?? 0, sea: bet.sea ?? 0, att: bet.att ?? 0 } : null });
    } else {
      dispatch({ type: 'COMPLETE_AND_CONTINUE', planId, spiritName, resultType, resetBreaks,
        ballEnd: (ballEnd && !isNaN(ballEnd)) ? ballEnd : null });
    }
    navigate('recorder', { planId });
  };

  return (
    /* 全屏遮罩：absolute 定位在 .mockup-screen 内，随样机圆角裁剪 */
    <div style={{
      position: 'absolute', inset: 0, zIndex: 1000,
      background: 'rgba(43,42,46,0.55)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'flex-end',
      borderRadius: 40,
      paddingBottom: 0,
    }}>
      {/* 弹窗主体：高度不超过容器 85% */}
      <div style={{
        width: '100%', maxWidth: 500,
        background: '#FBF7EC',
        borderRadius: '20px 20px 0 0',
        boxShadow: '0 -4px 24px rgba(43,42,46,0.18)',
        overflow: 'hidden',
        maxHeight: '85%',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* ── 顶部标题栏 ── */}
        <div style={{
          background: '#2B2A2E',
          padding: '16px 20px 14px',
          textAlign: 'center',
          position: 'relative',
          flexShrink: 0,
        }}>
          {/* 星星装饰 */}
          <div style={{
            fontSize: 11, color: 'rgba(251,200,57,0.7)',
            letterSpacing: 8, marginBottom: 4,
          }}>✦ ✦ ✦</div>
          <div style={{
            fontSize: 18, fontWeight: 900, color: '#FBC839',
            fontFamily: 'var(--font-display)', letterSpacing: 1,
          }}>恭喜获得异色精灵</div>
          <div style={{
            fontSize: 11, color: 'rgba(251,200,57,0.7)',
            letterSpacing: 8, marginTop: 4,
          }}>✦ ✦ ✦</div>
        </div>

        {/* ── 可滚动内容区 ── */}
        <div style={{ overflowY: 'auto', flex: 1 }}>

          {/* 精灵 + 数据 横排卡 */}
          <div style={{
            margin: '16px 16px 0',
            background: '#F0E8D5',
            borderRadius: 14,
            border: '1.5px solid rgba(103,93,83,0.2)',
            overflow: 'hidden',
            display: 'flex',
          }}>
            {/* 左：精灵图 */}
            <div style={{
              width: 120, flexShrink: 0,
              background: '#E8DCC8',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 12, position: 'relative',
            }}>
              <img
                src={`${import.meta.env.BASE_URL}spirits/${encodeURIComponent(SPIRIT_IMG_FILE[spiritName] || spiritName)}.png`}
                alt={spiritName}
                style={{ width: 96, height: 96, objectFit: 'contain' }}
                onError={e => { e.target.style.display = 'none'; }}
              />
              {/* 异色光效角标 */}
              <div style={{
                position: 'absolute', top: 6, right: 6,
                fontSize: 16, lineHeight: 1,
                filter: 'drop-shadow(0 0 4px rgba(251,200,57,0.9))',
              }}>✨</div>
              {/* 精灵名 */}
              <div style={{
                position: 'absolute', bottom: 8, left: 0, right: 0,
                textAlign: 'center',
                fontSize: 11, fontWeight: 900, color: '#2B2A2E',
                fontFamily: 'var(--font-display)',
              }}>{spiritName}</div>
            </div>

            {/* 右：数据表 */}
            <div style={{ flex: 1, padding: '4px 14px 4px 10px' }}>
              {/* 三池标签 */}
              <div style={{ paddingTop: 10, marginBottom: 2 }}>
                {(() => {
                  const cfg = POOL_TYPE_CONFIG[resultType] || POOL_TYPE_CONFIG.world;
                  const icon = resultType === 'family' ? '✓' : resultType === 'attr' ? '⚡' : '🎲';
                  return (
                    <span style={{
                      fontSize: 10, fontWeight: 700,
                      padding: '2px 8px', borderRadius: 20,
                      background: cfg.tagBg, color: cfg.tagColor,
                      border: `1px solid ${cfg.tagBorder}`,
                    }}>{icon} {cfg.label}</span>
                  );
                })()}
              </div>

              <Row label="果实方案">
                <PlanIcon plan={plan} size={14} />
                {plan.type}
              </Row>

              <Row label="触发污染次数">
                <span style={{ color: 'var(--cta)', fontWeight: 900, fontSize: 16, fontFamily: 'var(--font-display)' }}>
                  {task.shieldBreakCount}
                </span>
                <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: 11 }}>/80</span>
              </Row>

              <Row label="触发污染分布">
                <span style={{ color: 'var(--success)', fontSize: 11 }}>绿×{breakdowns.original}</span>
                <span style={{ color: 'var(--polluted)', fontSize: 11 }}>紫×{breakdowns.polluted}</span>
                <span style={{ color: 'var(--gold)', fontSize: 11 }}>✨×{breakdowns.shiny}</span>
              </Row>

              <div style={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between',
                padding: '9px 0',
              }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>欧非指数</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Stars count={rating.stars} color={rating.color} />
                  <span style={{ fontSize: 11, color: rating.color, fontWeight: 800 }}>{rating.label}</span>
                </span>
              </div>
            </div>
          </div>

          {/* ── 咕噜球消耗 ── */}
          <div style={{ margin: '16px 16px 0' }}>
            {/* 横幅标题 */}
            <div style={{
              position: 'relative',
              width: '100%', height: 44,
              marginBottom: 10,
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
              }}>咕噜球消耗</span>
            </div>

            <div style={{
              background: '#F0E8D5', borderRadius: 12, padding: '12px 14px',
              border: '1px solid rgba(103,93,83,0.15)',
            }}>
              <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 4 }}>咕噜球消耗</div>

              {ballMode === 'simple' ? (
                <>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10, lineHeight: 1.6 }}>
                    {hasBallStart ? (
                      <>
                        开始 <strong>{task.ballStart}</strong> 个
                        {restockTotal > 0 && <> + 补球 <strong style={{ color: 'var(--success)' }}>{restockTotal}</strong> 个</>}
                        {' '}− 剩余 = 消耗
                      </>
                    ) : '输入当前咕噜球剩余数量（选填）'}
                  </div>
                  <input
                    type="number" inputMode="numeric"
                    value={ballInput} onChange={e => setBallInput(e.target.value)}
                    placeholder="输入当前咕噜球剩余数量"
                    className="input-field"
                    style={{ background: '#FBF7EC' }}
                  />
                  {ballsUsed != null && ballsUsed >= 0 && (
                    <div style={{
                      marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '8px 12px', borderRadius: 8,
                      background: '#FFF9E0', border: '1px solid #C8A020',
                    }}>
                      <span style={{ fontSize: 12, color: 'var(--text-light)' }}>
                        {hasBallStart && restockTotal > 0
                          ? `${task.ballStart} + ${restockTotal} − ${ballEnd} =`
                          : '本次消耗'}
                      </span>
                      <span style={{ fontSize: 15, fontWeight: 900, color: 'var(--cta)' }}>{ballsUsed} 个咕噜球</span>
                    </div>
                  )}
                </>
              ) : (
                /* byType 模式 */
                <>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10, lineHeight: 1.6 }}>
                    填入各类剩余球数，自动计算每类消耗（选填）
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                      { label: '高级球', key: 'adv', value: ballEndAdv, setter: setBallEndAdv, color: '#C8830A', startVal: bst.adv, restVal: restByType.adv },
                      { label: '赛季球', key: 'sea', value: ballEndSea, setter: setBallEndSea, color: '#7E57C2', startVal: bst.sea, restVal: restByType.sea },
                      { label: '属性球', key: 'att', value: ballEndAtt, setter: setBallEndAtt, color: '#5B9CF6', startVal: bst.att, restVal: restByType.att },
                    ].map(({ label, key, value, setter, color, startVal, restVal }) => {
                      const endVal = value.trim() ? parseInt(value.trim(), 10) : null;
                      const used = endVal != null && !isNaN(endVal) ? startVal + restVal - endVal : null;
                      return (
                        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ minWidth: 42, flexShrink: 0 }}>
                            <div style={{ fontSize: 11, fontWeight: 800, color }}>{label}</div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                              {startVal}{restVal > 0 && `+${restVal}`}
                            </div>
                          </div>
                          <input
                            type="number" inputMode="numeric"
                            value={value} onChange={e => setter(e.target.value)}
                            placeholder="剩余"
                            className="input-field"
                            style={{ flex: 1, margin: 0, background: '#FBF7EC' }}
                          />
                          {used != null && used >= 0 && (
                            <span style={{ fontSize: 13, fontWeight: 900, color: 'var(--cta)', minWidth: 36, textAlign: 'right', flexShrink: 0 }}>
                              -{used}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {ballsUsedByTypeTotal != null && ballsUsedByTypeTotal >= 0 && (
                    <div style={{
                      marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '8px 12px', borderRadius: 8,
                      background: '#FFF9E0', border: '1px solid #C8A020',
                    }}>
                      <span style={{ fontSize: 12, color: 'var(--text-light)' }}>
                        合计消耗
                        {ballsUsedByType && (
                          <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 4 }}>
                            （高{ballsUsedByType.adv} + 赛{ballsUsedByType.sea} + 属{ballsUsedByType.att}）
                          </span>
                        )}
                      </span>
                      <span style={{ fontSize: 15, fontWeight: 900, color: 'var(--cta)' }}>{ballsUsedByTypeTotal} 个咕噜球</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* ── 底部按钮区 ── */}
          <div style={{ padding: '12px 16px 28px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              className="btn btn-gold"
              onClick={handleSave}
              style={{ width: '100%', margin: 0 }}
            >
              📖 保存并结束
            </button>

            {/* 继续刷取：两个选项让用户决定是否清空记录 */}
            <div style={{
              border: '1.5px solid rgba(103,93,83,0.2)',
              borderRadius: 12, overflow: 'hidden',
            }}>
              {/* 提示标题 */}
              <div style={{
                padding: '8px 12px',
                background: '#F0E8D5',
                fontSize: 11, fontWeight: 700, color: 'var(--text-light)',
                textAlign: 'center', lineHeight: 1.5,
              }}>
                继续刷取 · 是否清空当前触发污染记录？
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500, marginTop: 2 }}>
                  {(resultType === 'family' || resultType === 'pool')
                    ? '家族池出货，建议清空重新计数'
                    : `${resultType === 'attr' ? '属性池' : '世界池'}出货，家族池进度未重置，可保留继续`}
                </div>
              </div>
              {/* 两个选项按钮 */}
              <div style={{ display: 'flex' }}>
                <button
                  onClick={() => handleContinue(true)}
                  style={{
                    flex: 1, padding: '11px 8px',
                    border: 'none', borderRight: '1px solid rgba(103,93,83,0.15)',
                    background: '#fff',
                    fontSize: 12, fontWeight: 800, color: '#C8351A',
                    fontFamily: 'var(--font-body)', cursor: 'pointer',
                    lineHeight: 1.4,
                  }}
                >
                  🔄 清空记录<br />
                  <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--text-muted)' }}>重新从 0 开始</span>
                </button>
                <button
                  onClick={() => handleContinue(false)}
                  style={{
                    flex: 1, padding: '11px 8px',
                    border: 'none',
                    background: '#fff',
                    fontSize: 12, fontWeight: 800, color: '#2B2A2E',
                    fontFamily: 'var(--font-body)', cursor: 'pointer',
                    lineHeight: 1.4,
                  }}
                >
                  ▶ 保留进度<br />
                  <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--text-muted)' }}>继续累积保底</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
