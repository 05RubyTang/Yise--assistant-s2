import { useState } from 'react';
import { useStore } from '../store';
import { PLANS, SPECIAL_FORMS, resolvePlanIconImg } from '../data/plans';
import SpiritAvatar from '../components/SpiritAvatar';
import PlanIcon from '../components/PlanIcon';
import FruitTag, { FruitLine } from '../components/FruitTag';
import { getWikiSpiritImg } from '../data/spirits-wiki';
import { LOCAL_SPIRIT_FILES } from '../data/local-assets';

const base = import.meta.env.BASE_URL;

const TIPS = [
  '在眠枭庇护所放好对应果实',
  '庇护所内不要放其他多余果实',
  '刷取期间不要跨区传送或退出游戏',
];

export default function Checklist({ planId, basePlanId, navigate, goBack }) {
  const { state, dispatch } = useStore();

  // 当前选中方案（可通过「换方案」切换）
  const [activePlanId, setActivePlanId] = useState(planId);
  const [showSwitcher, setShowSwitcher] = useState(false);

  // 反查已有 task 的球数数据，用于预填输入框（防止回到此页时空提交覆盖旧数据）
  const _existingTask = (state.activeTasks || []).find(t => t.planId === planId);
  const _existMode = _existingTask?.ballMode || 'simple';
  const _existBst  = _existingTask?.ballStartByType;

  // 咕噜球模式：'simple'（总数）| 'byType'（分类），初始值从已有 task 继承
  const [ballMode, setBallMode] = useState(_existMode);
  // simple 模式输入框：已有 task 的 ballStart 预填
  const [ballInput, setBallInput] = useState(
    _existingTask?.ballStart != null ? String(_existingTask.ballStart) : ''
  );
  // byType 模式下三类球：已有 task 的 ballStartByType 预填
  const [ballAdv, setBallAdv] = useState(_existBst?.adv != null ? String(_existBst.adv) : '');
  const [ballSea, setBallSea] = useState(_existBst?.sea != null ? String(_existBst.sea) : '');
  const [ballAtt, setBallAtt] = useState(_existBst?.att != null ? String(_existBst.att) : '');

  const rawPlan = PLANS.find(p => p.id === activePlanId)
    || (state.userPlanConfig || []).find(p => p.id === activePlanId);
  // 标准化：自定义方案继承基础属性方案的图标
  const attrBase = rawPlan?.attrId ? PLANS.find(p => p.id === rawPlan.attrId) : null;

  // 自定义方案：通过 fruitA/fruitB 在 PLANS 里反查对应的解锁条件
  // 仅当自定义方案自身没有 unlockA/B 时才做反查
  const isUserPlan = !!(rawPlan?.attrId); // 有 attrId 说明是自定义方案
  const fruitUnlockMap = (() => {
    if (!isUserPlan || !rawPlan) return {};
    const result = {};
    if (rawPlan.fruitA) {
      const src = PLANS.find(p => p.fruitA === rawPlan.fruitA || p.fruitB === rawPlan.fruitA);
      if (src) {
        const unlock = src.fruitA === rawPlan.fruitA ? src.unlockA : src.unlockB;
        result.fruitA = unlock || '';
      }
    }
    if (rawPlan.fruitB) {
      const src = PLANS.find(p => p.fruitA === rawPlan.fruitB || p.fruitB === rawPlan.fruitB);
      if (src) {
        const unlock = src.fruitA === rawPlan.fruitB ? src.unlockA : src.unlockB;
        result.fruitB = unlock || '';
      }
    }
    return result;
  })();

  const plan = rawPlan ? {
    ...rawPlan,
    type:    rawPlan.type    || rawPlan.label || '自定义方案',
    shinies: Array.isArray(rawPlan.shinies) ? rawPlan.shinies : [],
    unlockA: rawPlan.unlockA || fruitUnlockMap.fruitA || '',
    unlockB: rawPlan.unlockB || fruitUnlockMap.fruitB || '',
    // 自定义方案无 iconImg/icon 时从基础方案继承（异属混刷会用混刷专属图标）
    iconImg: resolvePlanIconImg(rawPlan, attrBase),
    icon:    rawPlan.icon    || attrBase?.icon    || '✨',
  } : null;

  // 判断某个解锁条件是否为「图鉴类解锁」（需要集齐图鉴）
  const isPokedexUnlock = (unlockStr) => unlockStr && unlockStr.includes('集齐');

  // 当前方案关联的特殊形态（通过 planIds 匹配）
  const relatedForms = plan ? SPECIAL_FORMS.filter(f => f.planIds.includes(plan.id)) : [];

  // 同属性的所有可选方案（基础 + 积累属系池 + 自定义），用于「切换方案」
  const baseAttrId = basePlanId ?? planId;
  const basePlan = PLANS.find(p => p.id === baseAttrId);
  // 同属系的积累属系池方案（noShiny && attrId 指向当前属系）
  const poolSiblings = PLANS.filter(p => p.noShiny && p.attrId === baseAttrId);
  const switcherOptions = basePlan ? [
    // 基础推荐方案
    { id: basePlan.id, label: `${basePlan.type}（推荐）`, fruitA: basePlan.fruitA, fruitB: basePlan.fruitB, tag: null },
    // 积累属系池方案
    ...poolSiblings.map(p => ({
      id: p.id,
      label: p.type,
      fruitA: p.fruitA, fruitB: p.fruitB,
      tag: '回顾价格高',
    })),
    // 同属性的用户自定义方案
    ...(state.userPlanConfig || [])
      .filter(p => p.attrId === baseAttrId)
      .map(p => ({ id: p.id, label: p.label || '自定义方案', fruitA: p.fruitA, fruitB: p.fruitB, tag: '自定义' })),
  ] : null;

  if (!plan) return null;

  const handleStart = () => {
    // 判断该方案是否已有进行中的 task
    const existingTask = (state.activeTasks || []).find(t => t.planId === plan.id);
    const taskExists = !!existingTask;

    // 从方案对象中取赛季标记：plan.season 统一为 'S1'/'S2' 字符串，fallback 到 'S1'
    const planSeason = (typeof plan.season === 'string' && plan.season) ? plan.season : 'S1';

    if (ballMode === 'byType') {
      const adv = parseInt(ballAdv.trim(), 10) || 0;
      const sea = parseInt(ballSea.trim(), 10) || 0;
      const att = parseInt(ballAtt.trim(), 10) || 0;
      const hasAny = ballAdv.trim() || ballSea.trim() || ballAtt.trim();
      const ballPayload = {
        ballMode: 'byType',
        ballStartByType: hasAny ? { adv, sea, att } : null,
      };
      dispatch(taskExists
        ? { type: 'SET_TASK_BALLS', planId: plan.id, ...ballPayload }
        : { type: 'START_TASK',    planId: plan.id, season: planSeason, ...ballPayload }
      );
    } else {
      const parsed = ballInput.trim() ? parseInt(ballInput.trim(), 10) : null;
      const validParsed = (parsed != null && !isNaN(parsed) && parsed >= 0) ? parsed : null;
      // 若用户没有修改输入框（空），保留 task 中已有的 ballStart，不覆盖为 null
      const finalBallStart = validParsed ?? (taskExists ? (existingTask.ballStart ?? null) : null);
      const ballPayload = {
        ballMode: 'simple',
        ballStart: finalBallStart,
      };
      dispatch(taskExists
        ? { type: 'SET_TASK_BALLS', planId: plan.id, ...ballPayload }
        : { type: 'START_TASK',    planId: plan.id, season: planSeason, ...ballPayload }
      );
    }
    navigate('recorder', { planId: plan.id });
  };

  // 赛季单抓：目标精灵（shinies[0]）
  const targetSpirit = plan.season ? plan.shinies[0] : null;
  const _targetFileName = targetSpirit || '';
  const _hasLocalTarget = LOCAL_SPIRIT_FILES.has(_targetFileName);
  const spiritImgSrc = targetSpirit
    ? (_hasLocalTarget
        ? `${base}spirits/${encodeURIComponent(targetSpirit)}.webp`
        : (getWikiSpiritImg(targetSpirit) || `${base}spirits/${encodeURIComponent(targetSpirit)}.webp`))
    : null;
  const isObtained = targetSpirit ? !!state.spirits[targetSpirit]?.obtained : false;

  return (
    <div style={{ paddingBottom: 24 }}>
      {/* 顶部 */}
      <div className="page-header">
        <button className="back-btn" onClick={goBack}><img src={`${import.meta.env.BASE_URL}back-icon.webp`} alt="返回" /></button>
        <span className="page-header-title">确认方案</span>
        {/* 「切换方案」按钮：有多个可选方案时显示 */}
        {switcherOptions && switcherOptions.length > 1 && (
          <button
            onClick={() => setShowSwitcher(v => !v)}
            style={{
              marginLeft: 'auto',
              padding: '5px 12px',
              borderRadius: 8,
              border: showSwitcher ? '1.5px solid #2B2A2E' : '1.5px solid rgba(103,93,83,0.3)',
              background: showSwitcher ? '#2B2A2E' : 'var(--card-inner)',
              color: showSwitcher ? '#FBF7EC' : 'var(--text-muted)',
              fontSize: 12, fontWeight: 700,
              fontFamily: 'var(--font-body)', cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {showSwitcher ? '收起 ↑' : '切换方案 ↓'}
          </button>
        )}
      </div>

      {/* 方案切换面板（展开时显示） */}
      {showSwitcher && switcherOptions && (
        <div className="card animate-in" style={{ padding: '10px 0', marginBottom: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 0.5, padding: '0 14px 8px' }}>
            选择方案
          </div>
          {switcherOptions.map(opt => {
            const isSelected = opt.id === activePlanId;
            const tagColor = opt.tag === '积累属系池'
              ? { bg: 'rgba(255,193,7,0.12)', text: '#9A7208', border: 'rgba(255,193,7,0.4)' }
              : { bg: 'rgba(103,93,83,0.1)', text: 'var(--text-muted)', border: 'rgba(103,93,83,0.18)' };
            return (
              <button
                key={opt.id}
                onClick={() => { setActivePlanId(opt.id); setShowSwitcher(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  width: '100%', padding: '10px 14px',
                  border: 'none', borderBottom: '1px solid var(--divider)',
                  background: isSelected ? 'rgba(200,131,10,0.07)' : 'transparent',
                  cursor: 'pointer', textAlign: 'left',
                  fontFamily: 'var(--font-body)',
                }}
              >
                <div style={{
                  width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                  background: isSelected ? '#C8830A' : 'var(--divider)',
                  border: isSelected ? '2px solid #C8830A' : '2px solid var(--card-border)',
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: 13, fontWeight: isSelected ? 800 : 600,
                    color: isSelected ? '#C8830A' : 'var(--text)',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    {opt.label}
                    {opt.tag && (
                      <span style={{
                        fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 10,
                        background: tagColor.bg, color: tagColor.text,
                        border: `1px solid ${tagColor.border}`,
                      }}>{opt.tag}</span>
                    )}
                  </div>
                  {(opt.fruitA || opt.fruitB) && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      {opt.fruitA}{opt.fruitB ? ` + ${opt.fruitB}` : ''}
                    </div>
                  )}
                </div>
                {isSelected && (
                  <span style={{ fontSize: 14, color: '#C8830A', flexShrink: 0 }}>✓</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* ── 方案概览卡 ── */}
      <div className="card animate-in">

        {/* 顶部：图标 + 标题行 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          {plan.season ? (
            /* 赛季单抓：用精灵大图替换属性 icon */
            <div style={{
              width: 64, height: 64, borderRadius: 14, flexShrink: 0,
              background: isObtained ? 'rgba(75,156,70,0.1)' : '#F0E8D5',
              border: isObtained ? '2px solid rgba(75,156,70,0.35)' : '2px solid rgba(103,93,83,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', position: 'relative',
            }}>
              <img
                src={spiritImgSrc}
                alt={targetSpirit}
                loading="lazy"
                style={{ width: 56, height: 56, objectFit: 'contain' }}
                onError={e => {
                  const wiki = getWikiSpiritImg(targetSpirit);
                  if (wiki && e.target.src !== wiki) { e.target.src = wiki; }
                  else { e.target.style.display = 'none'; }
                }}
              />
              {isObtained && (
                <span style={{
                  position: 'absolute', bottom: 2, right: 4,
                  fontSize: 12, color: '#4B9C46', fontWeight: 900,
                }}>✓</span>
              )}
            </div>
          ) : (
            /* 属性方案：保持原属性 icon */
            <div style={{
              width: 52, height: 52, borderRadius: 13,
              background: '#F0E8D5',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, overflow: 'hidden', padding: 6,
            }}>
              <PlanIcon plan={plan} size={36} />
            </div>
          )}

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 900, fontFamily: 'var(--font-display)' }}>
              {plan.season ? `${plan.type} 异色刷取` : `${plan.type}方案`}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
              <FruitLine fruitA={plan.fruitA} fruitB={plan.fruitB} size={15} />
            </div>
            {plan.season && isObtained && (
              <div style={{
                marginTop: 4, display: 'inline-block',
                fontSize: 10, fontWeight: 800, padding: '1px 7px', borderRadius: 10,
                background: 'rgba(75,156,70,0.12)', color: '#4B9C46',
                border: '1px solid rgba(75,156,70,0.3)',
              }}>✓ 已收录</div>
            )}
          </div>
        </div>

        {/* 属性方案：刷取循环 */}
        {!plan.season && (
          <div style={{
            background: 'var(--card-inner)',
            borderRadius: 10, padding: '10px 12px', marginBottom: 14,
            fontSize: 13, color: 'var(--text-light)', lineHeight: 1.8,
          }}>
            <span style={{ color: 'var(--gold)', fontWeight: 800, fontSize: 11, letterSpacing: 0.5 }}>
              刷取循环
            </span>
            <br />
            抓3只{plan.spiritA}
            {plan.spiritB ? ` → 抓3只${plan.spiritB} → 循环` : ' → 每3只一轮，反复循环'}
          </div>
        )}

        {/* 赛季方案：庇护所 + 同放果实 + 解锁条件，合并在一张卡内 */}
        {plan.season && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 4 }}>

            {/* 解锁条件：fruitA（所有方案都有） */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 10px', borderRadius: 8,
              background: 'var(--card-inner)',
            }}>
              <FruitTag name={plan.fruitA} size={38} showName={false} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 2 }}>{plan.fruitA}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>{plan.unlockA}</div>
              </div>
            </div>

            {/* 解锁条件：fruitB（混刷方案才有） */}
            {plan.fruitB && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 10px', borderRadius: 8,
                background: 'var(--card-inner)',
              }}>
                <FruitTag name={plan.fruitB} size={38} showName={false} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 2 }}>{plan.fruitB}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>{plan.unlockB}</div>
                </div>
              </div>
            )}

            {/* 推荐庇护所 */}
            {plan.sanctuary && (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '8px 10px', borderRadius: 8,
                background: 'var(--card-inner)',
              }}>
                <span style={{
                  fontSize: 10, color: '#5B9CF6', fontWeight: 800,
                  minWidth: 28, paddingTop: 1, flexShrink: 0,
                }}>📍 庇</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 2 }}>「{plan.sanctuary}」</div>
                  {plan.sanctuaryTip && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>{plan.sanctuaryTip}</div>
                  )}
                </div>
              </div>
            )}

            {/* 推荐同放果实 */}
            {plan.coFruit && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 10px', borderRadius: 8,
                background: '#FFF9E0',
                border: '1px solid rgba(200,160,32,0.3)',
              }}>
                <span style={{ fontSize: 10, color: '#C8830A', fontWeight: 800, minWidth: 28, flexShrink: 0 }}>
                  同放
                </span>
                <div style={{ fontSize: 12, lineHeight: 1.5 }}>
                  <span style={{ fontWeight: 800 }}>{plan.coFruit}</span>
                  <span style={{ color: 'var(--text-muted)', marginLeft: 4 }}>可与本果实共用同一庇护所，节省位置</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 属性方案：可产出精灵列表 */}
        {!plan.season && (() => {
          const isNoShiny = !!plan.noShiny;
          const displayShinies = isNoShiny ? (plan.poolShinies || []) : plan.shinies;
          if (displayShinies.length === 0) return null;
          return (
            <>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 700, letterSpacing: 0.5 }}>
                {isNoShiny ? '可间接产出异色精灵' : '可产出异色精灵'}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {displayShinies.map(name => (
                  <SpiritAvatar key={name} name={name} obtained={state.spirits[name]?.obtained} size={40} />
                ))}
              </div>
            </>
          );
        })()}
      </div>

      {/* 属性方案：解锁条件（单独卡片） */}
      {!plan.season && (
        <div className="card animate-in" style={{ animationDelay: '0.05s' }}>
          <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 10 }}>解锁条件</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { label: plan.fruitA, desc: plan.unlockA },
              plan.fruitB ? { label: plan.fruitB, desc: plan.unlockB } : null,
            ].filter(Boolean).map((item, i) => {
              const isPokedex = isPokedexUnlock(item.desc);
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  padding: '8px 10px', borderRadius: 8,
                  background: isPokedex ? 'rgba(91,156,246,0.06)' : 'var(--card-inner)',
                  border: isPokedex ? '1px solid rgba(91,156,246,0.25)' : '1px solid transparent',
                }}>
                  <FruitTag name={item.label} size={40} showName={false} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 2 }}>
                      {item.label}
                    </div>
                    {item.desc ? (
                      <>
                        {isPokedex && (
                          <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: 3,
                            fontSize: 9, fontWeight: 800, padding: '1px 6px', borderRadius: 8,
                            background: 'rgba(91,156,246,0.12)', color: '#5B9CF6',
                            border: '1px solid rgba(91,156,246,0.3)',
                            marginBottom: 4,
                          }}>
                            📖 图鉴解锁
                          </div>
                        )}
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                          {item.desc}
                        </div>
                      </>
                    ) : (
                      <div style={{ fontSize: 11, color: 'rgba(103,93,83,0.4)', lineHeight: 1.5, fontStyle: 'italic' }}>
                        暂无解锁信息
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 特殊形态庇护所提示（有关联特殊形态时展示） */}
      {!plan.season && relatedForms.length > 0 && relatedForms.map((form, i) => (
        <div key={i} className="card animate-in" style={{
          animationDelay: '0.07s',
          background: 'rgba(156,111,224,0.05)',
          borderColor: 'rgba(156,111,224,0.3)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <span style={{
              fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 6,
              background: 'rgba(156,111,224,0.15)', color: '#9C6FE0',
              border: '1px solid rgba(156,111,224,0.3)',
            }}>🌰 特殊形态解锁</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#9C6FE0' }}>
              {form.spirit} → {form.hiddenForm}
            </span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.7 }}>
            <div style={{ marginBottom: 4 }}>
              将<strong style={{ color: '#9C6FE0' }}>{form.acornDesc}</strong>放入指定地底护所，可解锁「{form.hiddenForm}」隐藏形态。
            </div>
            <div>
              <span style={{ color: '#5B9CF6', fontWeight: 700 }}>📍 推荐庇护所：</span>
              <span style={{ color: 'var(--text)', fontWeight: 700 }}>{form.sanctuary}</span>
            </div>
          </div>
        </div>
      ))}

      {/* 咕噜球库存 */}
      <div className="card animate-in" style={{ animationDelay: '0.09s' }}>
        {/* 标题行 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 800 }}>咕噜球库存</span>
          <span style={{
            fontSize: 10, padding: '2px 8px', borderRadius: 20,
            background: 'var(--card-inner)', color: 'var(--text-muted)',
            border: '1px solid var(--divider)', fontWeight: 600,
          }}>选填</span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10, lineHeight: 1.6 }}>
          填写后，出货时可自动计算本次消耗球数
        </div>

        {/* 模式切换 */}
        <div style={{
          display: 'flex', gap: 6, marginBottom: 12,
          background: 'var(--card-inner)', borderRadius: 8, padding: 4,
          border: '1px solid var(--divider)',
        }}>
          {[
            { key: 'simple', label: '不区分球类' },
            { key: 'byType', label: '区分球类' },
          ].map(({ key, label }) => {
            const active = ballMode === key;
            return (
              <button
                key={key}
                onClick={() => setBallMode(key)}
                style={{
                  flex: 1, padding: '6px 0',
                  borderRadius: 6, border: 'none',
                  background: active ? '#2B2A2E' : 'transparent',
                  color: active ? '#FBF7EC' : 'var(--text-muted)',
                  fontSize: 12, fontWeight: active ? 800 : 600,
                  fontFamily: 'var(--font-body)', cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {ballMode === 'simple' ? (
          <input
            type="number" inputMode="numeric"
            value={ballInput} onChange={e => setBallInput(e.target.value)}
            placeholder="输入当前咕噜球总数"
            className="input-field"
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: '高级球', value: ballAdv, setter: setBallAdv, color: '#C8830A' },
              { label: '赛季球', value: ballSea, setter: setBallSea, color: '#7E57C2' },
              { label: '属性球', value: ballAtt, setter: setBallAtt, color: '#5B9CF6' },
            ].map(({ label, value, setter, color }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{
                  fontSize: 12, fontWeight: 800, color,
                  minWidth: 42, flexShrink: 0,
                }}>{label}</span>
                <input
                  type="number" inputMode="numeric"
                  value={value} onChange={e => setter(e.target.value)}
                  placeholder="0"
                  className="input-field"
                  style={{ flex: 1, margin: 0 }}
                />
              </div>
            ))}
            <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.6, marginTop: 2 }}>
              不需要计的球类留空即可
            </div>
          </div>
        )}
      </div>

      {/* 开始前确认 */}
      <div className="card animate-in" style={{
        animationDelay: '0.13s',
        background: '#FFF9E0', borderColor: '#C8A020', boxShadow: '0 2px 0 #C8A020',
      }}>
        <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 10, color: '#C8830A' }}>
          ⚡ 开始前确认
        </div>
        {TIPS.map((text, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'flex-start', gap: 8,
            padding: '7px 0',
            borderBottom: i < TIPS.length - 1 ? '1px solid rgba(200,160,32,0.2)' : 'none',
            fontSize: 13, color: 'var(--text-light)', lineHeight: 1.5,
          }}>
            <span style={{ color: '#C8830A', fontWeight: 800, flexShrink: 0 }}>·</span>
            <span>{text}</span>
          </div>
        ))}
      </div>

      <button className="btn btn-primary animate-in" style={{ animationDelay: '0.17s' }} onClick={handleStart}>
        开始刷取
      </button>
    </div>
  );
}
