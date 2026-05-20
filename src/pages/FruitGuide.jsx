import { useState, useMemo } from 'react';
import FruitTag from '../components/FruitTag';
import {
  FRUIT_GUIDE_TABS, ATTR_CONFIG,
  getTabEntries, getAllEntries, getTabAttrs,
  getMergedTabEntries, customFruitToEntry,
  ATTR_ID_TO_LABEL, LABEL_TO_ATTR_ID,
} from '../data/fruitGuide';
import { getAttrByAnyName, getFruitBySpirit, FRUIT_ATTR } from '../data/plans';
import { useStore } from '../store';

// ─── 属性徽章 ─────────────────────────────────────────────────────────────────
function AttrBadge({ attr }) {
  const cfg = ATTR_CONFIG[attr] || { color: '#A09080', bg: '#F0EAE0' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      fontSize: 10, fontWeight: 800,
      color: cfg.color, background: cfg.bg,
      border: `1px solid ${cfg.color}40`,
      borderRadius: 6, padding: '1px 6px',
      whiteSpace: 'nowrap', flexShrink: 0,
    }}>
      {cfg.icon && <img src={cfg.icon} alt={attr} width={11} height={11} style={{ objectFit: 'contain' }} />}
      {attr}
    </span>
  );
}

// ─── 待公布果实占位框（尺寸对齐 FruitTag size=38）─────────────────────────────
function FruitPendingPlaceholder({ size = 38 }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: size, height: size, flexShrink: 0,
      borderRadius: size * 0.22,
      background: 'linear-gradient(135deg, rgba(103,93,83,0.10) 0%, rgba(103,93,83,0.06) 100%)',
      border: '1.5px dashed rgba(103,93,83,0.35)',
    }}>
      <span style={{ fontSize: size * 0.38, opacity: 0.4 }}>?</span>
    </span>
  );
}

