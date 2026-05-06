// 果实方案常量数据
// 规则说明：只有属性1会计入池子，属性2方案已全部失效，现均为单果实循环
const base = import.meta.env.BASE_URL;

export const PLANS = [
  // ─── 属性方案（单果实循环，属性2已失效） ────────────────────────────────────
  {
    id: 'fire',
    type: '火系',
    icon: '🔥',
    iconImg: `${base}attrs/fire.png`,
    color: '#E8733A',
    fruitA: '治愈兔果实',
    fruitB: '火红尾果实',
    spiritA: '治愈兔',
    spiritB: '火红尾',
    shinies: ['治愈兔', '火红尾', '柴渣虫'],
    unlockA: '活动赠送',
    unlockB: '活动赠送',
    highValue: true,   // S级：两果实均活动赠送，成本最低
  },
  {
    id: 'ice',
    type: '冰系',
    icon: '❄️',
    iconImg: `${base}attrs/ice.png`,
    color: '#42A5F5',
    fruitA: '呼呼猪果实',
    fruitB: '大耳帽兜果实',
    spiritA: '呼呼猪',
    spiritB: '大耳帽兜',
    shinies: ['大耳帽兜', '呼呼猪', '月牙雪熊'],
    unlockA: '抓/进化20只对应精灵',
    unlockB: '集齐 120 只风眠省精灵图鉴（星霜崖地西侧破旧船旁）',
    highValue: true,   // S级：月牙雪熊赛季精灵同池，一方案刷双目标
  },
  {
    id: 'electric',
    type: '电系',
    icon: '⚡',
    iconImg: `${base}attrs/electric.png`,
    color: '#FDD835',
    fruitA: '拉特果实',
    fruitB: '小星光果实',  // 备选：电咩咩果实
    spiritA: '拉特',
    spiritB: '小星光',     // 备选：电咩咩
    shinies: ['拉特', '粉粉星', '双灯鱼'],
    unlockA: '抓/进化20只对应精灵',
    unlockB: '抓/进化20只对应精灵',
    highValue: true,   // S级：拉特+双灯鱼+粉粉星三精灵同池
    // 小星光果实可解锁「月光能量星光狮」特殊形态
    specialFormSanctuary: {
      sanctuary: '聆风塔地底护所',
      tip: '将小星光的橡果形态（黄色星形图案）放入此底护所，可解锁「月光能量星光狮」隐藏形态',
      hiddenForm: '月光能量星光狮',
      spirit: '小星光',
    },
  },
  {
    id: 'phantom',
    type: '幻系',
    icon: '🔮',
    iconImg: `${base}attrs/phantom.png`,
    color: '#AB47BC',
    fruitA: '哭哭菇果实',
    fruitB: '仪使者果实',  // 4.23后仪使者(地+幻)只计地系池，不计幻系；放着但不抓循环
    spiritA: '哭哭菇',
    spiritB: '仪使者',
    shinies: ['粉星仔', '粉粉星', '月牙雪熊'],
    unlockA: '抓/进化20只怖哭菇',
    unlockB: '集齐 60 只风眠省精灵图鉴（旧飞艇航道下方丰裕谷入口旁）',
    phantomNote: '4.23后仪使者(地+幻)只计地系池，幻系方案只用哭哭菇单系循环',
    highValue: true,   // S级：粉星仔+粉粉星+月牙雪熊三赛季精灵同池
  },
  {
    id: 'grass',
    type: '草系',
    icon: '🌿',
    iconImg: `${base}attrs/grass.png`,
    color: '#66BB6A',
    fruitA: '格兰种子果实',
    fruitB: '奇丽草果实',
    spiritA: '格兰种子',
    spiritB: '奇丽草',
    shinies: ['格兰种子', '奇丽草', '柴渣虫'],
    unlockA: '抓/进化20只对应精灵',
    unlockB: '抓/进化20只对应精灵',
    highValue: true,   // S级：两果实均易获取，且可顺带柴渣虫
  },
  {
    id: 'evil',
    type: '恶系',
    icon: '😈',
    iconImg: `${base}attrs/evil.png`,
    color: '#5D4037',
    fruitA: '小夜果实',
    fruitB: '恶魔狼果实',
    spiritA: '小夜',
    spiritB: '恶魔狼',
    shinies: ['恶魔狼', '嗜光嗡嗡'],
    unlockA: '抓/进化20只幽朔夜伊芙',
    unlockB: '抓/进化20只恶魔狼/幽朔夜伊芙',
  },
  {
    id: 'ghost',
    type: '幽系',
    icon: '👻',
    iconImg: `${base}attrs/ghost.png`,
    color: '#7E57C2',
    fruitA: '小灵面果实',
    fruitB: '梦游果实',    // 梦悠悠果实，幽系精灵，计入幽系池
    spiritA: '小灵面',
    spiritB: '梦悠悠',
    shinies: ['空空颅'],
    unlockA: '抓/进化20只幽冥眼',
    unlockB: '抓/进化20只梦悠悠/幽冥眼',
  },
  {
    id: 'mech',
    type: '机械系',
    icon: '⚙️',
    iconImg: `${base}attrs/mech.png`,
    color: '#78909C',
    fruitA: '机械方方果实',
    fruitB: null,           // 机械系单放最优，无 fruitB
    spiritA: '机械方方',
    spiritB: null,
    shinies: ['机械方方', '贝瑟'],  // 圣剑侍从无异色，已移除
    unlockA: '集齐 80 只洛克里安精灵图鉴（拾荒港口东南角）',
    unlockB: null,
  },
  {
    id: 'light',
    type: '光系',
    icon: '✨',
    iconImg: `${base}attrs/light.png`,
    color: '#FFB300',
    fruitA: '独角兽果实',
    fruitB: '犀角鸟果实',
    spiritA: '独角兽',
    spiritB: '犀角鸟',
    shinies: ['疾光千兽', '绒仙子'],
    unlockA: '抓/进化20只对应精灵',
    unlockB: '抓/进化20只对应精灵',
  },

  // ─── 赛季奇遇方案（第六章赛季任务单果实） ──────────────────────────────────
  // 获取方式：第六章赛季任务，捕捉2只污染血脉的对应精灵可获得
  {
    id: 'season_pinkstar',
    type: '粉粉星',
    icon: '⚡',
    iconImg: `${base}attrs/electric.png`,   // 粉粉星属性1：电系
    color: '#F48FB1',
    fruitA: '粉粉星果实',
    fruitB: null,
    spiritA: '粉粉星',
    spiritB: null,
    shinies: ['粉粉星'],
    unlockA: '第六章赛季任务，捕捉2只污染血脉的粉粉星可获得',
    unlockB: null,
    season: true,
    sanctuary: '凤息山魔力之源附近',
    sanctuaryTip: '与粉星仔果实位置相同（同一区域两个庇护所）；可与粉星仔同放省位',
    coFruit: '粉星仔果实',
  },
  {
    id: 'season_pinkbaby',
    type: '粉星仔',
    icon: '🔮',
    iconImg: `${base}attrs/phantom.png`,    // 粉星仔属性1：幻系
    color: '#F48FB1',
    fruitA: '粉星仔果实',
    fruitB: null,
    spiritA: '粉星仔',
    spiritB: null,
    shinies: ['粉星仔'],
    unlockA: '第六章赛季任务，捕捉2只污染血脉的粉星仔可获得',
    unlockB: null,
    season: true,
    sanctuary: '凤息山魔力之源附近',
    sanctuaryTip: '地图中为蓝色底座+星形图标；视野空旷，可站猫头鹰上投球',
    coFruit: '粉粉星果实',
  },
  {
    id: 'season_moonbear',
    type: '月牙雪熊',
    icon: '❄️',
    iconImg: `${base}attrs/ice.png`,        // 月牙雪熊属性1：冰系
    color: '#F48FB1',
    fruitA: '月牙雪熊果实',
    fruitB: null,
    spiritA: '月牙雪熊',
    spiritB: null,
    shinies: ['月牙雪熊'],
    unlockA: '第六章赛季任务，捕捉2只污染血脉的月牙雪熊可获得',
    unlockB: null,
    season: true,
    sanctuary: '星霜崖地魔力之源附近',
    sanctuaryTip: '雪地场景；离魔力之源极近，便于及时恢复精灵',
    coFruit: null,
  },
  {
    id: 'season_emptyskull',
    type: '空空颅',
    icon: '👻',
    iconImg: `${base}attrs/ghost.png`,      // 空空颅属性1：幽系
    color: '#F48FB1',
    fruitA: '空空颅果实',
    fruitB: null,
    spiritA: '空空颅',
    spiritB: null,
    shinies: ['空空颅'],
    unlockA: '第六章赛季任务，捕捉2只污染血脉的空空颅可获得',
    unlockB: null,
    season: true,
    sanctuary: '监管区魔力之源附近',
    sanctuaryTip: '草地+石径混合地形；可与嗜光嗡嗡同放',
    coFruit: '嗜光嗡嗡果实',
  },
  {
    id: 'season_cinder',
    type: '柴渣虫',
    icon: '🔥',
    iconImg: `${base}attrs/fire.png`,       // 柴渣虫属性1：火系
    color: '#F48FB1',
    fruitA: '柴渣虫果实',
    fruitB: null,
    spiritA: '柴渣虫',
    spiritB: null,
    shinies: ['柴渣虫'],
    unlockA: '第六章赛季任务，捕捉2只污染血脉的柴渣虫可获得',
    unlockB: null,
    season: true,
    sanctuary: '彼得大道魔力之源附近',
    sanctuaryTip: '沙滩地形；柴渣虫体型小，不推荐放在有草地的庇护所（易被遮挡）',
    coFruit: null,
  },
  {
    id: 'season_lightbuzz',
    type: '嗜光嗡嗡',
    icon: '😈',
    iconImg: `${base}attrs/evil.png`,       // 嗜光嗡嗡属性1：恶系
    color: '#F48FB1',
    fruitA: '嗜光嗡嗡果实',
    fruitB: null,
    spiritA: '嗜光嗡嗡',
    spiritB: null,
    shinies: ['嗜光嗡嗡'],
    unlockA: '第六章赛季任务，捕捉2只污染血脉的嗜光嗡嗡可获得',
    unlockB: null,
    season: true,
    sanctuary: '监管区魔力之源附近',
    sanctuaryTip: '二者均可放于同一空旷点，节省位置',
    coFruit: '空空颅果实',
  },
  {
    id: 'season_twolight',
    type: '双灯鱼',
    icon: '⚡',
    iconImg: `${base}attrs/electric.png`,   // 双灯鱼属性1：电系
    color: '#F48FB1',
    fruitA: '双灯鱼果实',
    fruitB: null,
    spiritA: '双灯鱼',
    spiritB: null,
    shinies: ['双灯鱼'],
    unlockA: '第六章赛季任务，捕捉2只污染血脉的双灯鱼可获得',
    unlockB: null,
    season: true,
    sanctuary: '沉船漩涡魔力之源附近',
    sanctuaryTip: '水边开阔，视野好；可与贝瑟共用位置（一陆一水）',
    coFruit: '贝瑟果实',
  },
  {
    id: 'season_besse',
    type: '贝瑟',
    icon: '⚙️',
    iconImg: `${base}attrs/mech.png`,       // 贝瑟属性1：机械系
    color: '#F48FB1',
    fruitA: '贝瑟果实',
    fruitB: null,
    spiritA: '贝瑟',
    spiritB: null,
    shinies: ['贝瑟'],
    unlockA: '第六章赛季任务，捕捉2只污染血脉的贝瑟可获得',
    unlockB: null,
    season: true,
    sanctuary: '沉船漩涡魔力之源附近',
    sanctuaryTip: '陆地+水域交界处；适合与双灯鱼同放（一陆一水）',
    coFruit: '双灯鱼果实',
  },

  // ─── 普通异色单刷方案（单刷对应精灵自身果实，进家族池） ──────────────────────
  // 解锁方式：抓/进化20只对应精灵，向NPC兑换对应果实
  // 优点：100%集中家族池，出货稳定；缺点：需要单独解锁每只精灵的果实
  {
    id: 'single_healingrabbit',
    type: '治愈兔',
    icon: '🔥',
    iconImg: `${base}attrs/fire.png`,
    color: '#E8733A',
    fruitA: '治愈兔果实',
    fruitB: null,
    spiritA: '治愈兔',
    spiritB: null,
    shinies: ['治愈兔'],
    unlockA: '活动赠送',
    unlockB: null,
    singleSpirit: true,
  },
  {
    id: 'single_firetail',
    type: '火红尾',
    icon: '🔥',
    iconImg: `${base}attrs/fire.png`,
    color: '#E8733A',
    fruitA: '火红尾果实',
    fruitB: null,
    spiritA: '火红尾',
    spiritB: null,
    shinies: ['火红尾'],
    unlockA: '活动赠送',
    unlockB: null,
    singleSpirit: true,
  },
  {
    id: 'single_snortpig',
    type: '呼呼猪',
    icon: '❄️',
    iconImg: `${base}attrs/ice.png`,
    color: '#42A5F5',
    fruitA: '呼呼猪果实',
    fruitB: null,
    spiritA: '呼呼猪',
    spiritB: null,
    shinies: ['呼呼猪'],
    unlockA: '抓/进化20只对应精灵',
    unlockB: null,
    singleSpirit: true,
  },
  {
    id: 'single_bigearhat',
    type: '大耳帽兜',
    icon: '❄️',
    iconImg: `${base}attrs/ice.png`,
    color: '#42A5F5',
    fruitA: '大耳帽兜果实',
    fruitB: null,
    spiritA: '大耳帽兜',
    spiritB: null,
    shinies: ['大耳帽兜'],
    unlockA: '集齐 120 只风眠省精灵图鉴（星霜崖地西侧破旧船旁）',
    unlockB: null,
    singleSpirit: true,
  },
  {
    id: 'single_ratt',
    type: '拉特',
    icon: '⚡',
    iconImg: `${base}attrs/electric.png`,
    color: '#FDD835',
    fruitA: '拉特果实',
    fruitB: null,
    spiritA: '拉特',
    spiritB: null,
    shinies: ['拉特'],
    unlockA: '抓/进化20只对应精灵',
    unlockB: null,
    singleSpirit: true,
  },
  {
    id: 'single_granlseed',
    type: '格兰种子',
    icon: '🌿',
    iconImg: `${base}attrs/grass.png`,
    color: '#66BB6A',
    fruitA: '格兰种子果实',
    fruitB: null,
    spiritA: '格兰种子',
    spiritB: null,
    shinies: ['格兰种子'],
    unlockA: '抓/进化20只对应精灵',
    unlockB: null,
    singleSpirit: true,
  },
  {
    id: 'single_beautygrass',
    type: '奇丽草',
    icon: '🌿',
    iconImg: `${base}attrs/grass.png`,
    color: '#66BB6A',
    fruitA: '奇丽草果实',
    fruitB: null,
    spiritA: '奇丽草',
    spiritB: null,
    shinies: ['奇丽草'],
    unlockA: '抓/进化20只对应精灵',
    unlockB: null,
    singleSpirit: true,
  },
  {
    id: 'single_demonwolf',
    type: '恶魔狼',
    icon: '😈',
    iconImg: `${base}attrs/evil.png`,
    color: '#5D4037',
    fruitA: '恶魔狼果实',
    fruitB: null,
    spiritA: '恶魔狼',
    spiritB: null,
    shinies: ['恶魔狼'],
    unlockA: '抓/进化20只恶魔狼/幽朔夜伊芙',
    unlockB: null,
    singleSpirit: true,
  },
  {
    id: 'single_mechbox',
    type: '机械方方',
    icon: '⚙️',
    iconImg: `${base}attrs/mech.png`,
    color: '#78909C',
    fruitA: '机械方方果实',
    fruitB: null,
    spiritA: '机械方方',
    spiritB: null,
    shinies: ['机械方方'],
    unlockA: '集齐 80 只洛克里安精灵图鉴（拾荒港口东南角）',
    unlockB: null,
    singleSpirit: true,
  },
  {
    id: 'single_swiftbeast',
    type: '疾光千兽',
    icon: '✨',
    iconImg: `${base}attrs/light.png`,
    color: '#FFB300',
    fruitA: '犀角鸟果实',   // 疾光千兽与犀角鸟同家族，使用犀角鸟果实刷取
    fruitB: null,
    spiritA: '疾光千兽',
    spiritB: null,
    shinies: ['疾光千兽'],
    unlockA: '购买战令礼包',
    unlockB: null,
    singleSpirit: true,
  },
  {
    id: 'single_fluffyfairy',
    type: '绒仙子',
    icon: '✨',
    iconImg: `${base}attrs/light.png`,
    color: '#FFB300',
    fruitA: '绒绒果实',   // 绒仙子与绒绒同家族，使用绒绒果实刷取
    fruitB: null,
    spiritA: '绒仙子',
    spiritB: null,
    shinies: ['绒仙子'],
    unlockA: '购买战令礼包',
    unlockB: null,
    singleSpirit: true,
  },
  // ─── 积累属系池方案（目标精灵本身无异色，但使用其果实可稳定积累对应属系池权重） ──
  // attrId 指向父属系方案 → 将在对应属系二级页展示，不在方案列表单独显示
  {
    id: 'fire_ape',
    type: '火焰猿+尖嘴狐仙',
    icon: '🔥',
    iconImg: `${base}attrs/fire.png`,
    color: '#E8733A',
    fruitA: '火焰猿果实',
    fruitB: '尖嘴狐仙果实',
    spiritA: '火焰猿',
    spiritB: '尖嘴狐仙',
    shinies: [],          // 火焰猿/尖嘴狐仙均无异色（仅污染形态），用于积累火系池
    unlockA: '抓/进化20只对应精灵',
    unlockB: '抓/进化20只对应精灵',
    noShiny: true,
    attrId: 'fire',       // 嵌入「火系」二级页
    highValue: true,      // 火系果实易获取，性价比高
    poolShinies: ['治愈兔', '火红尾', '柴渣虫'],  // 火系池可产出的异色精灵
  },
  {
    id: 'grass_bungaflower',
    type: '蹦蹦花',
    icon: '🌿',
    iconImg: `${base}attrs/grass.png`,
    color: '#66BB6A',
    fruitA: '蹦蹦花果实',
    fruitB: null,
    spiritA: '蹦蹦花',
    spiritB: null,
    shinies: [],          // 蹦蹦花无异色，用于积累草系池
    unlockA: '抓/进化20只对应精灵',
    unlockB: null,
    noShiny: true,
    attrId: 'grass',      // 嵌入「草系」二级页
    highValue: true,      // 草系果实易获取，性价比高
    poolShinies: ['格兰种子', '奇丽草', '柴渣虫'],  // 草系池可产出的异色精灵
  },
  {
    id: 'mech_bodoxi',
    type: '波多西+圣剑侍从',
    icon: '⚙️',
    iconImg: `${base}attrs/mech.png`,
    color: '#78909C',
    fruitA: '波多西果实',
    fruitB: '圣剑侍从果实',
    spiritA: '波多西',
    spiritB: '圣剑侍从',
    shinies: [],          // 波多西/圣剑侍从均无异色（仅污染形态），用于积累机械系池
    unlockA: '抓/进化20只对应精灵',
    unlockB: '集齐 80 只洛克里安精灵图鉴（拾荒港口东南角）',
    noShiny: true,
    attrId: 'mech',       // 嵌入「机械系」二级页
    highValue: true,      // 机械系池价值高（可出机械方方/贝瑟），性价比高
    poolShinies: ['机械方方', '贝瑟'],  // 机械系池可产出的异色精灵
  },
  {
    id: 'water_deepwhale',
    type: '水系',
    icon: '💧',
    iconImg: `${base}attrs/water.png`,
    color: '#1565C0',
    fruitA: '深蓝鲸果实',
    fruitB: null,
    spiritA: '深蓝鲸',
    spiritB: null,
    shinies: [],          // 深蓝鲸无异色，用于积累水系池
    unlockA: '集齐 100 只洛克里安精灵图鉴（拾荒港口找智慧树苗）',
    unlockB: null,
    noShiny: true,
    // 水系池可产出：第二属性含水系的异色精灵
    poolShinies: ['双灯鱼'],
  },
  {
    id: 'cute_chrysanthemumpear',
    type: '萌系',
    icon: '🌸',
    iconImg: `${base}attrs/cute.png`,
    color: '#E91E8C',
    fruitA: '菊花梨果实',
    fruitB: null,
    spiritA: '菊花梨',
    spiritB: null,
    shinies: [],          // 菊花梨无异色，用于积累萌系池
    unlockA: '抓/进化20只对应精灵',
    unlockB: null,
    noShiny: true,
    // 萌系池可产出：属性含萌系的异色精灵
    poolShinies: ['大耳帽兜', '治愈兔'],
  },
  {
    id: 'light_miniunicorn',
    type: '小独角兽',
    icon: '✨',
    iconImg: `${base}attrs/light.png`,
    color: '#FFB300',
    fruitA: '小独角兽果实',
    fruitB: null,
    spiritA: '小独角兽',
    spiritB: null,
    shinies: [],          // 小独角兽无异色，用于积累光系池
    unlockA: '抓/进化20只对应精灵',
    unlockB: null,
    noShiny: true,
    attrId: 'light',      // 嵌入「光系」二级页
    highValue: true,      // 光系池价值高（可出疾光千兽/绒仙子/嗜光嗡嗡），性价比高
    poolShinies: ['疾光千兽', '绒仙子', '嗜光嗡嗡'],  // 光系池可间接产出的异色精灵
  },
];

