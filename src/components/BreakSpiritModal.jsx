import { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import SpiritAvatar from './SpiritAvatar';
import { getAllEntries } from '../data/fruitGuide';

const getModalRoot = () => document.getElementById('modal-root') || document.body;

// fruit → spirit 映射（用果实名反查正确精灵名，防止 plan.spiritX 被用户填错）
const FRUIT_SPIRIT_MAP = {};
// 精灵名候选列表（去重，按名称排序）
const ALL_SPIRIT_NAMES = [];
const _seenSpirits = new Set();
getAllEntries().forEach(e => {
  FRUIT_SPIRIT_MAP[e.fruit] = e.spirit;
  if (e.spirit && !_seenSpirits.has(e.spirit)) {
    _seenSpirits.add(e.spirit);
    ALL_SPIRIT_NAMES.push(e.spirit);
  }
});
ALL_SPIRIT_NAMES.sort((a, b) => a.localeCompare(b, 'zh'));

// 快捷精灵卡片（复用 ShinySelectModal 相同样式）
function SpiritCard({ name, label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 12px',
        border: '1.5px solid rgba(103,93,83,0.2)',
        borderRadius: 'var(--radius)',
        background: 'var(--card-inner)',
        cursor: 'pointer', transition: 'all 0.15s',
        color: 'var(--text)', fontWeight: 700, fontSize: 13,
        fontFamily: 'var(--font-body)', textAlign: 'left',
        boxShadow: '0 2px 0 rgba(103,93,83,0.15)',
        width: '100%',
      }}
    >
      <SpiritAvatar name={name} size={36} showName={false} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 800 }}>{label || name}</div>
      </div>
    </button>
  );
}

/**
 * 选择这次触发污染的是哪只精灵。
 *
 * Props:
 *   plan        - 当前方案
 *   result      - 'original' | 'polluted'（用于显示上下文）
 *   onSelect(spiritName) - 确认选择回调
 *   onClose     - 关闭回调
 *   hasTabBar   - 是否有底部 TabBar（影响 overlay 高度）
 */
