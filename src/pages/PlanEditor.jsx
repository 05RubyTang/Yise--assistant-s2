import { useState } from 'react';
import { useStore } from '../store';
import { PLANS, getShinisByAttr } from '../data/plans';
import { getAllEntries, ATTR_CONFIG } from '../data/fruitGuide';
import PlanIcon from '../components/PlanIcon';
import SpiritAvatar from '../components/SpiritAvatar';
import FruitTag from '../components/FruitTag';

// 属性 id → 中文名映射（与 ATTR_OPTIONS 保持一致）
const ATTR_ID_TO_LABEL = {
  fire: '火系', ice: '冰系', electric: '电系', phantom: '幻系',
  grass: '草系', evil: '恶系', ghost: '幽系', mech: '机械系', light: '光系',
};

// 微型属性徽章（用于果实芯片内）
function TinyAttrBadge({ attr }) {
  const cfg = ATTR_CONFIG[attr] || { color: '#A09080', bg: '#F0EAE0' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 2,
      fontSize: 9, fontWeight: 800,
      color: cfg.color, background: cfg.bg,
      border: `1px solid ${cfg.color}40`,
      borderRadius: 4, padding: '0 4px',
      whiteSpace: 'nowrap', lineHeight: '14px',
    }}>
      {cfg.icon && (
        <img src={cfg.icon} alt={attr} width={9} height={9}
          style={{ objectFit: 'contain', verticalAlign: 'middle' }} />
      )}
      {attr}
    </span>
  );
}

