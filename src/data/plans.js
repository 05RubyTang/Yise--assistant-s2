// 果实方案常量数据
// 规则说明：只有属性1会计入池子，属性2方案已全部失效，现均为单果实循环

import { SEASONS } from './seasons.js';
import { S1_PLANS, S2_PLANS } from './seasons/index.js';
import { getPlanFruitsArray } from './common/getPlanFruitsArray.js';

const base = import.meta.env.BASE_URL;

// ═══════════════════════════════════════════════════════════════════════
// 重新导出：赛季方案数据和通用函数
// ═══════════════════════════════════════════════════════════════════════

export { S1_PLANS, S2_PLANS };
export { getPlanFruitsArray };

// ─── 合并 S1 和 S2 方案 ─────────────────────────────────────────────────
export const PLANS = [...S1_PLANS, ...S2_PLANS];

// ─── 属性 ID 集合（用于判断是否属于"属性系"池子） ────────────────────────────
const BASE_IDS = new Set([
  'fire', 'ice', 'electric', 'phantom', 'grass', 'evil', 'ghost', 'mech', 'light', 'light_fluffy',
  'water', 'cute', 'normal', 'poison',  // S2 新增普通系、毒系
]);

// ─── 果实名 → 属系 ID 映射 ─────────────────────────────────────────────────
export const FRUIT_ATTR = {
  '治愈兔果实':    'fire',
  '火红尾果实':    'fire',
  '柴渣虫果实':    'fire',
  '呼呼猪果实':    'ice',
  '大耳帽兜果实':  'ice',
  '月牙雪熊果实':  'ice',
  '拉特果实':      'electric',
  '小星光果实':    'electric',
  '粉粉星果实':    'electric',
  '双灯鱼果实':    'electric',
  '哭哭菇果实':    'phantom',
  '仪使者果实':    'phantom',
  '粉星仔果实':    'phantom',
  '格兰种子果实':  'grass',
  '奇丽草果实':    'grass',
  '小夜果实':      'evil',
  '恶魔狼果实':    'evil',
  '嗜光嗡嗡果实':  'evil',
  '小灵面果实':    'ghost',
  '梦游果实':      'ghost',
  '空空颅果实':    'ghost',
  '机械方方果实':  'mech',
  '贝瑟果实':      'mech',
  '圣剑侍从果实':  'mech',
  '独角兽果实':    'light',
  '犀角鸟果实':    'light',
  '疾光千兽果实':  'light',
  '绒绒果实':      'light',   // 绒仙子/疾光千兽家族（绒绒为进化前形态）
  '绒仙子果实':    'light',   // 旧数据兜底
  '火焰猿果实':    'fire',
  '尖嘴狐仙果实':  'fire',
  '蹦蹦花果实':    'grass',
  '波多西果实':    'mech',
  '圣剑侍从果实':  'mech',
  '深蓝鲸果实':    'water',
  '菊花梨果实':    'cute',
  '小独角兽果实':  'light',
  // S2 赛季奇遇 & 单刷专属果实
  '恶魔叮果实':    'evil',
  '公平鸽果实':    'normal',
  '灵狐果实':      'fire',
  '嘟嘟煲果实':    'poison',
  '幽影树果实':    'ghost',
  '小丑公爵果实':  'evil',
  '小鼓象果实':    'mech',
  '音碟吼果实':    'normal',
  '烟花伯爵果实':  'fire',
  '帅帅魔偶果实':  'phantom',
  '炫光迪迪果实':  'light',
  '加油海葵果实':  'water',
  '咕德帽帽果实':  'ghost',
  // S2 attr 混刷方案使用的果实（补全，防止编辑器显示「部分果实属系未识别」）
  '彩蝶鲨果实':    'water',   // 水系混刷
  '月牙雪熊果实':  'ice',     // 熊狼混刷（S1 精灵，S2 仍可作果实用）
  '乌拉怪果实':    'evil',    // 小夜/小丑公爵混刷
  '锤头鹤果实':    'wing',    // 翼系（锤头鹳同家族）
  '奇丽花果实':    'grass',   // 草系混刷
  '蹦跳花果实':    'grass',   // 草系混刷
  '盖武士果实':    'ghost',   // 幽系混刷
  '梦悠悠果实':    'ghost',   // 幽系混刷
  '圣剑-X果实':    'mech',    // 机械系混刷
  '红绒十字果实':  'fire',    // 火系混刷（红绒十字 = 治愈兔同家族）
  '星光狮果实':    'electric',// 电系混刷
  '酷拉果实':      'electric',// 电系混刷
  '粉耳星兔果实':  'phantom', // 幻系单刷
};

