import { createPortal } from 'react-dom';

const getModalRoot = () => document.getElementById('modal-root') || document.body;

export default function ResultModal({ onResult, onClose, hasTabBar = true }) {
  return createPortal(
    <div className={`modal-overlay${hasTabBar ? '' : ' modal-overlay--no-tab'}`} onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />

        {/* 顶部标题行：左上角取消 + 标题 */}
        <div style={{
          display: 'flex', alignItems: 'center',
          marginBottom: 16, gap: 8,
        }}>
          <button
            onClick={onClose}
            style={{
              flexShrink: 0,
              background: 'var(--card-inner)',
              border: '1.5px solid var(--divider)',
              borderRadius: 8,
              padding: '4px 10px',
              fontSize: 12, fontWeight: 700,
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
            }}
          >
            取消
          </button>
          <div className="modal-title" style={{ margin: 0, flex: 1, textAlign: 'center' }}>
            这次触发污染结果？
          </div>
          {/* 右侧占位，让标题居中 */}
          <div style={{ flexShrink: 0, width: 44 }} />
        </div>

        <button className="modal-option" onClick={() => onResult('original')}>
          <span className="modal-option-icon">🟢</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text)' }}>原色精灵</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>精灵恢复正常形态</div>
          </div>
        </button>

        <button className="modal-option" onClick={() => onResult('polluted')}>
          <span className="modal-option-icon">🟣</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text)' }}>污染精灵</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>带有紫色污染血脉</div>
          </div>
        </button>

        <button
          className="modal-option"
          onClick={() => onResult('shiny')}
          style={{ borderColor: '#C8A020', background: '#FFF9E0', boxShadow: '0 2px 0 #C8A020' }}
        >
          <span className="modal-option-icon">✨</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, color: '#C8830A' }}>异色精灵！</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>稀有配色精灵出现</div>
          </div>
        </button>

        <button className="modal-option" onClick={() => onResult('jelly')}>
          <span className="modal-option-icon">🍮</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text)' }}>果冻 / 星辰虫</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>仅计入世界池，不计保底次数</div>
          </div>
        </button>

        <button className="modal-option" onClick={() => onResult('failed')}>
          <span className="modal-option-icon">❌</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text)' }}>触发污染失败</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>逃跑 / 战败，本次完全不计入</div>
          </div>
        </button>
      </div>
    </div>,
    getModalRoot()
  );
}
