import { useState } from 'react';
import { getWikiSpiritImg } from '../data/spirits-wiki';
import { LOCAL_SPIRIT_FILES } from '../data/local-assets';

const base = import.meta.env.BASE_URL;

// 色块内精灵图（本地有文件时优先本地，否则直接用 wiki CDN）
function DotSpiritImg({ name }) {
  const hasLocal = LOCAL_SPIRIT_FILES.has(name);
  const localSrc = hasLocal ? `${base}spirits/${encodeURIComponent(name)}.webp` : null;
  const wikiSrc = getWikiSpiritImg(name);
  const [src, setSrc] = useState(localSrc || wikiSrc || '');
  const [triedWiki, setTriedWiki] = useState(!hasLocal);

  const handleError = (e) => {
    if (!triedWiki && wikiSrc) {
      setTriedWiki(true);
      setSrc(wikiSrc);
    } else {
      e.currentTarget.style.display = 'none';
    }
  };

  return (
    <img
      src={src}
      alt={name}
      title={name}
      loading="lazy"
      onError={handleError}
    />
  );
}

/**
 * 触发污染色块列表
 * 每格根据 break 记录类型着色，并显示精灵小图标（如有）。
 *
 * @param {Array}  breaks - task.shieldBreaks 数组
 * @param {number} max    - 最大格数（默认80）
 */
export default function ShieldDots({ breaks, max = 80 }) {
  const dots = [];

  for (let i = 0; i < max; i++) {
    const b = breaks[i];
    let cls = 'shield-dot';
    let inner = null;

    if (b) {
      cls += ` ${b.result}`;
      if (i === breaks.length - 1) cls += ' latest';

      if (b.result === 'shiny') {
        inner = <span className="dot-emoji">✨</span>;
      } else if (b.result === 'jelly') {
        inner = <span className="dot-emoji">🍮</span>;
      } else if (b.spiritName) {
        // original / polluted + 有精灵名：显示精灵头像（支持 wiki 兜底）
        inner = <DotSpiritImg name={b.spiritName} />;
      }
    }

    dots.push(
      <div key={i} className={cls}>
        {inner}
      </div>
    );
  }

  return <div className="shield-dots">{dots}</div>;
}
