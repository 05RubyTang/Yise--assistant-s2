import { useState } from 'react';
import { createPortal } from 'react-dom';
import SpiritAvatar from './SpiritAvatar';

const getModalRoot = () => document.getElementById('modal-root') || document.body;

export default function ShinySelectModal({ plan, onSelect, onClose, hasTabBar = true }) {
  const hasPoolSpirits = Array.isArray(plan.shinies) && plan.shinies.length > 0;
  const [showInput, setShowInput] = useState(!hasPoolSpirits);
  const [customName, setCustomName] = useState('');

  return createPortal(
    <div className={`modal-overlay${hasTabBar ? '' : ' modal-overlay--no-tab'}`} onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />

        <div className="modal-title" style={{ color: '#C8830A' }}>
          ✨ 出了哪只异色？
        </div>

        {/* 方案内精灵（自定义方案无 shinies 时不渲染） */}
        {hasPoolSpirits && (
          <>
            <div style={{
              fontSize: 11, color: 'var(--text-muted)',
              marginBottom: 10, letterSpacing: 0.5, fontWeight: 700,
            }}>
              方案内精灵
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 8,
              marginBottom: 14,
            }}>
              {plan.shinies.map(name => (
                <button
                  key={name}
                  onClick={() => onSelect(name)}
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
                  }}
                >
                  <SpiritAvatar name={name} size={36} showName={false} />
                  <span style={{ flex: 1 }}>{name}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* 方案外精灵 / 自定义方案直接输入 */}
        <div style={{
          fontSize: 11, color: 'var(--text-muted)',
          marginBottom: 10, letterSpacing: 0.5, fontWeight: 700,
        }}>
          {hasPoolSpirits ? '其他精灵（属性池 / 世界池意外收获）' : '输入获得的精灵名'}
        </div>

        {!showInput ? (
          <button className="modal-option" onClick={() => setShowInput(true)}>
            <span className="modal-option-icon">🎲</span>
            <span style={{ fontWeight: 700 }}>其他精灵（手动输入）</span>
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              value={customName}
              onChange={e => setCustomName(e.target.value)}
              placeholder="输入精灵名称"
              autoFocus
              className="input-field"
              style={{ flex: 1 }}
            />
            <button
              disabled={!customName.trim()}
              onClick={() => customName.trim() && onSelect(customName.trim())}
              style={{
                flexShrink: 0,
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
