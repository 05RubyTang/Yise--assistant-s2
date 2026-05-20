import { useState } from 'react';
import { useStore } from '../store';
import { PLANS, S2_PLANS, classifyResultType, getPlanAttrId, computeFamilyPool, resolvePlanIconImg, ATTR_LABEL, ALL_SHINIES, analyzePlanFruits, SPIRIT_ATTR1 } from '../data/plans';
import SpiritAvatar from '../components/SpiritAvatar';
import PlanIcon from '../components/PlanIcon';
import { FruitLine } from '../components/FruitTag';
import ShieldDots from '../components/ShieldDots';
import ResultModal from '../components/ResultModal';
import ShinySelectModal from '../components/ShinySelectModal';
import BreakSpiritModal from '../components/BreakSpiritModal';

export default function Recorder({ planId, navigate }) {
  const { state, dispatch, poolCounts } = useStore();
  const task = (state.activeTasks || []).find(t => t.planId === planId);
  const rawPlan = PLANS.find(p => p.id === planId)
    || S2_PLANS.find(p => p.id === planId)
    || (state.userPlanConfig || []).find(p => p.id === planId);
  // 标准化：自定义方案继承基础属性方案的图标
  const attrBase = rawPlan?.attrId ? PLANS.find(p => p.id === rawPlan.attrId) : null;
  const plan = rawPlan ? {
    ...rawPlan,
    type:    rawPlan.type    || rawPlan.label || '自定义方案',
    shinies: Array.isArray(rawPlan.shinies) ? rawPlan.shinies : [],
    iconImg: resolvePlanIconImg(rawPlan, attrBase),
    icon:    rawPlan.icon    || attrBase?.icon    || '✨',
  } : null;

  const [showResult, setShowResult] = useState(false);
  const [showAbandonConfirm, setShowAbandonConfirm] = useState(false);
  const [showShinySelect, setShowShinySelect] = useState(false);
  // 暂存 'original' | 'polluted' 结果，等待精灵选择弹窗确认
  const [pendingResult, setPendingResult] = useState(null);
  const [showBreakSpiritSelect, setShowBreakSpiritSelect] = useState(false);
  // 补球弹框（simple 模式）
  const [showRestockInput, setShowRestockInput] = useState(false);
  const [restockInput, setRestockInput] = useState('');
  // 补球弹框（byType 模式）
  const [showRestockByType, setShowRestockByType] = useState(false);
  const [restockAdv, setRestockAdv] = useState('');
  const [restockSea, setRestockSea] = useState('');
  const [restockAtt, setRestockAtt] = useState('');
  // 暂停计球弹框
  const [showPauseInput, setShowPauseInput] = useState(false);
  const [pauseInput, setPauseInput] = useState('');
  const [pauseAdv, setPauseAdv] = useState('');
  const [pauseSea, setPauseSea] = useState('');
  const [pauseAtt, setPauseAtt] = useState('');
  // 修改开始球数弹框
  const [showEditStart, setShowEditStart] = useState(false);
  const [editStartInput, setEditStartInput] = useState('');
  const [editStartAdv, setEditStartAdv] = useState('');
  const [editStartSea, setEditStartSea] = useState('');
  const [editStartAtt, setEditStartAtt] = useState('');
  // 「配置咕噜球」Sheet（task 尚未设置球数时使用）
  const [showBallSetup, setShowBallSetup] = useState(false);
  const [setupMode, setSetupMode] = useState('simple');
  const [setupInput, setSetupInput] = useState('');
  const [setupAdv, setSetupAdv] = useState('');
  const [setupSea, setSetupSea] = useState('');
  const [setupAtt, setSetupAtt] = useState('');

  if (!plan || !task) return null;

  const handleResult = (result) => {
    setShowResult(false);

    if (result === 'failed') {
      // 完全失败：逃跑/战败，不计入任何池
      dispatch({ type: 'RECORD_FAILED_BREAK', planId });
      return;
    }
    if (result === 'jelly') {
      // 果冻/星辰虫：仅计世界池，但计入保底次数（记录为 jelly 类型）
      dispatch({ type: 'RECORD_BREAK', result: 'jelly', planId, spiritName: '果冻/星辰虫' });
      return;
    }
    if (result === 'shiny') {
      // 异色！直接记录，再弹出异色精灵选择
      dispatch({ type: 'RECORD_BREAK', result: 'shiny', planId });
      setShowShinySelect(true);
      return;
    }
    // 'original' | 'polluted'：暂存结果，弹出精灵选择弹窗
    setPendingResult(result);
    setShowBreakSpiritSelect(true);
  };

  const handleBreakSpiritSelect = (spiritName) => {
    setShowBreakSpiritSelect(false);
    if (pendingResult) {
      dispatch({ type: 'RECORD_BREAK', result: pendingResult, planId, spiritName });
      setPendingResult(null);
    }
  };

  const handleShinySelect = (name) => {
    setShowShinySelect(false);
    const resultType = classifyResultType(name, plan);
    navigate('report', { planId: plan.id, spiritName: name, resultType });
  };

  const handleExit = () => navigate('home');

  const handleAbandon = () => {
    setShowAbandonConfirm(true);
  };

  const handleAbandonConfirmed = () => {
    setShowAbandonConfirm(false);
    dispatch({ type: 'ABANDON_TASK', planId });
    navigate('home');
  };

  const remaining = 80 - task.shieldBreakCount;
  const progressColor = task.shieldBreakCount >= 60 ? 'var(--cta)' : '#FBC839';

  // 咕噜球相关计算
  const ballMode = task.ballMode || 'simple';
  const ballRestocks = task.ballRestocks || [];
  const pauseSegments = task.pauseSegments || [];

  // simple 模式
  const restockTotal = ballRestocks.reduce((s, r) => s + (r.amount || 0), 0);
  // 历史暂停段已消耗总计
  const pauseConsumedTotal = pauseSegments.reduce((s, seg) => s + (seg.consumed || 0), 0);

  // hasBallStart：判断是否已配置过球数
  // 兼容旧存量 task（无 ballMode 字段）：ballStart 字段名始终一致
  //   - ballStart / ballStartByType 有值 → 已配置
  //   - 或者 ballRestocks 非空 → 曾经记录过补球，也视为「已配置」状态（显示球卡片）
  const hasBallStart = ballMode === 'byType'
    ? (task.ballStartByType != null || ballRestocks.length > 0)
    : (task.ballStart != null || ballRestocks.length > 0);

  // byType 模式
  const bst = task.ballStartByType || { adv: 0, sea: 0, att: 0 };
  const restByType = ballRestocks.reduce(
    (s, r) => ({ adv: s.adv + (r.adv || 0), sea: s.sea + (r.sea || 0), att: s.att + (r.att || 0) }),
    { adv: 0, sea: 0, att: 0 }
  );

  const handleRestock = () => {
    const n = parseInt(restockInput.trim(), 10);
    if (!n || isNaN(n) || n <= 0) return;
    dispatch({ type: 'ADD_BALL_RESTOCK', planId, amount: n });
    setRestockInput('');
    setShowRestockInput(false);
  };

  const handleRestockByType = () => {
    const adv = parseInt(restockAdv.trim(), 10) || 0;
    const sea = parseInt(restockSea.trim(), 10) || 0;
    const att = parseInt(restockAtt.trim(), 10) || 0;
    if (adv === 0 && sea === 0 && att === 0) return;
    dispatch({ type: 'ADD_BALL_RESTOCK', planId, adv, sea, att });
    setRestockAdv(''); setRestockSea(''); setRestockAtt('');
    setShowRestockByType(false);
  };

  // 暂停计球：结算当前段，重置起始
  const handlePause = () => {
    if (ballMode === 'byType') {
      const adv = parseInt(pauseAdv.trim(), 10) || 0;
      const sea = parseInt(pauseSea.trim(), 10) || 0;
      const att = parseInt(pauseAtt.trim(), 10) || 0;
      dispatch({ type: 'PAUSE_BALL_SEGMENT', planId, currentByType: { adv, sea, att } });
      setPauseAdv(''); setPauseSea(''); setPauseAtt('');
    } else {
      const n = parseInt(pauseInput.trim(), 10);
      if (isNaN(n) || n < 0) return;
      dispatch({ type: 'PAUSE_BALL_SEGMENT', planId, current: n });
      setPauseInput('');
    }
    setShowPauseInput(false);
  };

  // 修改开始球数：不清空 restocks / pauseSegments
  const handleEditStart = () => {
    if (ballMode === 'byType') {
      const adv = parseInt(editStartAdv.trim(), 10) || 0;
      const sea = parseInt(editStartSea.trim(), 10) || 0;
      const att = parseInt(editStartAtt.trim(), 10) || 0;
      dispatch({ type: 'UPDATE_BALL_START', planId, ballMode: 'byType', ballStartByType: { adv, sea, att } });
      setEditStartAdv(''); setEditStartSea(''); setEditStartAtt('');
    } else {
      const n = parseInt(editStartInput.trim(), 10);
      if (isNaN(n) || n < 0) return;
      dispatch({ type: 'UPDATE_BALL_START', planId, ballMode: 'simple', ballStart: n });
      setEditStartInput('');
    }
    setShowEditStart(false);
  };

  // 配置咕噜球：首次设置（或未填过的 task 中途补填）
  const handleBallSetup = () => {
    if (setupMode === 'byType') {
      const adv = parseInt(setupAdv.trim(), 10) || 0;
      const sea = parseInt(setupSea.trim(), 10) || 0;
      const att = parseInt(setupAtt.trim(), 10) || 0;
      const hasAny = setupAdv.trim() || setupSea.trim() || setupAtt.trim();
      dispatch({
        type: 'SET_TASK_BALLS', planId,
        ballMode: 'byType',
        ballStartByType: hasAny ? { adv, sea, att } : null,
      });
    } else {
      const n = parseInt(setupInput.trim(), 10);
      dispatch({
        type: 'SET_TASK_BALLS', planId,
        ballMode: 'simple',
        ballStart: (!isNaN(n) && n > 0) ? n : null,
      });
    }
    setShowBallSetup(false);
    setSetupInput(''); setSetupAdv(''); setSetupSea(''); setSetupAtt('');
  };

  return (
    <div style={{ paddingBottom: 16 }}>
      {/* 顶部 header */}
      <div className="page-header" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="back-btn" onClick={handleExit}><img src={`${import.meta.env.BASE_URL}back-icon.webp`} alt="返回" /></button>
          {/* 属性图标 */}
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: '#F0E8D5',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden', padding: 3,
          }}>
            <PlanIcon plan={plan} size={26} />
          </div>
          <span className="page-header-title">
            {plan.season ? `${plan.type}刷取方案` : `${plan.type}方案`}
          </span>
        </div>
        <button
          onClick={handleAbandon}
          style={{
            border: '1.5px solid rgba(200,53,26,0.3)',
            background: '#FFF2EF', color: 'var(--danger)',
            fontSize: 12, fontFamily: 'var(--font-body)',
            padding: '6px 12px', borderRadius: 8,
            cursor: 'pointer', fontWeight: 700,
          }}
        >
          删除
        </button>
      </div>

      {/* 方案提示卡 */}
      <div style={{
        position: 'relative',
        margin: '0 16px 16px',
        borderRadius: 16,
        overflow: 'hidden',
        backgroundImage: `url(${import.meta.env.BASE_URL}card-frame-detail.webp)`,
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
      }}>
        {/* 深色标题条 */}
        <div style={{
          background: 'rgb(2 2 2 / 0%)',
          padding: '12px 14px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 11,
              background: 'rgba(255,255,255,0.13)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, padding: 4,
            }}>
              <PlanIcon plan={plan} size={26} />
            </div>
            <div>
              <div style={{
                fontSize: 17, fontWeight: 900, color: '#fff',
                fontFamily: 'var(--font-display)', letterSpacing: 0.5, lineHeight: 1.2,
              }}>
                {plan.season ? `${plan.type}刷取方案` : plan.shinies.length > 0 ? '3+3 刷取方案' : `${plan.type}`}
              </div>
              {plan.shinies.length > 0 && (
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2, fontWeight: 600 }}>
                  {plan.shinies.length} 套方案
                </div>
              )}
            </div>
          </div>
          {/* 右：已获得/总数（仅有 shinies 时展示） */}
          {plan.shinies.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 1, flexShrink: 0 }}>
                <span className="font-subtitle" style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>
                  {plan.shinies.filter(n => state.spirits[n]?.obtained).length}
                </span>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
                  /{plan.shinies.length}
                </span>
              </div>
          )}
        </div>
        {/* 正常内容区 */}
        <div style={{ padding: '12px 14px 22px' }}>
        <div style={{ fontSize: 12, color: 'var(--text-light)', marginBottom: 3 }}>
          <FruitLine fruitA={plan.fruitA} fruitB={plan.fruitB} size={14} />
        </div>
        {plan.season ? (
          plan.sanctuary && (
            <div style={{ fontSize: 12, color: 'var(--text-light)', marginBottom: 10 }}>
              <span style={{ color: '#5B9CF6', fontWeight: 700 }}>📍</span>
              {' '}「{plan.sanctuary}」
            </div>
          )
        ) : (
          <div style={{ fontSize: 12, color: 'var(--text-light)', marginBottom: 10 }}>
            抓3只{plan.spiritA}
            {plan.spiritB ? ` → 抓3只${plan.spiritB} → 循环` : ' → 每3只一轮'}
          </div>
        )}
        {/* 异色精灵解锁进度（有 shinies 时展示；自定义方案无 shinies 则提示手动记录） */}
        {plan.shinies.length > 0 ? (
          <>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, letterSpacing: 0.5, marginBottom: 6 }}>
              异色精灵解锁进度
              <span style={{ fontWeight: 400, marginLeft: 6 }}>
                {plan.shinies.filter(n => state.spirits[n]?.obtained).length}/{plan.shinies.length}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              {plan.shinies.map(name => {
                const obtained = state.spirits[name]?.obtained;
                return (
                  <div key={name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                    <SpiritAvatar name={name} obtained={obtained} size={32} showName={false} />
                    <span style={{
                      fontSize: 10, fontWeight: 700, lineHeight: 1,
                      color: obtained ? 'var(--success)' : 'var(--text-muted)',
                    }}>
                      {obtained ? '✓ 已获得' : '🔒 未解锁'}
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            自定义方案 · 出货后手动选择精灵名称
          </div>
        )}
        </div>
      </div>

      {/* 操作提示条 */}
      <div style={{
        margin: '0 16px 4px',
        padding: '8px 12px',
        borderRadius: 10,
        background: '#FFF9E0',
        border: '1.5px solid #C8A020',
        display: 'flex', alignItems: 'flex-start', gap: 8,
        fontSize: 12, color: 'var(--text-light)', lineHeight: 1.7,
      }}>
        <span style={{ fontSize: 14, flexShrink: 0, lineHeight: 1.6 }}>💡</span>
        <span>
          1. 遇到<span style={{ fontWeight: 800, color: '#C8830A' }}>果冻 / 星辰虫</span>时选对应选项——仅计世界池。<br />
          2. 左上角返回首页会<span style={{ fontWeight: 800 }}>自动暂停</span>。
        </span>
      </div>

      {/* ★ 记录触发污染大按钮 ★ */}
      <button
        className="recorder-btn-break"
        onClick={() => setShowResult(true)}
      >
        <img src={`${import.meta.env.BASE_URL}break-shield.webp`} alt="触发污染" style={{ width: 32, height: 32, objectFit: 'contain' }} />
        <span>记录一次触发污染</span>
      </button>

      {/* 工具栏 */}
      <div className="recorder-tools">
        <button
          className="recorder-undo"
          disabled={task.shieldBreaks.length === 0}
          onClick={() => dispatch({ type: 'UNDO_BREAK', planId })}
        >
          ↩ 撤销上一次
        </button>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
          已记录 <span style={{ color: 'var(--text)', fontWeight: 800 }}>{task.shieldBreaks.length}</span> 次
        </div>
      </div>

      {/* 补球弹窗（simple 模式）—— 悬浮在页面中 */}
      {showRestockInput && (
        <div
          onClick={() => { setShowRestockInput(false); setRestockInput(''); }}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(43,42,46,0.45)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 500,
              background: '#FBF7EC', borderRadius: '16px 16px 0 0',
              padding: '20px 20px 32px',
              boxShadow: '0 -4px 24px rgba(43,42,46,0.18)',
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>记录补球</div>
            <input
              type="number" inputMode="numeric" min="1"
              value={restockInput}
              onChange={e => setRestockInput(e.target.value)}
              placeholder="本次补了多少个咕噜球？"
              autoFocus className="input-field"
              onKeyDown={e => { if (e.key === 'Enter') handleRestock(); if (e.key === 'Escape') { setShowRestockInput(false); setRestockInput(''); } }}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button
                disabled={!restockInput.trim() || parseInt(restockInput, 10) <= 0}
                onClick={handleRestock}
                style={{
                  flex: 1, padding: '12px 0', borderRadius: 'var(--radius-sm)',
                  border: '2px solid var(--success)',
                  background: restockInput.trim() && parseInt(restockInput, 10) > 0 ? 'var(--success)' : '#B0A898',
                  color: '#fff', fontWeight: 800, fontSize: 14,
                  fontFamily: 'var(--font-body)',
                  cursor: restockInput.trim() && parseInt(restockInput, 10) > 0 ? 'pointer' : 'not-allowed',
                }}
              >确认补球</button>
              <button
                onClick={() => { setShowRestockInput(false); setRestockInput(''); }}
                style={{
                  padding: '12px 18px', borderRadius: 'var(--radius-sm)',
                  border: '1.5px solid var(--divider)', background: 'var(--card-inner)',
                  color: 'var(--text-muted)', fontWeight: 700, fontSize: 13,
                  fontFamily: 'var(--font-body)', cursor: 'pointer',
                }}
              >取消</button>
            </div>
          </div>
        </div>
      )}

      {/* 补球弹窗（byType 模式）—— 悬浮在页面中 */}
      {showRestockByType && (
        <div
          onClick={() => { setShowRestockByType(false); setRestockAdv(''); setRestockSea(''); setRestockAtt(''); }}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(43,42,46,0.45)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 500,
              background: '#FBF7EC', borderRadius: '16px 16px 0 0',
              padding: '20px 20px 32px',
              boxShadow: '0 -4px 24px rgba(43,42,46,0.18)',
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>记录补球</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: '高级球', value: restockAdv, setter: setRestockAdv, color: '#C8830A' },
                { label: '赛季球', value: restockSea, setter: setRestockSea, color: '#7E57C2' },
                { label: '属性球', value: restockAtt, setter: setRestockAtt, color: '#5B9CF6' },
              ].map(({ label, value, setter, color }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color, minWidth: 44, flexShrink: 0 }}>{label}</span>
                  <input
                    type="number" inputMode="numeric" min="0"
                    value={value} onChange={e => setter(e.target.value)}
                    placeholder="0" className="input-field" style={{ flex: 1, margin: 0 }}
                  />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button
                onClick={handleRestockByType}
                style={{
                  flex: 1, padding: '12px 0', borderRadius: 'var(--radius-sm)',
                  border: '2px solid var(--success)', background: 'var(--success)',
                  color: '#fff', fontWeight: 800, fontSize: 14,
                  fontFamily: 'var(--font-body)', cursor: 'pointer',
                }}
              >确认补球</button>
              <button
                onClick={() => { setShowRestockByType(false); setRestockAdv(''); setRestockSea(''); setRestockAtt(''); }}
                style={{
                  padding: '12px 18px', borderRadius: 'var(--radius-sm)',
                  border: '1.5px solid var(--divider)', background: 'var(--card-inner)',
                  color: 'var(--text-muted)', fontWeight: 700, fontSize: 13,
                  fontFamily: 'var(--font-body)', cursor: 'pointer',
                }}
              >取消</button>
            </div>
          </div>
        </div>
      )}

      {/* 暂停计球弹窗 */}
      {showPauseInput && (
        <div
          onClick={() => { setShowPauseInput(false); setPauseInput(''); setPauseAdv(''); setPauseSea(''); setPauseAtt(''); }}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(43,42,46,0.45)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 500,
              background: '#FBF7EC', borderRadius: '16px 16px 0 0',
              padding: '20px 20px 32px',
              boxShadow: '0 -4px 24px rgba(43,42,46,0.18)',
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 2 }}>暂停计球</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 14, lineHeight: 1.6 }}>
              填入<strong>当前</strong>携带的球数，系统自动结算本段消耗。下次继续刷时重新输入。
            </div>
            {ballMode === 'byType' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: '高级球', value: pauseAdv, setter: setPauseAdv, color: '#C8830A' },
                  { label: '赛季球', value: pauseSea, setter: setPauseSea, color: '#7E57C2' },
                  { label: '属性球', value: pauseAtt, setter: setPauseAtt, color: '#5B9CF6' },
                ].map(({ label, value, setter, color }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color, minWidth: 44, flexShrink: 0 }}>{label}</span>
                    <input
                      type="number" inputMode="numeric" min="0"
                      value={value} onChange={e => setter(e.target.value)}
                      placeholder="当前剩余" className="input-field" style={{ flex: 1, margin: 0 }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <input
                type="number" inputMode="numeric" min="0"
                value={pauseInput}
                onChange={e => setPauseInput(e.target.value)}
                placeholder="当前携带咕噜球数量"
                autoFocus className="input-field"
                onKeyDown={e => { if (e.key === 'Enter') handlePause(); }}
              />
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button
                onClick={handlePause}
                style={{
                  flex: 1, padding: '12px 0', borderRadius: 'var(--radius-sm)',
                  border: '2px solid #C8830A', background: '#C8830A',
                  color: '#fff', fontWeight: 800, fontSize: 14,
                  fontFamily: 'var(--font-body)', cursor: 'pointer',
                }}
              >确认暂停</button>
              <button
                onClick={() => { setShowPauseInput(false); setPauseInput(''); setPauseAdv(''); setPauseSea(''); setPauseAtt(''); }}
                style={{
                  padding: '12px 18px', borderRadius: 'var(--radius-sm)',
                  border: '1.5px solid var(--divider)', background: 'var(--card-inner)',
                  color: 'var(--text-muted)', fontWeight: 700, fontSize: 13,
                  fontFamily: 'var(--font-body)', cursor: 'pointer',
                }}
              >取消</button>
            </div>
          </div>
        </div>
      )}

      {/* 修改开始球数弹窗 */}
      {showEditStart && (
        <div
          onClick={() => { setShowEditStart(false); setEditStartInput(''); setEditStartAdv(''); setEditStartSea(''); setEditStartAtt(''); }}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(43,42,46,0.45)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 500,
              background: '#FBF7EC', borderRadius: '16px 16px 0 0',
              padding: '20px 20px 32px',
              boxShadow: '0 -4px 24px rgba(43,42,46,0.18)',
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 2 }}>修改开始球数</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 14, lineHeight: 1.6 }}>
              中途去刷了别的精灵消耗了球？直接改成<strong>当前实际</strong>带的球数作为新起点。<br />
              补球记录和暂停历史不会丢失。
            </div>
            {ballMode === 'byType' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: '高级球', value: editStartAdv, setter: setEditStartAdv, color: '#C8830A', cur: task.ballStartByType?.adv ?? 0 },
                  { label: '赛季球', value: editStartSea, setter: setEditStartSea, color: '#7E57C2', cur: task.ballStartByType?.sea ?? 0 },
                  { label: '属性球', value: editStartAtt, setter: setEditStartAtt, color: '#5B9CF6', cur: task.ballStartByType?.att ?? 0 },
                ].map(({ label, value, setter, color, cur }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color, minWidth: 44, flexShrink: 0 }}>{label}</span>
                    <input
                      type="number" inputMode="numeric" min="0"
                      value={value} onChange={e => setter(e.target.value)}
                      placeholder={`当前 ${cur}`} className="input-field" style={{ flex: 1, margin: 0 }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <input
                type="number" inputMode="numeric" min="0"
                value={editStartInput}
                onChange={e => setEditStartInput(e.target.value)}
                placeholder={`当前起始 ${task.ballStart ?? ''} 个，填新值`}
                autoFocus className="input-field"
                onKeyDown={e => { if (e.key === 'Enter') handleEditStart(); }}
              />
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button
                onClick={handleEditStart}
                style={{
                  flex: 1, padding: '12px 0', borderRadius: 'var(--radius-sm)',
                  border: '2px solid #5B9CF6', background: '#5B9CF6',
                  color: '#fff', fontWeight: 800, fontSize: 14,
                  fontFamily: 'var(--font-body)', cursor: 'pointer',
                }}
              >确认修改</button>
              <button
                onClick={() => { setShowEditStart(false); setEditStartInput(''); setEditStartAdv(''); setEditStartSea(''); setEditStartAtt(''); }}
                style={{
                  padding: '12px 18px', borderRadius: 'var(--radius-sm)',
                  border: '1.5px solid var(--divider)', background: 'var(--card-inner)',
                  color: 'var(--text-muted)', fontWeight: 700, fontSize: 13,
                  fontFamily: 'var(--font-body)', cursor: 'pointer',
                }}
              >取消</button>
            </div>
          </div>
        </div>
      )}

      {/* 配置咕噜球弹窗（首次设置或旧 task 补填） */}
      {showBallSetup && (
        <div
          onClick={() => { setShowBallSetup(false); setSetupInput(''); setSetupAdv(''); setSetupSea(''); setSetupAtt(''); }}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(43,42,46,0.45)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 500,
              background: '#FBF7EC', borderRadius: '16px 16px 0 0',
              padding: '20px 20px 36px',
              boxShadow: '0 -4px 24px rgba(43,42,46,0.18)',
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>配置咕噜球</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 14 }}>填写开始刷取时携带的球数</div>

            {/* 模式切换胶囊 */}
            <div style={{
              display: 'flex', background: 'var(--card-inner)',
              borderRadius: 8, padding: 3, marginBottom: 14,
              border: '1.5px solid var(--divider)',
            }}>
              {[
                { key: 'simple', label: '不区分球类' },
                { key: 'byType', label: '区分球类' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setSetupMode(key)}
                  style={{
                    flex: 1, padding: '6px 0', borderRadius: 6,
                    border: 'none', cursor: 'pointer',
                    fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 700,
                    background: setupMode === key ? '#2B2A2E' : 'transparent',
                    color: setupMode === key ? '#fff' : 'var(--text-muted)',
                    transition: 'all 0.15s',
                  }}
                >{label}</button>
              ))}
            </div>

            {/* simple：单行输入 */}
            {setupMode === 'simple' && (
              <input
                type="number" inputMode="numeric" min="0"
                value={setupInput}
                onChange={e => setSetupInput(e.target.value)}
                placeholder="携带咕噜球总数（可填 0）"
                autoFocus className="input-field"
                onKeyDown={e => { if (e.key === 'Enter') handleBallSetup(); }}
              />
            )}

            {/* byType：三行输入 */}
            {setupMode === 'byType' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: '高级球', value: setupAdv, setter: setSetupAdv, color: '#C8830A' },
                  { label: '赛季球', value: setupSea, setter: setSetupSea, color: '#7E57C2' },
                  { label: '属性球', value: setupAtt, setter: setSetupAtt, color: '#5B9CF6' },
                ].map(({ label, value, setter, color }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color, minWidth: 44, flexShrink: 0 }}>{label}</span>
                    <input
                      type="number" inputMode="numeric" min="0"
                      value={value} onChange={e => setter(e.target.value)}
                      placeholder="0" className="input-field" style={{ flex: 1, margin: 0 }}
                    />
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button
                onClick={handleBallSetup}
                style={{
                  flex: 1, padding: '12px 0', borderRadius: 'var(--radius-sm)',
                  border: '2px solid #2B2A2E', background: '#2B2A2E',
                  color: '#fff', fontWeight: 800, fontSize: 14,
                  fontFamily: 'var(--font-body)', cursor: 'pointer',
                }}
              >确认</button>
              <button
                onClick={() => { setShowBallSetup(false); setSetupInput(''); setSetupAdv(''); setSetupSea(''); setSetupAtt(''); }}
                style={{
                  padding: '12px 18px', borderRadius: 'var(--radius-sm)',
                  border: '1.5px solid var(--divider)', background: 'var(--card-inner)',
                  color: 'var(--text-muted)', fontWeight: 700, fontSize: 13,
                  fontFamily: 'var(--font-body)', cursor: 'pointer',
                }}
              >取消</button>
            </div>
          </div>
        </div>
      )}

      {/* 触发污染色块（始终显示，0 条记录时显示空格子） */}
      <div className="card" style={{
        backgroundImage: `url(${import.meta.env.BASE_URL}card-breaks.webp)`,
        backgroundSize: '100% auto',
        backgroundRepeat: 'repeat-y',
        backgroundPosition: 'top center',
        backgroundColor: 'transparent',
        border: '0px',
        boxShadow: 'none',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span className="font-subtitle" style={{ fontSize: 13, fontWeight: 800 }}>触发污染记录</span>
          <div style={{ display: 'flex', gap: 10, fontSize: 11, fontWeight: 700 }}>
            <span style={{ color: 'var(--success)' }}>
              原色×{task.shieldBreaks.filter(b => b.result === 'original').length}
            </span>
            <span style={{ color: 'var(--polluted)' }}>
              污染×{task.shieldBreaks.filter(b => b.result === 'polluted').length}
            </span>
            <span style={{ color: 'var(--gold)' }}>
              异色×{task.shieldBreaks.filter(b => b.result === 'shiny').length}
            </span>
          </div>
        </div>
        <ShieldDots breaks={task.shieldBreaks} max={100} />
      </div>

      {/* ── 双列卡：保底进度 + 咕噜球 ── */}
      <div style={{ display: 'flex', gap: 10, padding: '0 16px', marginBottom: 0 }}>

        {/* 左：本轮污染数小卡 */}
        <div style={{
          flex: '1 1 0',
          background: 'var(--card)',
          borderRadius: 'var(--radius)',
          border: '1.5px solid var(--card-border)',
          padding: '12px 12px 10px',
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: 0.3, marginBottom: 6 }}>
            本轮污染数
          </div>
          {/* 大数字 */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, marginBottom: 6 }}>
            <span className="font-subtitle" style={{
              fontSize: 34, fontWeight: 900, lineHeight: 1,
              color: progressColor,
            }}>{task.shieldBreakCount}</span>
          </div>
          {/* 细节行 */}
          <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.7 }}>
            <div>每次 1.8% 概率出异色</div>
          </div>
        </div>

        {/* 右：咕噜球小卡（始终渲染；无球数据时显示「配置咕噜球」入口） */}
        <div style={{
          flex: '1 1 0', position: 'relative',
          background: 'var(--card)',
          borderRadius: 'var(--radius)',
          border: hasBallStart ? '1.5px solid var(--card-border)' : '1.5px dashed var(--divider)',
          padding: '12px 12px 10px',
          display: 'flex', flexDirection: 'column',
        }}>
          {hasBallStart ? (
            <>
              {/* 标题 + 右上角操作按钮 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: 0.3 }}>咕噜球</div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    onClick={() => setShowPauseInput(true)}
                    style={{
                      fontSize: 10, fontWeight: 800,
                      padding: '2px 7px', borderRadius: 6,
                      border: '1.5px solid rgba(200,131,10,0.5)',
                      background: 'rgba(200,131,10,0.08)',
                      color: '#C8830A', cursor: 'pointer',
                      fontFamily: 'var(--font-body)', lineHeight: 1.4,
                    }}
                  >⏸ 暂停</button>
                  <button
                    onClick={() => ballMode === 'byType' ? setShowRestockByType(true) : setShowRestockInput(true)}
                    style={{
                      fontSize: 10, fontWeight: 800,
                      padding: '2px 7px', borderRadius: 6,
                      border: '1.5px solid rgba(75,156,70,0.5)',
                      background: 'rgba(75,156,70,0.08)',
                      color: 'var(--success)', cursor: 'pointer',
                      fontFamily: 'var(--font-body)', lineHeight: 1.4,
                    }}
                  >+ 补球</button>
                </div>
              </div>
              {/* 已消耗历史（有暂停记录时显示） */}
              {pauseConsumedTotal > 0 && (
                <div style={{
                  marginBottom: 6, padding: '4px 8px', borderRadius: 6,
                  background: 'rgba(200,131,10,0.08)',
                  border: '1px solid rgba(200,131,10,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: '#C8830A' }}>已消耗（{pauseSegments.length}段）</span>
                  <span className="font-subtitle" style={{ fontSize: 13, fontWeight: 900, color: '#C8830A' }}>
                    {pauseConsumedTotal}个
                  </span>
                </div>
              )}

              {/* simple 模式：大数字 */}
              {ballMode === 'simple' && (
                <>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, marginBottom: 6 }}>
                    <span className="font-subtitle" style={{
                      fontSize: 34, fontWeight: 900, lineHeight: 1,
                      color: '#2B2A2E',
                    }}>{task.ballStart}</span>
                    {restockTotal > 0 && (
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--success)', marginLeft: 4 }}>
                        +{restockTotal}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.7 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span>开始球数</span>
                      <button
                        onClick={() => { setEditStartInput(String(task.ballStart ?? '')); setShowEditStart(true); }}
                        style={{
                          fontSize: 9, padding: '1px 4px', borderRadius: 4,
                          border: '1px solid rgba(91,156,246,0.5)',
                          background: 'rgba(91,156,246,0.08)',
                          color: '#5B9CF6', cursor: 'pointer',
                          fontFamily: 'var(--font-body)', lineHeight: 1.4, fontWeight: 700,
                        }}
                      >✎ 改</button>
                    </div>
                    {ballRestocks.length > 0 && (
                      <div style={{ color: 'var(--success)', fontWeight: 700 }}>
                        补球 {ballRestocks.length} 次
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* byType 模式：三行小字 */}
              {ballMode === 'byType' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                  {[
                    { label: '高', key: 'adv', color: '#C8830A' },
                    { label: '赛', key: 'sea', color: '#7E57C2' },
                    { label: '属', key: 'att', color: '#5B9CF6' },
                  ].map(({ label, key, color }) => {
                    const sv = bst[key] || 0;
                    const rv = restByType[key] || 0;
                    return (
                      <div key={key} style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                        <span style={{ fontSize: 10, fontWeight: 800, color, minWidth: 14 }}>{label}</span>
                        <span className="font-subtitle" style={{ fontSize: 16, fontWeight: 900, color: '#2B2A2E', lineHeight: 1 }}>{sv}</span>
                        {rv > 0 && <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--success)' }}>+{rv}</span>}
                      </div>
                    );
                  })}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
                    {ballRestocks.length > 0 && (
                      <span style={{ fontSize: 10, color: 'var(--success)', fontWeight: 700 }}>补球 {ballRestocks.length} 次</span>
                    )}
                    <button
                      onClick={() => {
                        setEditStartAdv(String(task.ballStartByType?.adv ?? ''));
                        setEditStartSea(String(task.ballStartByType?.sea ?? ''));
                        setEditStartAtt(String(task.ballStartByType?.att ?? ''));
                        setShowEditStart(true);
                      }}
                      style={{
                        fontSize: 9, padding: '1px 4px', borderRadius: 4,
                        border: '1px solid rgba(91,156,246,0.5)',
                        background: 'rgba(91,156,246,0.08)',
                        color: '#5B9CF6', cursor: 'pointer',
                        fontFamily: 'var(--font-body)', lineHeight: 1.4, fontWeight: 700,
                      }}
                    >✎ 改起始</button>
                  </div>
                </div>
              )}

              {/* 撤销最近补球（有补球记录时） */}
              {ballRestocks.length > 0 && (
                <button
                  onClick={() => dispatch({ type: 'UNDO_BALL_RESTOCK', planId })}
                  style={{
                    marginTop: 8, alignSelf: 'flex-start',
                    fontSize: 9, fontWeight: 700, color: 'var(--text-muted)',
                    background: 'none', border: '1px solid var(--divider)',
                    borderRadius: 5, padding: '2px 7px', cursor: 'pointer',
                    fontFamily: 'var(--font-body)',
                  }}
                >↩ 撤销</button>
              )}
            </>
          ) : (
            /* 未配置球数：显示虚线入口卡 */
            <div
              onClick={() => setShowBallSetup(true)}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', gap: 3, padding: '4px 0',
              }}
            >
              <div style={{ fontSize: 16, lineHeight: 1 }}>⚙️</div>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)' }}>咕噜球</div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', opacity: 0.7, textAlign: 'center', lineHeight: 1.4 }}>
                点击补填<br />或返回配置
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 三池实时进度仪表盘 ── */}
      {(() => {
        const attrId = getPlanAttrId(plan);
        const familyPool = computeFamilyPool(task, plan);
        const worldPool = poolCounts?.worldPool || 0;
        const attrPoolCount = attrId ? ((poolCounts?.attrPools || {})[attrId] || 0) : 0;

        const FAMILY_LIMIT = 80;
        const ATTR_LIMIT = 80;
        const WORLD_LIMIT = 80;

        // 判断当前方案是否有家族池保底：
        // spiritA 在任意方案的 shinies 列表中，说明系统登记了该精灵的家族池
        const spiritAName = plan.spiritA || '';
        const spiritBName = plan.spiritB || '';
        const hasFamilyPool = spiritAName
          ? (ALL_SHINIES.includes(spiritAName) || ALL_SHINIES.some(k => k.includes(spiritAName) || spiritAName.includes(k)))
          : plan.shinies?.length > 0;
        // spiritB 同理（若存在）
        const spiritBInPool = spiritBName
          ? (ALL_SHINIES.includes(spiritBName) || ALL_SHINIES.some(k => k.includes(spiritBName) || spiritBName.includes(k)))
          : false;
        const showFamilyPool = hasFamilyPool || spiritBInPool || plan.shinies?.length > 0;

        // 无家族池时：根据果实属性判断精灵的出货池归属
        // fruitAttrId 有值 → 单果/同属混刷 → 精灵属性若与果实属性一致则归属系池，否则世界池
        // fruitAttrId 无值 → 跨属混刷 → 一律世界池
        const { fruitAttrId } = analyzePlanFruits(plan);
        // 查询精灵A的第一属性（用于判断归属）
        const spiritAttr1 = (() => {
          const name = spiritAName;
          if (!name) return null;
          // 精确匹配
          if (SPIRIT_ATTR1[name]) return SPIRIT_ATTR1[name];
          // 模糊匹配
          for (const [k, v] of Object.entries(SPIRIT_ATTR1)) {
            if (k.includes(name) || name.includes(k)) return v;
          }
          return null;
        })();
        // 无家族池时，判断出货落入属系池还是世界池
        // fruitAttrId 存在且与精灵属性一致 → 属系池；否则 → 世界池
        const noFamilyGoesAttr = !showFamilyPool && fruitAttrId && spiritAttr1 === fruitAttrId;
        const noFamilyGoesWorld = !showFamilyPool && !noFamilyGoesAttr;
        // 属系池标签（用于无家族池场景提示）
        const noFamilyAttrLabel = fruitAttrId ? (ATTR_LABEL[fruitAttrId] || fruitAttrId) : null;

        // 单条进度行（内联组件）
        const MiniPoolRow = ({ dotColor, label, count, limit }) => {
          const pct = Math.min(count / limit, 1);
          const isHigh = pct >= 0.85;
          const barColor = isHigh ? '#C8351A' : dotColor;
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, flex: 1 }}>
              <span style={{
                width: 7, height: 7, borderRadius: '50%',
                background: dotColor, flexShrink: 0, display: 'inline-block',
              }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', flexShrink: 0, minWidth: 42 }}>{label}</span>
              <div style={{ flex: 1, height: 5, borderRadius: 3, background: 'rgba(103,93,83,0.15)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 3,
                  width: `${pct * 100}%`,
                  background: barColor,
                  transition: 'width 0.4s ease',
                }} />
              </div>
              <span style={{
                fontSize: 11, fontWeight: 900, fontFamily: 'var(--font-display)',
                color: isHigh ? '#C8351A' : dotColor,
                flexShrink: 0, minWidth: 30, textAlign: 'right',
              }}>
                {count}<span style={{ fontSize: 9, fontWeight: 400, color: 'var(--text-muted)' }}>/{limit}</span>
              </span>
            </div>
          );
        };

        return (
          <div style={{
            margin: '10px 16px 0',
            borderRadius: 12,
            border: '1.5px solid rgba(103,93,83,0.18)',
            background: '#FBF7EC',
            padding: '10px 14px 10px',
          }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: 0.5, marginBottom: 8 }}>
              三池实时进度
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {showFamilyPool ? (
                <MiniPoolRow
                  dotColor="#C8830A"
                  label="家族池"
                  count={familyPool}
                  limit={FAMILY_LIMIT}
                />
              ) : (
                /* 无家族池：根据属性精确判断归入属系池或世界池 */
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{
                    width: 7, height: 7, borderRadius: '50%',
                    background: 'rgba(103,93,83,0.25)', flexShrink: 0, display: 'inline-block',
                  }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(103,93,83,0.4)', flexShrink: 0, minWidth: 42 }}>家族池</span>
                  <span style={{ fontSize: 9, color: 'rgba(103,93,83,0.45)', fontStyle: 'italic' }}>
                    无保底 · 出货计入
                    {noFamilyGoesAttr
                      ? <span style={{ color: '#C8830A', fontStyle: 'normal', fontWeight: 700 }}> {noFamilyAttrLabel}池</span>
                      : <span style={{ color: '#7E57C2', fontStyle: 'normal', fontWeight: 700 }}> 世界池</span>
                    }
                  </span>
                </div>
              )}
              {attrId && (
                <MiniPoolRow
                  dotColor={plan.color || '#E8A020'}
                  label={`${ATTR_LABEL[attrId] || attrId}池`}
                  count={attrPoolCount}
                  limit={ATTR_LIMIT}
                />
              )}
              <MiniPoolRow
                dotColor="#7E57C2"
                label="世界池"
                count={worldPool}
                limit={WORLD_LIMIT}
              />
            </div>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 7, lineHeight: 1.5 }}>
              {showFamilyPool
                ? '家族池出货后重置 · 系别池 / 世界池全局累计不清空'
                : noFamilyGoesAttr
                  ? `出货计入${noFamilyAttrLabel}池（全局累计）· 世界池同步累计`
                  : '出货计入世界池（全局累计）· 系别池不受影响'}
            </div>
          </div>
        );
      })()}

      {/* 三池机制说明 */}
      {(() => {
        // 判断是否有家族池（与仪表盘保持一致，重新计算）
        const spiritAName = plan.spiritA || '';
        const spiritBName = plan.spiritB || '';
        const hasFamilyPoolCard = spiritAName
          ? (ALL_SHINIES.includes(spiritAName) || ALL_SHINIES.some(k => k.includes(spiritAName) || spiritAName.includes(k)))
          : plan.shinies?.length > 0;
        const spiritBInPoolCard = spiritBName
          ? (ALL_SHINIES.includes(spiritBName) || ALL_SHINIES.some(k => k.includes(spiritBName) || spiritBName.includes(k)))
          : false;
        const showFamilyPoolCard = hasFamilyPoolCard || spiritBInPoolCard || plan.shinies?.length > 0;

        // 无家族池时：判断精灵属性 vs 果实属性，确定出货归属
        const { fruitAttrId: fruitAttrIdCard } = analyzePlanFruits(plan);
        const spiritAttr1Card = (() => {
          const name = spiritAName;
          if (!name) return null;
          if (SPIRIT_ATTR1[name]) return SPIRIT_ATTR1[name];
          for (const [k, v] of Object.entries(SPIRIT_ATTR1)) {
            if (k.includes(name) || name.includes(k)) return v;
          }
          return null;
        })();
        const noFamilyGoesAttrCard = !showFamilyPoolCard && fruitAttrIdCard && spiritAttr1Card === fruitAttrIdCard;
        const noFamilyAttrLabelCard = fruitAttrIdCard ? (ATTR_LABEL[fruitAttrIdCard] || fruitAttrIdCard) : null;

        const familyCardConfig = showFamilyPoolCard
          ? {
              dot: '#C8830A', bg: '#FFF3CC', border: '#C8A020',
              label: '家族池',
              rule: `放置${plan.spiritA || '对应精灵'}${plan.spiritB ? `或${plan.spiritB}` : ''}的果实，80次必出其异色`,
              note: '出货后属性池&世界池计数不重置，可继续累积',
            }
          : {
              dot: 'rgba(103,93,83,0.3)', bg: 'rgba(103,93,83,0.04)', border: 'rgba(103,93,83,0.12)',
              label: '家族池',
              rule: `${plan.spiritA || '当前精灵'}不在任意方案家族列表中，无家族池保底`,
              note: noFamilyGoesAttrCard
                ? `出货将计入${noFamilyAttrLabelCard}池（精灵属性与果实属性相符）`
                : '出货将计入世界池（精灵属性与果实属性不符或跨属混刷）',
            };

        return (
          <div style={{
            margin: '4px 16px 16px',
            borderRadius: 12,
            border: '1.5px solid rgba(103,93,83,0.18)',
            background: '#F8F4EC',
            overflow: 'hidden',
          }}>
            {/* 标题栏 */}
            <div style={{
              background: '#2B2A2E',
              padding: '8px 14px',
              fontSize: 11, fontWeight: 800, color: '#FBC839',
              letterSpacing: 1, fontFamily: 'var(--font-display)',
            }}>
              📖 官方三池机制说明
            </div>
            {/* 内容 */}
            <div style={{ padding: '10px 14px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                familyCardConfig,
                {
                  dot: '#E8A020',
                  bg: '#FFF8E8',
                  border: '#E8C060',
                  label: '属性池',
                  rule: `同属性其他精灵，80次必出`,
                  note: '出货后家族池&世界池计数不重置，可继续累积',
                },
                {
                  dot: '#7E57C2',
                  bg: '#F0EAFF',
                  border: 'rgba(126,87,194,0.3)',
                  label: '世界池',
                  rule: '所有其他精灵，80次必出',
                  note: '出货后家族池&属性池计数不重置，可继续累积',
                },
              ].map(({ dot, bg, border, label, rule, note }) => (
                <div key={label} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 9,
                  padding: '8px 10px', borderRadius: 8,
                  background: bg, border: `1px solid ${border}`,
                }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: dot, flexShrink: 0, marginTop: 4,
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: showFamilyPoolCard || label !== '家族池' ? '#2B2A2E' : 'rgba(103,93,83,0.5)', marginBottom: 2 }}>
                      {label}
                    </div>
                    <div style={{ fontSize: 10, color: showFamilyPoolCard || label !== '家族池' ? 'var(--text-light)' : 'rgba(103,93,83,0.4)', lineHeight: 1.6 }}>
                      {rule}
                    </div>
                    <div style={{ fontSize: 10, color: dot, fontWeight: 700, marginTop: 2 }}>
                      ↳ {note}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {showResult && (
        <ResultModal onResult={handleResult} onClose={() => setShowResult(false)} hasTabBar={false} />
      )}
      {showBreakSpiritSelect && pendingResult && (
        <BreakSpiritModal
          plan={plan}
          result={pendingResult}
          onSelect={handleBreakSpiritSelect}
          onClose={() => { setShowBreakSpiritSelect(false); setPendingResult(null); }}
          hasTabBar={false}
        />
      )}
      {showShinySelect && (
        <ShinySelectModal plan={plan} onSelect={handleShinySelect} onClose={() => setShowShinySelect(false)} hasTabBar={false} />
      )}

      {/* 删除确认弹窗 */}
      {showAbandonConfirm && (
        <div
          onClick={() => setShowAbandonConfirm(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 300,
            background: 'rgba(43,42,46,0.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 32px',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 320,
              background: '#FBF7EC',
              borderRadius: 16,
              padding: '24px 20px 20px',
              boxShadow: '0 8px 32px rgba(43,42,46,0.22)',
            }}
          >
            {/* 图标 + 标题 */}
            <div style={{ textAlign: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: 28, lineHeight: 1, marginBottom: 8 }}>🗑️</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--danger)', fontFamily: 'var(--font-display)' }}>
                确认删除刷取记录？
              </div>
            </div>
            {/* 提示文案 */}
            <div style={{
              fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.7,
              textAlign: 'center', marginBottom: 20,
              padding: '10px 8px',
              background: 'rgba(200,53,26,0.06)',
              borderRadius: 8,
              border: '1px solid rgba(200,53,26,0.15)',
            }}>
              删除后该记录<strong style={{ color: 'var(--danger)' }}>无法找回</strong>，<br />
              包括已记录的触发污染次数和球数数据。
            </div>
            {/* 按钮组 */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowAbandonConfirm(false)}
                style={{
                  flex: 1, padding: '12px 0',
                  borderRadius: 'var(--radius-sm)',
                  border: '1.5px solid var(--divider)',
                  background: 'var(--card-inner)',
                  color: 'var(--text-muted)',
                  fontWeight: 700, fontSize: 14,
                  fontFamily: 'var(--font-body)', cursor: 'pointer',
                }}
              >再想想</button>
              <button
                onClick={handleAbandonConfirmed}
                style={{
                  flex: 1, padding: '12px 0',
                  borderRadius: 'var(--radius-sm)',
                  border: '2px solid var(--danger)',
                  background: 'var(--danger)',
                  color: '#fff',
                  fontWeight: 800, fontSize: 14,
                  fontFamily: 'var(--font-body)', cursor: 'pointer',
                }}
              >确认删除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
