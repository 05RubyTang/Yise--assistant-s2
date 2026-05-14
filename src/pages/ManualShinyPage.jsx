import { useState } from 'react';
import { useStore } from '../store';
import { PLANS, ALL_SHINIES } from '../data/plans';
import SpiritAvatar from '../components/SpiritAvatar';
import PlanIcon from '../components/PlanIcon';

/* ── 果实方案选择弹窗 ── */
function PlanPickerModal({ value, onChange, onClose }) {
  const regularPlans = PLANS.filter(p => p.category !== 'seasonal');
  const seasonPlans  = PLANS.filter(p => p.category === 'seasonal');

  const Row = ({ p }) => {
    const isSel = value === p.id;
    return (
      <button
        onClick={() => { onChange(isSel ? null : p.id); onClose(); }}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          width: '100%', padding: '11px 16px', border: 'none',
          background: isSel ? 'rgba(200,131,10,0.10)' : 'transparent',
          borderBottom: '1px solid var(--divider)',
          cursor: 'pointer', textAlign: 'left',
        }}
      >
        <PlanIcon plan={p} size={18} />
        <span style={{
          flex: 1, fontSize: 14, fontWeight: 700,
          color: isSel ? '#C8830A' : 'var(--text)',
          fontFamily: 'var(--font-body)',
        }}>{p.type}方案</span>
        {isSel && <span style={{ fontSize: 16, color: '#C8830A' }}>✓</span>}
      </button>
    );
  };

  return (
    <>
      {/* 遮罩 */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 100,
        }}
      />
      {/* Sheet */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 101,
        background: 'var(--card)', borderRadius: '18px 18px 0 0',
        maxHeight: '72%', display: 'flex', flexDirection: 'column',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.18)',
      }}>
        {/* 拖拽把手 */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--divider)' }} />
        </div>
        {/* 标题行 */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '2px 16px 10px',
          borderBottom: '1.5px solid var(--divider)',
        }}>
          <span style={{ fontSize: 14, fontWeight: 900, color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
            选择果实方案
          </span>
          <button onClick={onClose} style={{
            border: 'none', background: 'transparent', fontSize: 18,
            color: 'var(--text-muted)', cursor: 'pointer', padding: '0 4px',
          }}>✕</button>
        </div>
        {/* 列表 */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {/* 不选 */}
          <button
            onClick={() => { onChange(null); onClose(); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              width: '100%', padding: '11px 16px', border: 'none',
              background: value === null ? 'rgba(200,131,10,0.10)' : 'transparent',
              borderBottom: '1px solid var(--divider)',
              cursor: 'pointer', textAlign: 'left',
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-muted)', flex: 1 }}>不填 / 跳过</span>
            {value === null && <span style={{ fontSize: 16, color: '#C8830A' }}>✓</span>}
          </button>

          {/* 属性方案 */}
          <div style={{ padding: '6px 16px 2px', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 0.5 }}>
            属性方案
          </div>
          {regularPlans.map(p => <Row key={p.id} p={p} />)}

          {/* 赛季奇遇方案 */}
          <div style={{ padding: '10px 16px 2px', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 0.5 }}>
            赛季奇遇方案
          </div>
          {seasonPlans.map(p => <Row key={p.id} p={p} />)}
          <div style={{ height: 20 }} />
        </div>
      </div>
    </>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 700, color: 'var(--text-muted)',
      marginBottom: 8, letterSpacing: 0.5,
    }}>{children}</div>
  );
}

function NumInput({ value, onChange, placeholder, color = '#2B2A2E' }) {
  return (
    <input
      type="number" inputMode="numeric" min="0"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%', boxSizing: 'border-box',
        padding: '11px 14px', borderRadius: 10,
        border: `1.5px solid ${color}44`,
        background: 'var(--card-inner)',
        fontSize: 16, fontWeight: 800, color,
        fontFamily: 'var(--font-display)', outline: 'none',
      }}
    />
  );
}