// ─── 精灵名 → 属性2 ID 映射（双属性精灵的第2属性，仅用于出货范围判断） ─────────
// 说明：4.23后双属精灵作为主力使用时只计第1属性池进度（贡献规则）；
//       但属性池出货时，第2属性也属于该池的出货范围（出货规则）。
//       因此这张表只用于 classifyResultType 判断「出货」属于哪个池子，
//       不用于计算刷池进度。
export const SPIRIT_ATTR2 = {
  '双灯鱼':   'water',    // 水系+电系（第1电系，第2水系）
  '月牙雪熊': 'phantom',  // 冰系+幻系
  '嗜光嗡嗡': 'light',   // 恶系+光系
  '柴渣虫':   'grass',   // 火系+草系
  '粉粉星':   'phantom',  // 电系+幻系
  '贝瑟':     'fire',    // 机械系+火系
  // 萌系精灵（cute 为第2属性）
  '治愈兔':   'cute',    // 火系+萌系
  '大耳帽兜': 'cute',    // 冰系+萌系
  // S2 双属性精灵
  '恶魔叮':   'wing',    // 恶系+翼系
  '灵狐':     'ice',     // 火系+冰系
  '幽影树':   'grass',   // 幽系+草系
  '音碟吼':   'mech',    // 普通系+机械系
  '烟花伯爵': 'poison',  // 火系+毒系
  '炫光迪迪': 'electric',// 光系+电系
  '加油海葵': 'cute',    // 水系+萌系
  '爆焰喷喷': 'dragon',  // 火系+龙系（战令）
};

// ─── 精灵名 → 属性1 ID 映射（4.23后双属精灵只按属性1计池） ──────────────────
export const SPIRIT_ATTR1 = {
  '治愈兔':   'fire',
  '火红尾':   'fire',
  '柴渣虫':   'fire',
  '呼呼猪':   'ice',
  '大耳帽兜': 'ice',
  '月牙雪熊': 'ice',
  '拉特':     'electric',
  '小星光':   'electric',
  '粉粉星':   'electric',
  '双灯鱼':   'electric',
  '哭哭菇':   'phantom',
  '粉星仔':   'phantom',
  '格兰种子': 'grass',
  '奇丽草':   'grass',
  '小夜':     'evil',
  '恶魔狼':   'evil',
  '嗜光嗡嗡': 'evil',
  '小灵面':   'ghost',
  '梦悠悠':   'ghost',
  '空空颅':   'ghost',
  '机械方方': 'mech',
  '贝瑟':     'mech',
  '圣剑侍从': 'mech',
  '独角兽':   'light',
  '犀角鸟':   'light',
  '疾光千兽': 'light',
  '绒仙子':   'light',
  '绒绒':     'light',
  '火焰猿':   'fire',
  '尖嘴狐仙': 'fire',
  '蹦蹦花':   'grass',
  '波多西':   'mech',
  '圣剑侍从': 'mech',
  '深蓝鲸':   'water',
  '菊花梨':   'cute',
  '小独角兽': 'light',
  // S2 赛季常驻异色
  '恶魔叮':   'evil',
  '公平鸽':   'normal',
  '灵狐':     'fire',
  '嘟嘟煲':   'poison',
  '幽影树':   'ghost',
  // S2 赛季奇遇异色
  '小丑公爵': 'evil',
  '小鼓象':   'mech',
  '音碟吼':   'normal',
  '烟花伯爵': 'fire',
  '帅帅魔偶': 'phantom',
  '炫光迪迪': 'light',
  '加油海葵': 'water',
  '咕德帽帽': 'ghost',
  // S2 战令异色
  '雪怪':     'ice',
  '爆焰喷喷': 'fire',
};

// ─── 按属性 ID 获取所有异色精灵 ──────────────────────────────────────────────
export function getShinisByAttr(attrId) {
  const plan = PLANS.find(p => p.id === attrId);
  return plan?.shinies || [];
}

// ─── 根据精灵名找到所有关联方案 ──────────────────────────────────────────────
export function findPlansForSpirit(spiritName) {
  return PLANS.filter(p =>
    (p.shinies && p.shinies.includes(spiritName)) ||
    (p.poolShinies && p.poolShinies.includes(spiritName)) ||
    p.spiritA === spiritName ||
    p.spiritB === spiritName
  );
}

// ─── 所有赛季奇遇精灵（season: true 的方案的 shinies） ────────────────────────
export const SEASON_SHINIES = PLANS
  .filter(p => p.season)
  .flatMap(p => p.shinies)
  .filter((v, i, a) => a.indexOf(v) === i);

