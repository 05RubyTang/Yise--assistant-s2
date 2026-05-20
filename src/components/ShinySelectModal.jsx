import { useState } from 'react';
import { createPortal } from 'react-dom';
import SpiritAvatar from './SpiritAvatar';
import { classifyResultType, POOL_TYPE_CONFIG } from '../data/plans';

const getModalRoot = () => document.getElementById('modal-root') || document.body;

/** 根据推导结果返回提示标签的样式配置 */
function getPoolHint(resultType) {
  if (!resultType) return null;
  const cfg = POOL_TYPE_CONFIG[resultType];
  if (!cfg) return null;
  const icon = resultType === 'family' ? '✓' : resultType === 'attr' ? '⚡' : '🎲';
  return { icon, label: cfg.label, tagBg: cfg.tagBg, tagColor: cfg.tagColor, tagBorder: cfg.tagBorder };
}

export default function ShinySelectModal({ plan, onSelect, onClose, hasTabBar = true }) {
  const hasPoolSpirits = Array.isArray(plan.shinies) && plan.shinies.length > 0;
  const [showInput, setShowInput] = useState(!hasPoolSpirits);
  const [customName, setCustomName] = useState('');

  // 实时推导池类型（输入不为空时才推导）
  const trimmed = customName.trim();
  const inferredType = trimmed ? classifyResultType(trimmed, plan) : null;
  const poolHint = getPoolHint(inferredType);

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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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
                disabled={!trimmed}
                onClick={() => trimmed && onSelect(trimmed)}
                style={{
                  flexShrink: 0,
                  padding: '11px 16px',
                  borderRadius: 'var(--radius-sm)',
                  border: '2px solid #2B2A2E',
                  background: trimmed ? '#2B2A2E' : '#B0A898',
                  color: '#FBF7EC',
                  fontWeight: 800, fontSize: 13,
                  fontFamily: 'var(--font-body)',
                  cursor: trimmed ? 'pointer' : 'not-allowed',
                  boxShadow: trimmed ? '0 2px 0 #111014' : 'none',
                  transition: 'all 0.15s',
                }}
              >
                确认
              </button>
            </div>

            {/* 实时池类型推导提示 */}
            {poolHint && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 10px', borderRadius: 8,
                background: poolHint.tagBg,
                border: `1px solid ${poolHint.tagBorder}`,
              }}>
                <span style={{ fontSize: 13 }}>{poolHint.icon}</span>
                <div style={{ flex: 1 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 800,
                    color: poolHint.tagColor,
                  }}>
                    预计：{poolHint.label}
                  </span>
                  {inferredType === 'attr' && (
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 5 }}>
                      精灵属性与当前果实属系匹配
                    </span>
                  )}
                  {inferredType === 'world' && (
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 5 }}>
                      属性不匹配或无法识别
                    </span>
                  )}
                  {inferredType === 'family' && (
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 5 }}>
                      该精灵在本方案家族内
                    </span>
                  )}
                </div>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', opacity: 0.7 }}>可覆盖</span>
              </div>
            )}
          </div>
        )}

        <button className="modal-close" onClick={onClose}>取消</button>
      </div>
    </div>,
    getModalRoot()
  );
}
