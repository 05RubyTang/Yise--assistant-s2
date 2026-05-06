/**
 * FruitTag — 果实标签组件
 * 图片优先级：本地 public/fruits/{name}.png → BWIKI CDN → 金色色块兜底
 * 用法：<FruitTag name="治愈兔果实" size={18} />
 */
import { useState } from 'react';
import { getWikiFruitImg } from '../data/fruits-wiki';

const base = import.meta.env.BASE_URL;

function FruitImg({ name, size }) {
  const localSrc = `${base}fruits/${encodeURIComponent(name)}.png?v=3`;
  const rawWikiSrc = getWikiFruitImg(name);
  // v=3 用于破除浏览器对旧 wiki CDN URL 的缓存（果实图标 URL 有过变更）
  const wikiSrc = rawWikiSrc ? `${rawWikiSrc}?v=3` : null;
  const [src, setSrc] = useState(localSrc);
  const [triedWiki, setTriedWiki] = useState(false);

  const handleError = (e) => {
    if (!triedWiki && wikiSrc) {
      setTriedWiki(true);
      setSrc(wikiSrc);
    } else {
      e.currentTarget.style.display = 'none';
      if (e.currentTarget.nextSibling) {
        e.currentTarget.nextSibling.style.display = 'inline-block';
      }
    }
  };

  return (
    <img
      src={src}
      alt={name}
      width={size}
      height={size}
      style={{
        width: size,
        height: size,
        objectFit: 'contain',
        verticalAlign: 'middle',
        flexShrink: 0,
        borderRadius: size * 0.2,
      }}
      onError={handleError}
    />
  );
}

export default function FruitTag({ name, size = 18, showName = true, style = {} }) {
  if (!name) return null;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      ...style,
    }}>
      <FruitImg name={name} size={size} />
      {/* 兜底色块，图片加载失败时显示 */}
      <span style={{
        display: 'none',
        width: size, height: size,
        borderRadius: size * 0.25,
        background: 'linear-gradient(135deg, #F6C958 40%, #E8A030 100%)',
        border: '1.5px solid #BC8E3E',
        flexShrink: 0,
        verticalAlign: 'middle',
      }} />
      {showName && (
        <span style={{ verticalAlign: 'middle' }}>{name}</span>
      )}
    </span>
  );
}

/**
 * FruitLine — 渲染「fruitA [+ fruitB]」一行
 * 用法：<FruitLine fruitA={plan.fruitA} fruitB={plan.fruitB} size={16} />
 */
export function FruitLine({ fruitA, fruitB, size = 16, textStyle = {} }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, flexWrap: 'wrap', ...textStyle }}>
      <FruitTag name={fruitA} size={size} />
      {fruitB ? (
        <>
          <span style={{ color: 'var(--text-muted)', fontSize: size * 0.8 }}>+</span>
          <FruitTag name={fruitB} size={size} />
        </>
      ) : (
        <span style={{ color: 'var(--text-muted)', fontSize: size * 0.85 }}>（单放）</span>
      )}
    </span>
  );
}
