/**
 * 果实解锁攻略数据
 * 类型：智慧树苗果实（图鉴解锁 / 地图互动）
 * attrs：精灵属性数组（可双属性），计入对应系别池
 */

const base = import.meta.env.BASE_URL;

// 属性配置（与 plans.js 保持一致，补充额外属性）
export const ATTR_CONFIG = {
  '火系':   { color: '#E8733A', bg: '#FFF1EA', icon: `${base}attrs/fire.png` },
  '冰系':   { color: '#42A5F5', bg: '#EAF4FF', icon: `${base}attrs/ice.png` },
  '电系':   { color: '#D4A800', bg: '#FFFBE6', icon: `${base}attrs/electric.png` },
  '幻系':   { color: '#AB47BC', bg: '#F9EEFF', icon: `${base}attrs/phantom.png` },
  '草系':   { color: '#4CAF50', bg: '#EDFAEE', icon: `${base}attrs/grass.png` },
  '恶系':   { color: '#8D6E63', bg: '#F5EFEC', icon: `${base}attrs/evil.png` },
  '幽系':   { color: '#7E57C2', bg: '#F3EEFF', icon: `${base}attrs/ghost.png` },
  '机械系': { color: '#78909C', bg: '#EEF2F3', icon: `${base}attrs/mech.png` },
  '光系':   { color: '#C8830A', bg: '#FFF8E6', icon: `${base}attrs/light.png` },
  '水系':   { color: '#0288D1', bg: '#E6F4FF', icon: `${base}attrs/water.png` },
  // 无专属刷取方案 / 暂无图标的属性
  '岩系':   { color: '#8D6E63', bg: '#F4F0ED' },
  '毒系':   { color: '#8E24AA', bg: '#F8EAFF' },
  '虫系':   { color: '#7CB342', bg: '#F0F9E6' },
  '龙系':   { color: '#5E35B1', bg: '#EDE7FF', icon: `${base}attrs/dragon.png` },
  '翼系':   { color: '#5BA8F5', bg: '#EAF3FF', icon: `${base}attrs/wing.png` },
  '普通系': { color: '#9E9E9E', bg: '#F5F5F5', icon: `${base}attrs/normal.png` },
  '地系':   { color: '#C8A045', bg: '#FFF8E7', icon: `${base}attrs/ground.png` },
};

