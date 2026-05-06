import { useState, useRef, useEffect } from 'react';
import { useStore } from '../store';
import FruitTag from '../components/FruitTag';
import { getFruitAttr } from '../data/plans';
import { FRUITS_WIKI_IMG } from '../data/fruits-wiki';

// 所有已知果实名（从 wiki 映射表 + 本地 public/fruits 合并，去重）
// 直接用 FRUITS_WIKI_IMG 的 key，覆盖量足够
const ALL_FRUIT_NAMES = Object.keys(FRUITS_WIKI_IMG).sort((a, b) => a.localeCompare(b, 'zh'));

/** 果实名输入框 + 自动补全下拉 */
function FruitInput({ value, onChange, placeholder, required }) {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  // 过滤候选项：输入内容在果实名中出现（忽略"果实"后缀方便搜索）
  const query = value.trim();
  const suggestions = query.length === 0 ? [] : ALL_FRUIT_NAMES.filter(name => {
    const q = query.endsWith('果实') ? query.slice(0, -2) : query;
    return name.includes(q) || name.replace('果实', '').includes(q);
  }).slice(0, 8); // 最多展示 8 条

  // 点击外部关闭
  useEffect(() => {
    const handleClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const select = (name) => {
    onChange(name);
    setOpen(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e) => {
    if (!open || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlighted(h => Math.min(h + 1, suggestions.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setHighlighted(h => Math.max(h - 1, 0)); }
    if (e.key === 'Enter')     { e.preventDefault(); select(suggestions[highlighted]); }
    if (e.key === 'Escape')    { setOpen(false); }
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative', flex: 1 }}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true); setHighlighted(0); }}
        onFocus={() => { if (query.length > 0) setOpen(true); }}
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
          {suggestions.map((name, i) => (
            <div
              key={name}
              onMouseDown={() => select(name)}
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
              <FruitTag name={name} size={26} showName={false} />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-body)' }}>
                {name}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// 属系 id → 展示配置
const ATTR_CFG = {
  fire:     { label: '火系',   color: '#E8733A', bg: 'rgba(232,115,58,0.12)'  },
  ice:      { label: '冰系',   color: '#42A5F5', bg: 'rgba(66,165,245,0.12)'  },
  electric: { label: '电系',   color: '#FDD835', bg: 'rgba(253,216,53,0.14)'  },
  phantom:  { label: '幻系',   color: '#AB47BC', bg: 'rgba(171,71,188,0.12)'  },
  grass:    { label: '草系',   color: '#66BB6A', bg: 'rgba(102,187,106,0.12)' },
  evil:     { label: '恶系',   color: '#795548', bg: 'rgba(121,85,72,0.12)'   },
  ghost:    { label: '幽系',   color: '#7E57C2', bg: 'rgba(126,87,194,0.12)'  },
  mech:     { label: '机械系', color: '#78909C', bg: 'rgba(120,144,156,0.12)' },
  light:    { label: '光系',   color: '#FFB300', bg: 'rgba(255,179,0,0.13)'   },
};

/** 单个属系 tag 组件 */
function AttrTag({ attrId }) {
  const cfg = ATTR_CFG[attrId];
  if (!cfg) return null;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 800,
      color: cfg.color, background: cfg.bg,
      border: `1px solid ${cfg.color}55`,
    }}>
      {cfg.label}
    </span>
  );
}

// saveOnly=true：从方案库「新建」入口进入，仅保存方案，不立即开始刷取
export default function CustomChecklist({ navigate, goBack, saveOnly = false }) {
  const { dispatch } = useStore();

  const [label, setLabel]     = useState('');
  const [fruitA, setFruitA]   = useState('');
  const [fruitB, setFruitB]   = useState('');
  const [shiniesRaw, setShiniesRaw] = useState(''); // 逗号分隔的精灵名
  const [ballInput, setBallInput] = useState('');

  const canStart = fruitA.trim().length > 0;

  // 实时计算果实属系（用于界面提示和 buildPlan）
  const attrA = getFruitAttr(fruitA.trim());
  const attrB = fruitB.trim() ? getFruitAttr(fruitB.trim()) : null;

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
    return {
      id, attrId: 'custom', label: planLabel, type: planLabel,
      fruitA: fa, fruitB: fb, spiritA: sa, spiritB: sb, shinies,
      attrA: attrA || null,   // 果实A的属系 id（用于出货池识别）
      attrB: attrB || null,   // 果实B的属系 id
      season: false, custom: true,
    };
  };

  // 仅保存方案，返回方案库
  const handleSave = () => {
    if (!canStart) return;
    const plan = buildPlan();
    dispatch({ type: 'SAVE_USER_PLAN', plan });
    goBack();
  };

  // 保存方案并立即开始刷取
  const handleStart = () => {
    if (!canStart) return;
    const plan = buildPlan();
    dispatch({ type: 'SAVE_USER_PLAN', plan });
    const ballStart = ballInput.trim() ? parseInt(ballInput.trim(), 10) : null;
    dispatch({
      type: 'START_TASK',
      planId: plan.id,
      ballStart: (ballStart && !isNaN(ballStart)) ? ballStart : null,
    });
    navigate('recorder', { planId: plan.id });
  };

  return (
    <div style={{ paddingBottom: 24 }}>
      {/* 顶部 */}
      <div className="page-header">
        <button className="back-btn" onClick={goBack}><img src={`${import.meta.env.BASE_URL}back-icon.png`} alt="返回" /></button>
        <span className="page-header-title">自定义刷取方案</span>
      </div>

      {/* 说明条 */}
      <div className="card" style={{ background: '#FFF9E0', border: '1.5px solid #C8A020', boxShadow: '0 2px 0 #C8A020', padding: '10px 14px' }}>
        <div style={{ fontSize: 12, color: 'var(--text-light)', lineHeight: 1.8 }}>
          填写你手头的果实，自定义刷取方案，灵活记录任意组合。
        </div>
      </div>

      {/* 方案名称 */}
      <div className="card animate-in">
        <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>方案名称 <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)' }}>（选填）</span></div>
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
        <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 12 }}>果实配置</div>

        {/* 果实 A */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, letterSpacing: 0.4 }}>
            果实 A <span style={{ color: 'var(--cta)', fontWeight: 900 }}>*</span>（必填）
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FruitInput
              value={fruitA}
              onChange={setFruitA}
              placeholder="输入精灵名或果实名，如：小灵面"
              required
            />
            {/* 选中后的大图预览 */}
            {attrA && fruitA.trim() && (
              <FruitTag name={fruitA.trim()} size={36} showName={false} />
            )}
          </div>
          {/* 属系识别提示 */}
          {fruitA.trim() && (
            <div style={{ marginTop: 5, display: 'flex', alignItems: 'center', gap: 6 }}>
              {attrA
                ? <><span style={{ fontSize: 10, color: 'var(--text-muted)' }}>识别属系：</span><AttrTag attrId={attrA} /></>
                : <span style={{ fontSize: 10, color: 'rgba(200,53,26,0.7)', fontWeight: 600 }}>未能识别属系，出货将记为世界池</span>
              }
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
              onChange={setFruitB}
              placeholder="留空则单果实循环"
            />
            {/* 选中后的大图预览 */}
            {attrB && fruitB.trim() && (
              <FruitTag name={fruitB.trim()} size={36} showName={false} />
            )}
          </div>
          {/* 属系识别提示 */}
          {fruitB.trim() && (
            <div style={{ marginTop: 5, display: 'flex', alignItems: 'center', gap: 6 }}>
              {attrB
                ? <><span style={{ fontSize: 10, color: 'var(--text-muted)' }}>识别属系：</span><AttrTag attrId={attrB} /></>
                : <span style={{ fontSize: 10, color: 'rgba(200,53,26,0.7)', fontWeight: 600 }}>未能识别属系</span>
              }
            </div>
          )}
        </div>

        {/* 池子匹配说明（A/B 都有属系时显示） */}
        {attrA && (
          <div style={{
            marginTop: 12, padding: '8px 10px', borderRadius: 8,
            background: 'var(--card-inner)', border: '1px solid var(--divider)',
            fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.7,
          }}>
            <span style={{ fontWeight: 800, color: 'var(--text-light)' }}>出货识别规则：</span>
            {attrB
              ? attrA === attrB
                ? <>出货精灵若非果实主精灵，且属于 <AttrTag attrId={attrA} /> 属系 → <span style={{ fontWeight: 700 }}>属性池</span>；其余 → <span style={{ fontWeight: 700 }}>世界池</span></>
                : <>出货精灵属于 <AttrTag attrId={attrA} /> 或 <AttrTag attrId={attrB} /> 属系 → <span style={{ fontWeight: 700 }}>属性池</span>；其余 → <span style={{ fontWeight: 700 }}>世界池</span></>
              : <>出货精灵若非果实主精灵，且属于 <AttrTag attrId={attrA} /> 属系 → <span style={{ fontWeight: 700 }}>属性池</span>；其余 → <span style={{ fontWeight: 700 }}>世界池</span></>
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

      {/* 精灵球（仅非 saveOnly 模式下显示） */}
      {!saveOnly && (
        <div className="card animate-in" style={{ animationDelay: '0.09s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 800 }}>精灵球库存</span>
            <span style={{
              fontSize: 10, padding: '2px 8px', borderRadius: 20,
              background: 'var(--card-inner)', color: 'var(--text-muted)',
              border: '1px solid var(--divider)', fontWeight: 600,
            }}>选填</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10, lineHeight: 1.6 }}>
            填写后，出货时可自动计算本次消耗球数
          </div>
          <input
            type="number" inputMode="numeric"
            value={ballInput} onChange={e => setBallInput(e.target.value)}
            placeholder="输入当前精灵球数量"
            className="input-field"
          />
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
    </div>
  );
}