// ─── 属性 ID 集合（用于判断是否属于"属性系"池子） ────────────────────────────
const BASE_IDS = new Set([
  'fire', 'ice', 'electric', 'phantom', 'grass', 'evil', 'ghost', 'mech', 'light',
  'water', 'cute',
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

// ─── 所有属性异色精灵（属性池方案的 shinies，去重） ──────────────────────────
export const ATTR_SHINIES = PLANS
  .filter(p => !p.season && BASE_IDS.has(p.id) && p.shinies?.length > 0)
  .flatMap(p => p.shinies)
  .filter((v, i, a) => a.indexOf(v) === i && !SEASON_SHINIES.includes(v));

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

/** 从方案对象中推断属性 id */
function getPlanAttrId(plan) {
  if (!plan) return null;
  const ALL_BASE = new Set([
    'fire','ice','electric','phantom','grass','evil','ghost','mech','light','water','cute'
  ]);
  if (ALL_BASE.has(plan.id)) return plan.id;
  if (plan.attrId && ALL_BASE.has(plan.attrId)) return plan.attrId;
  const m = (plan.iconImg || '').match(/attrs\/(\w+)\.png/);
  return m ? m[1] : null;
}

/**
 * 判断出货精灵属于哪个池子：
 *   'family' — 家族池（spiritA / spiritB 的同族精灵，70次保底）
 *   'attr'   — 属性池（同属性非家族精灵，80次保底）
 *   'world'  — 世界池（其他，80次保底）
 */
export function classifyResultType(resultSpirit, plan) {
  if (!resultSpirit || !plan) return 'world';
  const targetFamilies = [plan.spiritA, plan.spiritB].filter(Boolean);
  if (targetFamilies.some(t => fuzzyMatch(t, resultSpirit))) return 'family';
  const planAttrId = getPlanAttrId(plan);
  const spiritAttr = lookupAttr(resultSpirit);
  if (spiritAttr && planAttrId && spiritAttr === planAttrId) return 'attr';
  return 'world';
}

/**
 * 兼容旧数据：从 task + plan 推断池子类型
 */
export function inferPoolType(task, plan) {
  if (!task) return 'world';
  if (['family', 'attr', 'world'].includes(task.resultType)) return task.resultType;
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
