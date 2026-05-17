/**
 * FruitTag — 果实标签组件
 * 图片优先级链：
 *   1) 本地 public/fruits/{原名}.png
 *   2) 本地 public/fruits/{反查到的同义果实}.png（"独角兽" → "小独角兽果实"，"小灵面" → "小灵面果实" 等）
 *   3) BWIKI CDN（FRUITS_WIKI_IMG 字典）
 *   4) BWIKI CDN（反查到的同义果实）
 *   5) 本地 public/spirits/{精灵名}.png（用户输入精灵名时，去掉"果实"后缀去找精灵立绘）
 *   6) 首字汉字 SVG 头像兜底（不再用纯色块，更易识别且美观）
 * 用法：<FruitTag name="治愈兔果实" size={18} />
 */
import { useState, useMemo } from 'react';
import { getWikiFruitImg } from '../data/fruits-wiki';
import { getFruitBySpirit } from '../data/plans';

const base = import.meta.env.BASE_URL;

// ── 首字汉字头像兜底：不同果实首字 → 不同稳定渐变色 ──────────────────────────
const FALLBACK_PALETTE = [
  ['#F6C958', '#E8A030'], // 金黄
  ['#A8D88A', '#5BA850'], // 草绿
  ['#7FB7E8', '#3A82C4'], // 海蓝
  ['#F29A8A', '#D4513A'], // 珊瑚红
  ['#C8A8E2', '#7E57C2'], // 紫罗兰
  ['#F0AA60', '#C8732B'], // 橙棕
  ['#8AD0CC', '#3FA09A'], // 青绿
  ['#E89AB5', '#C2547A'], // 粉樱
  ['#9BB1C9', '#5C7A99'], // 雾蓝灰
  ['#D4B068', '#9B7B30'], // 古铜
];

function pickPalette(name) {
  // 简单哈希，保证同名稳定取色
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return FALLBACK_PALETTE[h % FALLBACK_PALETTE.length];
}

/** 从果实名取首字（"治愈兔果实"→"治"，"小灵面果实"→"小"）；非汉字时取首字符 */
function pickInitial(name) {
  const n = (name || '').trim();
  if (!n) return '?';
  // 跳过常见前缀符号
  const cleaned = n.replace(/^[\s「『《]/g, '');
  return cleaned.charAt(0) || '?';
}

/**
 * 构建图片源候选链。每次 onError 都向前推进一格，直到全部失败 → fallback SVG 头像
 * 数组里的每一项可以是 {kind:'img', src:string}，最后一项是 {kind:'svg'} 表示降级到首字头像
 */
function buildSrcChain(name) {
  const chain = [];
  const trimmed = (name || '').trim();
  if (!trimmed) return [{ kind: 'svg' }];

  // 辅助：同时推入 .webp 和 .png 两个候选，webp 优先（体积小、GitHub Pages 支持）
  function pushLocal(dir, filename) {
    const enc = encodeURIComponent(filename);
    chain.push({ kind: 'img', src: `${base}${dir}/${enc}.webp?v=3` });
    chain.push({ kind: 'img', src: `${base}${dir}/${enc}.png?v=3` });
  }

  // 反查同义果实名（用户输入精灵名 / 进化名时）
  const alias = getFruitBySpirit(trimmed.endsWith('果实') ? trimmed.slice(0, -2) : trimmed);

  // wiki CDN 查询（原名、补全「果实」后缀、反查名）
  const wikiSrc = getWikiFruitImg(trimmed)
    || (!trimmed.endsWith('果实') ? getWikiFruitImg(`${trimmed}果实`) : null)
    || (alias ? getWikiFruitImg(alias) : null);

  if (wikiSrc) {
    // ── 有 wiki 映射：直接走 CDN，跳过本地尝试，不产生 404 噪音 ──────────
    chain.push({ kind: 'img', src: `${wikiSrc}?v=3` });
  } else {
    // ── 无 wiki 映射：本地优先（S1 老果实有 public/fruits/ 本地图） ────────
    // 1. 本地 fruits 目录原名（webp 优先）
    pushLocal('fruits', trimmed);

    // 2. 若传入的是精灵名（不含「果实」后缀），自动补全「果实」再试本地图
    if (!trimmed.endsWith('果实')) {
      pushLocal('fruits', `${trimmed}果实`);
    }

    // 3. 反查同义果实名
    if (alias && alias !== trimmed) {
      pushLocal('fruits', alias);
    }

    // 4. 本地 spirits 目录（用户输入了完全自定义的精灵名）
    const spiritName = trimmed.endsWith('果实') ? trimmed.slice(0, -2) : trimmed;
    if (spiritName) {
      pushLocal('spirits', spiritName);
    }
  }

  // 兜底 SVG 首字头像
  chain.push({ kind: 'svg' });
  return chain;
}

function FallbackAvatar({ name, size }) {
  const [c1, c2] = useMemo(() => pickPalette(name), [name]);
  const initial   = useMemo(() => pickInitial(name), [name]);
  // 字号约为 size 的 0.55，单字时居中较好看
  const fontSize  = Math.round(size * 0.55);
  return (
    <span
      title={name}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: size, height: size,
        borderRadius: size * 0.22,
        background: `linear-gradient(135deg, ${c1} 30%, ${c2} 100%)`,
        border: `1.5px solid ${c2}`,
        color: '#FFF8E0',
        fontSize, fontWeight: 900,
        fontFamily: 'var(--font-display, "PingFang SC", system-ui)',
        textShadow: '0 1px 2px rgba(0,0,0,0.18)',
        flexShrink: 0,
        verticalAlign: 'middle',
        userSelect: 'none',
        lineHeight: 1,
      }}
    >
      {initial}
    </span>
  );
}

function FruitImg({ name, size }) {
  // chain 用 useMemo 仅依赖 name；切换 name 时重置 idx
  const chain = useMemo(() => buildSrcChain(name), [name]);
  const [idx, setIdx] = useState(0);

  // name 变化时，useMemo 会返回新数组，但 idx 不会自动重置——用一个 effect-less 模式：
  // 把 chain 长度作为 key，借助 React 重新挂载来重置 idx
  // 实际上更简单：用 name 当 key 包一层
  const cur = chain[idx];

  if (!cur || cur.kind === 'svg') {
    return <FallbackAvatar name={name} size={size} />;
  }

  return (
    <img
      src={cur.src}
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
      onError={() => setIdx(i => i + 1)}
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
      {/* key=name 保证切换果实名时彻底重置 src 候选链 */}
      <FruitImg key={name} name={name} size={size} />
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