export const FRUIT_GUIDE_GROUPS = [
  // ── 风眠省 ─────────────────────────────────────────────────────────────────
  {
    id: 'fengmian',
    label: '风眠省',
    color: '#5B9CF6',
    entries: [
      {
        fruit: '伏地兽果实',
        spirit: '伏地兽',
        attrs: ['岩系'],
        unlock: '集齐 8 只风眠省精灵图鉴',
        location: '商店街东侧，魔力之源学院驻地附近海边',
        tip: '前期必拿，新手友好',
      },
      {
        fruit: '咔咔羽毛果实',
        spirit: '咔咔羽毛',
        attrs: ['翼系'],
        unlock: '集齐 30 只风眠省精灵图鉴',
        location: '奥贝斯坦湖隐秘滩涂南侧小岛',
        tip: '需飞行坐骑',
      },
      {
        fruit: '仪使者果实',
        spirit: '仪使者',
        attrs: ['地系', '幻系'],
        unlock: '集齐 60 只风眠省精灵图鉴',
        location: '旧飞艇航道下方，丰裕谷入口旁',
        tip: null,
      },
      {
        fruit: '小黑猫果实',
        spirit: '小黑猫',
        attrs: ['普通系'],
        unlock: '集齐 90 只风眠省精灵图鉴',
        location: '叽叽喳喳台地中央',
        tip: null,
      },
      {
        fruit: '大耳帽兜果实',
        spirit: '大耳帽兜',
        attrs: ['冰系'],
        unlock: '集齐 120 只风眠省精灵图鉴',
        location: '星霜崖地西侧，破旧船旁',
        tip: '岚语峰也可',
      },
    ],
  },

  // ── 洛克里安（按解锁数量升序排列）──────────────────────────────────────────
  {
    id: 'luokerian',
    label: '洛克里安',
    color: '#66BB6A',
    entries: [
      {
        fruit: '可爱猿果实',
        spirit: '可爱猿',
        attrs: ['火系'],
        unlock: '集齐 40 只洛克里安精灵图鉴',
        location: '向日葵海岸，学院驻地东侧',
        tip: null,
      },
      {
        fruit: '布鲁斯果实',
        spirit: '布鲁斯',
        attrs: ['水系'],
        unlock: '集齐 60 只洛克里安精灵图鉴',
        location: '向日葵海岸西侧',
        tip: null,
      },
      {
        fruit: '多西果实',
        spirit: '多西',
        attrs: ['机械系'],
        unlock: '集齐 60 只洛克里安精灵图鉴',
        location: '二叠山丘王国监狱旁',
        tip: null,
      },
      {
        fruit: '小翼龙果实',
        spirit: '小翼龙',
        attrs: ['龙系', '翼系'],
        unlock: '集齐 70 只洛克里安精灵图鉴',
        location: '监管区南部',
        tip: null,
      },
      {
        fruit: '机械方方果实',
        spirit: '机械方方',
        attrs: ['机械系'],
        unlock: '集齐 80 只洛克里安精灵图鉴',
        location: '拾荒港口东南角',
        tip: null,
      },
      {
        fruit: '墨鱿士果实',
        spirit: '墨鱿士',
        attrs: ['水系'],
        unlock: '集齐 80 只洛克里安精灵图鉴',
        location: '圣所前哨东南侧',
        tip: null,
      },
      {
        fruit: '圣剑侍从果实',
        spirit: '圣剑侍从',
        attrs: ['光系'],
        unlock: '集齐 80 只洛克里安精灵图鉴',
        location: '回填山涧中部',
        tip: null,
      },
      {
        fruit: '噼啪鸟果实',
        spirit: '噼啪鸟',
        attrs: ['电系', '翼系'],
        unlock: '集齐 80 只洛克里安精灵图鉴',
        location: '圣所前哨东北侧',
        tip: null,
      },
      {
        fruit: '裘洛果实',
        spirit: '裘洛',
        attrs: ['毒系'],
        unlock: '集齐 100 只洛克里安精灵图鉴',
        location: '德雷克福德庄园上方',
        tip: null,
      },
      {
        fruit: '深蓝鲸果实',
        spirit: '深蓝鲸',
        attrs: ['水系'],
        unlock: '集齐 100 只洛克里安精灵图鉴',
        location: '沉船漩涡左上角',
        tip: null,
      },
      {
        fruit: '伊雷龙果实',
        spirit: '伊雷龙',
        attrs: ['电系'],
        unlock: '集齐 120 只洛克里安精灵图鉴',
        location: '咕嘟咕嘟浅滩西北侧',
        tip: null,
      },
      {
        fruit: '厉毒小萝果实',
        spirit: '厉毒小萝',
        attrs: ['毒系', '恶系'],
        unlock: '集齐 140 只洛克里安精灵图鉴',
        location: '恶水沼泽废弃站台旁',
        tip: null,
      },
    ],
  },

  // ── 其他地图（地图互动 / 暂未确认解锁条件）────────────────────────────────
  {
    id: 'other',
    label: '其他地图',
    color: '#C8830A',
    entries: [
      {
        fruit: '雪娃娃果实',
        spirit: '雪娃娃',
        attrs: ['冰系'],
        unlock: '抓/进化 20 只雪灵',
        location: null,
        tip: null,
      },
      {
        fruit: '小独角兽果实',
        spirit: '小独角兽',
        attrs: ['光系'],
        unlock: '抓/进化 20 只小独角兽',
        location: null,
        tip: '第二属性为光系，使用果实可积累光系池，间接产出疾光千兽/绒仙子/嗜光嗡嗡异色',
      },
    ],
  },
];