// ─── 战令宠异色精灵（需购买战令礼包专属果实单刷，不在常规属性池产出） ─────────
export const BATTLEPASS_SHINIES = PLANS
  .filter(p => p.singleSpirit && p.unlockA?.includes('战令'))
  .flatMap(p => p.shinies)
  .filter((v, i, a) => a.indexOf(v) === i);

// ─── 所有属性异色精灵（属性池方案的 shinies，去重；含战令宠） ─────────────────
export const ATTR_SHINIES = [
  ...PLANS
    .filter(p => !p.season && BASE_IDS.has(p.id) && p.shinies?.length > 0)
    .flatMap(p => p.shinies)
    .filter((v, i, a) => a.indexOf(v) === i && !SEASON_SHINIES.includes(v)),
  ...BATTLEPASS_SHINIES.filter(v => !SEASON_SHINIES.includes(v)),
].filter((v, i, a) => a.indexOf(v) === i);

// ─── 所有可产出异色精灵（去重，含 noShiny 辅助方案） ──────────────────────────
export const ALL_SHINIES = [...new Set(PLANS.flatMap(p => p.shinies))].filter(Boolean);

// ─── 通过果实名查询属系 ID ────────────────────────────────────────────────────
export function getFruitAttr(fruitName) {
  return FRUIT_ATTR[fruitName] || null;
}

// ─── 三池出货识别工具 ─────────────────────────────────────────────────────────

/** 规范化精灵名：去空格、去全角/中点，方便容错比较 */
function normalize(s) {
  return (s || '').trim().replace(/\s+/g, '').replace(/[·・•]/g, '');
}

/**
 * 模糊匹配两个中文精灵名（允许 1–2 字错误/多余）
 *  ≤3 字：允许 1 字不同
 *  >3 字：允许 2 字不同
 */
