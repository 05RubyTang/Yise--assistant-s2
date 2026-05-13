import { useState } from 'react';
import { getWikiSpiritImg } from '../data/spirits-wiki';
import { LOCAL_SPIRIT_FILES } from '../data/local-assets';

const base = import.meta.env.BASE_URL;

// 精灵名 → 图片文件名映射（精灵图文件名与精灵名不一致时使用）
// 柴渣虫的展示图为其异色形态效果图「燃薪虫.png」
const SPIRIT_IMG_FILE = {
  '柴渣虫': '燃薪虫',
};

/**
 * 精灵头像组件
 * 优先加载本地 public/spirits/{name}.png（仅当本地已知有该文件时）
 * 本地不存在时直接使用 BWIKI 立绘图，避免无意义的 404 请求
 */
export default function SpiritAvatar({ name, obtained, size = 48, showName = true, bare = false }) {
  const fileName = SPIRIT_IMG_FILE[name] || name;
  const hasLocal = LOCAL_SPIRIT_FILES.has(fileName);
  const localSrc = hasLocal ? `${base}spirits/${encodeURIComponent(fileName)}.png` : null;
  const wikiSrc = getWikiSpiritImg(name);

  // 若本地有图就先用本地，否则直接用 wiki
  const [src, setSrc] = useState(localSrc || wikiSrc || '');
  const [triedWiki, setTriedWiki] = useState(!hasLocal);

  const handleError = (e) => {
    if (!triedWiki && wikiSrc) {
      // 本地图加载失败 → 尝试 wiki 图
      setTriedWiki(true);
      setSrc(wikiSrc);
    } else {
      // wiki 图也失败 → 隐藏
      e.target.style.display = 'none';
      if (e.target.nextSibling) {
        e.target.nextSibling.style.display = 'flex';
      }
    }
  };

  // bare 模式：只输出 img，不带任何外层 div（用于图鉴网格等自定义布局）
  if (bare) {
    return (
      <img
        src={src}
        alt={name}
        loading="lazy"
        style={{
          width: size, height: size,
          objectFit: 'contain',
          opacity: obtained ? 1 : 0.45,
          display: 'block',
        }}
        onError={e => {
          if (!triedWiki && wikiSrc) {
            setTriedWiki(true);
            setSrc(wikiSrc);
          } else {
            e.target.style.opacity = '0';
          }
        }}
      />
    );
  }

  return (
    <div
      className={`spirit-card${obtained ? ' spirit-card-obtained' : ''}`}
      style={{ width: size + 18 }}
    >
      <div className="spirit-card-img" style={{ width: size, height: size }}>
        <img
          src={src}
          alt={name}
          loading="lazy"
          style={{ opacity: obtained ? 1 : 0.5 }}
          onError={handleError}
        />
        {obtained && (
          <span className="spirit-card-check">✓</span>
        )}
      </div>
      {showName && (
        <span className="spirit-card-name" title={name}>{name}</span>
      )}
    </div>
  );
}