// ─── 单个果实条目 ─────────────────────────────────────────────────────────────
function FruitEntry({ entry, isOwned, onToggle, groupColor, onEdit, onDelete }) {
  const isCustom = !!entry.custom;
  // 果实图标：有 fruitPending 标记时显示「待公布」占位框，否则正常显示图标
  const fruitIcon = entry.fruitPending
    ? <FruitPendingPlaceholder size={38} />
    : <FruitTag name={entry.fruit} size={38} showName={false} style={{ flexShrink: 0 }} />;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '9px 10px', borderRadius: 10,
      background: isOwned ? 'rgba(75,156,70,0.07)' : 'var(--card-inner)',
      border: isOwned
        ? '1px solid rgba(75,156,70,0.25)'
        : isCustom
          ? '1px dashed rgba(126,87,194,0.45)'
          : '1px solid transparent',
      transition: 'background 0.2s, border 0.2s',
    }}>
      {fruitIcon}

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* 行1：果实名 + 属性 + 自建角标 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', marginBottom: 3 }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: '#2B2A2E', fontFamily: 'var(--font-display)' }}>
            {entry.fruit}
          </span>
          {entry.attrs?.map(a => <AttrBadge key={a} attr={a} />)}
          {isCustom && (
            <span
              title={entry.source === 'plan' ? '由自定义方案同步' : '手动新建'}
              style={{
                fontSize: 9, fontWeight: 800,
                padding: '1px 5px', borderRadius: 6,
                color: '#7E57C2', background: 'rgba(126,87,194,0.10)',
                border: '1px solid rgba(126,87,194,0.35)',
              }}
            >
              自建{entry.source === 'plan' ? '·方案' : ''}
            </span>
          )}
        </div>

        {/* 行2：解锁条件 */}
        {entry.unlock && (
          <div style={{
            display: 'inline-flex', alignItems: 'center',
            fontSize: 10, fontWeight: 700,
            color: groupColor || '#C8830A',
            background: `${groupColor || '#C8830A'}15`,
            border: `1px solid ${groupColor || '#C8830A'}35`,
            borderRadius: 6, padding: '1px 6px',
            marginBottom: entry.location || entry.tip ? 3 : 0,
          }}>
            {entry.unlock}
          </div>
        )}

        {/* 行3：地点 + 备注 */}
        {(entry.location || entry.tip) && (
          <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            {entry.location && <span>📍 {entry.location}</span>}
            {entry.tip && (
              <span style={{ color: '#C8830A', marginLeft: entry.location ? 4 : 0 }}>
                {entry.location ? '· ' : ''}{entry.tip}
              </span>
            )}
          </div>
        )}
      </div>

      {/* 自建条目：编辑 + 删除小按钮 */}
      {isCustom && (
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          <button
            onClick={() => onEdit(entry)}
            title="编辑"
            style={{
              width: 26, height: 26, borderRadius: 8,
              border: '1px solid var(--divider)',
              background: 'var(--card)',
              color: 'var(--text-muted)',
              fontSize: 12, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >✎</button>
          <button
            onClick={() => onDelete(entry)}
            title="删除"
            style={{
              width: 26, height: 26, borderRadius: 8,
              border: '1px solid rgba(200,53,26,0.35)',
              background: 'rgba(200,53,26,0.06)',
              color: 'rgba(200,53,26,0.85)',
              fontSize: 12, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >🗑</button>
        </div>
      )}

      {/* 已拥有切换按钮 */}
      <button
        onClick={() => onToggle(entry.fruit)}
        style={{
          flexShrink: 0, width: 32, height: 32, borderRadius: 10,
          border: isOwned ? '1.5px solid rgba(75,156,70,0.5)' : '1.5px solid var(--divider)',
          background: isOwned ? 'rgba(75,156,70,0.12)' : 'var(--card)',
          color: isOwned ? '#4B9C46' : 'var(--text-muted)',
          fontSize: 15, fontWeight: 900,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', transition: 'all 0.18s',
        }}
      >
        {isOwned ? '✓' : '+'}
      </button>
    </div>
  );
}

// ─── 自建果实表单 Bottom Sheet ────────────────────────────────────────────────
// 用法：
//   <CustomFruitSheet open={...} initial={null|entry} onClose={...} onSubmit={data => ...} />
// onSubmit 接收 { fruit, spirit, attrId, attrs, unlock, tip }，由父组件 dispatch ADD_CUSTOM_FRUIT
function CustomFruitSheet({ open, initial, onClose, onSubmit }) {
  // 编辑态把已有数据回填；新建态全空
  const isEdit = !!initial;
  const [fruit, setFruit] = useState(initial?.fruit || '');
  const [spirit, setSpirit] = useState(initial?.spirit || '');
  const [unlock, setUnlock] = useState(initial?.unlock || '');
  const [tip, setTip] = useState(initial?.tip || '');
  // 已识别的 attrId（来自 spirit/fruit 自动反查 + 用户在面板里点选）
  // 编辑态：优先用 entry.attrs[0] → LABEL_TO_ATTR_ID 反查，否则尝试 getAttrByAnyName
  const initAttrId = useMemo(() => {
    if (!initial) return null;
    if (initial.attrs?.[0] && LABEL_TO_ATTR_ID[initial.attrs[0]]) return LABEL_TO_ATTR_ID[initial.attrs[0]];
    return getAttrByAnyName(initial.spirit || initial.fruit) || null;
  }, [initial]);
  const [attrIdManual, setAttrIdManual] = useState(initAttrId);
  // 自动识别：以 spirit 为主，没填则用 fruit
  const autoAttrId = useMemo(() => {
    const probe = (spirit && spirit.trim()) || (fruit && fruit.trim());
    if (!probe) return null;
    return getAttrByAnyName(probe);
  }, [spirit, fruit]);
  const attrId = attrIdManual ?? autoAttrId;
  const attrLabel = attrId ? ATTR_ID_TO_LABEL[attrId] : null;
  const attrCfg = attrLabel ? ATTR_CONFIG[attrLabel] : null;

  // 果实名预览：用户输入精灵名时，提供"自动加'果实'后缀"提示
  const previewFruit = (() => {
    const f = fruit.trim();
    if (f) return f;
    const s = spirit.trim();
    if (!s) return '';
    // 用户输入的是精灵名 → 反查内置果实名 → 兜底：精灵名+'果实'
    return getFruitBySpirit(s) || `${s}果实`;
  })();

  // 保护内置：用户填的 fruit name 命中 FRUIT_ATTR 则禁止保存
  const isBuiltin = previewFruit && Object.prototype.hasOwnProperty.call(FRUIT_ATTR, previewFruit);
  const canSubmit = !!previewFruit && !!attrId && !isBuiltin;

  if (!open) return null;

  const handleSubmit = () => {
    if (!canSubmit) return;
    const finalFruit = previewFruit;
    const finalSpirit = (spirit.trim()) || finalFruit.replace(/果实$/, '');
    onSubmit({
      fruit: finalFruit,
      spirit: finalSpirit,
      attrId,
      attrs: attrLabel ? [attrLabel] : [],
      unlock: unlock.trim() || '自定义',
      tip: tip.trim(),
    });
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
        zIndex: 400, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 480,
          background: 'var(--card)',
          borderTopLeftRadius: 20, borderTopRightRadius: 20,
          boxShadow: '0 -6px 30px rgba(0,0,0,0.25)',
          padding: '14px 16px 24px',
          maxHeight: '85vh', overflowY: 'auto',
        }}
      >
        <div style={{
          width: 36, height: 4, borderRadius: 2,
          background: 'var(--divider)', margin: '0 auto 12px',
        }} />
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14,
        }}>
          <span style={{ fontSize: 15, fontWeight: 900, color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
            {isEdit ? '编辑自建果实' : '新建自定义果实'}
          </span>
          <button
            onClick={onClose}
            style={{
              fontSize: 11, fontWeight: 700, padding: '4px 10px',
              border: '1px solid var(--divider)', borderRadius: 16,
              background: 'var(--card-inner)', color: 'var(--text-muted)',
              cursor: 'pointer', fontFamily: 'var(--font-body)',
            }}
          >取消</button>
        </div>

        {/* 预览区 */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 10px', borderRadius: 10,
          background: 'var(--card-inner)', border: '1px dashed var(--divider)',
          marginBottom: 14,
        }}>
          {previewFruit
            ? <FruitTag name={previewFruit} size={38} showName={false} style={{ flexShrink: 0 }} />
            : <div style={{
                width: 38, height: 38, borderRadius: 10,
                background: 'var(--card)', border: '1px dashed var(--divider)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-muted)', fontSize: 18,
              }}>?</div>
          }
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
              {previewFruit || '请填写果实名或精灵名'}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
              {attrLabel ? <span style={{ color: attrCfg?.color, fontWeight: 700 }}>属性：{attrLabel}</span> : '属性未识别，请下方手动选择'}
            </div>
          </div>
        </div>

        {/* 果实名 / 精灵名 二选一 */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>
            果实名或精灵名 <span style={{ color: 'var(--cta)', fontWeight: 900 }}>*</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              value={fruit}
              onChange={e => setFruit(e.target.value)}
              placeholder="果实名（如：哈密瓜果实）"
              className="input-field"
              style={{ flex: 1, margin: 0 }}
            />
            <input
              type="text"
              value={spirit}
              onChange={e => setSpirit(e.target.value)}
              placeholder="精灵名（如：哈密瓜）"
              className="input-field"
              style={{ flex: 1, margin: 0 }}
            />
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.5 }}>
            两个都填或只填一个均可；只填精灵名时果实名自动补「果实」后缀。
          </div>
          {isBuiltin && (
            <div style={{
              marginTop: 6, padding: '6px 8px', borderRadius: 8,
              background: 'rgba(200,53,26,0.08)', color: 'rgba(200,53,26,0.95)',
              fontSize: 11, fontWeight: 700,
            }}>
              「{previewFruit}」是内置果实，不能新建（避免覆盖内置数据）。
            </div>
          )}
        </div>

        {/* 属性选择网格 */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>
            属性 <span style={{ color: 'var(--cta)', fontWeight: 900 }}>*</span>
            {!attrIdManual && autoAttrId && (
              <span style={{ marginLeft: 6, color: 'var(--text-muted)', fontWeight: 500 }}>
                （已自动识别）
              </span>
            )}
          </div>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6,
          }}>
            {Object.entries(ATTR_ID_TO_LABEL).map(([id, label]) => {
              const cfg = ATTR_CONFIG[label] || {};
              const isActive = attrId === id;
              return (
                <button
                  key={id}
                  onClick={() => setAttrIdManual(id)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                    padding: '6px 4px', borderRadius: 8, cursor: 'pointer',
                    border: isActive ? `2px solid ${cfg.color || '#C8830A'}` : '1.5px solid var(--divider)',
                    background: isActive ? (cfg.bg || 'rgba(200,131,10,0.08)') : 'var(--card-inner)',
                    color: isActive ? (cfg.color || '#C8830A') : 'var(--text-light)',
                    fontSize: 11, fontWeight: isActive ? 900 : 700,
                    fontFamily: 'var(--font-body)',
                    transition: 'all 0.12s',
                  }}
                >
                  {cfg.icon && <img src={cfg.icon} alt={label} width={14} height={14} style={{ objectFit: 'contain' }} />}
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 解锁说明 */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>
            解锁条件 <span style={{ fontSize: 10, fontWeight: 500 }}>（选填）</span>
          </div>
          <input
            type="text"
            value={unlock}
            onChange={e => setUnlock(e.target.value)}
            placeholder="例：抓 20 只 / 商城购买 / 朋友赠送"
            className="input-field"
            style={{ margin: 0 }}
          />
        </div>

        {/* 备注 */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>
            备注 <span style={{ fontSize: 10, fontWeight: 500 }}>（选填）</span>
          </div>
          <input
            type="text"
            value={tip}
            onChange={e => setTip(e.target.value)}
            placeholder="备注信息，如使用建议 / 来源 / 注意事项"
            className="input-field"
            style={{ margin: 0 }}
          />
        </div>

        {/* 提交按钮 */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          style={{
            width: '100%', padding: '12px 0', borderRadius: 14,
            border: 'none',
            background: canSubmit ? '#2B2A2E' : '#B0A898',
            color: '#FBF7EC', fontSize: 14, fontWeight: 800,
            cursor: canSubmit ? 'pointer' : 'not-allowed',
            fontFamily: 'var(--font-body)',
          }}
        >
          {isEdit ? '保存修改' : '创建并加入「抓取获得」'}
        </button>
      </div>
    </div>
  );
}

// ─── 属性筛选浮层 ─────────────────────────────────────────────────────────────
function AttrFilterSheet({ attrs, selected, onChange, onClose }) {
  const [local, setLocal] = useState(selected);

  const toggle = (attr) => {
    setLocal(prev => prev.includes(attr) ? prev.filter(a => a !== attr) : [...prev, attr]);
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'flex-end',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%', background: '#FBF7EC',
          borderRadius: '20px 20px 0 0',
          padding: '20px 16px 40px',
          maxHeight: '70vh', overflowY: 'auto',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* 标题行 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ fontSize: 15, fontWeight: 900, color: '#2B2A2E', fontFamily: 'var(--font-display)' }}>
            属性筛选
          </span>
          {local.length > 0 && (
            <button
              onClick={() => setLocal([])}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 700, color: 'var(--text-muted)',
              }}
            >
              重置
            </button>
          )}
        </div>

        {/* 属性 chip 网格 */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
          {attrs.map(attr => {
            const cfg = ATTR_CONFIG[attr] || { color: '#A09080', bg: '#F0EAE0' };
            const isSelected = local.includes(attr);
            return (
              <button
                key={attr}
                onClick={() => toggle(attr)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '6px 12px', borderRadius: 20,
                  border: isSelected ? `1.5px solid ${cfg.color}` : '1.5px solid var(--divider)',
                  background: isSelected ? `${cfg.bg}` : 'var(--card-inner)',
                  color: isSelected ? cfg.color : 'var(--text-muted)',
                  fontSize: 12, fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  fontFamily: 'var(--font-body)',
                }}
              >
                {cfg.icon && <img src={cfg.icon} alt={attr} width={14} height={14} style={{ objectFit: 'contain' }} />}
                {attr}
              </button>
            );
          })}
        </div>

        {/* 确定按钮 */}
        <button
          onClick={() => { onChange(local); onClose(); }}
          style={{
            width: '100%', padding: '12px 0', borderRadius: 14,
            border: 'none', background: '#2B2A2E',
            color: '#FBF7EC', fontSize: 14, fontWeight: 800,
            cursor: 'pointer', fontFamily: 'var(--font-body)',
          }}
        >
          确定{local.length > 0 ? `（已选 ${local.length} 个属性）` : ''}
        </button>
      </div>
    </div>
  );
}

