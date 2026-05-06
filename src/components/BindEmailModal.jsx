import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase';
import { useStore } from '../store';

// OTP 验证码流程：
//   1. 用户选择模式（bind / login / switch）并输入邮箱
//   2. signInWithOtp 发送 8 位数字验证码（无 emailRedirectTo）
//   3. 用户在当前设备输入验证码 → verifyOtp 完成验证
//
// 模式说明：
//   bind   - 绑定邮箱：当前匿名数据 + 云端数据取并集
//   login  - 找回账号：当前设备数据 + 云端数据取并集（同 bind 效果）
//   switch - 切换账号：仅加载目标账号云端数据，当前设备数据不合并进去

async function sendOtp(email) {
  const { error } = await supabase.auth.signInWithOtp({ email });
  if (error) throw error;
}

async function doVerifyOtp(email, token) {
  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  });
  if (error) throw error;
}

function isWechatBrowser() {
  return /MicroMessenger/i.test(navigator.userAgent);
}

const RESEND_CD = 60;

// ── 各模式的文案配置 ──────────────────────────────────────────────────────────
const MODE_CONFIG = {
  bind: {
    title: '📧 绑定邮箱',
    desc: '绑定邮箱后，换手机或重装也能一键恢复全部数据，历史记录和收集进度一条不丢。',
    verifyBtn: '确认绑定',
  },
  login: {
    title: '🔑 找回账号',
    desc: '输入你之前绑定的邮箱，验证成功后此设备的数据会与云端记录合并，两边进度都保留。',
    verifyBtn: '确认找回',
  },
  switch: {
    title: '🔄 切换账号',
    desc: '输入另一个已绑定账号的邮箱，验证后此设备将切换到该账号。当前设备的数据不会合并过去，请放心。',
    verifyBtn: '确认切换',
  },
};