export function fuzzyMatch(a, b) {
  const na = normalize(a);
  const nb = normalize(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  if (na.includes(nb) || nb.includes(na)) return true;
  const shorter = na.length <= nb.length ? na : nb;
  const longer  = na.length <= nb.length ? nb : na;
  const matched = [...shorter].filter(ch => longer.includes(ch)).length;
  const missing = shorter.length - matched + Math.abs(na.length - nb.length);
  const maxMiss = shorter.length <= 3 ? 1 : 2;
  return missing <= maxMiss;
}

/** 用模糊匹配在 SPIRIT_ATTR1 里查找精灵的第一属性 id */
function lookupAttr(spiritName) {
  if (!spiritName) return null;
  const nq = normalize(spiritName);
  for (const [k, v] of Object.entries(SPIRIT_ATTR1)) {
    if (normalize(k) === nq) return v;
  }
  for (const [k, v] of Object.entries(SPIRIT_ATTR1)) {
    if (fuzzyMatch(k, spiritName)) return v;
  }
  return null;
}

/** 用模糊匹配在 SPIRIT_ATTR2 里查找精灵的第二属性 id（用于出货池判断） */
function lookupAttr2(spiritName) {
  if (!spiritName) return null;
  const nq = normalize(spiritName);
  for (const [k, v] of Object.entries(SPIRIT_ATTR2)) {
    if (normalize(k) === nq) return v;
  }
  for (const [k, v] of Object.entries(SPIRIT_ATTR2)) {
    if (fuzzyMatch(k, spiritName)) return v;
  }
  return null;
}

/** 从方案对象中推断属性 id */
export function getPlanAttrId(plan) {
  if (!plan) return null;
  const ALL_BASE = new Set([
    'fire','ice','electric','phantom','grass','evil','ghost','mech','light','water','cute','normal','poison'
  ]);
  if (ALL_BASE.has(plan.id)) return plan.id;
  if (plan.attrId && ALL_BASE.has(plan.attrId)) return plan.attrId;
  const m = (plan.iconImg || '').match(/attrs\/(\w+)\.png/);
  return m ? m[1] : null;
}

/**
 * analyzePlanFruits(plan)
 * 根据方案的果实组合分析刷取模式：
 *   - 果实数：只有 fruitA → 单刷（1种果实）；fruitA+fruitB → 双果实混刷
 *   - 同属判断：所有果实属于同一属系 → isSameAttr = true
 * 返回：{ isSingleFruit, isSameAttr, fruitAttrId }
 *   fruitAttrId：同属时的属性 ID（跨属则为 null）
 */
export function analyzePlanFruits(plan) {
  if (!plan) return { isSingleFruit: true, isSameAttr: false, fruitAttrId: null };
  const fruits = [plan.fruitA, plan.fruitB, plan.fruitC].filter(Boolean);
  const isSingleFruit = fruits.length <= 1;
  const fruitAttrs = [...new Set(fruits.map(f => FRUIT_ATTR[f]).filter(Boolean))];
  const isSameAttr = fruitAttrs.length === 1;
  const fruitAttrId = isSameAttr ? fruitAttrs[0] : null;
  return { isSingleFruit, isSameAttr, fruitAttrId };
}

/**
 * 判断出货/污染精灵属于哪个池子：
 *   'family' — 家族池（单刷方案，且污染精灵是 spiritA/spiritB 同族）
 *   'attr'   — 属性池（同属混刷/单刷的非家族同属精灵；或同属单刷的目标精灵被当作 attr 处理时）
 *   'world'  — 世界池（跨属混刷的所有精灵；或其他不匹配的精灵）
 *
 * 规则（按果实来判断，而非 category）：
 *   1. 只有1种果实（单刷）：
 *      - 目标精灵（spiritA/spiritB）污染 → family
 *      - 同属性非目标精灵 → attr
 *      - 其他 → world
 *   2. 多种果实且全部同属性（同属混刷）：
 *      - 任何同属性精灵污染 → attr（无家族池！）
 *      - 其他 → world
 *   3. 多种果实且跨属性（跨属混刷）：
 *      - 全部 → world
 *
 * 属性池出货范围说明（官方规则）：
 *   当某属性池触发出货时，该属性下所有精灵（包括第2属性属于该系的精灵）
 *   均有概率出现。因此判断时同时检查出货精灵的第1属性 AND 第2属性。
 *   例：萌系池出货 → 治愈兔（火+萌）或大耳帽兜（冰+萌）均算属性池出货。
 */
export function classifyResultType(resultSpirit, plan) {
  if (!resultSpirit || !plan) return 'world';
  const { isSingleFruit, isSameAttr, fruitAttrId } = analyzePlanFruits(plan);

  if (isSingleFruit) {
    // 单刷方案：先判断是否是目标精灵（家族池）
    const targetFamilies = [plan.spiritA, plan.spiritB].filter(Boolean);
    if (targetFamilies.some(t => fuzzyMatch(t, resultSpirit))) return 'family';
    // 非目标精灵：按属性判断
    if (fruitAttrId) {
      const spiritAttr1 = lookupAttr(resultSpirit);
      const spiritAttr2 = lookupAttr2(resultSpirit);
      if (spiritAttr1 === fruitAttrId || spiritAttr2 === fruitAttrId) return 'attr';
    }
    return 'world';
  }

  if (isSameAttr && fruitAttrId) {
    // 同属混刷：没有家族池，任何同属精灵 → attr
    const spiritAttr1 = lookupAttr(resultSpirit);
    const spiritAttr2 = lookupAttr2(resultSpirit);
    if (spiritAttr1 === fruitAttrId || spiritAttr2 === fruitAttrId) return 'attr';
    return 'world';
  }

  // 跨属混刷：全部归世界池
  return 'world';
}

/**
 * 兼容旧数据：从 task + plan 推断池子类型
 */
export function inferPoolType(task, plan) {
  if (!task) return 'world';
  // 'family' / 'attr' 已是明确的新格式值，直接信任存储
  if (task.resultType === 'family' || task.resultType === 'attr') return task.resultType;
  // 'world' 需要重新推断：旧数据可能因双属性判断缺失而被错误存成 world
  // 其他旧格式（'pool' 等）也走推断
  if (task.resultSpirit && plan) {
    return classifyResultType(task.resultSpirit, plan);
  }
  return task.resultType === 'pool' ? 'family' : 'world';
}

/** 池子类型的展示配置 */
export const POOL_TYPE_CONFIG = {
  family: { label: '家族池出货', bg: '#2B2A2E', color: '#FBF7EC', tagBg: '#F0E8D5', tagColor: '#C8830A', tagBorder: '#C8A020' },
  attr:   { label: '属性池出货', bg: '#E8A020', color: '#fff',    tagBg: '#FFF3CC', tagColor: '#C8830A', tagBorder: '#C8A020' },
  world:  { label: '世界池出货', bg: '#7E57C2', color: '#fff',    tagBg: '#F5E8FF', tagColor: '#8B4BB8', tagBorder: 'rgba(139,75,184,0.3)' },
  manual: { label: '手动补录',   bg: '#607D8B', color: '#fff',    tagBg: '#F0F4F8', tagColor: '#607D8B', tagBorder: 'rgba(96,125,139,0.3)' },
  // 旧值兜底
  pool:    { label: '方案出货',  bg: '#2B2A2E', color: '#FBF7EC', tagBg: '#F0E8D5', tagColor: '#C8830A', tagBorder: '#C8A020' },
  offpool: { label: '歪池出货',  bg: '#7E57C2', color: '#fff',    tagBg: '#F5E8FF', tagColor: '#8B4BB8', tagBorder: 'rgba(139,75,184,0.3)' },
};

// ─── 特殊形态数据 ─────────────────────────────────────────────────────────────
export const SPECIAL_FORMS = [
  {
    planIds: ['electric'],
    spirit: '小星光',
    fruitImg: '小星光果实',
    hiddenForm: '月光能量星光狮',
    sanctuary: '聆风塔地底护所',
    acornDesc: '小星光的橡果形态（黄色星形图案）',
  },
  {
    spirit: '小狮鹫',
    fruitImg: '小狮鹫果实',
    hiddenForm: '高山地皇家狮鹫',
    sanctuary: '学院驻地底护所',
    acornDesc: '高山地样子的果实形态（绿色山形图案）',
    planIds: [],
  },
  {
    spirit: '地鼠',
    fruitImg: '地鼠果实',
    hiddenForm: '储水期地鼠',
    sanctuary: '德雷克福德庄园底护所',
    acornDesc: '储水时样子的果实形态（黄色水滴/心形图案）',
    planIds: [],
  },
  {
    spirit: '蹦蹦种子',
    fruitImg: '蹦蹦种子果实',
    hiddenForm: '短毛球形态',
    sanctuary: '独角兽领地底护所',
    acornDesc: '短毛球果实（绿色带黑斑足球纹）',
    planIds: [],
  },
  {
    spirit: '蹦蹦种子',
    fruitImg: '蹦蹦种子果实',
    hiddenForm: '象牙球形态',
    sanctuary: '采邑地底护所',
    acornDesc: '象牙球果实（绿色带白花足球纹）',
    planIds: [],
  },
  {
    spirit: '蹦蹦种子',
    fruitImg: '蹦蹦种子果实',
    hiddenForm: '彩玉球形态',
    sanctuary: '挽风屏障底护所',
    acornDesc: '彩玉球果实（绿色带紫花足球纹）',
    planIds: [],
  },
];

// ─── 属性 ID → 咕噜球图标映射 ─────────────────────────────────────────────────
// 球→属性对照（来自游戏内百科）：
//   美妙球  = 萌系/普通系/水系/翼系（水兜球在本项目无素材，暂用美妙球兜底）
//   调温球  = 冰系/火系
//   变幻球  = 幻系/机械系（机械系实际用变幻球）
//   光合球  = 草系/光系
//   淘沙球  = 地系/虫系（电系精灵用淘沙球，此处映射 electric → 淘沙球）
//   好战球  = 龙系/武系
//   绝缘球  = 毒系/电系 → 此处 electric / poison 用绝缘球
//   暗星球  = 恶系/幽系
//   高级球  = 赛季/稀有（捕获赛季精灵时常用）
//   捕光球  = 水系（专属捕水系精灵）
// 注：electric 在洛克王国中使用绝缘球，mech 使用变幻球
export const ATTR_BALL_MAP = {
  fire:     { file: 'ball-temp.png',    label: '调温球' },
  ice:      { file: 'ball-temp.png',    label: '调温球' },
  electric: { file: 'ball-elec.png',   label: '绝缘球' },
  phantom:  { file: 'ball-phantom.png', label: '变幻球' },
  grass:    { file: 'ball-grass.png',   label: '光合球' },
  light:    { file: 'ball-grass.png',   label: '光合球' },
  evil:     { file: 'ball-dark.png',    label: '暗星球' },
  ghost:    { file: 'ball-dark.png',    label: '暗星球' },
  mech:     { file: 'ball-phantom.png', label: '变幻球' },
  water:    { file: 'ball-sea.png',     label: '捕光球' },
  cute:     { file: 'ball-cute.png',    label: '美妙球' },
  // 兜底
  normal:   { file: 'ball-cute.png',    label: '美妙球' },
  dragon:   { file: 'ball-fight.png',   label: '好战球' },
  fight:    { file: 'ball-fight.png',   label: '好战球' },
  earth:    { file: 'ball-earth.png',   label: '淘沙球' },
  bug:      { file: 'ball-earth.png',   label: '淘沙球' },
  wing:     { file: 'ball-cute.png',    label: '美妙球' },
  poison:   { file: 'ball-elec.png',   label: '绝缘球' },
};

/**
 * 根据精灵名获取对应的咕噜球信息
 * @param {string} spiritName
 * @returns {{ file: string, label: string } | null}
 */
export function getBallBySpirit(spiritName) {
  const attrId = SPIRIT_ATTR1[spiritName];
  if (!attrId) return null;
  return ATTR_BALL_MAP[attrId] || null;
}

/**
 * 根据方案（plan）获取对应属性球信息。
 * 属性球应跟随「用户全程在抓的果实精灵（spiritA）」的属性，
 * 而非出货精灵的属性。
 * 例：菊花梨方案（cute 系）→ 美妙球，即便出货的是治愈兔（fire 系）。
 * @param {object} plan
 * @returns {{ file: string, label: string } | null}
 */
export function getBallByPlan(plan) {
  if (!plan) return null;
  // 优先用 spiritA 的属性，fallback 到 spiritB
  const attrId = SPIRIT_ATTR1[plan.spiritA] || SPIRIT_ATTR1[plan.spiritB] || null;
  if (!attrId) return null;
  return ATTR_BALL_MAP[attrId] || null;
}

/** 根据精灵名返回属系 id（用于 attrs/{id}.png） */
export function getAttrIdBySpirit(spiritName) {
  return SPIRIT_ATTR1[spiritName] || null;
}

// ─── store.jsx 依赖的导出函数 ──────────────────────────────────────────────────

/**
 * classifyPool(spiritName, plan)
 * 判断破盾出现的精灵属于哪个池子（与 classifyResultType 等价，别名导出）：
 *   'family' — 家族池（plan 的 spiritA / spiritB 同族，70次保底）
 *   'attr'   — 属性池（同属性非家族精灵，80次保底）
 *   'world'  — 世界池（其他，80次保底）
 */
export function classifyPool(spiritName, plan) {
  return classifyResultType(spiritName, plan);
}

/**
 * resolveShinyKey(spiritName)
 * 将用户填写的精灵名归一化为图鉴中的「代表异色名」。
 * 若 spiritName 本身就是图鉴 key（PLANS 的 shinies 中存在），直接返回。
 * 若为同家族的进化前/后形态，则找到包含该精灵的方案后返回其 shinies[0]。
 * 找不到则返回原名（让调用方按原名处理）。
 */
export function resolveShinyKey(spiritName) {
  if (!spiritName) return spiritName;
  // 1. 所有图鉴 key 集合：PLANS 中所有 shinies 的并集
  const allKeys = new Set(ALL_SHINIES);
  // 精确命中：本身就是图鉴 key
  if (allKeys.has(spiritName)) return spiritName;
  // 2. 模糊匹配：遍历所有 shinies，找到 fuzzyMatch 的第一个
  for (const key of allKeys) {
    if (fuzzyMatch(key, spiritName)) return key;
  }
  // 3. 没有找到：返回原名（调用方按原名处理，图鉴不会误点亮）
  return spiritName;
}

/**
 * computePoolCounts(activeTasks, completedTasks, allPlans, season?)
 * 从任务事件流（shieldBreaks）派生三池当前保底计数。
 *
 * ── 截断点机制 ──────────────────────────────────────────────────────────────
 * 每次某池出货，该池就从那个时间点（completedAt）重新归零开始计数。
 * 实现方式：
 *   1. 先扫描 completedTasks，找各池最近一次出货的 completedAt 作为「截断点」
 *      - worldCutoff：最近一次世界池出货的 completedAt（全局唯一）
 *      - attrCutoffByAttr[attrId]：最近一次该属性池出货的 completedAt（按属性分桶）
 *      注意：hasContinuation 任务（COMPLETE_AND_CONTINUE 产生）的 completedAt
 *            也参与截断点计算（该池确实在那时出货了），但其 breaks 被跳过（已转移到 activeTask）。
 *   2. 统计所有 breaks（activeTasks + completedTasks）时，按 break.time 与截断点比较：
 *      - break.time ≤ cutoff → 跳过（截断点之前的进度已被清零）
 *      - break.time > cutoff  → 计入（截断点之后的新进度）
 *   3. hasContinuation 任务：其 breaks 已全部转移到 activeTask，
 *      遍历 completedTasks 时跳过其 breaks，避免重复计数。
 *
 * ── 赛季隔离 ────────────────────────────────────────────────────────────────
 * 传入 season 时，只统计同赛季的 completedTasks（截断点和 break 计数均限赛季内）。
 *
 * ── 家族池 ──────────────────────────────────────────────────────────────────
 * 家族池绑定单个 task，出货后由 COMPLETE_AND_CONTINUE 过滤 breaks 清零，不走截断点机制。
 * 多个进行中 task 并行时取最大值。
 *
 * ── Jelly（果冻/星辰虫）────────────────────────────────────────────────────
 * jelly 固定 pool='world'，计入世界池保底（不占 shieldBreakCount 序号），
 * 跟随 worldCutoff 截断点规则。
 *
 * @param {string} [season] - 当前赛季（'S1'|'S2'）
 * 返回：{ family: number, attrPools: { [attrId]: number }, worldPool: number }
 */
export function computePoolCounts(activeTasks, completedTasks, allPlans, season) {
  // 赛季过滤：只保留同赛季的已完成任务
  const relevantCompleted = (completedTasks || []).filter(t => {
    if (!t || t.resultType === 'abandoned') return false;
    if (season && t.season && t.season !== season) return false;
    return true;
  });

  // ── 阶段 1：建立各池截断点 ──────────────────────────────────────────────
  // hasContinuation 任务的 completedAt 也参与截断点计算（该池确实在那时出货）
  let worldCutoff = null;                // 最近一次世界池出货时间（ISO 字符串）
  const attrCutoffByAttr = {};          // { [attrId]: ISO 字符串 }
  relevantCompleted.forEach(task => {
    const plan = allPlans.find(p => p.id === task.planId);
    const planAttrId = getPlanAttrId(plan);
    const outPool = task.resultType; // 'family' | 'attr' | 'world'
    if (outPool === 'world') {
      if (!worldCutoff || task.completedAt > worldCutoff) worldCutoff = task.completedAt;
    } else if (outPool === 'attr' && planAttrId) {
      if (!attrCutoffByAttr[planAttrId] || task.completedAt > attrCutoffByAttr[planAttrId]) {
        attrCutoffByAttr[planAttrId] = task.completedAt;
      }
    }
    // family 池：绑定 task 内部，出货由 COMPLETE_AND_CONTINUE 的 filter 清零，不建全局截断点
  });

  // ── 阶段 2：计数 breaks ──────────────────────────────────────────────────
  const attrPools = {}; // { [attrId]: number }
  let worldPool = 0;
  let familyMax = 0;

  /**
   * 统计单条 break，按截断点决定是否计入。
   * onFamily: 家族池命中时的回调（null 则忽略家族 break）
   */
  const countBreak = (br, plan, planAttrId, onFamily) => {
    // shiny（出货事件本身）和 failed（失败/逃跑）不计入任何保底池
    if (br.result === 'shiny' || br.result === 'failed') return;
    // 推断池归属：优先取已存储的 pool 字段，否则实时推断
    const pool = br.pool || (plan ? classifyResultType(br.spiritName, plan) : 'world');
    if (pool === 'family') {
      if (onFamily) onFamily();
    } else if (pool === 'attr') {
      const cutoff = planAttrId ? attrCutoffByAttr[planAttrId] : null;
      // break.time 早于截断点 → 已被清零，跳过；无截断点或晚于截断点 → 计入
      if (!cutoff || !br.time || br.time > cutoff) {
        if (planAttrId) attrPools[planAttrId] = (attrPools[planAttrId] || 0) + 1;
        else worldPool++; // 无法识别属性时归入世界池
      }
    } else { // 'world'（含 jelly，jelly 的 pool 固定为 'world'）
      if (!worldCutoff || !br.time || br.time > worldCutoff) worldPool++;
    }
  };

  // 进行中的任务
  (activeTasks || []).forEach(task => {
    const plan = allPlans.find(p => p.id === task.planId);
    const planAttrId = getPlanAttrId(plan);
    let familyCount = 0;
    (task.shieldBreaks || []).forEach(br => {
      countBreak(br, plan, planAttrId, () => familyCount++);
    });
    if (familyCount > familyMax) familyMax = familyCount;
  });

  // 已完成的任务
  relevantCompleted.forEach(task => {
    // hasContinuation：breaks 已转移到 activeTask，跳过避免重复计数
    // （其 completedAt 已在阶段 1 作为截断点参与了计算）
    if (task.hasContinuation) return;
    const plan = allPlans.find(p => p.id === task.planId);
    const planAttrId = getPlanAttrId(plan);
    (task.shieldBreaks || []).forEach(br => {
      // 家族 breaks 属于 task 内部（已出货清零），完成后不再计入全局，传 null 忽略
      countBreak(br, plan, planAttrId, null);
    });
  });

  return { family: familyMax, attrPools, worldPool };
}

/**
 * getFruitBySpirit(spiritName)
 * 通过精灵名反查对应的果实名。
 * 策略：在 FRUIT_ATTR 中找到以 spiritName 开头且以"果实"结尾的 key。
 * 例：'治愈兔' → '治愈兔果实'，'小独角兽' → '小独角兽果实'。
 * 找不到则返回 null。
 */
export function getFruitBySpirit(spiritName) {
  if (!spiritName) return null;
  // 1. 精确匹配：spiritName + '果实'
  const exact = `${spiritName}果实`;
  if (FRUIT_ATTR[exact] !== undefined) return exact;
  // 2. 模糊匹配：FRUIT_ATTR 中 key 包含 spiritName 的（如昵称/别名）
  for (const key of Object.keys(FRUIT_ATTR)) {
    if (key.includes(spiritName)) return key;
  }
  return null;
}

/**
 * getAllSpiritFruitPairs()
 * 返回所有「精灵名 ↔ 果实名」的对照数组，每条形如 { spirit, fruit }。
 * 数据来源：FRUIT_ATTR（遍历 key，去掉"果实"后缀得到精灵名），去重后返回。
 */
export function getAllSpiritFruitPairs() {
  const result = [];
  const seen = new Set();
  for (const fruitName of Object.keys(FRUIT_ATTR)) {
    if (!fruitName.endsWith('果实')) continue;
    const spiritName = fruitName.slice(0, -2); // 去掉"果实"
    if (seen.has(spiritName)) continue;
    seen.add(spiritName);
    result.push({ spirit: spiritName, fruit: fruitName });
  }
  return result;
}

/**
 * getAttrByAnyName(name)
 * 通过果实名或精灵名反查属系 ID。
 * 先查 FRUIT_ATTR（果实名映射），再查 SPIRIT_ATTR1（精灵名映射），找不到返回 null。
 */
export function getAttrByAnyName(name) {
  if (!name) return null;
  if (FRUIT_ATTR[name]) return FRUIT_ATTR[name];
  if (SPIRIT_ATTR1[name]) return SPIRIT_ATTR1[name];
  return null;
}

/**
 * computeFamilyPool(task, plan)
 * 统计当前 task 的家族池保底计数：
 * 遍历 task.shieldBreaks，排除 jelly 类型，
 * 将 pool 字段缺失的记录用 classifyResultType 推断，
 * 返回属于 'family' 的次数。
 */
export function computeFamilyPool(task, plan) {
  if (!task) return 0;
  return (task.shieldBreaks || []).filter(br => {
    if (br.result === 'jelly') return false;
    const pool = br.pool || (br.spiritName ? classifyResultType(br.spiritName, plan) : 'world');
    return pool === 'family';
  }).length;
}

/**
 * getPlanMainPool(plan)
 * 返回方案的主池类型（基于果实分析，而非 category 字段）：
 *   'family' — 单刷（只有1种果实）
 *   'attr'   — 同属混刷（多种果实且全部同属性）
 *   'world'  — 跨属混刷（多种果实但跨属性）
 *
 * 对于自定义方案（无 fruitA 等字段），降级使用 category / singleSpirit / attrId 推断。
 */
export function getPlanMainPool(plan) {
  if (!plan) return 'world';
  // 优先用果实数据判断（官方方案都有 fruitA）
  const fruits = [plan.fruitA, plan.fruitB, plan.fruitC].filter(Boolean);
  if (fruits.length > 0) {
    const { isSingleFruit, isSameAttr, fruitAttrId } = analyzePlanFruits(plan);
    if (isSingleFruit) return 'family';
    if (isSameAttr && fruitAttrId) return 'attr';
    return 'world';
  }
  // 降级：自定义方案没有 fruitA 字段时，按旧逻辑推断
  if (plan.category === 'seasonal' || plan.category === 'single' || plan.singleSpirit) return 'family';
  if (getPlanAttrId(plan)) return 'attr';
  return 'world';
}

/**
 * resolvePlanIconImg(plan, attrBase)
 * 推导方案的图标路径：
 *   优先用 plan.iconImg，其次继承 attrBase.iconImg，都没有则返回 null。
 */
export function resolvePlanIconImg(plan, attrBase) {
  if (!plan) return null;
  if (plan.iconImg) return plan.iconImg;
  if (attrBase?.iconImg) return attrBase.iconImg;
  return null;
}
