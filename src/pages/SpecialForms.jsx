import { useState } from 'react';
import { SPECIAL_FORMS } from '../data/plans';
import { getWikiFruitImg } from '../data/fruits-wiki';

const base = import.meta.env.BASE_URL;

// 精灵图（加载失败自动隐藏整个框）
function SpiritImg({ name, size = 80 }) {
  return (
    <div style={{
      width: size, height: size, flexShrink: 0,
      borderRadius: 12,
      background: 'var(--card-inner)',
      border: '1.5px solid var(--card-border)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
    }}>
      <img
        src={`${base}spirits/${encodeURIComponent(name)}.png`}
        alt={name}
        style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 5, boxSizing: 'border-box' }}
        onError={e => { e.currentTarget.parentElement.style.display = 'none'; }}
      />
    </div>
  );
}

// 果实图（本地优先，兜底 wiki CDN）
function FruitImg({ name, size = 80 }) {
  const localSrc = `${base}fruits/${encodeURIComponent(name)}.png?v=3`;
  const rawWikiSrc = getWikiFruitImg(name);
  // v=3 用于破除浏览器对旧 wiki CDN URL 的缓存
  const wikiSrc = rawWikiSrc ? `${rawWikiSrc}?v=3` : null;
  const [src, setSrc] = useState(localSrc);
  const [triedWiki, setTriedWiki] = useState(false);

  const handleError = (e) => {
    if (!triedWiki && wikiSrc) {
      setTriedWiki(true);
      setSrc(wikiSrc);
    } else {
      e.currentTarget.parentElement.style.display = 'none';
    }
  };

  return (
    <div style={{
      width: size, height: size, flexShrink: 0,
      borderRadius: 12,
      background: 'rgba(200,131,10,0.07)',
      border: '1.5px solid rgba(200,131,10,0.22)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
    }}>
      <img
        src={src}
        alt={name}
        style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 5, boxSizing: 'border-box' }}
        onError={handleError}
      />
    </div>
  );
}

// 小标签
function ImgLabel({ children, color = 'var(--text-muted)' }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 600, color, textAlign: 'center', marginTop: 4 }}>
      {children}
    </div>
  );
}

// 信息行
function InfoRow({ icon, label, color, bg, border, children }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 8,
      padding: '8px 12px',
      borderRadius: 10,
      background: bg,
      border: `1px solid ${border}`,
    }}>
      <span style={{ fontSize: 15, flexShrink: 0, lineHeight: 1.2 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 10, fontWeight: 800, color, marginBottom: 2, letterSpacing: 0.4 }}>
          {label}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text)', fontWeight: 600, lineHeight: 1.5 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// 单精灵卡（小星光、小狮鹫、地鼠）
function SingleFormCard({ form, delay }) {
  return (
    <div className="card animate-in" style={{ animationDelay: `${delay}s`, padding: 0, overflow: 'hidden' }}>

      {/* ── 图片横排区 ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '16px 16px 12px',
        borderBottom: '1px solid var(--divider)',
      }}>
        {/* 左：果实图 */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <FruitImg name={form.fruitImg} size={76} />
          <ImgLabel color="#C8830A">果实</ImgLabel>
        </div>

        <span style={{ fontSize: 16, color: 'var(--text-muted)', flexShrink: 0 }}>→</span>

        {/* 右：普通形态（可选） + 隐藏形态 */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, flex: 1 }}>
          {form.baseSpirit && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <SpiritImg name={form.baseSpirit} size={72} />
                <ImgLabel>普通形态</ImgLabel>
              </div>
              <span style={{ fontSize: 14, color: 'var(--text-muted)', flexShrink: 0, paddingBottom: 18 }}>→</span>
            </>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <SpiritImg name={form.hiddenForm} size={72} />
            <ImgLabel color="#9C6FE0">隐藏形态</ImgLabel>
          </div>
        </div>
      </div>

      {/* ── 隐藏形态名 ── */}
      <div style={{ padding: '10px 16px 2px' }}>
        {form.baseSpirit && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 1 }}>
            {form.spirit} · {form.baseSpirit}
          </div>
        )}
        <div style={{ fontSize: 15, fontWeight: 900, color: '#9C6FE0', fontFamily: 'var(--font-display)' }}>
          {form.hiddenForm}
        </div>
      </div>

      {/* ── 详情行 ── */}
      <div style={{ padding: '8px 14px 14px', display: 'flex', flexDirection: 'column', gap: 7 }}>
        <InfoRow icon="🌰" label="果实外观" color="#C8830A" bg="rgba(200,131,10,0.06)" border="rgba(200,131,10,0.2)">
          {form.acornDesc}
        </InfoRow>
        <InfoRow icon="📍" label="放入地点" color="#5B9CF6" bg="rgba(91,156,246,0.07)" border="rgba(91,156,246,0.2)">
          <strong style={{ fontSize: 13, fontFamily: 'var(--font-display)', color: '#2B2A2E' }}>{form.sanctuary}</strong>
        </InfoRow>
      </div>
    </div>
  );
}