function parseN(str) {
  const n = parseInt(str, 10);
  return (str.trim() !== '' && !isNaN(n) && n >= 0) ? n : null;
}

export default function ManualShinyPage({ goBack }) {
  const { dispatch } = useStore();

  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [planId, setPlanId] = useState(null);
  const [showPlanPicker, setShowPlanPicker] = useState(false);
  const [shieldBreakCount, setShieldBreakCount] = useState('');
  const [polluted, setPolluted] = useState('');
  const [original, setOriginal] = useState('');
  // 球数模式：'simple'（总数）| 'byType'（分球类）
  const [ballMode, setBallMode] = useState('simple');
  const [ballsUsed, setBallsUsed] = useState('');
  const [ballAdv, setBallAdv] = useState('');
  const [ballSea, setBallSea] = useState('');
  const [ballAtt, setBallAtt] = useState('');
  const [dateInput, setDateInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const filtered = search.trim()
    ? ALL_SHINIES.filter(n => n.includes(search.trim()))
    : ALL_SHINIES;

  const handleSave = () => {
    if (!selected || saving) return;
    setSaving(true);
    const sbc = parseN(shieldBreakCount);
    const pol = parseN(polluted);
    const ori = parseN(original);
    let bal = null;
    let byType = null;
    if (ballMode === 'byType') {
      const adv = parseN(ballAdv) ?? 0;
      const sea = parseN(ballSea) ?? 0;
      const att = parseN(ballAtt) ?? 0;
      byType = { adv, sea, att };
      bal = adv + sea + att;
      if (bal === 0 && ballAdv === '' && ballSea === '' && ballAtt === '') {
        bal = null;
        byType = null;
      }
    } else {
      bal = parseN(ballsUsed);
    }
    let completedAt = new Date().toISOString();
    if (dateInput.trim()) {
      const d = new Date(dateInput.trim());
      if (!isNaN(d.getTime())) completedAt = d.toISOString();
    }
    dispatch({
      type: 'ADD_MANUAL_SHINY',
      spiritName: selected,
      planId,
      resultType: 'pool',
      shieldBreakCount: sbc,
      breakdowns: { polluted: pol ?? 0, original: ori ?? 0, shiny: 0 },
      ballsUsed: bal,
      ...(byType ? { ballsUsedByType: byType } : {}),
      completedAt,
    });
    setSaved(true);
    setTimeout(() => goBack(), 600);
  };

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', minHeight: '100%', background: 'var(--bg)' }}>

      {/* ── 顶部导航栏 ── */}
      <div style={{
        background: '#2B2A2E',
        padding: '14px 16px 12px',
        display: 'flex', alignItems: 'center', gap: 10,
        flexShrink: 0,
      }}>
        <button onClick={goBack} style={{
          border: 'none', background: 'rgba(255,255,255,0.12)',
          borderRadius: 10, width: 36, height: 36,
          fontSize: 16, color: '#FBF7EC', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>←</button>
        <div>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#FBC839', fontFamily: 'var(--font-display)', letterSpacing: 1 }}>
            ✍️ 手动补录异色记录
          </div>
          <div style={{ fontSize: 10, color: 'rgba(251,200,57,0.65)', marginTop: 1 }}>
            {selected ? `已选：${selected} · 填写详情后保存` : '第一步：选择精灵'}
          </div>
        </div>
      </div>

      {/* ── 可滚动内容区 ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 16px' }}>

        {/* 精灵选择 */}
        <div style={{
          background: 'var(--card)', borderRadius: 'var(--radius)',
          border: '1.5px solid var(--card-border)',
          boxShadow: 'var(--shadow-card)',
          padding: '14px 14px 10px',
          marginBottom: 12,
        }}>
          <SectionLabel>选择精灵</SectionLabel>
          {/* 搜索 */}
          <div style={{ position: 'relative', marginBottom: 10 }}>
            <span style={{
              position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
              fontSize: 13, color: 'var(--text-muted)', pointerEvents: 'none',
            }}>🔍</span>
            <input
              type="text" value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="搜索精灵名称…"
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '9px 12px 9px 32px', borderRadius: 10,
                border: '1.5px solid var(--divider)', background: 'var(--card-inner)',
                fontSize: 13, color: 'var(--text)', outline: 'none', fontFamily: 'var(--font-body)',
              }}
            />
          </div>
          {/* 网格 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 7 }}>
            {filtered.map(name => {
              const isSel = selected === name;
              return (
                <button key={name} onClick={() => setSelected(isSel ? null : name)} style={{
                  border: isSel ? '2px solid #C8830A' : '1.5px solid var(--divider)',
                  borderRadius: 12,
                  background: isSel ? 'rgba(200,131,10,0.10)' : 'var(--card-inner)',
                  padding: '7px 4px 5px', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  transition: 'all 0.15s',
                  boxShadow: isSel ? '0 0 0 3px rgba(200,131,10,0.15)' : 'none',
                }}>
                  <SpiritAvatar name={name} obtained size={40} showName={false} />
                  <span style={{
                    fontSize: 9, fontWeight: 700,
                    color: isSel ? '#C8830A' : 'var(--text-muted)',
                    textAlign: 'center', lineHeight: 1.3, wordBreak: 'break-all',
                  }}>{name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 详情填写（选了精灵才展开） */}
        {selected && (
          <>
            {/* 果实方案 — 单行点击弹窗 */}
            <div style={{
              background: 'var(--card)', borderRadius: 'var(--radius)',
              border: '1.5px solid var(--card-border)',
              boxShadow: 'var(--shadow-card)',
              marginBottom: 12, overflow: 'hidden',
            }}>
              <button
                onClick={() => setShowPlanPicker(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  width: '100%', padding: '13px 14px', border: 'none',
                  background: 'transparent', cursor: 'pointer', textAlign: 'left',
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 0.5, minWidth: 54 }}>
                  果实方案
                </span>
                <span style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {planId ? (() => {
                    const p = PLANS.find(x => x.id === planId);
                    return p ? (
                      <>
                        <PlanIcon plan={p} size={15} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{p.type}方案</span>
                      </>
                    ) : null;
                  })() : (
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>不填 / 跳过</span>
                  )}
                </span>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>›</span>
              </button>
            </div>

            {/* 触发数据 */}
            <div style={{
              background: 'var(--card)', borderRadius: 'var(--radius)',
              border: '1.5px solid var(--card-border)',
              boxShadow: 'var(--shadow-card)',
              padding: '14px', marginBottom: 12,
            }}>
              <SectionLabel>触发污染数据 <span style={{ fontWeight: 500 }}>（选填）</span></SectionLabel>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#D4560A', marginBottom: 6 }}>触发污染总次数</div>
                <NumInput value={shieldBreakCount} onChange={setShieldBreakCount} placeholder="输入触发次数（0~80）" color="#D4560A" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#8B4BB8', marginBottom: 6 }}>污染精灵次数</div>
                  <NumInput value={polluted} onChange={setPolluted} placeholder="紫色结果" color="#8B4BB8" />
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#4B9C46', marginBottom: 6 }}>原色精灵次数</div>
                  <NumInput value={original} onChange={setOriginal} placeholder="绿色结果" color="#4B9C46" />
                </div>
              </div>
            </div>

            {/* 消耗球数 & 时间 */}
            <div style={{
              background: 'var(--card)', borderRadius: 'var(--radius)',
              border: '1.5px solid var(--card-border)',
              boxShadow: 'var(--shadow-card)',
              padding: '14px', marginBottom: 12,
            }}>
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <SectionLabel style={{ marginBottom: 0 }}>消耗球数 <span style={{ fontWeight: 500 }}>（选填）</span></SectionLabel>
                  {/* 模式切换胶囊 */}
                  <div style={{
                    display: 'flex', borderRadius: 20,
                    border: '1.5px solid var(--divider)', overflow: 'hidden',
                    flexShrink: 0,
                  }}>
                    {[{ key: 'simple', label: '总球数' }, { key: 'byType', label: '分球类' }].map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => setBallMode(key)}
                        style={{
                          padding: '4px 11px', border: 'none', cursor: 'pointer',
                          fontSize: 11, fontWeight: 700,
                          background: ballMode === key ? '#2B2A2E' : 'transparent',
                          color: ballMode === key ? '#FBC839' : 'var(--text-muted)',
                          transition: 'all 0.15s',
                        }}
                      >{label}</button>
                    ))}
                  </div>
                </div>

                {ballMode === 'simple' ? (
                  <NumInput value={ballsUsed} onChange={setBallsUsed} placeholder="消耗了多少精灵球？" color="#2B2A2E" />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#1565C0', marginBottom: 5 }}>高级球</div>
                      <NumInput value={ballAdv} onChange={setBallAdv} placeholder="消耗高级球数量" color="#1565C0" />
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#6A1B9A', marginBottom: 5 }}>赛季球</div>
                      <NumInput value={ballSea} onChange={setBallSea} placeholder="消耗赛季球数量" color="#6A1B9A" />
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#D4560A', marginBottom: 5 }}>属性球</div>
                      <NumInput value={ballAtt} onChange={setBallAtt} placeholder="消耗属性球数量" color="#D4560A" />
                    </div>
                    {/* 合计预览 */}
                    {(ballAdv || ballSea || ballAtt) && (
                      <div style={{
                        padding: '7px 12px', borderRadius: 8,
                        background: 'rgba(43,42,46,0.07)',
                        fontSize: 12, fontWeight: 700, color: 'var(--text)',
                        textAlign: 'right',
                      }}>
                        合计：{(parseN(ballAdv) ?? 0) + (parseN(ballSea) ?? 0) + (parseN(ballAtt) ?? 0)} 球
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div>
                <SectionLabel>获得时间 <span style={{ fontWeight: 500 }}>（选填，留空 = 现在）</span></SectionLabel>
                <input
                  type="datetime-local"
                  value={dateInput}
                  onChange={e => setDateInput(e.target.value)}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    padding: '11px 14px', borderRadius: 10,
                    border: '1.5px solid var(--divider)', background: 'var(--card-inner)',
                    fontSize: 13, color: 'var(--text)', outline: 'none',
                    fontFamily: 'var(--font-body)',
                  }}
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── 底部固定保存按钮 ── */}
      <div style={{
        flexShrink: 0,
        padding: '12px 16px 20px',
        background: 'linear-gradient(to top, var(--bg) 85%, transparent)',
      }}>
        <button
          className={`btn btn-gold${(!selected || saving || saved) ? ' btn-disabled' : ''}`}
          onClick={handleSave}
          disabled={!selected || saving || saved}
          style={{
            width: '100%', margin: 0,
            opacity: saved ? 1 : (!selected || saving) ? 0.45 : 1,
            background: saved ? '#4B9C46' : undefined,
            border: saved ? '2px solid #3A7A37' : undefined,
            boxShadow: saved ? '0 4px 0 #2A5A27' : undefined,
            color: saved ? '#fff' : undefined,
          }}
        >
          {saved ? '✓ 已收录！' : saving ? '保存中…' : selected ? `收录「${selected}」` : '请先选择精灵'}
          </button>
        </div>
  
        {/* 果实方案弹窗 */}
        {showPlanPicker && (
          <PlanPickerModal
            value={planId}
            onChange={setPlanId}
            onClose={() => setShowPlanPicker(false)}
          />
        )}
      </div>
    );
  }