export default function BindEmailModal({ onClose, onSuccess, initialMode = 'bind' }) {
  const { forceSyncNow, setAuthMode } = useStore();
  const [step, setStep] = useState('input');    // 'input' | 'verify'
  const [mode, setMode] = useState(initialMode); // 'bind' | 'login' | 'switch'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCd, setResendCd] = useState(0);
  const cdRef = useRef(null);
  const inWechat = isWechatBrowser();

  const cfg = MODE_CONFIG[mode];

  // 倒计时
  useEffect(() => {
    if (resendCd <= 0) return;
    cdRef.current = setInterval(() => {
      setResendCd(v => {
        if (v <= 1) { clearInterval(cdRef.current); return 0; }
        return v - 1;
      });
    }, 1000);
    return () => clearInterval(cdRef.current);
  }, [resendCd > 0]);

  // 发送验证码
  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes('@')) {
      setError('请输入有效的邮箱地址');
      return;
    }
    setLoading(true);
    setError('');

    // 切换账号模式：不写 pending_bind_email，当前数据已有增量同步，无需额外备份
    // 绑定/找回模式：写入 pending_bind_email，供登录后合并时使用
    if (mode !== 'switch') {
      try {
        await forceSyncNow(trimmed);
      } catch (syncErr) {
        const msg = syncErr.message || '';
        if (msg.includes('尚未获得用户身份')) {
          setError('账号初始化中，请稍候 3 秒后重试');
        } else {
          setError(`数据备份失败，暂不发送验证码。原因：${msg}`);
        }
        setLoading(false);
        return;
      }
    }

    // 提前设置登录模式，SIGNED_IN 事件触发时读取
    setAuthMode(mode === 'switch' ? 'switch' : 'normal');

    try {
      await sendOtp(trimmed);
      setStep('verify');
      setResendCd(RESEND_CD);
    } catch (err) {
      setAuthMode('normal'); // 发送失败，重置模式
      const msg = err.message || '';
      if (msg.toLowerCase().includes('rate limit') || msg.includes('too many')) {
        setError('发送太频繁，请稍后再试');
      } else {
        setError(msg || '发送失败，请检查网络后重试');
      }
    } finally {
      setLoading(false);
    }
  }

  // 验证 OTP
  async function handleVerify(e) {
    e.preventDefault();
    const trimmed = otp.trim();
    if (!trimmed || trimmed.length < 4) {
      setError('请输入完整的验证码');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await doVerifyOtp(email.trim(), trimmed);
      onSuccess?.(email.trim(), mode);
    } catch (err) {
      setAuthMode('normal'); // 验证失败，重置模式，避免下次残留
      const msg = err.message || '';
      if (msg.toLowerCase().includes('expired') || msg.toLowerCase().includes('invalid')) {
        setError('验证码错误或已过期，请重新发送');
      } else {
        setError(msg || '验证失败，请重试');
      }
    } finally {
      setLoading(false);
    }
  }

  // 重发验证码
  async function handleResend() {
    if (resendCd > 0 || loading) return;
    setLoading(true);
    setError('');
    try {
      await sendOtp(email.trim());
      setResendCd(RESEND_CD);
      setOtp('');
    } catch (err) {
      setError(err.message || '发送失败，请重试');
    } finally {
      setLoading(false);
    }
  }

  function switchMode(m) {
    setMode(m);
    setError('');
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>

        {/* ── 步骤一：输入邮箱 ── */}
        {step === 'input' && (
          <>
            <div className="modal-header">
              <h3>{cfg.title}</h3>
              <button className="modal-close" onClick={onClose}>✕</button>
            </div>

            <div className="modal-body">
              {/* 模式选择 Tab */}
              <div style={{
                display: 'flex',
                gap: 6,
                marginBottom: 14,
                background: 'var(--bg-secondary, #f5f5f5)',
                borderRadius: 10,
                padding: 4,
              }}>
                {[
                  { key: 'bind',   label: '绑定邮箱' },
                  { key: 'login',  label: '找回账号' },
                  { key: 'switch', label: '切换账号' },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => switchMode(key)}
                    style={{
                      flex: 1,
                      padding: '7px 0',
                      border: 'none',
                      borderRadius: 7,
                      fontSize: 13,
                      fontWeight: mode === key ? 700 : 400,
                      cursor: 'pointer',
                      background: mode === key ? '#fff' : 'transparent',
                      color: mode === key ? 'var(--primary, #4CAF50)' : 'var(--text-muted, #888)',
                      boxShadow: mode === key ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                      transition: 'all 0.18s',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <p className="modal-desc">{cfg.desc}</p>

              {/* 切换账号额外提示 */}
              {mode === 'switch' && (
                <div style={{
                  margin: '0 0 10px',
                  padding: '9px 12px',
                  borderRadius: 9,
                  background: '#FFF8E1',
                  border: '1.5px solid rgba(255,193,7,0.4)',
                  fontSize: 12,
                  color: '#795548',
                  lineHeight: 1.6,
                }}>
                  💡 切换后此设备将只显示目标账号的数据。当前设备若有未绑定的记录，建议先用「绑定邮箱」保存。
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="input-group">
                  <label>邮箱地址</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(''); }}
                    placeholder="example@email.com"
                    autoFocus
                    autoComplete="email"
                  />
                </div>

                {error && <div className="form-error">⚠️ {error}</div>}

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                  style={{ width: '100%', marginTop: 12 }}
                >
                  {loading ? '发送中…' : '发送验证码'}
                </button>
              </form>
            </div>
          </>
        )}

        {/* ── 步骤二：输入验证码 ── */}
        {step === 'verify' && (
          <>
            <div className="modal-header">
              <h3>📬 输入验证码</h3>
              <button className="modal-close" onClick={onClose}>✕</button>
            </div>

            <div className="modal-body">
              <p className="modal-desc">
                验证码已发送至 <strong>{email}</strong><br />
                请查收邮件，将 8 位数字验证码填入下方。
              </p>

              {/* 切换账号：醒目提示 */}
              {mode === 'switch' && (
                <div style={{
                  margin: '4px 0 12px',
                  padding: '10px 12px',
                  borderRadius: 10,
                  background: '#FFF3E0',
                  border: '1.5px solid rgba(255,152,0,0.4)',
                  fontSize: 12,
                  color: '#E65100',
                  lineHeight: 1.7,
                }}>
                  🔄 验证后将切换到 <strong>{email}</strong> 的账号，当前设备数据不会合并进去。
                </div>
              )}

              {inWechat && (
                <div style={{
                  margin: '8px 0 12px',
                  padding: '10px 12px',
                  borderRadius: 10,
                  background: '#F0FFF4',
                  border: '1.5px solid rgba(75,156,70,0.35)',
                  textAlign: 'left',
                }}>
                  <div style={{ fontSize: 12, fontWeight: 900, color: '#3D8B3D', marginBottom: 4 }}>
                    📱 微信用户
                  </div>
                  <div style={{ fontSize: 11, color: '#2E7D32', lineHeight: 1.7 }}>
                    请打开手机邮箱 App 查收验证码，回到此页面输入即可，无需跳转浏览器。
                  </div>
                </div>
              )}

              <form onSubmit={handleVerify}>
                <div className="input-group">
                  <label>验证码</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={8}
                    value={otp}
                    onChange={e => { setOtp(e.target.value.replace(/\D/g, '')); setError(''); }}
                    placeholder="输入验证码"
                    autoFocus
                    style={{ letterSpacing: 6, fontSize: 22, textAlign: 'center' }}
                  />
                </div>

                {error && <div className="form-error">⚠️ {error}</div>}

                <div className="sent-tips" style={{ marginTop: 8 }}>
                  <p>⏳ 邮件通常 <strong>1 分钟内</strong>送达，请耐心等待</p>
                  <p>📌 没收到？请检查垃圾邮件箱</p>
                  <p>🔢 验证码 <strong>10 分钟</strong>内有效，共 8 位数字</p>
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                  style={{ width: '100%', marginTop: 12 }}
                >
                  {loading ? '验证中…' : cfg.verifyBtn}
                </button>
              </form>

              <div style={{ marginTop: 12, textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
                没收到验证码？
                <button
                  className="link-btn"
                  style={{ fontSize: 13, opacity: resendCd > 0 ? 0.5 : 1 }}
                  disabled={resendCd > 0 || loading}
                  onClick={handleResend}
                >
                  {resendCd > 0 ? `重新发送（${resendCd}s）` : '重新发送'}
                </button>
              </div>

              <button
                className="btn-secondary"
                style={{ width: '100%', marginTop: 10 }}
                onClick={() => { setStep('input'); setOtp(''); setError(''); setAuthMode('normal'); }}
              >
                ← 修改邮箱
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
