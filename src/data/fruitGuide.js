/**
 * 果实解锁攻略数据 v2
 * 三 Tab 结构：抓取获得 / 图鉴奖励 / 赛季&活动
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
  '萌系':   { color: '#E91E8C', bg: '#FEE8F4', icon: `${base}attrs/cute.png` },
  '岩系':   { color: '#8D6E63', bg: '#F4F0ED', icon: `${base}attrs/ground.png` },
  '毒系':   { color: '#8E24AA', bg: '#F8EAFF', icon: `${base}attrs/poison.png` },
  '龙系':   { color: '#5E35B1', bg: '#EDE7FF', icon: `${base}attrs/dragon.png` },
  '翼系':   { color: '#5BA8F5', bg: '#EAF3FF', icon: `${base}attrs/wing.png` },
  '普通系': { color: '#9E9E9E', bg: '#F5F5F5', icon: `${base}attrs/normal.png` },
  '地系':   { color: '#C8A045', bg: '#FFF8E7', icon: `${base}attrs/ground.png` },
  '虫系':   { color: '#7CB342', bg: '#F1F8E9', icon: `${base}attrs/bug.png` },
  '武系':   { color: '#D84315', bg: '#FBE9E7', icon: `${base}attrs/fighting.png` },
};

/**
 * usedInPlan 字段说明：
 *   '刷异色方案'  — 直接出现在图鉴方案中（fruitA / fruitB）
 *   '积累池权重'  — 出现在辅助积累池方案中（noShiny 方案）
 *    undefined    — 不在任何方案中，纯图鉴收集参考
 *
 * 三个 Tab 的 entries 之间无重叠（每个果实只归属一个 Tab）。
 */
