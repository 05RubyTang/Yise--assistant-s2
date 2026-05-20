import { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../store';
import { PLANS, getShinisByAttr, FRUIT_ATTR, getPlanFruitsArray, getFruitBySpirit, getAllSpiritFruitPairs, getAttrByAnyName } from '../data/plans';
import { S2_PLANS } from '../data/seasons/s2Plans';
import { getAllEntries, ATTR_CONFIG } from '../data/fruitGuide';
import { FRUITS_WIKI_IMG } from '../data/fruits-wiki';
import PlanIcon from '../components/PlanIcon';
import SpiritAvatar from '../components/SpiritAvatar';
import FruitTag from '../components/FruitTag';

// 属性 id → 中文名映射（与 ATTR_OPTIONS 保持一致）
const ATTR_ID_TO_LABEL = {
  fire: '火系', ice: '冰系', electric: '电系', phantom: '幻系',
  grass: '草系', evil: '恶系', ghost: '幽系', mech: '机械系', light: '光系',
};

// ── 属系属性顺序 ───────────────────────────────────────────────────────────
const SHINY_ATTR_ORDER = ['fire','ice','electric','phantom','grass','evil','ghost','mech','light','water','cute','poison','normal','wing'];
// 额外属系标签（补充 ATTR_ID_TO_LABEL 未覆盖的）
const EXTRA_ATTR_LABEL = {
  water: '水系', cute: '萌系', poison: '毒系', normal: '普通系', wing: '翼系',
};
const getAttrLabel = (id) => ATTR_ID_TO_LABEL[id] || EXTRA_ATTR_LABEL[id] || id;

// 从方案数组中按属系归组，返回 [{ id, iconImg, label, items }]
function buildShinyGroups(planList) {
  // 收集精灵 → 属系的映射（根据 iconImg 提取属系 id）
  const spiritAttrMap = {};
  planList.forEach(p => {
    const attrId = p.iconImg ? p.iconImg.replace(/.*\/attrs\//, '').replace(/\.(png|webp)$/, '') : null;
    (p.shinies || []).forEach(name => {
      if (!spiritAttrMap[name]) spiritAttrMap[name] = attrId;
    });
  });

  const seen = new Set();
  const groupMap = {};

  // 按属系顺序归组
  SHINY_ATTR_ORDER.forEach(id => { groupMap[id] = []; });

  planList.forEach(p => {
    const attrId = p.iconImg ? p.iconImg.replace(/.*\/attrs\//, '').replace(/\.(png|webp)$/, '') : null;
    (p.shinies || []).forEach(name => {
      if (seen.has(name)) return;
      seen.add(name);
      const key = spiritAttrMap[name] || attrId || 'other';
      if (!groupMap[key]) groupMap[key] = [];
      groupMap[key].push(name);
    });
  });

  // 转为数组，过滤空组，带 iconImg
  const groups = SHINY_ATTR_ORDER
    .filter(id => groupMap[id]?.length > 0)
    .map(id => {
      const refPlan = planList.find(p =>
        p.iconImg && p.iconImg.includes(`/${id}.`)
      );
      return {
        id,
        iconImg: refPlan?.iconImg || null,
        label: getAttrLabel(id),
        items: groupMap[id],
      };
    });

  // 残余（属系未识别）
  const extra = groupMap['other'] || [];
  if (extra.length > 0) groups.push({ id: 'other', iconImg: null, label: '其他', items: extra });
  return groups;
}

// ── 按赛季分层的异色精灵分组 ────────────────────────────────────────────────
// 结构：[{ season: 'S1', label: 'S1 经典', groups: [...] }, { season: 'S2', ... }]
const ALL_SHINIES_BY_SEASON = (() => {
  // S1：只用 PLANS（内置 9 属系方案）
  const s1Groups = buildShinyGroups(PLANS.filter(p => p.shinies?.length > 0));
  // S2：用 S2_PLANS 里有 shinies 的方案
  const s2Groups = buildShinyGroups(S2_PLANS.filter(p => p.shinies?.length > 0));
  return [
    { season: 'S1', label: 'S1 经典', groups: s1Groups },
    { season: 'S2', label: 'S2 狂欢', groups: s2Groups },
  ];
})();
// 扁平化（全选/清空时用）
const ALL_SHINIES_FLAT = ALL_SHINIES_BY_SEASON.flatMap(s => s.groups.flatMap(g => g.items));

// ── 果实名自动补全数据源 ────────────────────────────────────────────────────
const ALL_FRUIT_NAMES = Object.keys(FRUITS_WIKI_IMG).sort((a, b) => a.localeCompare(b, 'zh'));
const BASE_CANDIDATES = (() => {
  const list = [];
  for (const fruitName of ALL_FRUIT_NAMES) {
    list.push({ key: `fruit:${fruitName}`, fruitName, displayName: fruitName, type: 'fruit' });
  }
  for (const { spirit, fruit } of getAllSpiritFruitPairs()) {
    list.push({ key: `spirit:${spirit}`, fruitName: fruit, spiritName: spirit, displayName: spirit, type: 'spirit' });
  }
  return list;
})();

/** 果实名输入框 + 自动补全下拉 */
function FruitInput({ value, onChange, placeholder, required }) {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  const query = value.trim();
  const suggestions = useMemo(() => {
    if (query.length === 0) return [];
    const q = query.endsWith('果实') ? query.slice(0, -2) : query;
    const matched = BASE_CANDIDATES.filter(c => {
      if (!c.spiritName) return c.fruitName.includes(q) || c.fruitName.replace('果实', '').includes(q);
      return c.spiritName.includes(q) || c.fruitName.includes(q);
    });
    const seen = new Set();
    const result = [];
    matched.sort((a, b) => {
      const aExact = a.spiritName && a.spiritName === q ? 0 : 1;
      const bExact = b.spiritName && b.spiritName === q ? 0 : 1;
      if (aExact !== bExact) return aExact - bExact;
      const aPrefix = (a.spiritName || a.fruitName).startsWith(q) ? 0 : 1;
      const bPrefix = (b.spiritName || b.fruitName).startsWith(q) ? 0 : 1;
      if (aPrefix !== bPrefix) return aPrefix - bPrefix;
      return 0;
    });
    for (const c of matched) {
      if (seen.has(c.fruitName)) continue;
      seen.add(c.fruitName);
      result.push(c);
      if (result.length >= 8) break;
    }
    return result;
  }, [query]);

  useEffect(() => {
    const handleClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selectCandidate = (c) => {
    onChange(c.fruitName);
    setOpen(false);
    inputRef.current?.blur();
  };

  const tryAutoConvertSpirit = () => {
    const v = value.trim();
    if (!v || v.endsWith('果实')) return;
    const fruit = getFruitBySpirit(v);
    if (fruit) onChange(fruit);
  };

  const handleKeyDown = (e) => {
    if (open && suggestions.length > 0) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setHighlighted(h => Math.min(h + 1, suggestions.length - 1)); return; }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setHighlighted(h => Math.max(h - 1, 0)); return; }
      if (e.key === 'Enter')     { e.preventDefault(); selectCandidate(suggestions[highlighted]); return; }
      if (e.key === 'Escape')    { setOpen(false); return; }
    }
    if (e.key === 'Enter' && (!open || suggestions.length === 0)) {
      e.preventDefault();
      tryAutoConvertSpirit();
    }
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative', flex: 1 }}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true); setHighlighted(0); }}
        onFocus={() => { if (query.length > 0) setOpen(true); }}
        onBlur={() => { tryAutoConvertSpirit(); }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="input-field"
        style={{
          width: '100%',
          borderColor: required && !value.trim() ? 'rgba(200,131,10,0.4)' : 'var(--divider)',
        }}
        autoComplete="off"
      />
      {open && suggestions.length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: '#FBF7EC', border: '1.5px solid var(--card-border)',
          borderRadius: 10, boxShadow: '0 4px 16px rgba(43,42,46,0.14)',
          zIndex: 300, overflow: 'hidden', maxHeight: 260, overflowY: 'auto',
        }}>
          {suggestions.map((c, i) => (
            <div
              key={c.key}
              onMouseDown={() => selectCandidate(c)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 12px', cursor: 'pointer',
                background: i === highlighted ? 'rgba(200,131,10,0.08)' : 'transparent',
                borderBottom: i < suggestions.length - 1 ? '1px solid var(--divider)' : 'none',
                transition: 'background 0.1s',
              }}
              onMouseEnter={() => setHighlighted(i)}
            >
              <FruitTag name={c.fruitName} size={26} showName={false} />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-body)', flex: 1, minWidth: 0 }}>
                {c.displayName}
              </span>
              {c.spiritName && c.displayName !== c.fruitName && (
                <span style={{ fontSize: 10, color: 'var(--text-muted)', background: 'rgba(200,131,10,0.08)', padding: '2px 6px', borderRadius: 8, flexShrink: 0 }}>
                  {c.fruitName}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── 异色精灵选择弹窗（S1/S2 赛季分Tab） ────────────────────────────────────────
function ShinyPickerModal({ pendingShinies, setPendingShinies, togglePending, spirits, onCancel, onConfirm }) {
  const [activeSeason, setActiveSeason] = useState('S1');
  const seasonData = ALL_SHINIES_BY_SEASON.find(s => s.season === activeSeason) || ALL_SHINIES_BY_SEASON[0];
  const currentGroups = seasonData.groups;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(30,25,20,0.6)',
        display: 'flex', alignItems: 'flex-end',
      }}
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div style={{
        width: '100%', maxHeight: '82vh',
        background: 'var(--bg)', borderRadius: '18px 18px 0 0',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.18)',
      }}>
        {/* 弹窗头部 */}
        <div style={{
          padding: '16px 18px 0',
          flexShrink: 0,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 12,
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
                onClick={() => {
                  const seasonItems = currentGroups.flatMap(g => g.items);
                  setPendingShinies(prev => {
                    const existing = prev.filter(n => !seasonItems.includes(n));
                    return [...existing, ...seasonItems];
                  });
                }}
                style={{
                  fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 8,
                  border: '1px solid var(--divider)', background: 'var(--card-inner)',
                  color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'var(--font-body)',
                }}
              >全选</button>
              <button
                onClick={() => {
                  const seasonItems = new Set(currentGroups.flatMap(g => g.items));
                  setPendingShinies(prev => prev.filter(n => !seasonItems.has(n)));
                }}
                style={{
                  fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 8,
                  border: '1px solid var(--divider)', background: 'var(--card-inner)',
                  color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'var(--font-body)',
                }}
              >清空</button>
            </div>
          </div>

          {/* S1 / S2 Tab */}
          <div style={{
            display: 'flex', gap: 0,
            background: 'var(--card-inner)', borderRadius: 10,
            padding: 3, marginBottom: 0,
            border: '1.5px solid var(--divider)',
          }}>
            {ALL_SHINIES_BY_SEASON.map(s => {
              const isActive = activeSeason === s.season;
              const count = s.groups.flatMap(g => g.items).filter(n => pendingShinies.includes(n)).length;
              return (
                <button
                  key={s.season}
                  onClick={() => setActiveSeason(s.season)}
                  style={{
                    flex: 1, padding: '7px 0', borderRadius: 8,
                    border: 'none', cursor: 'pointer',
                    fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 800,
                    background: isActive ? '#2B2A2E' : 'transparent',
                    color: isActive ? '#FBC839' : 'var(--text-muted)',
                    transition: 'all 0.15s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                  }}
                >
                  {s.label}
                  {count > 0 && (
                    <span style={{
                      fontSize: 10, fontWeight: 900,
                      background: isActive ? '#FBC839' : 'rgba(200,131,10,0.2)',
                      color: isActive ? '#2B2A2E' : '#C8830A',
                      borderRadius: 10, padding: '0 5px', lineHeight: '16px',
                      minWidth: 18, textAlign: 'center',
                    }}>{count}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 分割线 */}
        <div style={{ height: 1, background: 'var(--divider)', margin: '10px 0 0', flexShrink: 0 }} />

        {/* 精灵列表（分属系分组，可滚动） */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 18px 8px' }}>
          {currentGroups.map(group => (
            <div key={group.id} style={{ marginBottom: 18 }}>
              {/* 属系标题 */}
              <div style={{
                fontSize: 11, fontWeight: 800, color: 'var(--text-muted)',
                letterSpacing: 0.5, marginBottom: 10,
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                {group.iconImg
                  ? <img src={group.iconImg} alt={group.label} width={14} height={14} style={{ objectFit: 'contain' }} />
                  : <span>🌍</span>
                }
                {group.label}
                <span style={{
                  fontSize: 10, color: 'var(--text-muted)', fontWeight: 600,
                  background: 'rgba(103,93,83,0.1)', borderRadius: 8,
                  padding: '0 5px', lineHeight: '16px',
                }}>
                  {group.items.filter(n => pendingShinies.includes(n)).length}/{group.items.length}
                </span>
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
                        opacity: isSelected ? 1 : 0.38,
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
                          obtained={spirits[name]?.obtained}
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
            onClick={onCancel}
            style={{
              flex: 1, padding: '12px 0', borderRadius: 12,
              border: '1.5px solid var(--divider)', background: 'var(--card-inner)',
              color: 'var(--text-muted)', fontSize: 14, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'var(--font-body)',
            }}
          >取消</button>
          <button
            onClick={onConfirm}
            style={{
              flex: 2, padding: '12px 0', borderRadius: 12,
              border: 'none', background: '#2B2A2E',
              color: '#FBF7EC', fontSize: 14, fontWeight: 800,
              cursor: 'pointer', fontFamily: 'var(--font-body)',
            }}
          >确定（{pendingShinies.length} 只）</button>
        </div>
      </div>
    </div>
  );
}

// ── 属性相关辅助 ──────────────────────────────────────────────────────────────
const ATTR_OPTIONS_FULL = [
  { id: 'fire', label: '火系' }, { id: 'ice', label: '冰系' }, { id: 'electric', label: '电系' },
  { id: 'phantom', label: '幻系' }, { id: 'grass', label: '草系' }, { id: 'evil', label: '恶系' },
  { id: 'ghost', label: '幽系' }, { id: 'mech', label: '机械系' }, { id: 'light', label: '光系' },
  { id: 'water', label: '水系' }, { id: 'cute', label: '萌系' }, { id: 'normal', label: '普通系' },
  { id: 'earth', label: '岩系' }, { id: 'wing', label: '翼系' }, { id: 'dragon', label: '龙系' },
  { id: 'poison', label: '毒系' }, { id: 'ground', label: '地系' }, { id: 'bug', label: '虫系' },
  { id: 'fighting', label: '武系' },
];
function getAttrCfg(attrId) {
  const opt = ATTR_OPTIONS_FULL.find(o => o.id === attrId);
  if (!opt) return null;
  const cfg = ATTR_CONFIG[opt.label] || {};
  return { label: opt.label, color: cfg.color || '#675D53', bg: cfg.bg || '#F0EAE0', icon: cfg.icon || null };
}

/** 属性 tag + 点击修改按钮 */
function FruitAttrPicker({ attrId, onPick }) {
  const cfg = attrId ? getAttrCfg(attrId) : null;
  if (cfg) {
    return (
      <button onClick={onPick} title="点击修改属性" style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '3px 8px', borderRadius: 16,
        border: `1.5px solid ${cfg.color}55`, background: cfg.bg, color: cfg.color,
        fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'var(--font-body)', flexShrink: 0,
      }}>
        {cfg.icon && <img src={cfg.icon} alt={cfg.label} width={12} height={12} style={{ objectFit: 'contain' }} />}
        {cfg.label}
        <span style={{ fontSize: 9, opacity: 0.65, marginLeft: 1 }}>✎</span>
      </button>
    );
  }
  return (
    <button onClick={onPick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: 16,
      border: '1.5px dashed rgba(200,53,26,0.55)', background: 'rgba(200,53,26,0.08)',
      color: 'rgba(200,53,26,0.95)', fontSize: 11, fontWeight: 800,
      cursor: 'pointer', fontFamily: 'var(--font-body)', flexShrink: 0,
    }}>⚠ 选属性</button>
  );
}

/** 属性选择 Bottom Sheet（供单个果实槽位改属性用） */
function AttrPickerSheet({ open, onClose, value, onChange }) {
  if (!open) return null;
  return createPortal(
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      zIndex: 500, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 480, background: 'var(--card)',
        borderTopLeftRadius: 20, borderTopRightRadius: 20,
        boxShadow: '0 -6px 30px rgba(0,0,0,0.25)', padding: '14px 16px 28px',
        maxHeight: '70vh', overflowY: 'auto',
      }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--divider)', margin: '0 auto 12px' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: 14, fontWeight: 900, color: 'var(--text)', fontFamily: 'var(--font-display)' }}>选择果实属性</span>
          <button onClick={() => { onChange(null); onClose(); }} style={{
            fontSize: 11, fontWeight: 700, padding: '4px 10px',
            border: '1px solid var(--divider)', borderRadius: 16,
            background: 'var(--card-inner)', color: 'var(--text-muted)',
            cursor: 'pointer', fontFamily: 'var(--font-body)',
          }}>清空</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {ATTR_OPTIONS_FULL.map(o => {
            const cfg = getAttrCfg(o.id);
            const isActive = value === o.id;
            return (
              <button key={o.id} onClick={() => { onChange(o.id); onClose(); }} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                padding: '8px 6px', borderRadius: 10, cursor: 'pointer',
                border: isActive ? `2px solid ${cfg.color}` : '1.5px solid var(--divider)',
                background: isActive ? cfg.bg : 'var(--card-inner)',
                color: isActive ? cfg.color : 'var(--text-light)',
                fontSize: 12, fontWeight: isActive ? 900 : 700, fontFamily: 'var(--font-body)',
                transition: 'all 0.15s',
              }}>
                {cfg.icon && <img src={cfg.icon} alt={cfg.label} width={16} height={16} style={{ objectFit: 'contain' }} />}
                {cfg.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>,
    document.getElementById('modal-root') || document.body
  );
}

/**
 * 方案属系选择 Bottom Sheet（方案级，含「混池」选项）
 * value: attrId 字符串 | 'world'（混池） | null（未选）
 */
function PlanAttrSelectorSheet({ open, onClose, value, onChange }) {
  if (!open) return null;
  const isWorld = value === 'world';
  return createPortal(
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      zIndex: 500, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 480, background: 'var(--card)',
        borderTopLeftRadius: 20, borderTopRightRadius: 20,
        boxShadow: '0 -6px 30px rgba(0,0,0,0.25)', padding: '14px 16px 28px',
        maxHeight: '75vh', overflowY: 'auto',
      }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--divider)', margin: '0 auto 12px' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 900, color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
              选择方案属系
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
              选填；用于快速预填果实 & 筛选参考
            </div>
          </div>
          {value && (
            <button onClick={() => { onChange(null); onClose(); }} style={{
              fontSize: 11, fontWeight: 700, padding: '4px 10px',
              border: '1px solid var(--divider)', borderRadius: 16,
              background: 'var(--card-inner)', color: 'var(--text-muted)',
              cursor: 'pointer', fontFamily: 'var(--font-body)',
            }}>清除</button>
          )}
        </div>

        {/* 「混池」特殊选项 */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, letterSpacing: 0.5 }}>
            特殊模式
          </div>
          <button
            onClick={() => { onChange('world'); onClose(); }}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px', borderRadius: 12, cursor: 'pointer',
              border: isWorld ? '2px solid #7E57C2' : '1.5px solid var(--divider)',
              background: isWorld ? 'rgba(126,87,194,0.08)' : 'var(--card-inner)',
              fontFamily: 'var(--font-body)', transition: 'all 0.15s',
            }}
          >
            <span style={{
              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
              background: isWorld ? 'rgba(126,87,194,0.18)' : 'rgba(103,93,83,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16,
            }}>🌍</span>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div style={{ fontSize: 13, fontWeight: isWorld ? 900 : 700, color: isWorld ? '#7E57C2' : 'var(--text)' }}>
                混池（世界池）
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
                跨属性混刷，进全局共享世界池；不影响各果实的单独属性
              </div>
            </div>
            {isWorld && <span style={{ fontSize: 14, color: '#7E57C2', fontWeight: 900 }}>✓</span>}
          </button>
        </div>

        {/* 属系列表 */}
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, letterSpacing: 0.5 }}>
          按属系
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {ATTR_OPTIONS_FULL.map(o => {
            const cfg = getAttrCfg(o.id);
            const isActive = value === o.id;
            return (
              <button key={o.id} onClick={() => { onChange(o.id); onClose(); }} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                padding: '8px 6px', borderRadius: 10, cursor: 'pointer',
                border: isActive ? `2px solid ${cfg.color}` : '1.5px solid var(--divider)',
                background: isActive ? cfg.bg : 'var(--card-inner)',
                color: isActive ? cfg.color : 'var(--text-light)',
                fontSize: 12, fontWeight: isActive ? 900 : 700, fontFamily: 'var(--font-body)',
                transition: 'all 0.15s',
              }}>
                {cfg.icon && <img src={cfg.icon} alt={cfg.label} width={16} height={16} style={{ objectFit: 'contain' }} />}
                {cfg.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>,
    document.getElementById('modal-root') || document.body
  );
}

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

// 已拥有果实快选芯片（按当前属性系别过滤，未选属性时隐藏）
function OwnedFruitPicker({ ownedFruits, onSelect, currentValue, attrLabel, fruitAttrsMap, excludeFruits = [] }) {
  // 未选属性时直接不渲染；只展示第一属性匹配当前选择系别的果实
  if (!attrLabel) return null;
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

  // 初始值（新建时不预选属系，编辑时读已存值；forceWorld 时用 'world' 表示）
  const initAttrId = existingUserPlan?.forceWorld
    ? 'world'
    : existingUserPlan?.attrId || basePlanId || null;
  const initLabel  = existingUserPlan?.label  || '';

  // 初始化 fruits 数组（兼容新旧两种格式），每槽额外带 attrManual（手动指定属性）
  const initFruits = useMemo(() => {
    if (existingUserPlan) {
      const arr = getPlanFruitsArray(existingUserPlan);
      if (arr.length > 0) return arr.map(f => ({ fruit: f.fruit || '', spirit: f.spirit || '', attrManual: null }));
    }
    if (basePlan) {
      const arr = getPlanFruitsArray(basePlan);
      if (arr.length > 0) return arr.map(f => ({ fruit: f.fruit || '', spirit: f.spirit || '', attrManual: null }));
    }
    return [{ fruit: '', spirit: '', attrManual: null }, { fruit: '', spirit: '', attrManual: null }];
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [attrId,  setAttrId]  = useState(initAttrId);
  const [label,   setLabel]   = useState(initLabel);
  // fruits 是数组：[{ fruit, spirit, attrManual }, ...]，最多 6 个
  const [fruits,  setFruits]  = useState(initFruits);
  // 属性 picker sheet 开关：记录当前打开的槽位 index（null 表示关闭）
  const [attrPickerIdx, setAttrPickerIdx] = useState(null);
  // 方案属系选择弹窗
  const [showAttrSelector, setShowAttrSelector] = useState(false);
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
    setFruits(prev => prev.map((f, i) => {
      if (i !== idx) return f;
      // 修改果实名时，清掉手动指定的属性（让自动识别重新接管）
      if (field === 'fruit') return { ...f, fruit: value, attrManual: null };
      return { ...f, [field]: value };
    }));
  };

  // 设置果实数量（增减槽位）
  const setFruitCount = (count) => {
    setFruits(prev => {
      if (count > prev.length) {
        return [...prev, ...Array(count - prev.length).fill({ fruit: '', spirit: '', attrManual: null })];
      } else {
        return prev.slice(0, count);
      }
    });
  };

  const handleSave = () => {
    // 过滤掉空槽
    const validFruits = fruits.filter(f => f.fruit?.trim() || f.spirit?.trim());
    const isForceWorld = attrId === 'world';
    const plan = {
      id: existingUserPlan?.id || undefined,
      // 混池时 attrId 置 null，用 forceWorld 标记走世界池
      attrId: isForceWorld ? null : attrId,
      forceWorld: isForceWorld || undefined,
      label: label.trim() || `${isForceWorld ? '混池' : (currentAttr?.label || '自定义')}方案`,
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

  // 切换属性时，预填默认值 + 重置 shinies（'world' = 混池，直接设置）
  const handleAttrChange = (id) => {
    setAttrId(id);
    if (id === 'world') {
      // 混池：不预填果实，shinies 不重置（保持用户已选）
      return;
    }
    // 每次切换具体属系，shinies 重置为新属系全选
    setSelectedShinies(getShinisByAttr(id));
    if (!isEditing) {
      if (id) {
        const base = PLANS.find(p => p.id === id);
        if (base) {
          const arr = getPlanFruitsArray(base);
          if (arr.length > 0) {
            setFruits(arr.map(f => ({ fruit: f.fruit || '', spirit: f.spirit || '', attrManual: null })));
          } else {
            setFruits([{ fruit: '', spirit: '', attrManual: null }, { fruit: '', spirit: '', attrManual: null }]);
          }
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

      {/* ── 方案名称 + 属系选择（行内入口） ── */}
      <div className="card animate-in" style={{ animationDelay: '0.04s' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 800 }}>方案名称</span>
          {/* 属系行内选择按钮 */}
          <button
            onClick={() => setShowAttrSelector(true)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '4px 10px', borderRadius: 16, cursor: 'pointer',
              border: attrId === 'world'
                ? '1.5px solid #7E57C2'
                : attrId
                  ? `1.5px solid ${getAttrCfg(attrId)?.color || '#C8830A'}55`
                  : '1.5px dashed var(--divider)',
              background: attrId === 'world'
                ? 'rgba(126,87,194,0.08)'
                : attrId
                  ? (getAttrCfg(attrId)?.bg || 'var(--card-inner)')
                  : 'var(--card-inner)',
              color: attrId === 'world'
                ? '#7E57C2'
                : attrId
                  ? (getAttrCfg(attrId)?.color || '#C8830A')
                  : 'var(--text-muted)',
              fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-body)',
              transition: 'all 0.15s',
            }}
          >
            {attrId === 'world' ? (
              <><span>🌍</span><span>混池</span></>
            ) : attrId && getAttrCfg(attrId) ? (
              <>
                {getAttrCfg(attrId).icon && (
                  <img src={getAttrCfg(attrId).icon} width={12} height={12} alt=""
                    style={{ objectFit: 'contain' }} />
                )}
                <span>{getAttrCfg(attrId).label}</span>
              </>
            ) : (
              <span>选属系</span>
            )}
            <span style={{ fontSize: 9, opacity: 0.55 }}>▾</span>
          </button>
        </div>
        <input
          className="input-field"
          value={label}
          onChange={e => setLabel(e.target.value)}
          maxLength={16}
          placeholder="推荐填写庇护所名称，如「星霜崖」"
        />
      </div>

      {/* ── 精灵 & 果实配置 ── */}
      <div className="card animate-in" style={{ animationDelay: '0.06s' }}>
        <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 4 }}>精灵 & 果实配置</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10, lineHeight: 1.6 }}>
          {attrId === 'world'
            ? <>此方案强制走<strong style={{ color: '#7E57C2' }}>世界池（跨属混刷）</strong>，不影响各槽果实的单独属性识别。</>
            : currentAttr
              ? <>所有果实的精灵都是<strong style={{ color: 'var(--text-light)' }}>{currentAttr.label}</strong>精灵，才能有效攒属系池；属系不同则进世界池。</>
              : '同属性精灵的果实进属系池；属系不同则进世界池。可在右上角选择属系以快速预填。'
          }
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
          // 自动识别属性（支持精灵名/果实名/进化形态/别名）
          const autoAttr = slot.fruit?.trim() ? getAttrByAnyName(slot.fruit.trim()) : null;
          const resolvedAttr = slot.attrManual ?? autoAttr; // 手动 > 自动
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
                    <FruitInput
                      value={slot.fruit}
                      onChange={(val) => {
                        updateSlot(idx, 'fruit', val);
                        // 如果选中的是精灵条目，自动反查精灵名填入
                        const spiritName = val.endsWith('果实')
                          ? (val.slice(0, -2))
                          : val;
                        if (!slot.spirit?.trim()) {
                          const guessedSpirit = getFruitBySpirit(spiritName)
                            ? spiritName
                            : fruitSpiritMap[val] || '';
                          if (guessedSpirit) updateSlot(idx, 'spirit', guessedSpirit);
                        }
                      }}
                      placeholder={idx === 0 ? '输入精灵名或果实名' : '精灵名/果实名'}
                      required={isRequired}
                    />
                    {slot.fruit?.trim() && (
                      <FruitTag name={slot.fruit.trim()} size={24} showName={false} />
                    )}
                  </div>
                  {/* 属性识别行 */}
                  {slot.fruit?.trim() && (
                    <div style={{ marginTop: 5, display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>属系：</span>
                      <FruitAttrPicker
                        attrId={resolvedAttr}
                        onPick={() => setAttrPickerIdx(idx)}
                      />
                      {!resolvedAttr && (
                        <span style={{ fontSize: 10, color: 'rgba(200,53,26,0.8)', fontWeight: 600 }}>
                          未识别，点右侧手动指定
                        </span>
                      )}
                    </div>
                  )}
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

    {/* ── 果实属性选择 Bottom Sheet（单槽位） ── */}
    <AttrPickerSheet
      open={attrPickerIdx !== null}
      onClose={() => setAttrPickerIdx(null)}
      value={attrPickerIdx !== null ? (fruits[attrPickerIdx]?.attrManual ?? getAttrByAnyName(fruits[attrPickerIdx]?.fruit?.trim() || '')) : null}
      onChange={(id) => {
        if (attrPickerIdx !== null) {
          setFruits(prev => prev.map((f, i) => i === attrPickerIdx ? { ...f, attrManual: id } : f));
        }
        setAttrPickerIdx(null);
      }}
    />

    {/* ── 方案属系选择 Bottom Sheet（方案级，含混池） ── */}
    <PlanAttrSelectorSheet
      open={showAttrSelector}
      onClose={() => setShowAttrSelector(false)}
      value={attrId}
      onChange={(id) => {
        if (id === 'world' || id === null) {
          setAttrId(id);
          if (id === null) setSelectedShinies([]);
        } else {
          handleAttrChange(id);
        }
      }}
    />

    {/* ── 异色精灵选择弹窗（S1/S2 赛季分Tab） ── */}
    {showShinyModal && createPortal(
      <ShinyPickerModal
        pendingShinies={pendingShinies}
        setPendingShinies={setPendingShinies}
        togglePending={togglePending}
        spirits={state.spirits}
        onCancel={() => setShowShinyModal(false)}
        onConfirm={confirmShinyModal}
      />,
      document.getElementById('modal-root') || document.body
    )}
    </>
  );
}
