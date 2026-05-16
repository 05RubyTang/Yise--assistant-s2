import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../store';
import { PLANS, getShinisByAttr, FRUIT_ATTR, getPlanFruitsArray } from '../data/plans';
import { getAllEntries, ATTR_CONFIG } from '../data/fruitGuide';
import PlanIcon from '../components/PlanIcon';
import SpiritAvatar from '../components/SpiritAvatar';
import FruitTag from '../components/FruitTag';

// 属性 id → 中文名映射（与 ATTR_OPTIONS 保持一致）
const ATTR_ID_TO_LABEL = {
  fire: '火系', ice: '冰系', electric: '电系', phantom: '幻系',
  grass: '草系', evil: '恶系', ghost: '幽系', mech: '机械系', light: '光系',
};

// ── 所有可抓异色精灵（跨全属系，去重，按属系分组）────────────────────────────
// 遍历内置属系方案，提取 shinies，首次出现优先归入该属系组
const SHINY_ATTR_ORDER = ['fire','ice','electric','phantom','grass','evil','ghost','mech','light'];
const ALL_SHINIES_GROUPED = (() => {
  const seen = new Set();
  const groups = SHINY_ATTR_ORDER.map(id => {
    const plan = PLANS.find(p => p.id === id);
    const items = (plan?.shinies || []).filter(n => {
      if (seen.has(n)) return false;
      seen.add(n);
      return true;
    });
    return { id, label: ATTR_ID_TO_LABEL[id] || id, items };
  }).filter(g => g.items.length > 0);
  // 收录未被归入属系的残余精灵（世界池专有等）
  const extra = [];
  PLANS.forEach(p => {
    (p.shinies || []).forEach(n => {
      if (!seen.has(n)) { seen.add(n); extra.push(n); }
    });
  });
  if (extra.length > 0) groups.push({ id: 'world', label: '其他', items: extra });
  return groups;
})();

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
function OwnedFruitPicker({ ownedFruits, onSelect, currentValue, attrLabel, fruitAttrsMap, excludeFruits = [] }) {
  // 只展示第一属性匹配当前选择系别的果实，且排除已被其他槽选中的
  const filtered = (ownedFruits || []).filter(fruit => {
    if (excludeFruits.includes(fruit)) return false;
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

// 最大果实槽位数
const MAX_FRUITS = 6;

// 果实槽序号标签
const SLOT_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];

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

  // 初始化 fruits 数组（兼容新旧两种格式）
  const initFruits = useMemo(() => {
    if (existingUserPlan) {
      // 先尝试新格式 fruits[]
      const arr = getPlanFruitsArray(existingUserPlan);
      if (arr.length > 0) return arr.map(f => ({ fruit: f.fruit || '', spirit: f.spirit || '' }));
    }
    if (basePlan) {
      const arr = getPlanFruitsArray(basePlan);
      if (arr.length > 0) return arr.map(f => ({ fruit: f.fruit || '', spirit: f.spirit || '' }));
    }
    // 默认2槽
    return [{ fruit: '', spirit: '' }, { fruit: '', spirit: '' }];
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [attrId,  setAttrId]  = useState(initAttrId);
  const [label,   setLabel]   = useState(initLabel);
  // fruits 是数组：[{ fruit, spirit }, ...]，最多 6 个
  const [fruits,  setFruits]  = useState(initFruits);
  const [showDelete, setShowDelete] = useState(false);
  const [saved, setSaved] = useState(false);

  // 用户自选「可抓异色精灵」（初始：编辑时继承已有选择，新建时全选）
  const initShinies = useMemo(() => {
    if (existingUserPlan?.shinies?.length > 0) return existingUserPlan.shinies;
    return getShinisByAttr(initAttrId);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const [selectedShinies, setSelectedShinies] = useState(initShinies);

  // 弹窗状态：pendingShinies 是弹窗内的临时选中（点「确定」才同步到 selectedShinies）
  const [showShinyModal, setShowShinyModal] = useState(false);
  const [pendingShinies, setPendingShinies] = useState([]);

  const openShinyModal = () => {
    setPendingShinies([...selectedShinies]);
    setShowShinyModal(true);
  };
  const confirmShinyModal = () => {
    setSelectedShinies([...pendingShinies]);
    setShowShinyModal(false);
  };
  const togglePending = (name) => {
    setPendingShinies(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  const fruitCount = fruits.length;

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

  const isEditing = !!existingUserPlan;
  // 至少 fruitA 和 spiritA 必填
  const canSave = fruits[0]?.fruit?.trim() && fruits[0]?.spirit?.trim();

  // 实时池类型推断
  const poolPreview = useMemo(() => {
    const validFruits = fruits.filter(f => f.fruit?.trim());
    if (validFruits.length === 0) return null;
    const attrs = validFruits.map(f => FRUIT_ATTR[f.fruit.trim()] || null);
    const knownAttrs = attrs.filter(Boolean);
    if (knownAttrs.length === 0) return { type: 'unknown', label: '属系待识别', color: '#A09080', bg: 'rgba(160,144,128,0.1)' };
    if (knownAttrs.length < validFruits.length) {
      // 有些果实识别不到属系
      return { type: 'partial', label: '部分果实属系未识别', color: '#C8830A', bg: 'rgba(200,131,10,0.1)' };
    }
    const allSame = knownAttrs.every(a => a === knownAttrs[0]);
    if (validFruits.length === 1) {
      return { type: 'family', label: '家族池 + 属系池', color: '#4B9C46', bg: 'rgba(75,156,70,0.1)' };
    }
    if (allSame) {
      return { type: 'attr', label: '属系池（同属混刷）', color: '#5B9CF6', bg: 'rgba(91,156,246,0.1)' };
    }
    return { type: 'world', label: '世界池（跨属混刷）', color: '#7E57C2', bg: 'rgba(126,87,194,0.1)' };
  }, [fruits]);

  // ── 槽位操作辅助 ────────────────────────────────────────────────────────────
  const updateSlot = (idx, field, value) => {
    setFruits(prev => prev.map((f, i) => i === idx ? { ...f, [field]: value } : f));
  };

  // 设置果实数量（增减槽位）
  const setFruitCount = (count) => {
    setFruits(prev => {
      if (count > prev.length) {
        // 增加槽位
        return [...prev, ...Array(count - prev.length).fill({ fruit: '', spirit: '' })];
      } else {
        // 减少槽位（截断）
        return prev.slice(0, count);
      }
    });
  };

  const handleSave = () => {
    // 过滤掉空槽
    const validFruits = fruits.filter(f => f.fruit?.trim() || f.spirit?.trim());
    const plan = {
      id: existingUserPlan?.id || undefined,
      attrId,
      label: label.trim() || `${currentAttr?.label}方案`,
      // 新字段：fruits 数组
      fruits: validFruits.map(f => ({
        fruit:  f.fruit?.trim()  || '',
        spirit: f.spirit?.trim() || '',
      })),
      // 兼容旧字段（取前两槽，供 Checklist / Recorder 等老代码读取）
      fruitA:  validFruits[0]?.fruit?.trim()  || '',
      spiritA: validFruits[0]?.spirit?.trim() || '',
      fruitB:  validFruits[1]?.fruit?.trim()  || null,
      spiritB: validFruits[1]?.spirit?.trim() || null,
      // 用户自选可抓异色精灵
      shinies: selectedShinies,
    };
    dispatch({ type: 'SAVE_USER_PLAN', plan });
    setSaved(true);
    setTimeout(() => { setSaved(false); goBack(); }, 900);
  };

  const handleDelete = () => {
    dispatch({ type: 'DELETE_USER_PLAN', id: userPlanId });
    goBack();
  };

  // 切换属性时，预填默认值 + 重置 shinies 全选
  const handleAttrChange = (id) => {
    setAttrId(id);
    // 每次切换属性，shinies 重置为新属系全选
    setSelectedShinies(getShinisByAttr(id));
    if (!isEditing) {
      const base = PLANS.find(p => p.id === id);
      if (base) {
        const arr = getPlanFruitsArray(base);
        if (arr.length > 0) {
          setFruits(arr.map(f => ({ fruit: f.fruit || '', spirit: f.spirit || '' })));
        } else {
          setFruits([{ fruit: '', spirit: '' }, { fruit: '', spirit: '' }]);
        }
      }
    }
  };

  // 当前所有已选果实名（用于排除 OwnedFruitPicker 中的重复项）
  const allSelectedFruits = fruits.map(f => f.fruit?.trim()).filter(Boolean);

  return (
    <>
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
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10, lineHeight: 1.6 }}>
          所有果实的精灵都是{currentAttr?.label}精灵，才能有效攒属系池；属系不同则进世界池。
        </div>

        {/* ── 果实数量选择 ── */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-light)', marginBottom: 8 }}>
            果实槽位数量
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {Array.from({ length: MAX_FRUITS }, (_, i) => i + 1).map(n => {
              const isActive = fruitCount === n;
              return (
                <button
                  key={n}
                  onClick={() => setFruitCount(n)}
                  style={{
                    minWidth: 40, padding: '5px 10px', borderRadius: 8,
                    border: isActive ? '2px solid #C8830A' : '1.5px solid var(--divider)',
                    background: isActive ? '#FFF9E0' : 'var(--card-inner)',
                    color: isActive ? '#C8830A' : 'var(--text-muted)',
                    fontSize: 13, fontWeight: isActive ? 800 : 600,
                    cursor: 'pointer', fontFamily: 'var(--font-body)',
                    boxShadow: isActive ? '0 2px 0 #C8A020' : 'none',
                    transition: 'all 0.15s',
                  }}
                >
                  {n}
                </button>
              );
            })}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.6 }}>
            单放1个果实 = 家族池+属系池；多个同属果实 = 属系池；属系不同 = 世界池
          </div>
        </div>

        {/* ── 池类型实时预判 ── */}
        {poolPreview && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 10px', borderRadius: 8,
            background: poolPreview.bg,
            border: `1px solid ${poolPreview.color}40`,
            marginBottom: 12,
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: poolPreview.color }}>
              📊 预计进池：{poolPreview.label}
            </span>
          </div>
        )}

        {/* ── 各槽位输入 ── */}
        {fruits.map((slot, idx) => {
          const isRequired = idx === 0;
          const otherFruits = allSelectedFruits.filter((_, i) => i !== idx);
          return (
            <div
              key={idx}
              style={{
                marginBottom: idx < fruitCount - 1 ? 14 : 0,
                paddingBottom: idx < fruitCount - 1 ? 14 : 0,
                borderBottom: idx < fruitCount - 1 ? '1px dashed var(--divider)' : 'none',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div style={{
                  fontSize: 11, fontWeight: 700, color: 'var(--text-light)',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 18, height: 18, borderRadius: 5,
                    background: isRequired ? '#C8830A' : 'var(--card-inner)',
                    border: isRequired ? 'none' : '1px solid var(--divider)',
                    color: isRequired ? '#fff' : 'var(--text-muted)',
                    fontSize: 10, fontWeight: 800,
                  }}>{SLOT_LABELS[idx]}</span>
                  精灵 {SLOT_LABELS[idx]}
                </div>
                {!isRequired && (
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>选填</span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>精灵名{isRequired ? '（必填）' : ''}</div>
                  <input
                    className="input-field"
                    value={slot.spirit}
                    onChange={e => updateSlot(idx, 'spirit', e.target.value)}
                    placeholder={idx === 0 ? '如：治愈兔' : `如：火红尾`}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>果实名{isRequired ? '（必填）' : ''}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input
                      className="input-field"
                      value={slot.fruit}
                      onChange={e => updateSlot(idx, 'fruit', e.target.value)}
                      placeholder={idx === 0 ? '如：治愈兔果实' : '如：火红尾果实'}
                      style={{ flex: 1 }}
                    />
                    {slot.fruit?.trim() && (
                      <FruitTag name={slot.fruit.trim()} size={24} showName={false} />
                    )}
                  </div>
                </div>
              </div>

              {/* 已拥有果实快选 */}
              <OwnedFruitPicker
                ownedFruits={ownedFruits}
                currentValue={slot.fruit}
                attrLabel={currentAttrLabel}
                fruitAttrsMap={fruitAttrsMap}
                excludeFruits={otherFruits}
                onSelect={(fruit) => {
                  updateSlot(idx, 'fruit', fruit);
                  updateSlot(idx, 'spirit', fruitSpiritMap[fruit] || slot.spirit);
                }}
              />
            </div>
          );
        })}
      </div>

      {/* ── 该方案可抓异色精灵 ── */}
      <div className="card animate-in" style={{ animationDelay: '0.08s' }}>
        {/* 标题行 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 800 }}>该方案可抓异色精灵</span>
          <button
            onClick={openShinyModal}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 8,
              border: '1.5px solid #C8830A', background: '#FFF9E0',
              color: '#C8830A', cursor: 'pointer', fontFamily: 'var(--font-body)',
            }}
          >＋ 添加</button>
        </div>

        {/* 已选精灵展示区 */}
        {selectedShinies.length > 0 ? (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {selectedShinies.map(name => (
              <div
                key={name}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                  position: 'relative',
                }}
              >
                <div style={{ position: 'relative' }}>
                  <SpiritAvatar
                    name={name}
                    obtained={state.spirits[name]?.obtained}
                    size={44}
                  />
                  {/* 移除按钮 */}
                  <button
                    onClick={() => setSelectedShinies(prev => prev.filter(n => n !== name))}
                    style={{
                      position: 'absolute', top: -4, right: -4,
                      width: 16, height: 16, borderRadius: '50%',
                      background: '#675D53', color: '#FBF7EC',
                      border: 'none', cursor: 'pointer',
                      fontSize: 10, fontWeight: 900, lineHeight: 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: 0,
                    }}
                  >×</button>
                </div>
                <span style={{
                  fontSize: 10, color: 'var(--text-muted)',
                  maxWidth: 48, textAlign: 'center', lineHeight: 1.3,
                }}>{name}</span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            padding: '14px 0', textAlign: 'center',
            fontSize: 12, color: 'rgba(103,93,83,0.4)', fontStyle: 'italic',
          }}>
            暂未选择，点击「＋ 添加」选择目标异色精灵
          </div>
        )}

        {selectedShinies.length > 0 && (
          <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-muted)' }}>
            已选 <strong style={{ color: '#C8830A' }}>{selectedShinies.length}</strong> 只
            <span style={{ marginLeft: 8, color: 'rgba(103,93,83,0.5)' }}>·</span>
            <button
              onClick={() => setSelectedShinies([])}
              style={{
                marginLeft: 8, fontSize: 11, color: 'var(--text-muted)',
                background: 'none', border: 'none', cursor: 'pointer',
                padding: 0, fontFamily: 'var(--font-body)', textDecoration: 'underline',
              }}
            >清空</button>
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

    {/* ── 异色精灵选择弹窗 ── */}
    {showShinyModal && createPortal(
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(30,25,20,0.6)',
          display: 'flex', alignItems: 'flex-end',
        }}
        onClick={e => { if (e.target === e.currentTarget) setShowShinyModal(false); }}
      >
        <div style={{
          width: '100%', maxHeight: '80vh',
          background: 'var(--bg)', borderRadius: '18px 18px 0 0',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 -4px 24px rgba(0,0,0,0.18)',
        }}>
          {/* 弹窗头部 */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 18px 12px',
            borderBottom: '1px solid var(--divider)', flexShrink: 0,
          }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 900, fontFamily: 'var(--font-display)' }}>
                选择目标异色精灵
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                已选 <strong style={{ color: pendingShinies.length > 0 ? '#C8830A' : 'var(--text-muted)' }}>
                  {pendingShinies.length}
                </strong> 只
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setPendingShinies(ALL_SHINIES_GROUPED.flatMap(g => g.items))}
                style={{
                  fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 8,
                  border: '1px solid var(--divider)', background: 'var(--card-inner)',
                  color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'var(--font-body)',
                }}
              >全选</button>
              <button
                onClick={() => setPendingShinies([])}
                style={{
                  fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 8,
                  border: '1px solid var(--divider)', background: 'var(--card-inner)',
                  color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'var(--font-body)',
                }}
              >清空</button>
            </div>
          </div>

          {/* 精灵列表（分属系分组，可滚动） */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 18px 8px' }}>
            {ALL_SHINIES_GROUPED.map(group => (
              <div key={group.id} style={{ marginBottom: 18 }}>
                {/* 属系标题 */}
                <div style={{
                  fontSize: 11, fontWeight: 800, color: 'var(--text-muted)',
                  letterSpacing: 0.5, marginBottom: 10,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  {(() => {
                    const plan = PLANS.find(p => p.id === group.id);
                    return plan
                      ? <PlanIcon plan={plan} size={14} />
                      : <span>🌍</span>;
                  })()}
                  {group.label}
                </div>

                {/* 精灵网格 */}
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {group.items.map(name => {
                    const isSelected = pendingShinies.includes(name);
                    return (
                      <div
                        key={name}
                        onClick={() => togglePending(name)}
                        style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                          cursor: 'pointer',
                          opacity: isSelected ? 1 : 0.4,
                          transition: 'opacity 0.12s',
                        }}
                      >
                        <div style={{
                          borderRadius: 12, padding: 2,
                          border: isSelected ? '2px solid #C8830A' : '2px solid transparent',
                          background: isSelected ? 'rgba(200,131,10,0.08)' : 'transparent',
                          position: 'relative', transition: 'all 0.12s',
                        }}>
                          <SpiritAvatar
                            name={name}
                            obtained={state.spirits[name]?.obtained}
                            size={46}
                          />
                          {isSelected && (
                            <span style={{
                              position: 'absolute', bottom: -2, right: -2,
                              width: 15, height: 15, borderRadius: '50%',
                              background: '#C8830A', color: '#fff',
                              fontSize: 9, fontWeight: 900,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              lineHeight: 1,
                            }}>✓</span>
                          )}
                        </div>
                        <span style={{
                          fontSize: 10,
                          fontWeight: isSelected ? 700 : 600,
                          color: isSelected ? '#C8830A' : 'var(--text-muted)',
                          maxWidth: 50, textAlign: 'center', lineHeight: 1.3,
                        }}>{name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* 底部确认按钮 */}
          <div style={{
            padding: '12px 18px 20px', flexShrink: 0,
            borderTop: '1px solid var(--divider)',
            display: 'flex', gap: 10,
          }}>
            <button
              onClick={() => setShowShinyModal(false)}
              style={{
                flex: 1, padding: '12px 0', borderRadius: 12,
                border: '1.5px solid var(--divider)', background: 'var(--card-inner)',
                color: 'var(--text-muted)', fontSize: 14, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'var(--font-body)',
              }}
            >取消</button>
            <button
              onClick={confirmShinyModal}
              style={{
                flex: 2, padding: '12px 0', borderRadius: 12,
                border: 'none', background: '#2B2A2E',
                color: '#FBF7EC', fontSize: 14, fontWeight: 800,
                cursor: 'pointer', fontFamily: 'var(--font-body)',
              }}
            >确定（{pendingShinies.length} 只）</button>
          </div>
        </div>
      </div>,
      document.getElementById('modal-root') || document.body
    )}
    </>
  );
}