export const FRUIT_GUIDE_TABS = [
  // ─── Tab 1：抓取获得 ─────────────────────────────────────────────────────────
  // 获取方式：抓/进化 20 只对应精灵 → 找 NPC 兑换
  {
    id: 'catch',
    label: '抓取获得',
    desc: '抓/进化 20 只对应精灵',
    // 扁平条目列表（无子分组）
    entries: [
      {
        fruit: '呼呼猪果实',
        spirit: '呼呼猪',
        attrs: ['冰系'],
        unlock: '抓/进化 20 只呼呼猪',
        usedInPlan: '刷异色方案',
      },
      {
        fruit: '雪娃娃果实',
        spirit: '雪娃娃',
        attrs: ['冰系'],
        unlock: '抓/进化 20 只雪灵',
      },
      {
        fruit: '拉特果实',
        spirit: '拉特',
        attrs: ['电系'],
        unlock: '抓/进化 20 只拉特',
        usedInPlan: '刷异色方案',
      },
      {
        fruit: '小星光果实',
        spirit: '小星光',
        attrs: ['电系'],
        unlock: '抓/进化 20 只小星光',
        usedInPlan: '刷异色方案',
        tip: '放入「聆风塔地底护所」可解锁「月光能量星光狮」特殊形态',
      },
      {
        fruit: '哭哭菇果实',
        spirit: '哭哭菇',
        attrs: ['幻系'],
        unlock: '抓/进化 20 只怖哭菇',
        usedInPlan: '刷异色方案',
      },
      {
        fruit: '格兰种子果实',
        spirit: '格兰种子',
        attrs: ['草系'],
        unlock: '抓/进化 20 只格兰种子',
        usedInPlan: '刷异色方案',
      },
      {
        fruit: '奇丽草果实',
        spirit: '奇丽草',
        attrs: ['草系'],
        unlock: '抓/进化 20 只奇丽草',
        usedInPlan: '刷异色方案',
      },
      {
        fruit: '蹦蹦花果实',
        spirit: '蹦蹦花',
        attrs: ['草系'],
        unlock: '抓/进化 20 只蹦蹦花',
        usedInPlan: '积累池权重',
        tip: '草系池可产出格兰种子/奇丽草/柴渣虫异色',
      },
      {
        fruit: '小夜果实',
        spirit: '小夜',
        attrs: ['恶系'],
        unlock: '抓/进化 20 只幽朔夜伊芙',
        usedInPlan: '刷异色方案',
      },
      {
        fruit: '恶魔狼果实',
        spirit: '恶魔狼',
        attrs: ['恶系'],
        unlock: '抓/进化 20 只恶魔狼',
        usedInPlan: '刷异色方案',
      },
      {
        fruit: '小灵面果实',
        spirit: '小灵面',
        attrs: ['幽系'],
        unlock: '抓/进化 20 只幽冥眼',
        usedInPlan: '刷异色方案',
      },
      {
        fruit: '梦游果实',
        spirit: '梦悠悠',
        attrs: ['幽系'],
        unlock: '抓/进化 20 只梦悠悠',
        usedInPlan: '刷异色方案',
      },
      {
        fruit: '独角兽果实',
        spirit: '独角兽',
        attrs: ['光系'],
        unlock: '抓/进化 20 只独角兽',
        usedInPlan: '刷异色方案',
        tip: '单刷此果实时光系池只可产出嗜光嗡嗡异色；搭配犀角鸟果实可额外产出疾光千兽，搭配绒绒果实可额外产出绒仙子',
      },
      {
        fruit: '治愈兔果实',
        spirit: '治愈兔',
        attrs: ['火系'],
        unlock: '抓/进化 20 只红绒十字',
        usedInPlan: '刷异色方案',
        tip: '火系循环方案核心果实，成本最低',
      },
      {
        fruit: '尖嘴狐仙果实',
        spirit: '尖嘴狐仙',
        attrs: ['火系'],
        unlock: '抓/进化 20 只尖嘴狐仙',
        usedInPlan: '积累池权重',
      },
      {
        fruit: '菊花梨果实',
        spirit: '菊花梨',
        attrs: ['萌系'],
        unlock: '抓/进化 20 只菊花梨',
        usedInPlan: '积累池权重',
        tip: '萌系池可产出大耳帽兜/治愈兔异色',
      },
      {
        fruit: '公平鸽果实',
        spirit: '公平鸽',
        attrs: ['普通系'],
        unlock: '抓/进化 20 只公平鸽',
        tip: '普通系池权重，常用于自定义方案',
      },
      {
        fruit: '小电企鹅果实',
        spirit: '电企鹅',
        attrs: ['冰系'],
        unlock: '抓/进化 20 只电企鹅',
        usedInPlan: '刷异色方案',
        tip: '冰系池，灵狐属火+冰双属，冰系池可刷出灵狐',
      },
      {
        fruit: '白发懒人果实',
        spirit: '睡睡王',
        attrs: ['普通系'],
        unlock: '抓/进化 20 只瞌睡王',
        usedInPlan: '刷异色方案',
        tip: '普通系池替代方案，可刷公平鸽 / 音碟吼',
      },
      {
        fruit: '逗逗果实',
        spirit: '梦想三三',
        attrs: ['萌系'],
        unlock: '抓/进化 20 只梦想三三',
        usedInPlan: '刷异色方案',
        tip: '萌系池，可刷菊花梨 / 加油海葵',
      },
      {
        fruit: '矿晶虫果实',
        spirit: '晶石蜗',
        attrs: ['光系'],
        unlock: '抓/进化 20 只晶石蜗',
        usedInPlan: '刷异色方案',
        tip: '光系池，可刷小独角兽 / 炫光迪迪',
      },
    ],
  },

  // ─── Tab 2：图鉴奖励 ─────────────────────────────────────────────────────────
  // 获取方式：收集地图精灵图鉴达到数量 → 找 NPC 兑换
  {
    id: 'pokedex',
    label: '图鉴奖励',
    desc: '收集地图精灵图鉴达到数量',
    // 子分组（按地图）
    groups: [
      {
        id: 'fengmian',
        label: '风眠省',
        color: '#5B9CF6',
        entries: [
          {
            fruit: '伏地兽果实',
            spirit: '伏地兽',
            attrs: ['岩系'],
            unlock: '集齐 8 只风眠省图鉴',
            location: '商店街东侧，魔力之源学院驻地附近海边',
            tip: '前期必拿，新手友好',
          },
          {
            fruit: '咔咔羽毛果实',
            spirit: '咔咔羽毛',
            attrs: ['翼系'],
            unlock: '集齐 30 只风眠省图鉴',
            location: '奥贝斯坦湖隐秘滩涂南侧小岛',
            tip: '需飞行坐骑',
          },
          {
            fruit: '仪使者果实',
            spirit: '仪使者',
            attrs: ['地系', '幻系'],
            unlock: '集齐 60 只风眠省图鉴',
            location: '旧飞艇航道下方，丰裕谷入口旁',
            usedInPlan: '刷异色方案',
          },
          {
            fruit: '小黑猫果实',
            spirit: '小黑猫',
            attrs: ['普通系'],
            unlock: '集齐 90 只风眠省图鉴',
            location: '叽叽喳喳台地中央',
          },
          {
            fruit: '大耳帽兜果实',
            spirit: '大耳帽兜',
            attrs: ['冰系'],
            unlock: '集齐 120 只风眠省图鉴',
            location: '星霜崖地西侧，破旧船旁',
            tip: '岚语峰也可',
            usedInPlan: '刷异色方案',
          },
        ],
      },
      {
        id: 'luokerian',
        label: '洛克里安',
        color: '#66BB6A',
        entries: [
          {
            fruit: '可爱猿果实',
            spirit: '可爱猿',
            attrs: ['火系'],
            unlock: '集齐 40 只洛克里安图鉴',
            location: '向日葵海岸，学院驻地东侧',
            tip: '火焰猿进化前，同一道具图标，火系池权重',
          },
          {
            fruit: '布鲁斯果实',
            spirit: '布鲁斯',
            attrs: ['水系'],
            unlock: '集齐 60 只洛克里安图鉴',
            location: '向日葵海岸西侧',
          },
          {
            fruit: '多西果实',
            spirit: '多西',
            attrs: ['机械系'],
            unlock: '集齐 60 只洛克里安图鉴',
            location: '二叠山丘王国监狱旁',
          },
          {
            fruit: '小翼龙果实',
            spirit: '小翼龙',
            attrs: ['龙系', '翼系'],
            unlock: '集齐 70 只洛克里安图鉴',
            location: '监管区南部',
          },
          {
            fruit: '机械方方果实',
            spirit: '机械方方',
            attrs: ['机械系'],
            unlock: '集齐 80 只洛克里安图鉴',
            location: '拾荒港口东南角',
            usedInPlan: '刷异色方案',
          },
          {
            fruit: '墨鱿士果实',
            spirit: '墨鱿士',
            attrs: ['水系'],
            unlock: '集齐 80 只洛克里安图鉴',
            location: '圣所前哨东南侧',
          },
          {
            fruit: '圣剑侍从果实',
            spirit: '圣剑侍从',
            attrs: ['光系'],
            unlock: '集齐 80 只洛克里安图鉴',
            location: '回填山涧中部',
            usedInPlan: '积累池权重',
            tip: '机械系池辅助方案用果实',
          },
          {
            fruit: '噼啪鸟果实',
            spirit: '噼啪鸟',
            attrs: ['电系', '翼系'],
            unlock: '集齐 80 只洛克里安图鉴',
            location: '圣所前哨东北侧',
          },
          {
            fruit: '裘洛果实',
            spirit: '裘洛',
            attrs: ['毒系'],
            unlock: '集齐 100 只洛克里安图鉴',
            location: '德雷克福德庄园上方',
          },
          {
            fruit: '深蓝鲸果实',
            spirit: '深蓝鲸',
            attrs: ['水系'],
            unlock: '集齐 100 只洛克里安图鉴',
            location: '沉船漩涡左上角',
            usedInPlan: '积累池权重',
            tip: '水系池可产出双灯鱼异色',
          },
          {
            fruit: '伊雷龙果实',
            spirit: '伊雷龙',
            attrs: ['电系'],
            unlock: '集齐 120 只洛克里安图鉴',
            location: '咕嘟咕嘟浅滩西北侧',
          },
          {
            fruit: '厉毒小萝果实',
            spirit: '厉毒小萝',
            attrs: ['毒系', '恶系'],
            unlock: '集齐 140 只洛克里安图鉴',
            location: '恶水沼泽废弃站台旁',
            usedInPlan: '刷异色方案',
            tip: '即厉毒修萝果实（同家族），毒系池可刷嘟嘟煲 / 烟花伯爵',
          },
        ],
      },
    ],
  },

  // ─── Tab 3：赛季&活动 ────────────────────────────────────────────────────────
  {
    id: 'season',
    label: '赛季&活动',
    desc: '赛季任务 / 活动赠送 / 战令购买',
    groups: [
      {
        id: 's2_season_task',
        label: 'S2「狂欢怪谈」奇遇精灵',
        color: '#F48FB1',
        desc: '完成 S2 第五章赛季任务获得（2026/6/12 后开放）',
        entries: [
          {
            fruit: '小丑公爵果实',
            spirit: '小丑公爵',
            attrs: ['恶系'],
            unlock: '完成 S2 第五章赛季任务（2026/6/12 后开放）',
            tip: '捕捉 2 只污染血脉的小丑公爵',
            usedInPlan: '刷异色方案',
          },
          {
            fruit: '小鼓象果实',
            spirit: '小鼓象',
            attrs: ['机械系'],
            unlock: '完成 S2 第五章赛季任务（2026/6/12 后开放）',
            tip: '捕捉 2 只污染血脉的小鼓象',
            usedInPlan: '刷异色方案',
          },
          {
            fruit: '烟花伯爵果实',
            spirit: '烟花伯爵',
            attrs: ['火系', '毒系'],
            unlock: '完成 S2 第五章赛季任务（2026/6/12 后开放）',
            tip: '捕捉 2 只污染血脉的烟花伯爵',
            usedInPlan: '刷异色方案',
          },
          {
            fruit: '帅帅魔偶果实',
            spirit: '帅帅魔偶',
            attrs: ['幻系'],
            unlock: '完成 S2 第五章赛季任务（2026/6/12 后开放）',
            tip: '捕捉 2 只污染血脉的帅帅魔偶',
            usedInPlan: '刷异色方案',
          },
          {
            fruit: '炫光迪迪果实',
            spirit: '炫光迪迪',
            attrs: ['电系'],
            unlock: '完成 S2 第五章赛季任务（2026/6/12 后开放）',
            tip: '捕捉 2 只污染血脉的炫光迪迪',
            usedInPlan: '刷异色方案',
          },
          {
            fruit: '加油海葵果实',
            spirit: '加油海葵',
            attrs: ['水系', '萌系'],
            unlock: '完成 S2 第五章赛季任务（2026/6/12 后开放）',
            tip: '捕捉 2 只污染血脉的加油海葵',
            usedInPlan: '刷异色方案',
          },
          {
            fruit: '咕德帽帽果实',
            spirit: '咕德帽帽',
            attrs: ['幽系'],
            unlock: '完成 S2 第五章赛季任务（2026/6/12 后开放）',
            tip: '捕捉 2 只污染血脉的咕德帽帽',
            usedInPlan: '刷异色方案',
          },
          {
            fruit: '音碟吼果实',
            spirit: '音碟吼',
            attrs: ['普通系', '机械系'],
            unlock: '完成 S2 第五章赛季任务（2026/6/12 后开放）',
            tip: '捕捉 2 只污染血脉的音碟吼；果实尚未上线，方案暂不可用',
          },
        ],
      },
      {
        id: 'season_task',
        label: '第六章赛季任务',
        color: '#F06292',
        desc: '捕捉 2 只污染血脉的对应精灵',
        entries: [
          {
            fruit: '粉粉星果实',
            spirit: '粉粉星',
            attrs: ['电系'],
            unlock: '捕捉 2 只污染血脉的粉粉星',
            location: '凤息山魔力之源附近',
            tip: '可与粉星仔果实同放同区域庇护所',
            usedInPlan: '刷异色方案',
          },
          {
            fruit: '粉星仔果实',
            spirit: '粉星仔',
            attrs: ['幻系'],
            unlock: '捕捉 2 只污染血脉的粉星仔',
            location: '凤息山魔力之源附近',
            tip: '地图中为蓝色底座+星形图标，视野开阔',
            usedInPlan: '刷异色方案',
          },
          {
            fruit: '月牙雪熊果实',
            spirit: '月牙雪熊',
            attrs: ['冰系'],
            unlock: '捕捉 2 只污染血脉的月牙雪熊',
            location: '星霜崖地魔力之源附近',
            tip: '雪地场景，离魔力之源极近',
            usedInPlan: '刷异色方案',
          },
          {
            fruit: '空空颅果实',
            spirit: '空空颅',
            attrs: ['幽系'],
            unlock: '捕捉 2 只污染血脉的空空颅',
            location: '监管区魔力之源附近',
            tip: '可与嗜光嗡嗡果实同放',
            usedInPlan: '刷异色方案',
          },
          {
            fruit: '柴渣虫果实',
            spirit: '柴渣虫',
            attrs: ['火系'],
            unlock: '捕捉 2 只污染血脉的柴渣虫',
            location: '彼得大道魔力之源附近',
            tip: '沙滩地形，体型小不推荐草地庇护所',
            usedInPlan: '刷异色方案',
          },
          {
            fruit: '嗜光嗡嗡果实',
            spirit: '嗜光嗡嗡',
            attrs: ['恶系'],
            unlock: '捕捉 2 只污染血脉的嗜光嗡嗡',
            location: '监管区魔力之源附近',
            tip: '可与空空颅果实同放',
            usedInPlan: '刷异色方案',
          },
          {
            fruit: '双灯鱼果实',
            spirit: '双灯鱼',
            attrs: ['电系'],
            unlock: '捕捉 2 只污染血脉的双灯鱼',
            location: '沉船漩涡魔力之源附近',
            tip: '水边开阔，可与贝瑟果实共用位置',
            usedInPlan: '刷异色方案',
          },
          {
            fruit: '贝瑟果实',
            spirit: '贝瑟',
            attrs: ['机械系'],
            unlock: '捕捉 2 只污染血脉的贝瑟',
            location: '沉船漩涡魔力之源附近',
            tip: '陆地+水域交界，适合与双灯鱼同放',
            usedInPlan: '刷异色方案',
          },
        ],
      },
      {
        id: 'activity',
        label: '活动赠送',
        color: '#FF8A65',
        desc: '通过游戏活动免费获得',
        entries: [
          {
            fruit: '火红尾果实',
            spirit: '火红尾',
            attrs: ['火系'],
            unlock: '活动赠送',
            tip: '「火红迎新」活动限定领取',
            usedInPlan: '刷异色方案',
          },
          {
            fruit: '春团果实',
            spirit: '春团',
            attrs: ['萌系'],
            unlock: '活动赠送',
            tip: '「洛克筑梦师」活动（2026.4.3–4.24）',
            usedInPlan: '积累池权重',
          },
          {
            fruit: '幽星光果实',
            spirit: '幽星光',
            attrs: ['幽系'],
            unlock: '活动赠送',
            tip: '「洛克筑梦师」活动（2026.5.1–5.22）',
          },
          {
            fruit: '鸭吉吉果实',
            spirit: '燃了鸭',
            attrs: ['火系'],
            unlock: '活动赠送',
            tip: '公测预约 / 登录活动赠送',
          },
        ],
      },
      {
        id: 'battlepass',
        label: '战令/购买',
        color: '#9C27B0',
        desc: '购买战令礼包获得',
        entries: [
          {
            fruit: '绒绒果实',
            spirit: '绒绒',
            attrs: ['光系'],
            unlock: '购买战令礼包',
            usedInPlan: '刷异色方案',
            tip: '绒仙子/绒绒同家族，使用此果实刷绒仙子',
          },
          {
            fruit: '犀角鸟果实',
            spirit: '犀角鸟',
            attrs: ['光系'],
            unlock: '购买战令礼包',
            usedInPlan: '刷异色方案',
            tip: '光系方案用果实，同池可出疾光千兽',
          },
          {
            fruit: '雪怪果实',
            spirit: '雪怪',
            attrs: ['冰系'],
            unlock: '购买战令礼包',
            usedInPlan: '刷异色方案',
            tip: 'S2 战令限定，冰系单刷异色专属',
          },
          {
            fruit: '爆焰喷喷果实',
            spirit: '爆焰喷喷',
            attrs: ['火系'],
            unlock: '购买战令礼包',
            usedInPlan: '刷异色方案',
            tip: 'S2 战令限定，火系单刷异色专属',
          },
        ],
      },
    ],
  },
];

