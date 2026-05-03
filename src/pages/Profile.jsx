import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../store';
import { supabase } from '../supabase';
import BindEmailModal from '../components/BindEmailModal';
import PlanIcon from '../components/PlanIcon';
import SpiritAvatar from '../components/SpiritAvatar';
import { PLANS, ALL_SHINIES, inferPoolType, POOL_TYPE_CONFIG } from '../data/plans';

// ─── 工具函数 ─────────────────────────────────────────────────────────────────

function formatDateTime(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} · ${hh}:${mi}`;
}

function parseNonNeg(str) {
  const n = parseInt(str.trim(), 10);
  return (str.trim() !== '' && !isNaN(n) && n >= 0) ? n : null;
}

// ─── 历史卡片（从 History.jsx 迁移，保持完全一致）──────────────────────────

function HistoryCard({ task, index, userPlanConfig }) {
  const { dispatch } = useStore();
  const plan = PLANS.find(p => p.id === task.planId)
    || (userPlanConfig || []).find(p => p.id === task.planId) || null;
  const isManual = task.resultType === 'manual';
  const isSuccess = task.resultType !== 'abandoned';
  // 三池类型（兼容旧数据）
  const poolType = isSuccess && !isManual ? inferPoolType(task, plan) : null;
  const poolCfg  = poolType ? (POOL_TYPE_CONFIG[poolType] || POOL_TYPE_CONFIG.world) : null;
  const breakdowns = task.breakdowns || {};
  const polluted = breakdowns.polluted || 0;
  const original = breakdowns.original || 0;
  const shiny = breakdowns.shiny || 0;

  const [editing, setEditing] = useState(false);
  const [inputs, setInputs] = useState({
    shieldBreakCount: '',
    polluted: '',
    original: '',
    ballsUsed: '',
  });
  const [confirmDelete, setConfirmDelete] = useState(false);

  const openEdit = () => {
    setConfirmDelete(false);
    setInputs({
      shieldBreakCount: task.shieldBreakCount != null ? String(task.shieldBreakCount) : '',
      polluted: String(polluted),
      original: String(original),
      ballsUsed: task.ballsUsed != null ? String(task.ballsUsed) : '',
    });
    setEditing(true);
  };

  const handleSave = () => {
    const sbc = parseNonNeg(inputs.shieldBreakCount);
    const pol = parseNonNeg(inputs.polluted);
    const ori = parseNonNeg(inputs.original);
    const bal = parseNonNeg(inputs.ballsUsed);
    dispatch({
      type: 'UPDATE_COMPLETED_STATS',
      taskId: task.id,
      shieldBreakCount: sbc ?? task.shieldBreakCount,
      polluted: pol ?? polluted,
      original: ori ?? original,
      ballsUsed: bal,
    });
    setEditing(false);
  };

  const handleDelete = () => {
    dispatch({ type: 'DELETE_COMPLETED_TASK', taskId: task.id });
  };

  const setField = (field, val) => setInputs(prev => ({ ...prev, [field]: val }));

  return (
    <div className="card animate-in" style={{ animationDelay: `${index * 0.04}s` }}>
      {/* 顶部行 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: '#F0E8D5', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
        }}>
          {isSuccess
            ? <SpiritAvatar name={task.resultSpirit} obtained size={44} showName={false} />
            : plan ? <PlanIcon plan={plan} size={30} /> : <span style={{ fontSize: 22 }}>?</span>
          }
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 15, fontWeight: 900, fontFamily: 'var(--font-display)',
            color: isSuccess ? '#2B2A2E' : '#A09080',
            marginBottom: 3,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {isSuccess ? task.resultSpirit : `${plan?.type || '?'}方案 · 未完成`}
          </div>
          <div style={{ fontSize: 11, color: '#A09080', fontWeight: 500 }}>
            {formatDateTime(task.completedAt)}
          </div>
        </div>
        <button
          onClick={editing ? () => setEditing(false) : openEdit}
          style={{
            flexShrink: 0,
            border: editing ? '1px solid rgba(103,93,83,0.3)' : '1px solid rgba(103,93,83,0.25)',
            background: editing ? '#F0E8D5' : 'var(--card-inner)',
            borderRadius: 6, padding: '4px 10px', fontSize: 10, fontWeight: 700,
            color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'var(--font-body)',
          }}
        >{editing ? '✕ 取消' : '✎ 编辑'}</button>
        <button
          onClick={() => { setEditing(false); setConfirmDelete(v => !v); }}
          style={{
            flexShrink: 0,
            border: confirmDelete ? '1px solid rgba(200,53,26,0.5)' : '1px solid rgba(200,53,26,0.25)',
            background: confirmDelete ? '#FFF2EF' : 'var(--card-inner)',
            borderRadius: 6, padding: '4px 10px', fontSize: 10, fontWeight: 700,
            color: '#C8351A', cursor: 'pointer', fontFamily: 'var(--font-body)',
          }}
        >🗑</button>
      </div>

      {/* 删除确认 */}
      {confirmDelete && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#FFF2EF', borderRadius: 8, padding: '8px 12px', marginBottom: 10,
          border: '1px solid rgba(200,53,26,0.2)',
        }}>
          <span style={{ fontSize: 11, color: '#C8351A', fontWeight: 700 }}>
            确定删除这条记录？{isSuccess && task.resultSpirit ? `（若无其他「${task.resultSpirit}」记录，将恢复为未解锁）` : ''}
          </span>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginLeft: 8 }}>
            <button onClick={handleDelete} style={{
              padding: '4px 12px', borderRadius: 6,
              border: '1.5px solid #C8351A', background: '#C8351A', color: '#fff',
              fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'var(--font-body)',
            }}>删除</button>
            <button onClick={() => setConfirmDelete(false)} style={{
              padding: '4px 10px', borderRadius: 6,
              border: '1px solid rgba(103,93,83,0.25)', background: 'var(--card-inner)', color: 'var(--text-muted)',
              fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)',
            }}>取消</button>
          </div>
        </div>
      )}

      {/* 出货标签 */}
      {isSuccess && (
        <div style={{
          background: isManual ? '#5D4037' : (poolCfg?.bg || '#7E57C2'),
          borderRadius: 8, padding: '6px 12px', marginBottom: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          {!isManual && plan && poolType === 'family' && (
            <PlanIcon plan={plan} size={16} style={{ filter: 'brightness(2)' }} />
          )}
          {isManual && <span style={{ fontSize: 13 }}>✍️</span>}
          <span style={{
            fontSize: 12, fontWeight: 800,
            color: isManual ? '#FBF7EC' : (poolCfg?.color || '#FBF7EC'),
            fontFamily: 'var(--font-display)', letterSpacing: 1,
          }}>
            {isManual
              ? '手动补录'
              : poolType === 'family'
                ? `${plan?.type || ''}方案 · ${poolCfg?.label || '家族池出货'}`
                : (poolCfg?.label || '世界池出货')}
          </span>
          {task.note && (
            <span style={{ fontSize: 10, color: 'rgba(251,247,236,0.75)', fontWeight: 500, marginLeft: 2 }}>
              · {task.note}
            </span>
          )}
        </div>
      )}

      {/* 数据网格：manual 类型只显示球数 */}
      {isManual ? (
        <div style={{
          background: '#F0E8D5', borderRadius: 10, overflow: 'hidden', marginBottom: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '10px 0',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 17, fontWeight: 900, color: '#2B2A2E', lineHeight: 1, fontFamily: 'var(--font-display)' }}>
              {task.ballsUsed != null ? task.ballsUsed : '—'}
            </div>
            <div style={{ fontSize: 9, color: '#A09080', marginTop: 4, fontWeight: 600 }}>消耗球数</div>
          </div>
        </div>
      ) : (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          background: '#F0E8D5', borderRadius: 10, overflow: 'hidden', marginBottom: 8,
        }}>
          {[
            { label: '触发污染次数', value: task.shieldBreakCount ?? '—', color: '#D4560A' },
            { label: '污染精灵', value: polluted, color: '#8B4BB8' },
            { label: '原色精灵', value: original, color: '#4B9C46' },
            { label: '消耗球数', value: task.ballsUsed != null ? task.ballsUsed : '—', color: '#2B2A2E' },
          ].map((item, i) => (
            <div key={i} style={{
              padding: '10px 4px', textAlign: 'center',
              borderRight: i < 3 ? '1px solid rgba(103,93,83,0.12)' : 'none',
            }}>
              <div style={{ fontSize: 17, fontWeight: 900, color: item.color, lineHeight: 1, fontFamily: 'var(--font-display)' }}>
                {item.value}
              </div>
              <div style={{ fontSize: 9, color: '#A09080', marginTop: 4, fontWeight: 600 }}>{item.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* 编辑面板 */}
      {editing && (
        <div style={{
          background: '#F0E8D5', borderRadius: 10,
          padding: '12px 12px 10px', marginBottom: 8,
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: 0.5 }}>
            修改数据
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 10px', marginBottom: 10 }}>
            {(isManual ? [
              { field: 'ballsUsed', label: '消耗球数', placeholder: '个', color: '#2B2A2E' },
            ] : [
              { field: 'shieldBreakCount', label: '触发污染次数', placeholder: '次数', color: '#D4560A' },
              { field: 'polluted', label: '污染精灵', placeholder: '只', color: '#8B4BB8' },
              { field: 'original', label: '原色精灵', placeholder: '只', color: '#4B9C46' },
              { field: 'ballsUsed', label: '消耗球数', placeholder: '个', color: '#2B2A2E' },
            ]).map(({ field, label, placeholder, color }) => (
              <div key={field}>
                <div style={{ fontSize: 9, fontWeight: 700, color, marginBottom: 4 }}>{label}</div>
                <input
                  type="number" inputMode="numeric" min="0"
                  value={inputs[field]}
                  onChange={e => setField(field, e.target.value)}
                  placeholder={placeholder}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    padding: '7px 10px', borderRadius: 7,
                    border: `1.5px solid ${color}44`,
                    background: '#FBF7EC',
                    fontSize: 13, fontWeight: 800, fontFamily: 'var(--font-display)',
                    color, outline: 'none',
                  }}
                />
              </div>
            ))}
          </div>
          <button onClick={handleSave} style={{
            width: '100%', padding: '10px 0',
            border: '2px solid #2B2A2E', borderRadius: 'var(--radius-sm)',
            background: '#2B2A2E', color: '#FBF7EC',
            fontSize: 12, fontWeight: 800, fontFamily: 'var(--font-body)', cursor: 'pointer',
            boxShadow: '0 2px 0 #111014',
          }}>保存修改</button>
        </div>
      )}

      {/* 标签行 */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {isManual ? (
          <span style={{
            fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 700,
            background: 'rgba(93,64,55,0.08)', color: '#5D4037',
            border: '1px solid rgba(93,64,55,0.2)',
          }}>✍️ 手动补录</span>
        ) : (
          <span style={{
            fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 700,
            background: 'rgba(212,86,10,0.08)', color: '#D4560A',
            border: '1px solid rgba(212,86,10,0.2)',
          }}>💀 触发污染 {task.shieldBreakCount ?? '—'}</span>
        )}
        {!isManual && polluted > 0 && (
          <span style={{
            fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 700,
            background: 'rgba(139,75,184,0.08)', color: '#8B4BB8',
            border: '1px solid rgba(139,75,184,0.2)',
          }}>污染精灵 {polluted}</span>
        )}
        {!isManual && original > 0 && (
          <span style={{
            fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 700,
            background: 'rgba(75,156,70,0.08)', color: '#4B9C46',
            border: '1px solid rgba(75,156,70,0.2)',
          }}>原色精灵 {original}</span>
        )}
        {!isManual && shiny > 0 && (
          <span style={{
            fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 700,
            background: 'rgba(200,131,10,0.10)', color: '#C8830A',
            border: '1px solid rgba(200,131,10,0.25)',
          }}>✨ 异色精灵 {shiny}</span>
        )}
      </div>
    </div>
  );
}

// ─── 已移至 ManualShinyPage.jsx ───────────────────────────────────────────────

// 分区标题组件（HistoryCard 内部使用）
function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 700, color: 'var(--text-muted)',
      marginBottom: 8, letterSpacing: 0.5, textTransform: 'uppercase',
    }}>{children}</div>
  );
}

// ─── 「我的」主页面 ───────────────────────────────────────────────────────────

// ─── 用户名 Hook ──────────────────────────────────────────────────────────────

const USERNAME_KEY = 'lk_username';

function genDefaultName() {
  // 「小洛克」+ 4位随机数字
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `小洛克${suffix}`;
}

function useUsername() {
  const [username, setUsername] = useState(() => {
    const saved = localStorage.getItem(USERNAME_KEY);
    if (saved) return saved;
    const name = genDefaultName();
    localStorage.setItem(USERNAME_KEY, name);
    return name;
  });
  const [nameSaving, setNameSaving] = useState(false);

  // userId 有值时额外写 Supabase
  const saveUsername = async (name, userId) => {
    const trimmed = name.trim();
    if (!trimmed) return false;
    // 先写本地
    localStorage.setItem(USERNAME_KEY, trimmed);
    setUsername(trimmed);
    // 再写云端（有 userId 时）
    if (userId) {
      setNameSaving(true);
      try {
        const { error } = await supabase.from('user_data').upsert({
          user_id: userId,
          user_name: trimmed,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
        if (error) console.warn('[Supabase] 更新用户名失败:', error.message);
      } finally {
        setNameSaving(false);
      }
    }
    return true;
  };

  return { username, saveUsername, nameSaving };
}

// ─── 头像上传 Hook ────────────────────────────────────────────────────────────

const AVATAR_KEY = 'lk_user_avatar';

function useAvatar() {
  const [avatarUrl, setAvatarUrl] = useState(() => localStorage.getItem(AVATAR_KEY) || null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;

    // 压缩为最大 200×200 的 base64
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const SIZE = 200;
        const canvas = document.createElement('canvas');
        const scale = Math.min(SIZE / img.width, SIZE / img.height, 1);
        canvas.width  = Math.round(img.width  * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        localStorage.setItem(AVATAR_KEY, dataUrl);
        setAvatarUrl(dataUrl);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
    // 清空 input，允许重复选同一文件
    e.target.value = '';
  };

  return { avatarUrl, handleFileChange };
}

// ─── 头像组件 ────────────────────────────────────────────────────────────────

function AvatarUploader({ avatarUrl, onFileChange }) {
  const ref = { current: null };
  return (
    <div
      className="profile-avatar profile-avatar-btn"
      onClick={() => ref.current?.click()}
      title="点击更换头像"
    >
      <img
        src={avatarUrl || `${import.meta.env.BASE_URL}default-avatar.png`}
        alt="头像"
        className="profile-avatar-img"
      />
      <span className="profile-avatar-edit">✎</span>
      <input
        ref={r => { ref.current = r; }}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={onFileChange}
      />
    </div>
  );
}

// ─── 更新公告弹窗 ─────────────────────────────────────────────────────────────

const CHANGELOG = [
  {
    version: 'v2.0',
    date: '2025-04-30',
    tags: ['新功能', '修复'],
    items: [
      '污染记录模块优化：破盾后可选择具体的原色 / 污染精灵，不论哪种结果都会计入对应池子，同时破盾记录色块展示精灵头像，绿=原色 / 紫=污染 / 金=异色',
      '修复了自定义刷取回到首页方案丢失问题，并且支持手动输入精灵名后自动匹配果实 & 精灵图',
      '新增分球计数 & 记录中随时补球功能',
      '友情提示：果冻 & 星辰虫单独计世界池，不计家族保底次数',
      '精灵图鉴与果实图片来源：BWIKI（wiki.biligame.com/rocom），感谢社区贡献者',
    ],
  },
  {
    version: 'v1.5',
    date: '2025-04-23',
    tags: ['机制同步'],
    items: [
      '同步官方三池机制：家族池 / 属性池 / 世界池独立计数，互不重置',
      '刷取页新增三池机制说明卡片',
      '保底进度条样式优化',
    ],
  },
  {
    version: 'v1.0',
    date: '2025-04-10',
    tags: ['首次发布'],
    items: [
      '支持异色精灵刷取方案配置与触发污染记录',
      '保底进度追踪（80次必出）',
      '邮箱绑定 + 云端数据备份',
      '果实解锁攻略、特殊形态精灵攻略',
    ],
  },
];

const TAG_COLORS = {
  '新功能': { bg: 'rgba(75,156,70,0.12)', color: '#4B9C46', border: 'rgba(75,156,70,0.3)' },
  '修复': { bg: 'rgba(200,53,26,0.10)', color: '#C8351A', border: 'rgba(200,53,26,0.25)' },
  '机制同步': { bg: 'rgba(200,131,10,0.12)', color: '#C8830A', border: 'rgba(200,131,10,0.3)' },
  '首次发布': { bg: 'rgba(91,156,246,0.12)', color: '#5B9CF6', border: 'rgba(91,156,246,0.3)' },
  '优化': { bg: 'rgba(126,87,194,0.12)', color: '#7E57C2', border: 'rgba(126,87,194,0.3)' },
};

function ChangelogModal({ onClose }) {
  return createPortal(
    <div
      className="modal-overlay modal-overlay--no-tab"
      onClick={onClose}
    >
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{ maxHeight: '80vh', overflowY: 'auto' }}
      >
        <div className="modal-handle" />

        {/* 标题行 */}
        <div style={{
          display: 'flex', alignItems: 'center', marginBottom: 18, gap: 8,
        }}>
          <button
            onClick={onClose}
            style={{
              flexShrink: 0,
              background: 'var(--card-inner)',
              border: '1.5px solid var(--divider)',
              borderRadius: 8, padding: '4px 10px',
              fontSize: 12, fontWeight: 700,
              color: 'var(--text-muted)', cursor: 'pointer',
              fontFamily: 'var(--font-body)',
            }}
          >关闭</button>
          <div className="modal-title" style={{ margin: 0, flex: 1, textAlign: 'center' }}>
            更新公告
          </div>
          <div style={{ flexShrink: 0, width: 44 }} />
        </div>

        {/* 版本列表 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {CHANGELOG.map((entry, i) => (
            <div key={entry.version} style={{
              borderRadius: 12,
              border: `1.5px solid ${i === 0 ? 'rgba(200,131,10,0.35)' : 'var(--divider)'}`,
              background: i === 0 ? '#FFFBF0' : 'var(--card-inner)',
              overflow: 'hidden',
            }}>
              {/* 版本标题条 */}
              <div style={{
                padding: '10px 14px',
                background: i === 0 ? '#2B2A2E' : 'rgba(103,93,83,0.06)',
                display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
              }}>
                <span style={{
                  fontSize: 14, fontWeight: 900,
                  color: i === 0 ? '#FBC839' : 'var(--text)',
                  fontFamily: 'var(--font-display)',
                }}>
                  {entry.version}
                </span>
                <span style={{
                  fontSize: 10, color: i === 0 ? 'rgba(251,247,236,0.5)' : 'var(--text-muted)',
                  fontWeight: 600,
                }}>
                  {entry.date}
                </span>
                <div style={{ display: 'flex', gap: 4, marginLeft: 'auto', flexWrap: 'wrap' }}>
                  {entry.tags.map(tag => {
                    const c = TAG_COLORS[tag] || TAG_COLORS['优化'];
                    return (
                      <span key={tag} style={{
                        fontSize: 9, fontWeight: 800, padding: '2px 7px',
                        borderRadius: 20, border: `1px solid ${c.border}`,
                        background: i === 0 ? 'rgba(255,255,255,0.15)' : c.bg,
                        color: i === 0 ? '#FBF7EC' : c.color,
                      }}>{tag}</span>
                    );
                  })}
                </div>
              </div>
              {/* 更新条目 */}
              <ul style={{
                margin: 0, padding: '10px 14px 12px 28px',
                display: 'flex', flexDirection: 'column', gap: 6,
              }}>
                {entry.items.map((item, j) => (
                  <li key={j} style={{
                    fontSize: 12, color: 'var(--text-light)', lineHeight: 1.6,
                    fontWeight: i === 0 ? 600 : 500,
                  }}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function Profile({ navigate }) {
  const { state, syncStatus, authUser, userId } = useStore();
  // null = 主页，'history' = 刷取记录子页
  const [subPage, setSubPage] = useState(null);
  const [showChangelog, setShowChangelog] = useState(false);
  const [showBindModal, setShowBindModal] = useState(false);
  const [bindSentEmail, setBindSentEmail] = useState(null);
  const { avatarUrl, handleFileChange } = useAvatar();
  const { username, saveUsername, nameSaving } = useUsername();
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [nameSaved, setNameSaved] = useState(false);

  // ── 邮箱绑定入口展开状态 ──
  const [emailExpanded, setEmailExpanded] = useState(false);

  // ── 更新公告折叠状态 ──
  const [guideExpanded, setGuideExpanded] = useState(false);

  // ── 问题反馈 ──
  const [fbContent, setFbContent] = useState('');
  const [fbContact, setFbContact] = useState('');
  const [fbStatus, setFbStatus] = useState('idle'); // 'idle' | 'sending' | 'done' | 'error'

  const submitFeedback = async () => {
    const trimmed = fbContent.trim();
    if (!trimmed) return;
    setFbStatus('sending');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id ?? null;
      const { error } = await supabase.from('feedback').insert({
        user_id: uid,
        content: trimmed,
        contact: fbContact.trim() || null,
      });
      if (error) throw error;
      setFbStatus('done');
      setFbContent('');
      setFbContact('');
    } catch (e) {
      console.warn('[Feedback] 提交失败:', e?.message);
      setFbStatus('error');
    }
  };

  const isBound = !!authUser?.email;
  const userEmail = authUser?.email ?? null;

  // 统计（收集）
  const totalObtained = Object.values(state.spirits).filter(s => s.obtained).length;
  const totalSpirits = Object.keys(state.spirits).length;
  const completionPct = totalSpirits > 0 ? Math.round((totalObtained / totalSpirits) * 100) : 0;

  // 统计（历史）
  const tasks = state.completedTasks || [];
  const successTasks = tasks.filter(t => t.resultType !== 'abandoned');
  const totalShiny = successTasks.length;
  const normalSuccessTasks = successTasks.filter(t => t.resultType !== 'manual' && t.shieldBreakCount != null);
  const totalBreaks = normalSuccessTasks.reduce((s, t) => s + (t.shieldBreakCount || 0), 0);
  const avgBreaks = normalSuccessTasks.length > 0 ? Math.round(totalBreaks / normalSuccessTasks.length) : 0;

  const syncColor = syncStatus === 'ready' ? '#4CAF50' : syncStatus === 'offline' ? '#FF9800' : '#9E9E9E';
  const syncLabel = syncStatus === 'ready' ? '已同步' : syncStatus === 'offline' ? '离线' : '同步中';

  return (
    <div className="page profile-page" style={{ position: 'relative' }}>
      {/* 我的页全局背景图 */}
      <img
        src={`${import.meta.env.BASE_URL}profile-bg.png`}
        alt="" aria-hidden="true"
        style={{
          position: 'absolute', top: -20, left: '50%',
          transform: 'translateX(-50%)',
          width: 390, height: 'auto',
          opacity: 1,
          pointerEvents: 'none', userSelect: 'none',
          zIndex: -1,
        }}
      />
      {/* 页头 —— 子页时显示返回按钮 */}
      <div className="page-header">
        {subPage === 'history' ? (
          <>
            <button
              onClick={() => setSubPage(null)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '4px 8px 4px 0', fontSize: 18, color: 'var(--text)',
                display: 'flex', alignItems: 'center', gap: 4,
                fontFamily: 'var(--font-body)', fontWeight: 700,
              }}
            >‹</button>
            <h2 style={{ flex: 1 }}>刷取记录</h2>
          </>
        ) : (
          <h2>我的</h2>
        )}
      </div>

      {/* ══ 主页：我的 ══════════════════════════════════════════════════════════ */}
      {subPage === null && (
        <div style={{ paddingTop: 160 }}>
          {/* ━━ 1+2 合并卡：用户信息 + 收集进度 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          <div className="card animate-in" style={{
            margin: '0 16px 12px', padding: 0,
            overflow: 'hidden', position: 'relative',
          }}>
            {/* 迪莫剪影装饰 */}
            <img
              src={`${import.meta.env.BASE_URL}dimo-bg.png`}
              alt="" aria-hidden="true"
              style={{
                position: 'absolute', right: 14, top: 14,
                width: 72, height: 72,
                objectFit: 'contain', opacity: 0.10,
                pointerEvents: 'none', userSelect: 'none',
              }}
            />

            {/* ── 上半：头像 + 昵称/状态 + 邮箱入口 ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 16px 14px' }}>
              {/* 头像 */}
              <AvatarUploader avatarUrl={avatarUrl} onFileChange={handleFileChange} />

              {/* 昵称 + 同步状态 + 邮箱入口（同行小文字） */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {editingName ? (
                  <div className="username-edit-row">
                    <input
                      className="username-input"
                      value={nameInput}
                      maxLength={12}
                      autoFocus
                      onChange={e => setNameInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          saveUsername(nameInput, userId).then(ok => {
                            if (ok) { setEditingName(false); setNameSaved(true); setTimeout(() => setNameSaved(false), 2000); }
                          });
                        }
                        if (e.key === 'Escape') setEditingName(false);
                      }}
                    />
                    <button className="username-confirm-btn" disabled={nameSaving}
                      onClick={() => {
                        saveUsername(nameInput, userId).then(ok => {
                          if (ok) { setEditingName(false); setNameSaved(true); setTimeout(() => setNameSaved(false), 2000); }
                        });
                      }}
                    >{nameSaving ? '…' : '✓'}</button>
                    <button className="username-cancel-btn" onClick={() => setEditingName(false)}>✕</button>
                  </div>
                ) : (
                  <div className="username-display-row">
                    <span className="profile-username">{username}</span>
                    {nameSaved && (
                      <span style={{ fontSize: 10, color: 'var(--success)', fontWeight: 700, marginLeft: 4 }}>已同步✓</span>
                    )}
                    <button className="username-edit-icon"
                      onClick={() => { setNameInput(username); setEditingName(true); }}>✎</button>
                  </div>
                )}
                {/* 状态行：同步点 + 邮箱小入口并排 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5, flexWrap: 'wrap' }}>
                  {/* 同步状态 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{
                      width: 7, height: 7, borderRadius: '50%',
                      background: syncColor, flexShrink: 0,
                      boxShadow: syncStatus === 'ready' ? '0 0 0 2px rgba(76,175,80,0.2)' : 'none',
                    }} />
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{syncLabel}</span>
                  </div>
                  {/* 竖分隔 */}
                  <span style={{ width: 1, height: 10, background: 'var(--divider)', display: 'inline-block' }} />
                  {/* 邮箱小入口 */}
                  <button
                    onClick={() => setEmailExpanded(v => !v)}
                    style={{
                      background: 'none', border: 'none', padding: 0,
                      cursor: 'pointer', fontFamily: 'var(--font-body)',
                      display: 'flex', alignItems: 'center', gap: 3,
                    }}
                  >
                    <span style={{ fontSize: 11 }}>{isBound ? '✅' : '📧'}</span>
                    <span style={{
                      fontSize: 11, fontWeight: 700,
                      color: isBound ? 'var(--success)' : 'var(--cta)',
                      textDecoration: emailExpanded ? 'underline' : 'none',
                    }}>
                      {isBound ? '邮箱已绑定' : '绑定邮箱'}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* ── 展开的邮箱操作区 ── */}
            {emailExpanded && (
              <div style={{
                padding: '12px 16px 14px',
                background: '#FFFBF0',
                borderTop: '1px solid rgba(200,131,10,0.2)',
                borderBottom: '1px solid rgba(200,131,10,0.12)',
              }}>
                {!isBound ? (
                  <>
                    <div style={{ fontSize: 11, color: 'var(--text-light)', lineHeight: 1.7, marginBottom: 10 }}>
                      <span style={{ fontWeight: 700, color: '#C8830A' }}>📌 说明：</span>
                      需从<span style={{ fontWeight: 700 }}>浏览器</span>打开使用，微信渠道暂不支持；每日绑定数量有上限，遇失败请次日再试～
                    </div>
                    <button
                      onClick={() => setShowBindModal(true)}
                      style={{
                        width: '100%', padding: '10px 0',
                        border: '1.5px solid #C8830A', borderRadius: 10,
                        background: '#C8830A', color: '#fff',
                        fontSize: 13, fontWeight: 800, cursor: 'pointer',
                        fontFamily: 'var(--font-body)',
                      }}
                    >去绑定邮箱</button>
                    {bindSentEmail && (
                      <div style={{
                        marginTop: 10, padding: '8px 12px', borderRadius: 8,
                        background: 'rgba(75,156,70,0.1)', border: '1px solid rgba(75,156,70,0.3)',
                        fontSize: 11, color: '#4B9C46', fontWeight: 600,
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      }}>
                        <span>📬 确认邮件已发至 <strong>{bindSentEmail}</strong>，点击链接完成绑定</span>
                        <button onClick={() => setBindSentEmail(null)} style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: '#4B9C46', fontSize: 14, marginLeft: 8,
                        }}>✕</button>
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
                      绑定邮箱：<span style={{ color: 'var(--success)', fontWeight: 700 }}>{userEmail}</span>
                    </div>
                    <button
                      onClick={() => setShowBindModal(true)}
                      style={{
                        width: '100%', padding: '9px 0',
                        border: '1px solid var(--divider)', borderRadius: 10,
                        background: 'var(--card-inner)', color: 'var(--text)',
                        fontSize: 12, fontWeight: 700, cursor: 'pointer',
                        fontFamily: 'var(--font-body)',
                      }}
                    >换绑 / 找回账号</button>
                  </div>
                )}
              </div>
            )}

            {/* ── 分隔线 ── */}
            <div style={{ height: 1, background: 'var(--divider)', margin: '0 16px' }} />

            {/* ── 下半：进度条 + 三格数字 ── */}
            <div style={{ padding: '14px 16px 16px' }}>
              {/* 进度条 */}
              <div style={{
                height: 8, borderRadius: 4,
                background: 'rgba(103,93,83,0.12)',
                overflow: 'hidden', marginBottom: 14,
              }}>
                <div style={{
                  height: '100%', borderRadius: 4,
                  width: `${completionPct}%`,
                  background: 'linear-gradient(90deg, #4CAF50, #8BC34A)',
                  transition: 'width 0.6s cubic-bezier(.4,0,.2,1)',
                }} />
              </div>

              {/* 三格数字 */}
              <div style={{ display: 'flex', gap: 0 }}>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#4CAF50', lineHeight: 1, fontFamily: 'var(--font-display)' }}>
                    {totalObtained}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 5, fontWeight: 600 }}>已收集</div>
                </div>
                <div style={{ width: 1, background: 'var(--divider)', margin: '2px 0' }} />
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#C8830A', lineHeight: 1, fontFamily: 'var(--font-display)' }}>
                    {totalSpirits - totalObtained}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 5, fontWeight: 600 }}>待收集</div>
                </div>
                <div style={{ width: 1, background: 'var(--divider)', margin: '2px 0' }} />
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#2B2A2E', lineHeight: 1, fontFamily: 'var(--font-display)' }}>
                    {totalSpirits}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 5, fontWeight: 600 }}>全部</div>
                </div>
              </div>
            </div>
          </div>

          {/* ━━ 3. 快捷功能 2×2 宫格（黑底白字） ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            gap: 10, margin: '0 16px 12px',
          }}>
            {[
              {
                icon: '📋',
                iconBg: 'rgba(255,255,255,0.12)',
                label: '抓宠记录',
                desc: '查看历史出货',
                action: () => setSubPage('history'),
              },
              {
                icon: null,
                iconBg: 'rgba(255,255,255,0.12)',
                iconImg: `${import.meta.env.BASE_URL}fruit-icon.png`,
                label: '果实攻略',
                desc: '果实获取位置',
                action: () => navigate('fruitGuide'),
              },
              {
                icon: '🌰',
                iconBg: 'rgba(255,255,255,0.12)',
                label: '特殊形态',
                desc: '特殊形态精灵',
                action: () => navigate('specialForms'),
              },
              {
                icon: '🧪',
                iconBg: 'rgba(255,255,255,0.12)',
                label: '自定义方案',
                desc: '我的方案 & 数据',
                action: () => navigate('myCustomPlans'),
              },
            ].map((item, i) => (
              <button
                key={i}
                onClick={item.action}
                style={{
                  display: 'flex', flexDirection: 'row', alignItems: 'center',
                  gap: 10, padding: '12px 14px',
                  border: 'none',
                  borderRadius: 'var(--radius)',
                  background: '#2B2A2E',
                  boxShadow: '0 2px 0 #111014',
                  cursor: 'pointer', textAlign: 'left',
                  fontFamily: 'var(--font-body)',
                }}
              >
                {/* 图标 */}
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: item.iconBg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20,
                }}>
                  {item.iconImg
                    ? <img src={item.iconImg} alt={item.label} width={24} height={24} style={{ objectFit: 'contain' }} />
                    : item.icon
                  }
                </div>
                {/* 文字 */}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 900, color: '#FFFFFF', fontFamily: 'var(--font-display)', marginBottom: 2, whiteSpace: 'nowrap' }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', lineHeight: 1.4 }}>
                    {item.desc}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* ━━ 4. 更新公告（折叠） ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          <div style={{ margin: '0 16px 12px' }}>
            <button
              onClick={() => setGuideExpanded(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                width: '100%', padding: '13px 16px',
                border: '1.5px solid var(--card-border)',
                borderRadius: guideExpanded ? '12px 12px 0 0' : 'var(--radius)',
                background: 'var(--card)',
                boxShadow: guideExpanded ? 'none' : 'var(--shadow-card)',
                cursor: 'pointer', fontFamily: 'var(--font-body)',
                boxSizing: 'border-box',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>📢</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#2B2A2E', fontFamily: 'var(--font-display)' }}>
                  更新公告
                </span>
              </div>
              <span style={{
                fontSize: 14, color: 'var(--text-muted)',
                transform: guideExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
                display: 'inline-block',
              }}>›</span>
            </button>

            {guideExpanded && (
              <div style={{
                border: '1.5px solid var(--card-border)',
                borderTop: 'none',
                borderRadius: '0 0 12px 12px',
                background: 'var(--card-inner)',
                padding: '0 0 4px',
              }}>
                {/* 版本 & 更新公告 */}
                <div style={{ padding: '12px 16px 10px' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 0.5, marginBottom: 8 }}>
                    关于
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '9px 0', borderBottom: '1px solid var(--divider)',
                    }}>
                      <span style={{ fontSize: 12, color: 'var(--text-light)', fontWeight: 500 }}>版本</span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>v2.0</span>
                    </div>
                    <div
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '9px 0', borderBottom: '1px solid var(--divider)', cursor: 'pointer',
                      }}
                      onClick={() => setShowChangelog(true)}
                    >
                      <span style={{ fontSize: 12, color: 'var(--text-light)', fontWeight: 500 }}>更新公告</span>
                      <span style={{ fontSize: 12, color: 'var(--cta)', fontWeight: 700 }}>查看 →</span>
                    </div>
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '9px 0',
                    }}>
                      <span style={{ fontSize: 12, color: 'var(--text-light)', fontWeight: 500 }}>数据存储</span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>本地 + 云端双备份</span>
                    </div>
                  </div>
                </div>

                {/* 使用技巧 */}
                <div style={{ padding: '0 16px 12px' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 0.5, marginBottom: 8 }}>
                    使用技巧
                  </div>
                  {[
                    '触发污染后点「破盾」，选择精灵类型（原色/污染/异色）',
                    '每次出货后会自动计入图鉴，无需手动标记',
                    '之前刷过的异色可以去「抓宠记录」→「补充我的异色」手动添加',
                    '绑定邮箱后，换手机也能同步记录数据',
                  ].map((tip, i) => (
                    <div key={i} style={{
                      display: 'flex', gap: 8, marginBottom: 7,
                    }}>
                      <span style={{
                        flexShrink: 0, width: 18, height: 18, borderRadius: '50%',
                        background: 'rgba(103,93,83,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, fontWeight: 800, color: 'var(--text-muted)',
                        marginTop: 1,
                      }}>{i + 1}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-light)', lineHeight: 1.6, fontWeight: 500 }}>
                        {tip}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ━━ 开发者的话 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          <div className="profile-section dev-note-section">
            <div className="section-title">开发者的话</div>
            <div className="dev-note-card">
              <div className="dev-note-avatar-row">
                <div className="dev-note-avatar">🧑‍💻</div>
                <div className="dev-note-identity">
                  <div className="dev-note-name">Bing</div>
                  <div className="dev-note-handle">小红书 @Bing的学习日常</div>
                </div>
              </div>
              <p className="dev-note-text">
                Hi！我是 Bing，交互设计专业在读学生，28 届毕业选手，设计 &amp; 程序一体机 vibe coding 爱好者。这个 App 是用爱发电做的小工具，希望能帮到每一位在洛克王国刷异色的你 ✨
              </p>
              <a
                className="dev-note-xhs-btn"
                href="https://www.xiaohongshu.com/user/profile/60a77be2000000000100a4f3"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-4-4 1.41-1.41L11 14.17l6.59-6.58L19 9l-8 8z"/>
                </svg>
                去小红书找我聊
              </a>
            </div>
          </div>

          {/* ━━ 问题反馈 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          <div className="profile-section feedback-section">
            <div className="section-title">问题反馈</div>
            {fbStatus === 'done' ? (
              <div className="feedback-done">
                <div className="feedback-done-icon">🎉</div>
                <div className="feedback-done-text">反馈已收到，感谢你！</div>
                <button className="feedback-again-btn" onClick={() => setFbStatus('idle')}>再写一条</button>
              </div>
            ) : (
              <div className="feedback-form">
                <textarea
                  className="feedback-textarea"
                  placeholder="遇到 Bug？有什么想法或建议？都可以告诉我～"
                  maxLength={500}
                  value={fbContent}
                  onChange={e => { setFbContent(e.target.value); if (fbStatus === 'error') setFbStatus('idle'); }}
                />
                <div className="feedback-char-count">{fbContent.length} / 500</div>
                <input
                  className="feedback-contact-input"
                  placeholder="联系方式（选填）：微信 / 小红书 / 邮箱…"
                  value={fbContact}
                  maxLength={100}
                  onChange={e => setFbContact(e.target.value)}
                />
                {fbStatus === 'error' && <div className="feedback-error">提交失败，请稍后再试</div>}
                <button
                  className="feedback-submit-btn"
                  disabled={!fbContent.trim() || fbStatus === 'sending'}
                  onClick={submitFeedback}
                >
                  {fbStatus === 'sending' ? '提交中…' : '提交反馈'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ 子页：刷取记录 ══════════════════════════════════════════════════════ */}
      {subPage === 'history' && (
        <div style={{ paddingBottom: 24 }}>
          {/* 汇总统计卡 */}
          {tasks.length > 0 && (
            <div className="card animate-in" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
                {[
                  { label: '成功出货', value: totalShiny, unit: '次', color: '#4B9C46', bg: 'rgba(75,156,70,0.06)' },
                  { label: '平均触发污染', value: normalSuccessTasks.length > 0 ? avgBreaks : '—', unit: normalSuccessTasks.length > 0 ? '次' : '', color: '#C8830A', bg: 'rgba(200,131,10,0.06)' },
                  { label: '中断次数', value: tasks.filter(t => t.resultType === 'abandoned').length, unit: '次', color: '#A09080', bg: 'transparent' },
                ].map((stat, i) => (
                  <div key={i} style={{
                    padding: '14px 10px', textAlign: 'center',
                    borderRight: i < 2 ? '1px solid var(--divider)' : 'none',
                    background: stat.bg,
                  }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: stat.color, lineHeight: 1, fontFamily: 'var(--font-display)' }}>
                      {stat.value}
                      <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', marginLeft: 1 }}>{stat.unit}</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5, fontWeight: 600 }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 「+ 补充我的异色」入口按钮 */}
          <button
            onClick={() => navigate('manualShiny')}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              width: 'calc(100% - 32px)', margin: '10px 16px 2px',
              padding: '11px 14px',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              background: '#2B2A2E',
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 200 200" fill="none"
              xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
              <path d="M46.8359 160.664C46.3477 160.664 45.8203 160.547 45.1758 160.313C43.3008 159.629 42.3047 157.539 42.9492 155.645C46.8945 143.965 58.8477 115.449 60.3711 112.402C89.3359 54.5117 120.039 28.2227 169.922 18.6328C171.445 18.3594 172.949 19.0039 173.75 20.293C174.551 21.582 174.492 23.2422 173.574 24.4727L149.883 55.957C148.574 57.6953 148.145 59.9219 148.711 62.0313L151.914 73.9649C153.008 77.9883 152.285 82.3047 149.961 85.7617C148.814 87.4797 147.309 88.9294 145.549 90.0115C143.789 91.0936 141.816 91.7826 139.766 92.0313L123.398 94.0625C120.488 94.4336 118.105 96.582 117.422 99.3945C118.535 105.449 115.605 111.582 110.195 114.199C107.441 115.547 104.375 115.957 101.367 115.41L86.7187 112.773C84.4922 112.383 82.1875 113.184 80.7031 114.863L55.9961 142.754C55.4492 144.082 52.9492 150.43 51.5625 153.945C51.0352 155.273 50.6055 156.406 50.1758 157.324C50.0977 157.559 50.0195 157.773 49.9414 157.988L49.8633 157.969C48.9844 159.766 48.1445 160.664 46.8359 160.664ZM161.68 28.0078C119.512 38.6133 93.1836 63.3203 66.9922 115.703C66.6016 116.484 65.4687 119.082 63.9453 122.676L75.1758 110C78.3594 106.406 83.2813 104.688 88.0078 105.547L102.656 108.184C104.141 108.457 105.625 108.242 106.973 107.598C109.512 106.367 110.82 103.32 110.078 100.352C109.961 99.8828 109.941 99.375 110 98.9063C110.977 92.5586 116.113 87.5781 122.48 86.7774L138.848 84.7461C140.879 84.4922 142.695 83.3789 143.828 81.6797C144.961 79.9805 145.312 77.8906 144.785 75.918L141.582 63.9844C140.41 59.668 141.289 55.1367 143.984 51.5625L161.68 28.0078ZM85.1367 183.789C78.7695 183.789 75.4492 179.805 73.0273 176.895C70.7031 174.121 69.375 172.656 66.6016 172.656C63.8281 172.656 62.4805 174.102 60.1563 176.895C57.7344 179.805 54.4141 183.789 48.0469 183.789C41.6797 183.789 38.3789 179.805 35.957 176.895C33.6328 174.102 32.3047 172.656 29.5117 172.656C27.4805 172.656 25.8203 170.996 25.8203 168.965C25.8203 166.934 27.4805 165.273 29.5117 165.273C35.8789 165.273 39.1992 169.258 41.6211 172.168C43.9453 174.941 45.2734 176.406 48.0469 176.406C50.8203 176.406 52.168 174.961 54.4922 172.168C56.9141 169.258 60.2344 165.273 66.6016 165.273C72.9688 165.273 76.2891 169.258 78.7109 172.168C81.0352 174.941 82.3633 176.406 85.1562 176.406C87.1875 176.406 88.8477 178.066 88.8477 180.098C88.8281 182.148 87.168 183.789 85.1367 183.789Z" fill="#FFFFFF"/>
            </svg>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#FFFFFF', fontFamily: 'var(--font-display)' }}>
                + 补充我的异色
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', marginTop: 1 }}>
                手动记录以前抓过的精灵 & 消耗
              </div>
            </div>
          </button>

          {/* 空状态 */}
          {tasks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <div className="empty-state-text">
                暂无刷取记录<br />开始第一次刷取后，记录将显示在这里
              </div>
            </div>
          ) : (
            <>
              <div style={{ margin: '4px 16px 6px', fontSize: 11, color: 'var(--text-light)', fontWeight: 700, letterSpacing: 1 }}>
                ▼ 最近记录（共 {tasks.length} 条）
              </div>
              {tasks.map((task, i) => (
                <HistoryCard key={task.id || i} task={task} index={i} userPlanConfig={state.userPlanConfig} />
              ))}
            </>
          )}
        </div>
      )}

      {/* 更新公告弹窗 */}
      {showChangelog && (
        <ChangelogModal onClose={() => setShowChangelog(false)} />
      )}

      {/* 邮箱绑定弹窗 */}
      {showBindModal && (
        <BindEmailModal
          onClose={() => setShowBindModal(false)}
          onSuccess={(email) => {
            // 邮件发出后关闭弹窗，顶部显示提示条
            // 真正的账号升级在用户点邮件链接后由 store 的 onAuthStateChange 自动完成
            setBindSentEmail(email);
            setShowBindModal(false);
          }}
        />
      )}

    </div>
  );
}