// ─── 主页面 ───────────────────────────────────────────────────────────────────
export default function FruitGuide({ goBack }) {
  const { state, dispatch } = useStore();
  const ownedFruits = state.ownedFruits || [];
  const customFruits = state.customFruits || [];

  const [activeTabId, setActiveTabId] = useState('catch');
  const [showAttrFilter, setShowAttrFilter] = useState(false);
  const [selectedAttrs, setSelectedAttrs] = useState([]);

  // 自建果实 Sheet 状态：null 关闭 / { editing: null|entry } 打开
  const [customSheet, setCustomSheet] = useState(null);

  // 当前 Tab 数据
  const currentTab = FRUIT_GUIDE_TABS.find(t => t.id === activeTabId);

  // 当前 Tab 下所有 entries（扁平，已合并 customFruits 到 catch Tab 末尾）
  const currentEntries = useMemo(
    () => getMergedTabEntries(currentTab, customFruits),
    [currentTab, customFruits]
  );

  // 当前 Tab 下所有可筛选属性（包含自建果实带来的属性）
  const currentAttrs = useMemo(
    () => [...new Set(currentEntries.flatMap(e => e.attrs || []))],
    [currentEntries]
  );

  // 筛选后的果实名 Set（null = 不筛选）
  const filteredFruits = useMemo(() => {
    if (selectedAttrs.length === 0) return null;
    return new Set(
      currentEntries
        .filter(e => e.attrs?.some(a => selectedAttrs.includes(a)))
        .map(e => e.fruit)
    );
  }, [currentEntries, selectedAttrs]);

  // 是否显示某条 entry
  const isVisible = (fruit) => !filteredFruits || filteredFruits.has(fruit);

  // 全局已拥有计数（跨 Tab，含自建果实）
  const allEntries = useMemo(() => {
    const base = getAllEntries();
    const extras = customFruits
      .filter(c => c && !c.deleted && !base.some(b => b.fruit === c.fruit))
      .map(customFruitToEntry).filter(Boolean);
    return [...base, ...extras];
  }, [customFruits]);
  const totalOwned = allEntries.filter(e => ownedFruits.includes(e.fruit)).length;
  const totalFruits = allEntries.length;

  // 每个 Tab 的总数（catch Tab 含自建果实数量）
  const tabCounts = useMemo(() =>
    FRUIT_GUIDE_TABS.reduce((acc, tab) => {
      acc[tab.id] = getMergedTabEntries(tab, customFruits).length;
      return acc;
    }, {}),
    [customFruits]
  );

  const toggle = (fruitName) => dispatch({ type: 'TOGGLE_OWNED_FRUIT', fruit: fruitName });

  // 自建果实：编辑/删除回调
  const handleEditCustom = (entry) => setCustomSheet({ editing: entry });
  const handleDeleteCustom = (entry) => {
    if (!entry?.fruit) return;
    if (!window.confirm(`确认删除自建果实「${entry.fruit}」吗？删除后将不再出现在攻略页与候选下拉中。`)) return;
    dispatch({ type: 'DELETE_CUSTOM_FRUIT', fruit: entry.fruit });
    if (ownedFruits.includes(entry.fruit)) {
      dispatch({ type: 'TOGGLE_OWNED_FRUIT', fruit: entry.fruit });
    }
  };
  const handleSubmitCustom = (data) => {
    // upsert：内置 fruit 名称由 reducer 兜底拒绝，这里直接 dispatch
    dispatch({
      type: 'ADD_CUSTOM_FRUIT',
      fruit: data.fruit,
      spirit: data.spirit,
      attrs: data.attrs,
      attrId: data.attrId,
      unlock: data.unlock,
      tip: data.tip,
      source: 'manual',
    });
    setCustomSheet(null);
  };

  // 当前 Tab 所有果实名（扁平）
  const tabFruits = useMemo(() => currentEntries.map(e => e.fruit), [currentEntries]);
  const tabFruitSet = useMemo(() => new Set(tabFruits), [tabFruits]);

  // 当前 Tab 全选
  const handleSelectAll = () => {
    const merged = [...new Set([...ownedFruits, ...tabFruits])];
    dispatch({ type: 'SET_OWNED_FRUITS', fruits: merged });
  };

  // 当前 Tab 全取消
  const handleClearTab = () => {
    const remaining = ownedFruits.filter(f => !tabFruitSet.has(f));
    dispatch({ type: 'SET_OWNED_FRUITS', fruits: remaining });
  };

  // 切换 Tab 时清空属性筛选
  const switchTab = (tabId) => {
    setActiveTabId(tabId);
    setSelectedAttrs([]);
  };

  return (
    <div style={{ paddingBottom: 32 }}>
      {/* 顶部 */}
      <div className="page-header">
        <button className="back-btn" onClick={goBack}>
          <img src={`${import.meta.env.BASE_URL}back-icon.webp`} alt="返回" />
        </button>
        <span className="page-header-title">果实解锁攻略</span>
      </div>

      {/* 全局进度条幅 */}
      <div className="card animate-in" style={{
        background: 'linear-gradient(135deg, #FFF4D6 0%, #FFF9EC 100%)',
        border: '1px solid rgba(200,131,10,0.25)',
        padding: '12px 14px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#C8830A' }}>
            🌿 果实获取进度
          </div>
          <div style={{
            fontSize: 11, fontWeight: 700,
            color: totalOwned === totalFruits ? '#4CAF50' : '#C8830A',
          }}>
            {totalOwned} / {totalFruits} 已获得
          </div>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>
          点右侧 + 标记已拥有，数据随账号云端保存。
        </div>
      </div>

      {/* Tab 切换栏 */}
      <div style={{
        display: 'flex', gap: 0,
        margin: '0 16px 12px',
        background: 'var(--card-inner)',
        borderRadius: 14, padding: 4,
        overflow: 'hidden',
      }}>
        {FRUIT_GUIDE_TABS.map(tab => {
          const isActive = tab.id === activeTabId;
          return (
            <button
              key={tab.id}
              onClick={() => switchTab(tab.id)}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                padding: '8px 4px', borderRadius: 10,
                border: 'none', cursor: 'pointer',
                background: isActive ? '#FBF7EC' : 'transparent',
                boxShadow: isActive ? '0 1px 4px rgba(43,42,46,0.10)' : 'none',
                transition: 'all 0.18s',
                whiteSpace: 'nowrap',
                fontFamily: 'var(--font-body)',
              }}
            >
              <span style={{
                fontSize: 12, fontWeight: 900,
                color: isActive ? '#2B2A2E' : 'var(--text-muted)',
                fontFamily: 'var(--font-display)',
              }}>
                {tab.label}
              </span>
              <span style={{
                fontSize: 10, fontWeight: 600,
                color: isActive ? '#C8830A' : 'var(--text-muted)',
                marginTop: 1,
              }}>
                {tabCounts[tab.id]} 种
              </span>
            </button>
          );
        })}
      </div>

      {/* 筛选行：属性筛选 + Tab 全选/全取消 */}
      <div style={{ margin: '0 16px 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
        {/* 属性筛选 */}
        <button
          onClick={() => setShowAttrFilter(true)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '6px 12px', borderRadius: 20,
            border: selectedAttrs.length > 0
              ? '1.5px solid #C8830A'
              : '1.5px solid var(--divider)',
            background: selectedAttrs.length > 0
              ? 'rgba(200,131,10,0.10)'
              : 'var(--card-inner)',
            color: selectedAttrs.length > 0 ? '#C8830A' : 'var(--text-muted)',
            fontSize: 12, fontWeight: 800,
            cursor: 'pointer', fontFamily: 'var(--font-body)',
          }}
        >
          <span style={{ fontSize: 13 }}>⚙️</span>
          属性筛选
          {selectedAttrs.length > 0 && (
            <span style={{
              background: '#C8830A', color: '#fff',
              borderRadius: 10, fontSize: 10, fontWeight: 900,
              padding: '0 5px', lineHeight: '16px', minWidth: 16,
              textAlign: 'center',
            }}>
              {selectedAttrs.length}
            </span>
          )}
        </button>
        {selectedAttrs.length > 0 && (
          <button
            onClick={() => setSelectedAttrs([])}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 11, fontWeight: 700, color: 'var(--text-muted)',
              padding: 0,
            }}
          >
            清除
          </button>
        )}

        {/* 弹性空白 */}
        <div style={{ flex: 1 }} />

        {/* Tab 级 全选 / 全取消 */}
        <button
          onClick={handleSelectAll}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 3,
            padding: '5px 10px', borderRadius: 16,
            border: '1.5px solid rgba(75,156,70,0.4)',
            background: 'rgba(75,156,70,0.07)',
            color: '#4B9C46', fontSize: 11, fontWeight: 800,
            cursor: 'pointer', fontFamily: 'var(--font-body)',
            whiteSpace: 'nowrap',
          }}
        >✓ 全有</button>
        <button
          onClick={handleClearTab}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 3,
            padding: '5px 10px', borderRadius: 16,
            border: '1.5px solid var(--divider)',
            background: 'var(--card-inner)',
            color: 'var(--text-muted)', fontSize: 11, fontWeight: 800,
            cursor: 'pointer', fontFamily: 'var(--font-body)',
            whiteSpace: 'nowrap',
          }}
        >× 全无</button>
      </div>

      {/* Tab 内容区 */}
      <div className="card animate-in" key={activeTabId}>
        {/* Tab 描述 */}
        <div style={{
          fontSize: 11, color: 'var(--text-muted)', fontWeight: 600,
          marginBottom: 12,
          paddingBottom: 10,
          borderBottom: '1px solid var(--divider)',
        }}>
          {currentTab.desc}
        </div>

        {/* 扁平列表（抓取获得 Tab，已合并自建果实到末尾） */}
        {currentTab.entries && (() => {
          const visible = currentEntries.filter(e => isVisible(e.fruit));
          return (
            <>
              {/* 顶部「+ 新建自定义果实」按钮（仅 catch Tab 显示） */}
              <button
                onClick={() => setCustomSheet({ editing: null })}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '10px 12px', borderRadius: 12,
                  border: '1.5px dashed rgba(126,87,194,0.55)',
                  background: 'rgba(126,87,194,0.06)',
                  color: '#7E57C2', fontSize: 12, fontWeight: 800,
                  cursor: 'pointer', fontFamily: 'var(--font-body)',
                  marginBottom: 8,
                }}
              >
                <span style={{ fontSize: 14, lineHeight: 1 }}>＋</span>
                新建自定义果实
                <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)' }}>
                  （自定义方案输入新果实时也会自动同步至此）
                </span>
              </button>
              {visible.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, padding: '20px 0' }}>
                  没有匹配的果实
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {visible.map((entry, i) => (
                    <FruitEntry
                      key={i}
                      entry={entry}
                      isOwned={ownedFruits.includes(entry.fruit)}
                      onToggle={toggle}
                      groupColor="#C8830A"
                      onEdit={handleEditCustom}
                      onDelete={handleDeleteCustom}
                    />
                  ))}
                </div>
              )}
            </>
          );
        })()}

        {/* 分组列表（图鉴奖励 / 赛季&活动 Tab） */}
        {currentTab.groups && currentTab.groups.map((group, gi) => {
          const visible = group.entries.filter(e => isVisible(e.fruit));
          if (visible.length === 0) return null;
          return (
            <div key={group.id} style={{ marginBottom: gi < currentTab.groups.length - 1 ? 18 : 0 }}>
                {/* 子分组标题 */}
                <div style={{ marginBottom: group.desc ? 4 : 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 3, height: 14, borderRadius: 2,
                      background: group.color, flexShrink: 0,
                    }} />
                    <span style={{ fontSize: 12, fontWeight: 900, color: '#2B2A2E', fontFamily: 'var(--font-display)' }}>
                      {group.label}
                    </span>
                    <span style={{
                      fontSize: 10, padding: '1px 6px', borderRadius: 8, fontWeight: 700,
                      background: `${group.color}18`, color: group.color,
                      border: `1px solid ${group.color}40`,
                    }}>
                      {visible.length} 个
                    </span>
                  </div>
                  {/* desc 单独一行，缩进对齐文字 */}
                  {group.desc && (
                    <div style={{
                      fontSize: 10, color: 'var(--text-muted)', fontWeight: 500,
                      marginTop: 3, paddingLeft: 11, lineHeight: 1.5,
                      marginBottom: 8,
                    }}>
                      {group.desc}
                    </div>
                  )}
                </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {visible.map((entry, i) => (
                  <FruitEntry
                    key={i}
                    entry={entry}
                    isOwned={ownedFruits.includes(entry.fruit)}
                    onToggle={toggle}
                    groupColor={group.color}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {/* 全部被筛选掉时 */}
        {currentTab.groups && currentTab.groups.every(g => g.entries.every(e => !isVisible(e.fruit))) && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, padding: '20px 0' }}>
            没有匹配的果实
          </div>
        )}
      </div>

      {/* 属性筛选浮层 */}
      {showAttrFilter && (
        <AttrFilterSheet
          attrs={currentAttrs}
          selected={selectedAttrs}
          onChange={setSelectedAttrs}
          onClose={() => setShowAttrFilter(false)}
        />
      )}

      {/* 自建果实表单浮层（key 切换时强制重置内部 state） */}
      {customSheet && (
        <CustomFruitSheet
          key={customSheet.editing?.fruit || '__new__'}
          open
          initial={customSheet.editing || null}
          onClose={() => setCustomSheet(null)}
          onSubmit={handleSubmitCustom}
        />
      )}
    </div>
  );
}
