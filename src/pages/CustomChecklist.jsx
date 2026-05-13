import { useState, useRef, useEffect, useMemo } from 'react';
import { useStore } from '../store';
import FruitTag from '../components/FruitTag';
import { getFruitAttr, getFruitBySpirit, getAllSpiritFruitPairs, getAttrByAnyName, FRUIT_ATTR } from '../data/plans';
import { FRUITS_WIKI_IMG } from '../data/fruits-wiki';
import { ATTR_CONFIG, ATTR_ID_TO_LABEL } from '../data/fruitGuide';

// 所有已知果实名（从 wiki 映射表 + 本地 public/fruits 合并，去重）
// 直接用 FRUITS_WIKI_IMG 的 key，覆盖量足够
const ALL_FRUIT_NAMES = Object.keys(FRUITS_WIKI_IMG).sort((a, b) => a.localeCompare(b, 'zh'));

/**
 * 候选项数据源：果实名 + 精灵名 合并去重（内置部分，模块顶层只跑一次）
 * 每条结构：{ key, fruitName, spiritName?, displayName, type: 'fruit' | 'spirit' | 'custom' }
 *   - fruit 项：displayName = "xxx果实"
 *   - spirit 项：displayName = "xxx（→ xxx果实）"，选中时把 fruitName 写入输入框
 *   - custom 项：来自用户自建果实（在组件内 useMemo 合并，运行时拼接）
 */
const BASE_CANDIDATES = (() => {
  const list = [];
  // 1) 果实条目
  for (const fruitName of ALL_FRUIT_NAMES) {
    list.push({
      key: `fruit:${fruitName}`,
      fruitName,
      displayName: fruitName,
      type: 'fruit',
    });
  }
  // 2) 精灵条目（去掉与果实名前缀重复的，避免重复展示）
  for (const { spirit, fruit } of getAllSpiritFruitPairs()) {
    // 如果精灵名 + "果实" 就是果实名本身（如 "小灵面" → "小灵面果实"），且果实条目已存在，
    // 则单独再加个"精灵名"条目让用户搜得到（输入"小灵面"时优先匹配到精灵条目，更直观）。
    list.push({
      key: `spirit:${spirit}`,
      fruitName: fruit,
      spiritName: spirit,
      displayName: spirit,
      type: 'spirit',
    });
  }
  return list;
})();

/**
 * 把 customFruits 转成候选项（同时插入 fruit / spirit 两条）
 * - 跳过 deleted=true 的墓碑
 * - 跳过 fruit 名命中内置 FRUITS_WIKI_IMG 的（避免和内置果实条目冲突）
 */
function buildCustomCandidates(customFruits) {
  const list = [];
  if (!Array.isArray(customFruits)) return list;
  for (const c of customFruits) {
    if (!c || c.deleted || !c.fruit) continue;
    if (FRUITS_WIKI_IMG[c.fruit]) continue;  // 内置图库已有 → 已被 BASE_CANDIDATES 覆盖
    list.push({
      key: `custom_fruit:${c.fruit}`,
      fruitName: c.fruit,
      displayName: c.fruit,
      type: 'custom',
      isCustom: true,
    });
    if (c.spirit && c.spirit !== c.fruit) {
      list.push({
        key: `custom_spirit:${c.spirit}`,
        fruitName: c.fruit,
        spiritName: c.spirit,
        displayName: c.spirit,
        type: 'custom',
        isCustom: true,
      });
    }
  }
  return list;
}