export default function BreakSpiritModal({ plan, result, onSelect, onClose, hasTabBar = true }) {
  const [showInput, setShowInput] = useState(false);
  const [customName, setCustomName] = useState('');
  const [dropOpen, setDropOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const inputRef = useRef(null);
  const wrapRef = useRef(null);

  // 根据输入关键词过滤精灵候选（最多 8 条）
  const suggestions = useMemo(() => {
    const q = customName.trim();
    if (!q) return [];
    const lower = q.toLowerCase();
    const matched = ALL_SPIRIT_NAMES.filter(n => n.includes(q) || n.toLowerCase().includes(lower));
    matched.sort((a, b) => {
      const aStart = a.startsWith(q) ? 0 : 1;
      const bStart = b.startsWith(q) ? 0 : 1;
      return aStart - bStart || a.localeCompare(b, 'zh');
    });
    return matched.slice(0, 8);
  }, [customName]);

  // 点击外部关闭下拉
  useEffect(() => {
    const handleClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setDropOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selectSuggestion = (name) => {
    onSelect(name);
    setDropOpen(false);
  };

  const handleKeyDown = (e) => {
    if (dropOpen && suggestions.length > 0) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setHighlighted(h => Math.min(h + 1, suggestions.length - 1)); return; }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setHighlighted(h => Math.max(h - 1, 0)); return; }
      if (e.key === 'Enter')     { e.preventDefault(); selectSuggestion(suggestions[highlighted]); return; }
      if (e.key === 'Escape')    { setDropOpen(false); return; }
    }
    if (e.key === 'Enter' && (!dropOpen || suggestions.length === 0) && customName.trim()) {
      onSelect(customName.trim());
    }
  };

  // 方案主精灵快捷按钮（最多 2 个）
  // 优先用果实名反查正确精灵名（防止用户在 PlanEditor 里填错了 spiritA/B）
  const resolveSpirit = (fruitName, spiritName) =>
    (fruitName && FRUIT_SPIRIT_MAP[fruitName]) || spiritName || null;

  const mainSpirits = [
    resolveSpirit(plan.fruitA, plan.spiritA) && { name: resolveSpirit(plan.fruitA, plan.spiritA) },
    resolveSpirit(plan.fruitB, plan.spiritB) && { name: resolveSpirit(plan.fruitB, plan.spiritB) },
  ].filter(Boolean);

  const resultLabel = result === 'original' ? '原色精灵' : '污染精灵';
  const resultColor = result === 'original' ? 'var(--success)' : 'var(--polluted)';

  return createPortal(
    <div
      className={`modal-overlay${hasTabBar ? '' : ' modal-overlay--no-tab'}`}
      onClick={onClose}
    >
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />

        {/* 标题 */}
        <div style={{ marginBottom: 16 }}>
          <div className="modal-title" style={{ marginBottom: 4 }}>
            {result === 'original' ? '出现了哪只原色精灵？' : '出现了哪只污染精灵？'}
          </div>
          <div style={{
            fontSize: 11, color: 'var(--text-muted)',
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <span style={{ color: resultColor, fontWeight: 800 }}>● {resultLabel}</span>
          </div>
        </div>

        {/* 方案主精灵快捷按钮 */}
        {mainSpirits.length > 0 && (
          <>
            <div style={{
              fontSize: 11, color: 'var(--text-muted)',
              marginBottom: 8, letterSpacing: 0.5, fontWeight: 700,
            }}>
              方案主精灵
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
              {mainSpirits.map(s => (
                <SpiritCard
                  key={s.name}
                  name={s.name}
                  onClick={() => onSelect(s.name)}
                />
              ))}
            </div>
          </>
        )}

        {/* 其他精灵 / 手动输入 */}
        <div style={{
          fontSize: 11, color: 'var(--text-muted)',
          marginBottom: 8, letterSpacing: 0.5, fontWeight: 700,
        }}>
          其他精灵
        </div>

        {!showInput ? (
          <button className="modal-option" onClick={() => { setShowInput(true); setTimeout(() => inputRef.current?.focus(), 50); }}>
            <span className="modal-option-icon">🎲</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: 13 }}>其他精灵（手动输入）</div>
            </div>
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 8, position: 'relative' }} ref={wrapRef}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                ref={inputRef}
                type="text"
                value={customName}
                onChange={e => { setCustomName(e.target.value); setDropOpen(true); setHighlighted(0); }}
                onFocus={() => { if (customName.trim()) setDropOpen(true); }}
                onKeyDown={handleKeyDown}
                placeholder="输入精灵名称（如：呼呼猪…）"
                autoFocus
                className="input-field"
                style={{ width: '100%' }}
                autoComplete="off"
              />
              {/* 自动补全下拉 */}
              {dropOpen && suggestions.length > 0 && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                  background: '#FBF7EC', border: '1.5px solid var(--card-border)',
                  borderRadius: 10, boxShadow: '0 4px 16px rgba(43,42,46,0.14)',
                  zIndex: 600, overflow: 'hidden',
                }}>
                  {suggestions.map((name, i) => (
                    <div
                      key={name}
                      onMouseDown={() => selectSuggestion(name)}
                      onMouseEnter={() => setHighlighted(i)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '8px 12px', cursor: 'pointer',
                        background: i === highlighted ? 'rgba(200,131,10,0.08)' : 'transparent',
                        borderBottom: i < suggestions.length - 1 ? '1px solid var(--divider)' : 'none',
                        transition: 'background 0.1s',
                      }}
                    >
                      <SpiritAvatar name={name} size={28} showName={false} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-body)' }}>
                        {name}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button
              disabled={!customName.trim()}
              onClick={() => customName.trim() && onSelect(customName.trim())}
              style={{
                flexShrink: 0, alignSelf: 'flex-start',
                padding: '11px 16px',
                borderRadius: 'var(--radius-sm)',
                border: '2px solid #2B2A2E',
                background: customName.trim() ? '#2B2A2E' : '#B0A898',
                color: '#FBF7EC',
                fontWeight: 800, fontSize: 13,
                fontFamily: 'var(--font-body)',
                cursor: customName.trim() ? 'pointer' : 'not-allowed',
                boxShadow: customName.trim() ? '0 2px 0 #111014' : 'none',
                transition: 'all 0.15s',
              }}
            >
              确认
            </button>
          </div>
        )}

        <button className="modal-close" onClick={onClose}>取消</button>
      </div>
    </div>,
    getModalRoot()
  );
}