// ── attrId（plans.js 英文 id）↔ 中文 label 映射 ───────────────────────────────
// plans.js 的 attrId 用英文（fire/ice/...），fruitGuide 与 ATTR_CONFIG 用中文 key（火系/冰系/...）。
// customFruits 同步、entries 渲染都需要这张映射。覆盖 19 个属系，与 CustomChecklist 的 ATTR_OPTIONS_FULL 对齐。
export const ATTR_ID_TO_LABEL = {
  fire: '火系',
  ice: '冰系',
  electric: '电系',
  phantom: '幻系',
  grass: '草系',
  evil: '恶系',
  ghost: '幽系',
  mech: '机械系',
  light: '光系',
  water: '水系',
  cute: '萌系',
  normal: '普通系',
  earth: '岩系',
  wing: '翼系',
  dragon: '龙系',
  poison: '毒系',
  ground: '地系',
  bug: '虫系',
  fighting: '武系',
};

/** 中文 label → attrId 反查（少数几次手动选属性时使用） */
export const LABEL_TO_ATTR_ID = Object.entries(ATTR_ID_TO_LABEL)
  .reduce((acc, [id, label]) => { acc[label] = id; return acc; }, {});

// ── 工具函数 ──────────────────────────────────────────────────────────────────

/** 获取某 Tab 下所有 entries（扁平化） */
export function getTabEntries(tab) {
  if (tab.entries) return tab.entries;
  return (tab.groups || []).flatMap(g => g.entries);
}