/** 果实名输入框 + 自动补全下拉（同时支持果实名和精灵名搜索） */
function FruitInput({ value, onChange, placeholder, required, candidates }) {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  // 过滤候选项：输入内容在果实名/精灵名中出现（忽略 "果实" 后缀方便搜索）
  const query = value.trim();
  const suggestions = useMemo(() => {
    if (query.length === 0) return [];
    const q = query.endsWith('果实') ? query.slice(0, -2) : query;
    const matched = candidates.filter(c => {
      // fruit / custom 类型只有 fruitName，按 fruitName 匹配
      if (!c.spiritName) {
        return c.fruitName.includes(q) || c.fruitName.replace('果实', '').includes(q);
      }
      // spirit / custom 含 spiritName 的：匹配精灵名 OR 对应果实名
      return c.spiritName.includes(q) || c.fruitName.includes(q);
    });
    // 去重：同一个 fruitName 在 fruit 和 spirit 两类里都出现时，
    // 优先保留更接近用户输入的（如果输入的就是精灵名前缀，spirit 项排前）
    const seen = new Set();
    const result = [];
    // 排序：完全匹配的精灵名排最前 → 精灵名前缀匹配 → 果实条目
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
      // 同一 fruitName 只展示一条：优先精灵条目（如果用户搜索的是精灵关键字）
      const dedupKey = c.fruitName;
      if (seen.has(dedupKey)) continue;
      seen.add(dedupKey);
      result.push(c);
      if (result.length >= 8) break;
    }
    return result;
  }, [query, candidates]);

  // 点击外部关闭
  useEffect(() => {
    const handleClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selectCandidate = (c) => {
    // 不论用户点的是果实条目还是精灵条目，最终写入输入框的都是 fruitName
    // 这样下游 getFruitAttr / FruitTag 都能正常用
    onChange(c.fruitName);
    setOpen(false);
    inputRef.current?.blur();
  };

  // 用户失焦/回车但没在候选里选时，尝试自动把"精灵名"转成"果实名"
  const tryAutoConvertSpirit = () => {
    const v = value.trim();
    if (!v) return;
    // 已经是 "xxx果实" 结尾，无需转换
    if (v.endsWith('果实')) return;
    // 是精灵名 → 找对应果实
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
          background: '#FBF7EC',
          border: '1.5px solid var(--card-border)',
          borderRadius: 10,
          boxShadow: '0 4px 16px rgba(43,42,46,0.14)',
          zIndex: 300,
          overflow: 'hidden',
          maxHeight: 260,
          overflowY: 'auto',
        }}>
          {suggestions.map((c, i) => (
            <div
              key={c.key}
              onMouseDown={() => selectCandidate(c)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 12px',
                cursor: 'pointer',
                background: i === highlighted ? 'rgba(200,131,10,0.08)' : 'transparent',
                borderBottom: i < suggestions.length - 1 ? '1px solid var(--divider)' : 'none',
                transition: 'background 0.1s',
              }}
              onMouseEnter={() => setHighlighted(i)}
            >
              <FruitTag name={c.fruitName} size={26} showName={false} />
              <span style={{
                fontSize: 13, fontWeight: 700, color: 'var(--text)',
                fontFamily: 'var(--font-body)', flex: 1, minWidth: 0,
              }}>
                {c.displayName}
              </span>
              {c.spiritName && c.displayName !== c.fruitName && (
                <span style={{
                  fontSize: 10, color: 'var(--text-muted)',
                  background: 'rgba(200,131,10,0.08)',
                  padding: '2px 6px', borderRadius: 8,
                  flexShrink: 0,
                }}>
                  {c.fruitName}
                </span>
              )}
              {c.isCustom && (
                <span style={{
                  fontSize: 9, fontWeight: 800,
                  padding: '1px 5px', borderRadius: 6,
                  color: '#7E57C2', background: 'rgba(126,87,194,0.10)',
                  border: '1px solid rgba(126,87,194,0.35)',
                  flexShrink: 0,
                }}>
                  自建
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// 属系 id → 展示配置（与 fruitGuide 的 ATTR_CONFIG 对齐，但改成按 id 索引）
// 这里覆盖 18 个属性，对应 FRUIT_ATTR 中可能出现的所有属系 id；
// 自定义方案的果实可能是任何属性（包括 fruitB 跨属选 normal/poison/wing 等），
// 所以「属性选择器」需要让所有 18 系都能选。
const ATTR_OPTIONS_FULL = [
  { id: 'fire',     label: '火系'   },
  { id: 'ice',      label: '冰系'   },
  { id: 'electric', label: '电系'   },
  { id: 'phantom',  label: '幻系'   },
  { id: 'grass',    label: '草系'   },
  { id: 'evil',     label: '恶系'   },
  { id: 'ghost',    label: '幽系'   },
  { id: 'mech',     label: '机械系' },
  { id: 'light',    label: '光系'   },
  { id: 'water',    label: '水系'   },
  { id: 'cute',     label: '萌系'   },
  { id: 'normal',   label: '普通系' },
  { id: 'earth',    label: '岩系'   },
  { id: 'wing',     label: '翼系'   },
  { id: 'dragon',   label: '龙系'   },
  { id: 'poison',   label: '毒系'   },
  { id: 'ground',   label: '地系'   },
  { id: 'bug',      label: '虫系'   },
  { id: 'fighting', label: '武系'   },
];
const ATTR_OPTION_MAP = ATTR_OPTIONS_FULL.reduce((acc, o) => { acc[o.id] = o; return acc; }, {});
// 取 fruitGuide.ATTR_CONFIG 里的颜色/图标，没有就给个兜底
function getAttrCfg(attrId) {
  const opt = ATTR_OPTION_MAP[attrId];
  if (!opt) return null;
  const cfg = ATTR_CONFIG[opt.label] || {};
  return {
    label: opt.label,
    color: cfg.color || '#675D53',
    bg: cfg.bg || '#F0EAE0',
    icon: cfg.icon || null,
  };
}

/** 单个属系 tag 组件 */
function AttrTag({ attrId }) {
  const cfg = getAttrCfg(attrId);
  if (!cfg) return null;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 800,
      color: cfg.color, background: cfg.bg,
      border: `1px solid ${cfg.color}55`,
    }}>
      {cfg.icon && (
        <img src={cfg.icon} alt={cfg.label} width={11} height={11}
          style={{ objectFit: 'contain', verticalAlign: 'middle' }} />
      )}
      {cfg.label}
    </span>
  );
}

/**
 * 属性选择器 Bottom Sheet（在 18 个属性里选一个，可清空）
 * - value: 当前 attrId（可空）
 * - onChange(attrId|null)
 * - title: Sheet 标题
 * - allowClear: 是否允许清空（默认 true）
 */
function AttrPickerSheet({ open, onClose, value, onChange, title = '选择属性', allowClear = true }) {
  if (!open) return null;
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
          maxHeight: '70vh', overflowY: 'auto',
        }}
      >
        {/* 拖拽把手 */}
        <div style={{
          width: 36, height: 4, borderRadius: 2,
          background: 'var(--divider)', margin: '0 auto 12px',
        }} />
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 12,
        }}>
          <span style={{ fontSize: 14, fontWeight: 900, color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
            {title}
          </span>
          {allowClear && (
            <button
              onClick={() => { onChange(null); onClose(); }}
              style={{
                fontSize: 11, fontWeight: 700, padding: '4px 10px',
                border: '1px solid var(--divider)', borderRadius: 16,
                background: 'var(--card-inner)', color: 'var(--text-muted)',
                cursor: 'pointer', fontFamily: 'var(--font-body)',
              }}
            >清空</button>
          )}
        </div>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8,
        }}>
          {ATTR_OPTIONS_FULL.map(o => {
            const cfg = getAttrCfg(o.id);
            const isActive = value === o.id;
            return (
              <button
                key={o.id}
                onClick={() => { onChange(o.id); onClose(); }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                  padding: '8px 6px', borderRadius: 10, cursor: 'pointer',
                  border: isActive ? `2px solid ${cfg.color}` : '1.5px solid var(--divider)',
                  background: isActive ? cfg.bg : 'var(--card-inner)',
                  color: isActive ? cfg.color : 'var(--text-light)',
                  fontSize: 12, fontWeight: isActive ? 900 : 700,
                  fontFamily: 'var(--font-body)',
                  transition: 'all 0.15s',
                }}
              >
                {cfg.icon && (
                  <img src={cfg.icon} alt={cfg.label} width={16} height={16}
                    style={{ objectFit: 'contain' }} />
                )}
                {cfg.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * 内联「属性选择」按钮 + 提示（用于果实输入框右侧）
 * - 自动识别成功：显示当前属性 tag + 「✎ 改」小按钮
 * - 自动识别失败 / 用户清空：高亮提示「请选择属性」按钮
 * - 用户已手动选过：显示属性 tag + 「✎ 改」小按钮
 */
function FruitAttrPicker({ attrId, isManual, onPick, label = '属性' }) {
  const cfg = attrId ? getAttrCfg(attrId) : null;
  if (cfg) {
    return (
      <button
        onClick={onPick}
        title={isManual ? '已手动指定' : '自动识别（点击修改）'}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '4px 8px', borderRadius: 16,
          border: `1.5px solid ${cfg.color}55`,
          background: cfg.bg, color: cfg.color,
          fontSize: 11, fontWeight: 800, cursor: 'pointer',
          fontFamily: 'var(--font-body)', flexShrink: 0,
        }}
      >
        {cfg.icon && (
          <img src={cfg.icon} alt={cfg.label} width={12} height={12}
            style={{ objectFit: 'contain' }} />
        )}
        {cfg.label}
        <span style={{ fontSize: 9, opacity: 0.65, marginLeft: 1 }}>✎</span>
      </button>
    );
  }
  // 没有属性：高亮提示
  return (
    <button
      onClick={onPick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '4px 10px', borderRadius: 16,
        border: '1.5px dashed rgba(200,53,26,0.55)',
        background: 'rgba(200,53,26,0.08)',
        color: 'rgba(200,53,26,0.95)',
        fontSize: 11, fontWeight: 800, cursor: 'pointer',
        fontFamily: 'var(--font-body)', flexShrink: 0,
      }}
    >
      ⚠ 选{label}
    </button>
  );
}

// saveOnly=true：从方案库「新建」入口进入，仅保存方案，不立即开始刷取
export default function CustomChecklist({ navigate, goBack, saveOnly = false }) {
  const { state, dispatch } = useStore();
  const customFruits = state.customFruits || [];

  // 候选数据源：内置 BASE_CANDIDATES + 用户自建果实（运行时合并）
  const candidates = useMemo(
    () => [...BASE_CANDIDATES, ...buildCustomCandidates(customFruits)],
    [customFruits]
  );

  const [label, setLabel]     = useState('');
  const [fruitA, setFruitA]   = useState('');
  const [fruitB, setFruitB]   = useState('');
  const [shiniesRaw, setShiniesRaw] = useState(''); // 逗号分隔的精灵名

  // ── 咕噜球库存 state（与 Checklist.jsx 内置方案保持一致）──────────────────
  // 仅在 saveOnly=false（即从首页「开始新刷取」入口进入需立即开刷）时使用
  const [ballMode,  setBallMode]  = useState('simple'); // 'simple' | 'byType'
  const [ballInput, setBallInput] = useState('');       // simple 模式
  const [ballAdv,   setBallAdv]   = useState('');       // byType 高级球
  const [ballSea,   setBallSea]   = useState('');       // byType 赛季球
  const [ballAtt,   setBallAtt]   = useState('');       // byType 属性球

  // ── 属性手动指定 state ─────────────────────────────────────────────────────
  // null 表示未手动指定，由果实名自动识别；非 null 表示用户在 Sheet 里手动选了
  const [attrAManual,   setAttrAManual]   = useState(null);
  const [attrBManual,   setAttrBManual]   = useState(null);

  // 属性 Sheet 开关（用 'A' / 'B' 标识打开哪一个）
  const [pickerOpen, setPickerOpen] = useState(null); // null | 'A' | 'B'

  const canStart = fruitA.trim().length > 0;

  // 实时识别属系（自动）：用 getAttrByAnyName 支持精灵名 / 果实名 / 进化形态名 / 别名
  // 这样输入"恶魔狼"/"光纤兽"/"燃了鸭"等精灵名也能立即识别属性，不必输入完整果实名
  const autoAttrA = useMemo(() => getAttrByAnyName(fruitA.trim()), [fruitA]);
  const autoAttrB = useMemo(() => fruitB.trim() ? getAttrByAnyName(fruitB.trim()) : null, [fruitB]);

  // 用户手动 > 自动识别
  const attrA = attrAManual ?? autoAttrA;
  const attrB = attrBManual ?? autoAttrB;

  // ── 自动推导方案的池类型 ───────────────────────────────────────────────────
  // 规则：
  //   - 只填果实A（无B），且 A 有属性  → 属性池方案（attr）
  //   - A、B 都填，且 A 属性 = B 属性  → 属性池方案（attr）
  //   - A、B 都填，且 A 属性 ≠ B 属性  → 世界池方案（world）
  //   - 属性识别不出来                  → 世界池方案（world）兜底
  // 注：自定义方案没有「指定家族头」的语义，故不主动推导家族池；家族池作为
  //     属性池方案下「目标精灵自身出货」时由 classifyPool 在记录时判定。
  const poolKind = useMemo(() => {
    if (!attrA) return 'world';
    if (!fruitB.trim()) return 'attr';
    if (attrA && attrB && attrA === attrB) return 'attr';
    return 'world';
  }, [attrA, attrB, fruitB]);

  const POOL_LABEL = { attr: '属性池方案', world: '世界池方案' };

  // 改果实名时清掉对应的 manual 标记（让自动识别接管，避免旧手动选项残留）
  const handleFruitAChange = (v) => {
    setFruitA(v);
    setAttrAManual(null);
  };
  const handleFruitBChange = (v) => {
    setFruitB(v);
    setAttrBManual(null);
  };

  const buildPlan = () => {
    const id       = `custom_${Date.now()}`;
    const planLabel = label.trim() || '自定义方案';
    const fa       = fruitA.trim();
    const fb       = fruitB.trim() || null;
    const sa       = fa.endsWith('果实') ? fa.slice(0, -2) : fa;
    const sb       = fb ? (fb.endsWith('果实') ? fb.slice(0, -2) : fb) : null;
    const shinies  = shiniesRaw.trim()
      ? shiniesRaw.split(/[，,、\s]+/).map(s => s.trim()).filter(Boolean)
      : (sa ? [sa] : []);
    // attrId 自动推导：
    //   属性池方案 → 用 attrA（具体属性 id），让方案库/筛选按属性归类
    //   世界池方案 → 'custom'，不归入任一具体属性 tab
    const computedAttrId = poolKind === 'attr' ? (attrA || 'custom') : 'custom';
    return {
      id,
      attrId: computedAttrId,
      label: planLabel, type: planLabel,
      fruitA: fa, fruitB: fb, spiritA: sa, spiritB: sb, shinies,
      attrA: attrA || null,   // 果实A的属系 id（用于出货池识别）
      attrB: attrB || null,   // 果实B的属系 id
      // 是否为用户手动指定，便于后续判定/审计
      attrAManual: !!attrAManual,
      attrBManual: !!attrBManual,
      // 系统自动推导的方案池类型（'attr' | 'world'），便于上层展示和审计
      poolKind,
      season: false, custom: true,
    };
  };

  // 把方案里填的 fruit 同步到 customFruits（仅非内置果实）
  // - 归一化：用户输入「哈密瓜」/「哈密瓜果实」统一存为「哈密瓜果实」
  //   （与攻略页 CustomFruitSheet 的 previewFruit 规则保持一致，避免重复条目）
  // - 内置果实跳过：FRUIT_ATTR 命中，保护内置数据
  // - 未识别属性（attrId 为空）跳过：避免攻略页出现没有属性的空条目
  // - source='plan' + fromPlanId：标记同步来源，自建角标显示「自建·方案」
  const syncFruitToGuide = (fruitName, spiritName, attrId, planId) => {
    const raw = (fruitName || '').trim();
    if (!raw) return;
    if (!attrId) return;
    // 归一化为「XX果实」
    const fruit = raw.endsWith('果实') ? raw : `${raw}果实`;
    if (Object.prototype.hasOwnProperty.call(FRUIT_ATTR, fruit)) return;
    const attrLabel = ATTR_ID_TO_LABEL[attrId];
    const spirit = (spiritName || '').trim() || fruit.replace(/果实$/, '');
    dispatch({
      type: 'ADD_CUSTOM_FRUIT',
      fruit,
      spirit,
      attrs: attrLabel ? [attrLabel] : [],
      attrId,
      unlock: '由自定义方案添加',
      source: 'plan',
      fromPlanId: planId,
    });
  };

  // 仅保存方案，返回方案库
  const handleSave = () => {
    if (!canStart) return;
    const plan = buildPlan();
    dispatch({ type: 'SAVE_USER_PLAN', plan });
    // 同步两个果实到攻略页（内置 / 未识别属性的会被自动跳过）
    syncFruitToGuide(plan.fruitA, plan.spiritA, plan.attrA, plan.id);
    syncFruitToGuide(plan.fruitB, plan.spiritB, plan.attrB, plan.id);
    goBack();
  };

  // 保存方案并立即开始刷取
  const handleStart = () => {
    if (!canStart) return;
    const plan = buildPlan();
    dispatch({ type: 'SAVE_USER_PLAN', plan });
    // 同步两个果实到攻略页（同 handleSave）
    syncFruitToGuide(plan.fruitA, plan.spiritA, plan.attrA, plan.id);
    syncFruitToGuide(plan.fruitB, plan.spiritB, plan.attrB, plan.id);

    // 球数 payload，与 Checklist.jsx 内置方案一致：
    //   simple → ballMode='simple', ballStart=number|null
    //   byType → ballMode='byType', ballStartByType={adv,sea,att}|null
    let ballPayload;
    if (ballMode === 'byType') {
      const adv = parseInt(ballAdv.trim(), 10) || 0;
      const sea = parseInt(ballSea.trim(), 10) || 0;
      const att = parseInt(ballAtt.trim(), 10) || 0;
      const hasAny = ballAdv.trim() || ballSea.trim() || ballAtt.trim();
      ballPayload = {
        ballMode: 'byType',
        ballStartByType: hasAny ? { adv, sea, att } : null,
      };
    } else {
      const parsed = ballInput.trim() ? parseInt(ballInput.trim(), 10) : null;
      const valid = (parsed != null && !isNaN(parsed) && parsed >= 0) ? parsed : null;
      ballPayload = {
        ballMode: 'simple',
        ballStart: valid,
      };
    }

    dispatch({
      type: 'START_TASK',
      planId: plan.id,
      ...ballPayload,
    });
    navigate('recorder', { planId: plan.id });
  };

  return (
    <div style={{ paddingBottom: 24 }}>
      {/* 顶部 */}
      <div className="page-header">
        <button className="back-btn" onClick={goBack}><img src={`${import.meta.env.BASE_URL}back-icon.webp`} alt="返回" /></button>
        <span className="page-header-title">自定义刷取方案</span>
      </div>

      {/* 说明条 */}
      <div className="card" style={{ background: '#FFF9E0', border: '1.5px solid #C8A020', boxShadow: '0 2px 0 #C8A020', padding: '10px 14px' }}>
        <div style={{ fontSize: 12, color: 'var(--text-light)', lineHeight: 1.8 }}>
          填写你手头的果实，自定义刷取方案，灵活记录任意组合。
        </div>
      </div>

      {/* 方案名称 + 主属系 */}
      <div className="card animate-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 800 }}>
            方案名称 <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)' }}>（选填）</span>
          </span>
        </div>
        <input
          type="text"
          value={label}
          onChange={e => setLabel(e.target.value)}
          placeholder="例：幽系自定义 / 混合方案"
          className="input-field"
        />
      </div>

      {/* 果实 */}
      <div className="card animate-in" style={{ animationDelay: '0.04s' }}>
        <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 4 }}>果实配置</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.6 }}>
          填果实名后会自动识别属性；若识别不准（写错了名 / 不在果实库），点旁边属性标签手动指定，三池识别就能正确累计。
        </div>

        {/* 果实 A */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, letterSpacing: 0.4 }}>
            果实 A <span style={{ color: 'var(--cta)', fontWeight: 900 }}>*</span>（必填）
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FruitInput
              value={fruitA}
              onChange={handleFruitAChange}
              placeholder="输入精灵名或果实名，如：小灵面"
              required
              candidates={candidates}
            />
            {/* 选中后的大图预览：先做精灵→果实反查，确保用户输入精灵名（如"恶魔狼"）也能取到本地果实图 */}
            {fruitA.trim() && (
              <FruitTag
                name={getFruitBySpirit(fruitA.trim()) || fruitA.trim()}
                size={36}
                showName={false}
              />
            )}
          </div>
          {/* 属性行：自动识别 tag / 未识别提示 + 手动选择按钮 */}
          {fruitA.trim() && (
            <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                属系：
              </span>
              <FruitAttrPicker
                attrId={attrA}
                isManual={!!attrAManual}
                onPick={() => setPickerOpen('A')}
                label="果实A属性"
              />
              {!attrA && (
                <span style={{ fontSize: 10, color: 'rgba(200,53,26,0.85)', fontWeight: 600 }}>
                  未能识别，请手动指定，否则出货全部记为世界池
                </span>
              )}
              {attrA && !attrAManual && !autoAttrA && (
                // 理论上 autoAttrA 为空时 attrA 也只能来自 manual；这里做个兜底说明
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>（手动指定）</span>
              )}
            </div>
          )}
        </div>

        {/* 果实 B */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, letterSpacing: 0.4 }}>
            果实 B（选填）
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FruitInput
              value={fruitB}
              onChange={handleFruitBChange}
              placeholder="留空则单果实循环"
              candidates={candidates}
            />
            {/* 选中后的大图预览：同果实A，先做精灵→果实反查 */}
            {fruitB.trim() && (
              <FruitTag
                name={getFruitBySpirit(fruitB.trim()) || fruitB.trim()}
                size={36}
                showName={false}
              />
            )}
          </div>
          {/* 属性行 */}
          {fruitB.trim() && (
            <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                属系：
              </span>
              <FruitAttrPicker
                attrId={attrB}
                isManual={!!attrBManual}
                onPick={() => setPickerOpen('B')}
                label="果实B属性"
              />
              {!attrB && (
                <span style={{ fontSize: 10, color: 'rgba(200,53,26,0.85)', fontWeight: 600 }}>
                  未能识别，请手动指定
                </span>
              )}
            </div>
          )}
        </div>

        {/* 池子匹配说明（A 有属性时显示推导出的方案池类型） */}
        {fruitA.trim() && (
          <div style={{
            marginTop: 12, padding: '8px 10px', borderRadius: 8,
            background: 'var(--card-inner)', border: '1px solid var(--divider)',
            fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.7,
          }}>
            <span style={{ fontWeight: 800, color: 'var(--text-light)' }}>出货识别规则：</span>
            {!attrA
              ? <>果实A属性未识别，所有出货均归 <span style={{ fontWeight: 700 }}>世界池</span></>
              : poolKind === 'attr'
                ? <>本方案为 <span style={{ fontWeight: 800, color: 'var(--cta)' }}>{POOL_LABEL.attr}</span>，按属性池 80 次保底累计</>
                : <>本方案为 <span style={{ fontWeight: 800, color: 'var(--cta)' }}>{POOL_LABEL.world}</span>，按世界池 80 次保底累计</>
            }
          </div>
        )}
      </div>

      {/* 可出精灵 */}
      <div className="card animate-in" style={{ animationDelay: '0.07s' }}>
        <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 6 }}>
          可出异色精灵 <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)' }}>（选填）</span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, lineHeight: 1.6 }}>
          用逗号分隔多个精灵名，留空则自动填入果实A对应精灵
        </div>
        <input
          type="text"
          value={shiniesRaw}
          onChange={e => setShiniesRaw(e.target.value)}
          placeholder="例：空空颅, 小灵面"
          className="input-field"
        />
      </div>

      {/* 咕噜球库存（仅 saveOnly=false 即「开始新刷取」入口显示，与 Checklist.jsx 内置方案保持一致结构） */}
      {!saveOnly && (
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
            ].map(({ key, label: btnLabel }) => {
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
                  {btnLabel}
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
              ].map(({ label: rowLabel, value, setter, color }) => (
                <div key={rowLabel} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    fontSize: 12, fontWeight: 800, color,
                    minWidth: 42, flexShrink: 0,
                  }}>{rowLabel}</span>
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
      )}

      {/* 按钮 */}
      <button
        className={`btn animate-in${canStart ? ' btn-primary' : ''}`}
        style={{
          animationDelay: '0.12s',
          opacity: canStart ? 1 : 0.45,
          cursor: canStart ? 'pointer' : 'not-allowed',
          background: canStart ? undefined : '#B0A898',
          boxShadow: canStart ? undefined : 'none',
        }}
        onClick={saveOnly ? handleSave : handleStart}
        disabled={!canStart}
      >
        {saveOnly ? '保存方案' : '开始刷取'}
      </button>

      {/* ── 属性选择 Bottom Sheet ── */}
      <AttrPickerSheet
        open={pickerOpen === 'A'}
        onClose={() => setPickerOpen(null)}
        value={attrA}
        onChange={(id) => setAttrAManual(id)}
        title="选择果实 A 的属性"
      />
      <AttrPickerSheet
        open={pickerOpen === 'B'}
        onClose={() => setPickerOpen(null)}
        value={attrB}
        onChange={(id) => setAttrBManual(id)}
        title="选择果实 B 的属性"
      />
    </div>
  );
}