// 已拥有果实快选芯片（按当前属性系别过滤）
function OwnedFruitPicker({ ownedFruits, onSelect, currentValue, attrLabel, fruitAttrsMap }) {
  // 只展示第一属性匹配当前选择系别的果实
  const filtered = (ownedFruits || []).filter(fruit => {
    const attrs = fruitAttrsMap[fruit];
    return attrs && attrs[0] === attrLabel;
  });
  if (filtered.length === 0) return null;
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>
        已拥有果实（点击填入）
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
        {filtered.map(fruit => {
          const isActive = currentValue === fruit;
          const attrs = fruitAttrsMap[fruit] || [];
          return (
            <button
              key={fruit}
              onClick={() => onSelect(fruit)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '3px 8px 3px 8px', borderRadius: 8, cursor: 'pointer',
                fontSize: 11, fontWeight: 700,
                border: isActive ? '1.5px solid #4B9C46' : '1.5px solid var(--divider)',
                background: isActive ? 'rgba(75,156,70,0.1)' : 'var(--card-inner)',
                color: isActive ? '#4B9C46' : 'var(--text-light)',
                fontFamily: 'var(--font-body)',
                transition: 'all 0.15s',
              }}
            >
              {isActive && <span style={{ fontSize: 10 }}>✓</span>}
              <FruitTag name={fruit} size={16} showName={false} />
              <span>{fruit}</span>
              <span style={{ display: 'inline-flex', gap: 3 }}>
                {attrs.map(a => <TinyAttrBadge key={a} attr={a} />)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// 可选的属性系别（不含水系，水系只能奇遇单抓）
const ATTR_OPTIONS = [
  { id: 'fire',     label: '火系',   icon: '🔥' },
  { id: 'ice',      label: '冰系',   icon: '❄️' },
  { id: 'electric', label: '电系',   icon: '⚡' },
  { id: 'phantom',  label: '幻系',   icon: '🔮' },
  { id: 'grass',    label: '草系',   icon: '🌿' },
  { id: 'evil',     label: '恶系',   icon: '😈' },
  { id: 'ghost',    label: '幽系',   icon: '👻' },
  { id: 'mech',     label: '机械系', icon: '⚙️' },
  { id: 'light',    label: '光系',   icon: '✨' },
];

export default function PlanEditor({ basePlanId, userPlanId, goBack }) {
  const { state, dispatch } = useStore();

  // 判断是编辑已有方案 or 基于默认方案新建
  const existingUserPlan = userPlanId
    ? (state.userPlanConfig || []).find(p => p.id === userPlanId)
    : null;
  const basePlan = PLANS.find(p => p.id === (basePlanId || existingUserPlan?.attrId));

  // 初始值
  const initAttrId = existingUserPlan?.attrId || basePlanId || 'fire';
  const initLabel  = existingUserPlan?.label  || '';
  const initFruitA = existingUserPlan?.fruitA || basePlan?.fruitA || '';
  const initSpiritA= existingUserPlan?.spiritA|| basePlan?.spiritA|| '';
  const initFruitB = existingUserPlan?.fruitB || basePlan?.fruitB || '';
  const initSpiritB= existingUserPlan?.spiritB|| basePlan?.spiritB|| '';

  const [attrId,  setAttrId]  = useState(initAttrId);
  const [label,   setLabel]   = useState(initLabel);
  const [fruitA,  setFruitA]  = useState(initFruitA);
  const [spiritA, setSpiritA] = useState(initSpiritA);
  const [fruitB,  setFruitB]  = useState(initFruitB);
  const [spiritB, setSpiritB] = useState(initSpiritB);
  const [showDelete, setShowDelete] = useState(false);
  const [saved, setSaved] = useState(false);

  const currentAttr = ATTR_OPTIONS.find(a => a.id === attrId);
  const currentBasePlan = PLANS.find(p => p.id === attrId);

  // 已拥有果实列表（从 store 读取，并补全对应的精灵名）
  const rawOwned = state.ownedFruits || [];
  // 构建 fruit → spirit / attrs 映射
  const fruitSpiritMap = {};
  const fruitAttrsMap = {};
  getAllEntries().forEach(e => {
    fruitSpiritMap[e.fruit] = e.spirit;
    fruitAttrsMap[e.fruit] = e.attrs || [];
  });
  const ownedFruits = rawOwned.filter(f => fruitSpiritMap[f]); // 只展示攻略库里有的
  const currentAttrLabel = ATTR_ID_TO_LABEL[attrId] || '';

  // 根据当前选择的属性，列出可产出的异色精灵
  const possibleShinies = getShinisByAttr(attrId);

  const isEditing = !!existingUserPlan;
  const canSave = fruitA.trim() && spiritA.trim();

  const handleSave = () => {
    const plan = {
      id: existingUserPlan?.id || undefined,
      attrId,
      label: label.trim() || `${currentAttr?.label}方案`,
      fruitA:  fruitA.trim(),
      spiritA: spiritA.trim(),
      fruitB:  fruitB.trim()  || null,
      spiritB: spiritB.trim() || null,
    };
    dispatch({ type: 'SAVE_USER_PLAN', plan });
    setSaved(true);
    setTimeout(() => { setSaved(false); goBack(); }, 900);
  };

  const handleDelete = () => {
    dispatch({ type: 'DELETE_USER_PLAN', id: userPlanId });
    goBack();
  };

  // 切换属性时，清空精灵/果实输入（已有方案保留用户输入，仅新建时预填默认）
  const handleAttrChange = (id) => {
    setAttrId(id);
    if (!isEditing) {
      const base = PLANS.find(p => p.id === id);
      setFruitA(base?.fruitA || '');
      setSpiritA(base?.spiritA || '');
      setFruitB(base?.fruitB || '');
      setSpiritB(base?.spiritB || '');
    }
  };

  return (
    <div style={{ paddingBottom: 32 }}>
      {/* 顶部 */}
      <div className="page-header">
        <button className="back-btn" onClick={goBack}><img src={`${import.meta.env.BASE_URL}back-icon.webp`} alt="返回" /></button>
        <span className="page-header-title">
          {isEditing ? '编辑方案' : '新建方案'}
        </span>
        {isEditing && (
          <button
            onClick={() => setShowDelete(v => !v)}
            style={{
              marginLeft: 'auto', fontSize: 11, fontWeight: 700,
              padding: '4px 10px', border: '1px solid rgba(200,53,26,0.3)',
              borderRadius: 6, background: showDelete ? '#FFF2EF' : 'var(--card-inner)',
              color: '#C8351A', cursor: 'pointer', fontFamily: 'var(--font-body)',
            }}
          >🗑 删除</button>
        )}
      </div>

      {/* 删除确认条 */}
      {showDelete && (
        <div style={{
          margin: '0 16px 8px', padding: '10px 14px', borderRadius: 10,
          background: '#FFF2EF', border: '1px solid rgba(200,53,26,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: 12, color: '#C8351A', fontWeight: 700 }}>
            确认删除这个方案？
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={handleDelete} style={{
              padding: '4px 14px', borderRadius: 6,
              border: '1.5px solid #C8351A', background: '#C8351A', color: '#fff',
              fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'var(--font-body)',
            }}>确认删除</button>
            <button onClick={() => setShowDelete(false)} style={{
              padding: '4px 10px', borderRadius: 6,
              border: '1px solid rgba(103,93,83,0.25)', background: 'var(--card-inner)',
              color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)',
            }}>取消</button>
          </div>
        </div>
      )}

      {/* ── 属性选择 ── */}
      <div className="card animate-in">
        <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 10 }}>选择属性系别</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {ATTR_OPTIONS.map(attr => {
            const plan = PLANS.find(p => p.id === attr.id);
            const isSelected = attrId === attr.id;
            return (
              <button
                key={attr.id}
                onClick={() => handleAttrChange(attr.id)}
                style={{
                  padding: '8px 4px', borderRadius: 10, cursor: 'pointer',
                  border: isSelected ? '2px solid #C8830A' : '1.5px solid var(--divider)',
                  background: isSelected ? '#FFF9E0' : 'var(--card-inner)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  fontFamily: 'var(--font-body)',
                  boxShadow: isSelected ? '0 2px 0 #C8A020' : 'none',
                  transition: 'all 0.15s',
                }}
              >
                {plan
                  ? <PlanIcon plan={plan} size={22} />
                  : <span style={{ fontSize: 20, lineHeight: 1 }}>{attr.icon}</span>
                }
                <span style={{
                  fontSize: 11, fontWeight: isSelected ? 800 : 600,
                  color: isSelected ? '#C8830A' : 'var(--text-light)',
                }}>{attr.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 方案名称（选填） ── */}
      <div className="card animate-in" style={{ animationDelay: '0.04s' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 800 }}>方案名称</span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>选填</span>
        </div>
        <input
          className="input-field"
          value={label}
          onChange={e => setLabel(e.target.value)}
          maxLength={16}
          placeholder={`推荐填写庇护所名称，如「星霜崖」`}
        />
      </div>

      {/* ── 精灵 & 果实配置 ── */}
      <div className="card animate-in" style={{ animationDelay: '0.06s' }}>
        <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 4 }}>精灵 & 果实配置</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.6 }}>
          两种果实的精灵都要是{currentAttr?.label}精灵，才能有效攒属性池。
        </div>

        {/* 精灵 A */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-light)', marginBottom: 6 }}>
            精灵 A（必填）
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>精灵名</div>
              <input className="input-field" value={spiritA} onChange={e => setSpiritA(e.target.value)}
                placeholder="如：治愈兔" />
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>果实名</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input className="input-field" value={fruitA} onChange={e => setFruitA(e.target.value)}
                  placeholder="如：治愈兔果实" style={{ flex: 1 }} />
                {fruitA.trim() && (
                  <FruitTag name={fruitA.trim()} size={24} showName={false} />
                )}
              </div>
            </div>
          </div>
          {/* 已拥有果实快选（按当前属性系别过滤） */}
          <OwnedFruitPicker
            ownedFruits={ownedFruits}
            currentValue={fruitA}
            attrLabel={currentAttrLabel}
            fruitAttrsMap={fruitAttrsMap}
            onSelect={(fruit) => {
              setFruitA(fruit);
              setSpiritA(fruitSpiritMap[fruit] || spiritA);
            }}
          />
        </div>

        {/* 精灵 B */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-light)' }}>
              精灵 B
            </div>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>选填（单放可不填）</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>精灵名</div>
              <input className="input-field" value={spiritB} onChange={e => setSpiritB(e.target.value)}
                placeholder="如：火红尾" />
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>果实名</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input className="input-field" value={fruitB} onChange={e => setFruitB(e.target.value)}
                  placeholder="如：火红尾果实" style={{ flex: 1 }} />
                {fruitB.trim() && (
                  <FruitTag name={fruitB.trim()} size={24} showName={false} />
                )}
              </div>
            </div>
          </div>
          {/* 已拥有果实快选（按属性过滤，排除已选给 A 的） */}
          <OwnedFruitPicker
            ownedFruits={ownedFruits.filter(f => f !== fruitA)}
            currentValue={fruitB}
            attrLabel={currentAttrLabel}
            fruitAttrsMap={fruitAttrsMap}
            onSelect={(fruit) => {
              setFruitB(fruit);
              setSpiritB(fruitSpiritMap[fruit] || spiritB);
            }}
          />
        </div>
      </div>

      {/* ── 该方案可抓异色精灵 ── */}
      <div className="card animate-in" style={{ animationDelay: '0.08s' }}>
        <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 4 }}>该方案可抓异色精灵</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.6 }}>
          以下精灵的第一属性均为{currentAttr?.label}，使用{currentAttr?.label}果实攒系别池可随机产出。
        </div>
        {possibleShinies.length > 0 ? (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {possibleShinies.map(name => (
              <SpiritAvatar
                key={name}
                name={name}
                obtained={state.spirits[name]?.obtained}
                size={44}
              />
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
            暂无对应精灵数据
          </div>
        )}
      </div>

      {/* ── 保存按钮 ── */}
      <button
        className="btn btn-primary animate-in"
        style={{ animationDelay: '0.1s', opacity: canSave ? 1 : 0.45 }}
        disabled={!canSave}
        onClick={handleSave}
      >
        {saved ? '✓ 已保存' : (isEditing ? '保存修改' : '保存方案')}
      </button>
    </div>
  );
}