/** 获取所有 Tab 下所有 entries（全局） */
export function getAllEntries() {
  return FRUIT_GUIDE_TABS.flatMap(getTabEntries);
}

/** 获取某 Tab 下出现的所有属性（去重） */
export function getTabAttrs(tab) {
  const entries = getTabEntries(tab);
  return [...new Set(entries.flatMap(e => e.attrs || []))];
}

/**
 * 把 customFruits 里的一条记录转成 entry 格式（与 catch Tab 静态条目同构）
 * - attrs：优先用记录里的 attrs（中文系名数组），其次按 attrId 反查
 * - 标记 custom: true / source 字段，便于 UI 渲染自建角标和编辑/删除
 */
export function customFruitToEntry(c) {
  if (!c || !c.fruit) return null;
  let attrs = Array.isArray(c.attrs) && c.attrs.length > 0
    ? c.attrs
    : (c.attrId && ATTR_ID_TO_LABEL[c.attrId] ? [ATTR_ID_TO_LABEL[c.attrId]] : []);
  return {
    fruit: c.fruit,
    spirit: c.spirit || c.fruit.replace(/果实$/, ''),
    attrs,
    unlock: c.unlock || '自定义',
    tip: c.tip || '',
    custom: true,                        // 渲染层用：自建角标
    source: c.source || 'manual',        // 'manual' / 'plan'
    fromPlanId: c.fromPlanId || null,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

/**
 * 合并自建果实到指定 Tab 的 entries
 * - 仅 catch Tab 合并，其他 Tab 原样返回 getTabEntries(tab)
 * - 过滤掉 deleted=true 的墓碑记录
 * - 按 fruit name 去重：内置已存在 → 保留内置（不被自建覆盖）
 * - 自建条目按 createdAt 升序排在内置之后
 */
export function getMergedTabEntries(tab, customFruits) {
  const baseEntries = getTabEntries(tab);
  if (!tab || tab.id !== 'catch') return baseEntries;
  if (!Array.isArray(customFruits) || customFruits.length === 0) return baseEntries;
  const baseFruitSet = new Set(baseEntries.map(e => e.fruit));
  const extras = customFruits
    .filter(c => c && !c.deleted && c.fruit && !baseFruitSet.has(c.fruit))
    .sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''))
    .map(customFruitToEntry)
    .filter(Boolean);
  return [...baseEntries, ...extras];
}