// 蹦蹦种子合并大卡
function BunBunCard({ forms, delay }) {
  return (
    <div className="card animate-in" style={{ animationDelay: `${delay}s`, padding: 0, overflow: 'hidden' }}>

      {/* 顶部标题 */}
      <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid var(--divider)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
          <div style={{ width: 4, height: 18, borderRadius: 2, background: '#9C6FE0', flexShrink: 0 }} />
          <span style={{ fontSize: 15, fontWeight: 900, color: '#2B2A2E', fontFamily: 'var(--font-display)' }}>
            蹦蹦种子
          </span>
          <span style={{
            fontSize: 10, padding: '1px 8px', borderRadius: 10, fontWeight: 700,
            background: 'rgba(156,111,224,0.1)', color: '#9C6FE0',
            border: '1px solid rgba(156,111,224,0.25)',
          }}>3 种果实形态</span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.7 }}>
          蹦蹦种子有 <strong style={{ color: '#2B2A2E' }}>3 种不同果实</strong>，需分别放入不同地底护所解锁对应隐藏形态。
        </div>
      </div>

      {/* 横排主体：左果实图 + 右三种形态列表 */}
      <div style={{ display: 'flex', gap: 12, padding: '14px 14px 14px' }}>

        {/* 左：果实图（共用一张） */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
          <FruitImg name={forms[0].fruitImg} size={76} />
          <ImgLabel color="#C8830A">果实</ImgLabel>
        </div>

        <span style={{ fontSize: 16, color: 'var(--text-muted)', flexShrink: 0, paddingTop: 28 }}>→</span>

        {/* 右：三种形态 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {forms.map((form, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 10px',
              borderRadius: 10,
              background: 'var(--card-inner)',
              border: '1px solid var(--card-border)',
            }}>
              <SpiritImg name={`蹦蹦种子${form.hiddenForm}`} size={56} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: '#9C6FE0', fontFamily: 'var(--font-display)', marginBottom: 3 }}>
                  {form.hiddenForm}
                </div>
                <div style={{
                  fontSize: 10, fontWeight: 700, color: '#C8830A',
                  background: 'rgba(200,131,10,0.07)', border: '1px solid rgba(200,131,10,0.2)',
                  borderRadius: 5, padding: '1px 6px', display: 'inline-block', marginBottom: 3,
                }}>
                  🌰 {form.acornDesc}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  <span style={{ color: '#5B9CF6', fontWeight: 700 }}>📍 </span>
                  <span style={{ color: '#2B2A2E', fontWeight: 700 }}>{form.sanctuary}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SpecialForms({ goBack }) {
  const singleForms = SPECIAL_FORMS.filter(f => f.spirit !== '蹦蹦种子');
  const bunbunForms = SPECIAL_FORMS.filter(f => f.spirit === '蹦蹦种子');

  return (
    <div style={{ paddingBottom: 32 }}>
      <div className="page-header">
        <button className="back-btn" onClick={goBack}><img src={`${import.meta.env.BASE_URL}back-icon.png`} alt="返回" /></button>
        <span className="page-header-title">特殊形态精灵攻略</span>
      </div>

      {/* 说明横幅 */}
      <div className="card animate-in" style={{ padding: '12px 14px' }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: '#C8830A', marginBottom: 6 }}>
          🌰 果实形态解锁隐藏形态
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.7 }}>
          将精灵的<strong style={{ color: '#2B2A2E' }}>果实形态</strong>放入指定地底护所，等待一段时间后可解锁隐藏形态。<br />
          ⚠️ 需要放入<strong style={{ color: '#C8830A' }}>果实形态</strong>，而非普通精灵本体。
        </div>
      </div>

      {/* 单精灵卡 */}
      {singleForms.map((form, i) => (
        <SingleFormCard key={form.hiddenForm} form={form} delay={i * 0.07} />
      ))}

      {/* 蹦蹦种子合并大卡 */}
      {bunbunForms.length > 0 && (
        <BunBunCard forms={bunbunForms} delay={singleForms.length * 0.07} />
      )}
    </div>
  );
}
