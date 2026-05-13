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
    unlockB: '抓/进化20只恶魔狼',
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
    type: '光系（疾光千兽）',
    icon: '✨',
    iconImg: `${base}attrs/light.png`,
    color: '#FFB300',
    fruitA: '独角兽果实',
    fruitB: '犀角鸟果实',   // 犀角鸟与疾光千兽同家族
    spiritA: '独角兽',
    spiritB: '犀角鸟',
    shinies: ['疾光千兽', '嗜光嗡嗡'],  // 犀角鸟→疾光千兽家族池；绒仙子需换绒绒果实
    unlockA: '抓/进化20只对应精灵',
    unlockB: '购买战令礼包',  // 犀角鸟果实为战令专属
  },
  {
    id: 'light_fluffy',
    type: '光系（绒仙子）',
    icon: '✨',
    iconImg: `${base}attrs/light.png`,
    color: '#FFB300',
    fruitA: '独角兽果实',
    fruitB: '绒绒果实',     // 绒绒与绒仙子同家族
    spiritA: '独角兽',
    spiritB: '绒绒',
    shinies: ['绒仙子', '嗜光嗡嗡'],   // 绒绒→绒仙子家族池；嗜光嗡嗡同属光系大池
    unlockA: '抓/进化20只对应精灵',
    unlockB: '购买战令礼包',  // 绒绒果实为战令专属
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
    unlockA: '抓/进化20只恶魔狼',
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
    highValue: true,      // 光系池价值高（可出嗜光嗡嗡），性价比高；疾光千兽/绒仙子需战令果实单刷
    poolShinies: ['嗜光嗡嗡'],  // 单刷光系池只可间接产出嗜光嗡嗡；疾光千兽/绒仙子为战令宠，需各自专属果实
  },
];

// ─── 属性 ID 集合（用于判断是否属于"属性系"池子） ────────────────────────────
const BASE_IDS = new Set([
  'fire', 'ice', 'electric', 'phantom', 'grass', 'evil', 'ghost', 'mech', 'light', 'light_fluffy',
  'water', 'cute',
]);

// ─── 果实名 → 属系 ID 映射 ─────────────────────────────────────────────────
// 注意：此映射用于 classifyPool 判定刷池归属（系别池/世界池），
//       任何攻略库 fruitGuide 里出现的果实必须在此表能查到第1属性，否则
//       自定义方案使用该果实时会被全部错判为世界池。
//       新增果实的同时要注意把对应精灵补到 SPIRIT_ATTR1 / SPIRIT_ATTR2。
export const FRUIT_ATTR = {
  // ── 火系 ────────────────────────────────────────────────────────────────
  '治愈兔果实':    'fire',
  '火红尾果实':    'fire',
  '柴渣虫果实':    'fire',
  '火焰猿果实':    'fire',
  '尖嘴狐仙果实':  'fire',
  '可爱猿果实':    'fire',
  '鸭吉吉果实':    'fire',  // 对应精灵：燃了鸭
  // ── 冰系 ────────────────────────────────────────────────────────────────
  '呼呼猪果实':    'ice',
  '大耳帽兜果实':  'ice',
  '月牙雪熊果实':  'ice',
  '雪娃娃果实':    'ice',
  '雪豆丁果实':    'ice',
  // ── 电系 ────────────────────────────────────────────────────────────────
  '拉特果实':      'electric',
  '小星光果实':    'electric',
  '粉粉星果实':    'electric',
  '双灯鱼果实':    'electric',
  '电咩咩果实':    'electric',
  '伊雷龙果实':    'electric',
  '噼啪鸟果实':    'electric',  // 电+翼，第1属性电
  // ── 幻系 ────────────────────────────────────────────────────────────────
  '哭哭菇果实':    'phantom',
  '仪使者果实':    'phantom',  // 注：4.23 后仪使者改为 ground+phantom，第1属性变更，进池逻辑只看 fruitA 属性
  '粉星仔果实':    'phantom',
  // ── 草系 ────────────────────────────────────────────────────────────────
  '格兰种子果实':  'grass',
  '奇丽草果实':    'grass',
  '蹦蹦花果实':    'grass',
  '蹦蹦种子果实':  'grass',
  // ── 恶系 ────────────────────────────────────────────────────────────────
  '小夜果实':      'evil',
  '恶魔狼果实':    'evil',
  '嗜光嗡嗡果实':  'evil',
  '厉毒小萝果实':  'evil',  // 毒+恶，第1属性毒，归 poison（见下）
  // ── 幽系 ────────────────────────────────────────────────────────────────
  '小灵面果实':    'ghost',
  '梦游果实':      'ghost',
  '空空颅果实':    'ghost',
  '幽星光果实':    'ghost',
  // ── 机械系 ──────────────────────────────────────────────────────────────
  '机械方方果实':  'mech',
  '贝瑟果实':      'mech',
  '圣剑侍从果实':  'mech',
  '波多西果实':    'mech',
  '多西果实':      'mech',
  // ── 光系 ────────────────────────────────────────────────────────────────
  '独角兽果实':    'light',
  '犀角鸟果实':    'light',
  '疾光千兽果实':  'light',
  '绒绒果实':      'light',   // 绒仙子/疾光千兽家族（绒绒为进化前形态）
  '绒仙子果实':    'light',   // 旧数据兜底
  '小独角兽果实':  'light',
  // ── 水系 ────────────────────────────────────────────────────────────────
  '深蓝鲸果实':    'water',
  '布鲁斯果实':    'water',
  '墨鱿士果实':    'water',
  // ── 萌系 ────────────────────────────────────────────────────────────────
  '菊花梨果实':    'cute',
  '春团果实':      'cute',
  // ── 普通 / 其他系（非 9 种主系，自定义方案选不到这些果实做主刷果，
  //                  但作为 fruitB 跨属混刷需要能识别属性才能正确归世界池） ─
  '公平鸽果实':    'normal',  // 公平鸽为普通系
  '小黑猫果实':    'normal',  // 普通系
  '伏地兽果实':    'earth',   // 岩系/地系，沿用 earth
  '咔咔羽毛果实':  'wing',    // 翼系
  '小翼龙果实':    'dragon',  // 龙+翼，第1属性龙
  '裘洛果实':      'poison',  // 毒系
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
  '仪使者':   'phantom',  // 地系+幻系
  '落陨星兔': 'ghost',   // 幻系+幽系（进化终态，wiki 校对：第二属性为「幽」非「暗」）
  // 萌系精灵（cute 为第2属性）
  '治愈兔':   'cute',    // 火系+萌系
  '大耳帽兜': 'cute',    // 冰系+萌系
  // 攻略库 fruitGuide 中标注的双属精灵补全（出货归属判定用）
  '小翼龙':   'wing',    // 龙系+翼系
  '噼啪鸟':   'wing',    // 电系+翼系
  '厉毒小萝': 'evil',    // 毒系+恶系
};

// ─── 精灵名 → 属性1 ID 映射（4.23后双属精灵只按属性1计池） ──────────────────
// 注意：此映射用于 classifyPool 判定污染精灵命中哪个系别池（matchesTargetAttr）。
//       自定义方案中污染精灵若不在此表里（lookupAttr 返回 null），将被错判为世界池。
//       任何攻略库 fruitGuide 里的精灵都应在此表能查到第1属性。
export const SPIRIT_ATTR1 = {
  // ── 火系 ────────────────────────────────────────────────────────────────
  '治愈兔':   'fire',
  '火红尾':   'fire',
  '柴渣虫':   'fire',
  '燃薪虫':   'fire',     // 柴渣虫进化形
  '护主犬':   'fire',
  '火焰猿':   'fire',
  '尖嘴狐仙': 'fire',
  '可爱猿':   'fire',
  '燃了鸭':   'fire',
  // ── 冰系 ────────────────────────────────────────────────────────────────
  '呼呼猪':   'ice',
  '大耳帽兜': 'ice',
  '月牙雪熊': 'ice',
  '雪豆丁':   'ice',
  '雪娃娃':   'ice',
  // ── 电系 ────────────────────────────────────────────────────────────────
  '拉特':     'electric',
  '小星光':   'electric',
  '粉粉星':   'electric',
  '双灯鱼':   'electric',
  '电咩咩':   'electric',
  '酷拉':     'electric',
  '伊雷龙':   'electric',
  '噼啪鸟':   'electric',  // 电+翼，第1属性电
  // ── 幻系 ────────────────────────────────────────────────────────────────
  '哭哭菇':   'phantom',
  '粉星仔':   'phantom',
  '粉耳星兔': 'phantom',
  '落陨星兔': 'phantom',  // 进化形，主属性幻系
  '仪使者':   'ground',   // 地系+幻系（4.23 后第1属性改地系）
  // ── 草系 ────────────────────────────────────────────────────────────────
  '格兰种子': 'grass',
  '奇丽草':   'grass',
  '蹦蹦花':   'grass',
  '蹦蹦种子': 'grass',
  // ── 恶系 ────────────────────────────────────────────────────────────────
  '小夜':     'evil',
  '恶魔狼':   'evil',
  '嗜光嗡嗡': 'evil',
  // ── 幽系 ────────────────────────────────────────────────────────────────
  '小灵面':   'ghost',
  '梦悠悠':   'ghost',
  '梦游':     'ghost',   // 梦悠悠的另一进化形
  '空空颅':   'ghost',
  '墨鱿士':   'ghost',
  '幽星光':   'ghost',
  // ── 机械系 ──────────────────────────────────────────────────────────────
  '机械方方': 'mech',
  '贝瑟':     'mech',
  '圣剑侍从': 'mech',
  '波多西':   'mech',
  '多西':     'mech',
  // ── 光系 ────────────────────────────────────────────────────────────────
  '独角兽':   'light',
  '犀角鸟':   'light',
  '疾光千兽': 'light',
  '绒仙子':   'light',
  '绒绒':     'light',
  '小独角兽': 'light',
  // ── 水系 ────────────────────────────────────────────────────────────────
  '深蓝鲸':   'water',
  '板板壳':   'water',
  '布鲁斯':   'water',
  // ── 萌系 ────────────────────────────────────────────────────────────────
  '菊花梨':   'cute',
  '春团':     'cute',
  // ── 其他系（普通/岩/翼/龙/毒；自定义方案 attr 选不到这几系，
  //          但污染精灵需要能被识别才能正确归世界池而非未知漏算） ──────────
  '公平鸽':   'normal',  // 普通系
  '小黑猫':   'normal',  // 普通系
  '伏地兽':   'earth',   // 岩系/地系
  '咔咔羽毛': 'wing',    // 翼系
  '小翼龙':   'dragon',  // 龙+翼，第1属性龙
  '裘洛':     'poison',  // 毒系
  '厉毒小萝': 'poison',  // 毒+恶，第1属性毒
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

/**
 * 通过任意名称（果实名 / 精灵名 / 进化形态名 / 别名）查询属系 ID。
 * 用于自定义方案输入框的实时属性反查——用户输入「恶魔狼」「光纤兽」「燃了鸭」
 * 等精灵名时也能立即识别属性，不必输入完整果实名。
 *
 * 命中链路（按优先级）：
 *   1) 直接当果实名查 FRUIT_ATTR（最准）
 *   2) 当精灵名 → 反查同义果实名（含 EVO_FAMILIES + ALIAS）→ 查 FRUIT_ATTR
 *   3) 当精灵名直接查 SPIRIT_ATTR1（覆盖那些"精灵无独立果实"的进化中间形态）
 *   4) 输入「xxx果实」但库里只有精灵名 → 兜底再查 SPIRIT_ATTR1
 *
 * 注：不做 fuzzyMatch 兜底——与 getFruitBySpirit 一样的"宁缺毋滥"策略，
 *     避免「恶魔叮」误命中「恶魔狼」属性。识别不到就返回 null，由 UI 提示用户手动指定。
 *
 * @param {string} name 用户输入的任意名称
 * @returns {string|null} 属性 id（如 'evil', 'light', 'fire'），未识别返回 null
 */
export function getAttrByAnyName(name) {
  if (!name) return null;
  const trimmed = name.trim();
  if (!trimmed) return null;

  // 1) 直接当果实名查
  const a1 = FRUIT_ATTR[trimmed];
  if (a1) return a1;

  // 2) 当精灵名 → 反查同义果实名 → 查果实属性
  const aliasFruit = getFruitBySpirit(trimmed);
  if (aliasFruit && FRUIT_ATTR[aliasFruit]) return FRUIT_ATTR[aliasFruit];

  // 3) 当精灵名直接查 SPIRIT_ATTR1
  const a3 = SPIRIT_ATTR1[trimmed];
  if (a3) return a3;

  // 4) 输入「xxx果实」但库里只有精灵名 → 兜底
  if (trimmed.endsWith('果实')) {
    const stripped = trimmed.slice(0, -2);
    if (stripped && SPIRIT_ATTR1[stripped]) return SPIRIT_ATTR1[stripped];
  }

  return null;
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

// ─── 开发期未识别项警告（每名字只警告一次，仅 dev 环境，避免线上骚扰） ──────
const __WARNED_UNKNOWN_SPIRITS = new Set();
const __WARNED_UNKNOWN_FRUITS  = new Set();
const __IS_DEV = (() => {
  try { return Boolean(import.meta?.env?.DEV); } catch { return false; }
})();

function warnUnknownSpirit(spiritName, where) {
  if (!__IS_DEV || !spiritName) return;
  if (__WARNED_UNKNOWN_SPIRITS.has(spiritName)) return;
  __WARNED_UNKNOWN_SPIRITS.add(spiritName);
  // eslint-disable-next-line no-console
  console.warn(
    `[plans] 未识别精灵 "${spiritName}"（@${where}）：` +
    `请补到 SPIRIT_ATTR1 / SPIRIT_ATTR2，否则该精灵在自定义方案中可能被错判为世界池。`
  );
}

function warnUnknownFruit(fruitName, where) {
  if (!__IS_DEV || !fruitName) return;
  if (__WARNED_UNKNOWN_FRUITS.has(fruitName)) return;
  __WARNED_UNKNOWN_FRUITS.add(fruitName);
  // eslint-disable-next-line no-console
  console.warn(
    `[plans] 未识别果实 "${fruitName}"（@${where}）：` +
    `请补到 FRUIT_ATTR，否则使用该果实的自定义方案三池判定会失效。`
  );
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

/**
 * 自定义方案 icon 智能推导：
 *   - 内置/已显式设置 iconImg → 沿用
 *   - 自定义且为「跨属性混刷」(异属) → 用混刷专属图标
 *   - 否则 → 用对应属性基础方案的 iconImg（同属混刷 / 单填属性）
 * @param {Object} rawPlan  原始方案数据
 * @param {Object|null} attrBase  对应属性基础方案（已查表）
 * @returns {string|null} 解析后的 iconImg 路径
 */
export function resolvePlanIconImg(rawPlan, attrBase) {
  if (!rawPlan) return null;
  if (rawPlan.iconImg) return rawPlan.iconImg;
  // 跨属混刷判定：自定义 + 双果实 + 双属性都识别出来 + 属性不一致
  // （poolKind 显式标 'world' 也算）
  const isCrossAttr = !!rawPlan.custom && (
    rawPlan.poolKind === 'world'
    || (!!rawPlan.fruitB && !!rawPlan.attrA && !!rawPlan.attrB && rawPlan.attrA !== rawPlan.attrB)
  );
  if (isCrossAttr) return `${base}icon-mixpool.png`;
  return attrBase?.iconImg || null;
}

/** 从方案对象中推断属性 id */
export function getPlanAttrId(plan) {
  if (!plan) return null;
  // 11 个一级方案属性（与方案库 attrTabs 对应）
  const ALL_BASE = new Set([
    'fire','ice','electric','phantom','grass','evil','ghost','mech','light','water','cute'
  ]);
  // 18 系属性 id 全集（用于自定义方案手选了 normal/wing/poison/dragon 等场景）
  const ALL_ATTRS = new Set([
    ...ALL_BASE,
    'normal','earth','wing','dragon','poison','ground','bug','fighting'
  ]);
  // ── 世界池方案护栏 ─────────────────────────────────────────────────────────
  // 自定义方案如果系统已自动判定为世界池（A/B 跨属混刷或属性识别失败），
  // 不应该回退到 attrA 提供「属性 id」给三池仪表盘/出货归属——否则世界池方案
  // 也会冒出一个属性池小条，并把异色出货错认为属性池出货。
  // 优先使用显式标记 plan.poolKind；旧数据无此字段时按 attrA/attrB 兼容判定。
  if (plan.custom) {
    if (plan.poolKind === 'world') return null;
    // 旧数据兼容：A、B 属性都有且不一致 → 世界池方案
    if (plan.fruitB && plan.attrA && plan.attrB && plan.attrA !== plan.attrB) return null;
  }
  if (ALL_BASE.has(plan.id)) return plan.id;
  if (plan.attrId && ALL_BASE.has(plan.attrId)) return plan.attrId;
  // 自定义方案 attrId 可能是 18 系的任意一种 → 也认作有效属性
  if (plan.attrId && ALL_ATTRS.has(plan.attrId)) return plan.attrId;
  // 自定义方案没填 attrId 时，fallback 到 plan.attrA（自定义方案保存时已写入）
  if (plan.attrA && ALL_ATTRS.has(plan.attrA)) return plan.attrA;
  const m = (plan.iconImg || '').match(/attrs\/(\w+)\.png/);
  return m ? m[1] : null;
}

/**
 * 判断出货精灵属于哪个池子：
 *   'family' — 家族池（spiritA / spiritB 的同族精灵，80次保底）
 *   'attr'   — 属性池（同属性非家族精灵，80次保底）
 *   'world'  — 世界池（其他，80次保底）
 *
 * 属性池出货范围说明（官方规则）：
 *   当某属性池触发出货时，该属性下所有精灵（包括第2属性属于该系的精灵）
 *   均有概率出现。因此判断时同时检查出货精灵的第1属性 AND 第2属性。
 *   例：萌系池出货 → 治愈兔（火+萌）或大耳帽兜（冰+萌）均算属性池出货。
 */
export function classifyResultType(resultSpirit, plan) {
  if (!resultSpirit || !plan) return 'world';
  const targetFamilies = [plan.spiritA, plan.spiritB].filter(Boolean);
  if (targetFamilies.some(t => fuzzyMatch(t, resultSpirit))) return 'family';
  const planAttrId = getPlanAttrId(plan);
  if (planAttrId) {
    const spiritAttr1 = lookupAttr(resultSpirit);
    const spiritAttr2 = lookupAttr2(resultSpirit);
    // 出货精灵的任意一个属性与方案属性匹配，即判为属性池出货
    if (spiritAttr1 === planAttrId || spiritAttr2 === planAttrId) return 'attr';
  }
  return 'world';
}

/**
 * 判断「触发噩梦污染」时，该次触发累积进哪个池子的保底计数器。
 *
 * 与 classifyResultType（出货归属）不同，classifyPool 判定的是：
 *   「这次污染事件，应该给哪个保底池子 +1？」
 *
 * 判定流程：
 *   1. 取 fruitA / fruitB 的第1属性
 *   2. 两果实属性不同 → 世界池（跨属混刷）
 *   3. 两果实属性相同：
 *      a. 单刷（fruitA === fruitB）：
 *         i.  污染精灵 = 目标精灵本身（spiritA 或 spiritB）→ 家族池
 *         ii. 污染精灵任意属性 含 目标属性 → 系别池
 *         iii. 其余 → 世界池
 *      b. 同属混刷（fruitA ≠ fruitB，但第1属性相同）：
 *         i.  污染精灵任意属性 含 目标属性 → 系别池（含A/B精灵自身）
 *         ii. 其余 → 世界池
 *
 * @param {string} spiritName  污染精灵名称
 * @param {object} plan        当前方案对象（含 fruitA, fruitB, spiritA, spiritB, iconImg 等）
 * @returns {'family'|'attr'|'world'}
 */
export function classifyPool(spiritName, plan) {
  if (!spiritName || !plan) return 'world';

  // ── 步骤1：取两个果实的第1属性 id ──────────────────────────────────────────
  // 优先级：plan.attrA（用户在自定义方案里手动指定）> FRUIT_ATTR 映射（自动识别）
  // 这样自定义方案就算填了攻略库以外的果实名，也能凭手选属性正确分池。
  const attrA = plan.attrA || FRUIT_ATTR[plan.fruitA] || null;
  if (plan.fruitA && !attrA) warnUnknownFruit(plan.fruitA, 'classifyPool.fruitA');
  // 单刷（无 fruitB）时 attrB 继承 attrA；有 fruitB 但查不到属性时保持 null（不继承！）
  // 若强行继承会把跨属混刷（如菊花梨+公平鸽）错判为同属，导致进池归属错误
  let attrB;
  if (plan.fruitB) {
    attrB = plan.attrB || FRUIT_ATTR[plan.fruitB] || null;
    if (!attrB) warnUnknownFruit(plan.fruitB, 'classifyPool.fruitB');
  } else {
    attrB = attrA;
  }

  // ── 步骤2：两果实属性不同 → 世界池（跨属混刷） ──────────────────────────────
  if (attrA && attrB && attrA !== attrB) return 'world';

  // ── 步骤3：两果实属性相同（或单刷），判断单刷/同属混刷 ──────────────────────
  const isSingleFruit = !plan.fruitB || plan.fruitA === plan.fruitB;
  const targetAttr = attrA; // 目标属性（两者相同，取任意一个）

  // 污染精灵的属性（用于系别池判断）
  const pollAttr1 = lookupAttr(spiritName);
  const pollAttr2 = lookupAttr2(spiritName);
  // 若两张表都没找到该精灵，提醒补 SPIRIT_ATTR1
  if (pollAttr1 === null && pollAttr2 === null) {
    warnUnknownSpirit(spiritName, 'classifyPool');
  }
  const matchesTargetAttr = targetAttr &&
    (pollAttr1 === targetAttr || pollAttr2 === targetAttr);

  if (isSingleFruit) {
    // ── 单刷分支 ────────────────────────────────────────────────────────────
    // i. 污染精灵是目标精灵本身（spiritA 或 spiritB）→ 家族池
    const targets = [plan.spiritA, plan.spiritB].filter(Boolean);
    if (targets.some(t => fuzzyMatch(t, spiritName))) return 'family';
    // ii. 污染精灵属性命中目标属性 → 系别池
    if (matchesTargetAttr) return 'attr';
    // iii. 其余 → 世界池
    return 'world';
  } else {
    // ── 同属混刷分支（家族池不适用）────────────────────────────────────────
    // i. 污染精灵属性命中目标属性 → 系别池（含A/B精灵自身）
    if (matchesTargetAttr) return 'attr';
    // ii. 其余 → 世界池
    return 'world';
  }
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

// ─── 三池保底派生纯函数 ───────────────────────────────────────────────────────

/**
 * 判断方案的「主池」类型。
 *   'family' → 单刷（同一精灵 / 仅填 fruitA）
 *   'attr'   → 同属混刷（fruitA 与 fruitB 同属性）
 *   'world'  → 跨属混刷（fruitA 与 fruitB 属性不同）
 */
export function getPlanMainPool(plan) {
  if (!plan) return 'family';
  const attrA = FRUIT_ATTR[plan.fruitA] ?? null;
  const attrB = plan.fruitB ? (FRUIT_ATTR[plan.fruitB] ?? null) : attrA;
  if (attrA && attrB && attrA !== attrB) return 'world';
  if (!plan.fruitB || plan.fruitA === plan.fruitB) return 'family';
  return 'attr';
}

/**
 * 从单任务 shieldBreaks 事件流派生「家族池」计数。
 * 优先读 b.pool 字段；无 pool 字段时降级用 classifyPool 重新推断（旧数据兼容）。
 */
export function computeFamilyPool(task, plan) {
  return (task?.shieldBreaks || []).filter(b => {
    // 优先读已存储的 pool 字段；降级时 original/polluted 均需推断（旧数据兼容）
    const pool = b.pool ??
      ((b.result === 'polluted' || b.result === 'original') && b.spiritName
        ? classifyPool(b.spiritName, plan)
        : null);
    return pool === 'family';
  }).length;
}

/**
 * 从当前活跃任务和已完成任务的 shieldBreaks 事件流派生三池全局计数（纯函数，随 state 变化自动派生）。
 *
 * 返回 { attrPools: { [attrId]: number }, worldPool: number }
 *   - family 池在任务级单独计算（用 computeFamilyPool），不在这里累计
 *   - 统计规则：
 *     * 所有 activeTasks 的属性池和世界池记录
 *     * completedTasks 中**尚未清零的池**的记录：
 *       - resultType === 'family'：家族池清零，但属性池和世界池记录仍需统计
 *       - resultType === 'attr'：该任务的属性池已清零，不统计属性池记录，但世界池记录仍需统计
 *       - resultType === 'world'：该任务的世界池已清零，不统计世界池记录，但属性池记录仍需统计
 *     * **跨任务全局清零**（v2 修复）：
 *       - 找到最近一次 world 出货任务的 completedAt → 该时间点（含）之前的所有
 *         world breaks 全部丢弃；activeTasks 中早于该时间的 world breaks 同样丢弃。
 *       - 按 attrId 找最近一次 attr 出货任务的 completedAt → 同 attrId 早于该时间
 *         的所有 attr breaks 全部丢弃。
 *   - 优先读 b.pool 字段；缺失时从 b.spiritName 重新推断（兼容旧数据）
 *   - 无法推断的旧记录（无 spiritName）贡献 0（极少量，可接受）
 *
 * @param {Array} activeTasks - state.activeTasks
 * @param {Array} completedTasks - state.completedTasks
 * @param {Array} plans       - 全量方案列表（PLANS + 用户自定义方案）
 */
export function computePoolCounts(activeTasks, completedTasks, plans) {
  const planMap = Object.fromEntries((plans || []).map(p => [p.id, p]));
  const attrPools = {};
  let worldPool = 0;

  // ── 1. 计算「全局清零截断点」 ─────────────────────────────────────────────
  // worldCutoff: 最近一次 world 出货任务的 completedAt 时间戳（毫秒），早于（含）
  //              该时间的所有 world breaks 都视为已被清零。
  // attrCutoffByAttr: { [attrId]: 最近一次该 attrId 出货任务的 completedAt 毫秒 }
  let worldCutoff = 0;
  const attrCutoffByAttr = {};
  for (const task of (completedTasks || [])) {
    const plan = planMap[task.planId];
    if (!plan) continue;
    const ts = task.completedAt ? new Date(task.completedAt).getTime() : 0;
    if (!ts) continue;
    if (task.resultType === 'world' && ts > worldCutoff) {
      worldCutoff = ts;
    } else if (task.resultType === 'attr') {
      const attrId = getPlanAttrId(plan);
      if (attrId && (!attrCutoffByAttr[attrId] || ts > attrCutoffByAttr[attrId])) {
        attrCutoffByAttr[attrId] = ts;
      }
    }
  }

  // ── 2. 统计 activeTasks ──────────────────────────────────────────────────
  // 活跃任务的 break 时间用 b.time（每条 shieldBreak 都带 time），早于截断点的丢弃
  for (const task of (activeTasks || [])) {
    const plan = planMap[task.planId];
    if (!plan) continue;
    const planAttrId = getPlanAttrId(plan);
    for (const b of (task.shieldBreaks || [])) {
      let pool = b.pool ?? null;
      if (!pool && (b.result === 'polluted' || b.result === 'original') && b.spiritName) {
        pool = classifyPool(b.spiritName, plan);
      }
      if (!pool && b.result === 'jelly') pool = 'world';
      if (!pool) continue;

      const bts = b.time ? new Date(b.time).getTime() : 0;
      if (pool === 'attr') {
        const cutoff = planAttrId ? (attrCutoffByAttr[planAttrId] || 0) : 0;
        if (bts && cutoff && bts <= cutoff) continue;  // 已被清零
        if (planAttrId) attrPools[planAttrId] = (attrPools[planAttrId] || 0) + 1;
      } else if (pool === 'world') {
        if (bts && worldCutoff && bts <= worldCutoff) continue;  // 已被清零
        worldPool++;
      }
    }
  }

  // ── 3. 统计 completedTasks 中尚未清零的池 ────────────────────────────────
  for (const task of (completedTasks || [])) {
    const plan = planMap[task.planId];
    if (!plan) continue;

    const resultType = task.resultType;
    const planAttrId = getPlanAttrId(plan);
    const taskTs = task.completedAt ? new Date(task.completedAt).getTime() : 0;

    for (const b of (task.shieldBreaks || [])) {
      let pool = b.pool ?? null;
      if (!pool && (b.result === 'polluted' || b.result === 'original') && b.spiritName) {
        pool = classifyPool(b.spiritName, plan);
      }
      if (!pool && b.result === 'jelly') pool = 'world';
      if (!pool) continue;

      // 单 break 时间，缺失则退化为整 task 完成时间
      const bts = b.time ? new Date(b.time).getTime() : taskTs;

      if (pool === 'attr') {
        // 自身就是 attr 出货任务 → 该任务自己的 attr 累积已清零，跳过
        if (resultType === 'attr') continue;
        // 全局截断：早于（含）最近一次同 attrId 出货时间 → 已被清零
        const cutoff = planAttrId ? (attrCutoffByAttr[planAttrId] || 0) : 0;
        if (bts && cutoff && bts <= cutoff) continue;
        if (planAttrId) attrPools[planAttrId] = (attrPools[planAttrId] || 0) + 1;
      } else if (pool === 'world') {
        if (resultType === 'world') continue;
        // 全局截断：早于（含）最近一次 world 出货时间 → 已被清零
        if (bts && worldCutoff && bts <= worldCutoff) continue;
        worldPool++;
      }
    }
  }

  return { attrPools, worldPool };
}

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

// ─── 进化家族表（图鉴点亮放宽） ──────────────────────────────────────────────
/**
 * 已确认的进化链家族列表。
 * 用户在记录异色时，只要填的精灵名属于某个家族，即视为获得了该家族在图鉴里的代表异色。
 * 例：填"柴渣虫"→ 点亮"燃薪虫"；填"贝加尔"或"贝古斯"→ 点亮"贝瑟"。
 *
 * 注意：每个家族里第一个真正在 ALL_SHINIES 中存在的名字，会被作为图鉴代表。
 * 维护时把同进化链的所有形态名都列进来即可（顺序无强约束，但通常按"图鉴名优先"排在最前）。
 */
// 重要约定：每个家族数组的【第一个名字】必须是图鉴里的代表名（即 ALL_SHINIES 中的那个）。
// findFamilyShinyName 会从前往后找第一个出现在 ALL_SHINIES 里的成员作为点亮目标，
// 所以无论用户填的是进化前还是进化后的形态，都能定位到正确的图鉴格子。
export const EVO_FAMILIES = [
  ['粉星仔', '粉耳星兔', '落陨星兔'],
  ['粉粉星', '小皮球'],
  ['贝瑟', '贝加尔', '贝古斯'],
  ['月牙雪熊'],
  ['空空颅', '夜宿颅', '夜枭'],
  ['双灯鱼', '利灯鱼'],
  // 图鉴名是「柴渣虫」（一阶），燃薪虫是其进化形
  ['柴渣虫', '燃薪虫'],
  ['嗜光嗡嗡', '窃光蚊'],
  ['大耳帽兜', '帽兜娃娃', '雪影娃娃'],
  ['护主犬', '音速犬'],
  ['恶魔狼'],
  ['格兰种子', '格兰花', '格兰球'],
  ['机械方方', '多彩方方', '立方人'],
  ['治愈兔', '红丝绒', '红绒十字'],
  ['拉特', '酷拉'],
  ['呼呼猪', '獠牙猪'],
  ['奇丽草', '奇丽叶', '奇丽花'],
  // 图鉴名是「疾光千兽」（终阶），犀角鸟/光纤兽是其前置形态
  ['疾光千兽', '光纤兽', '犀角鸟'],
  // 图鉴名是「绒仙子」（终阶），绒绒/小绒茧是其前置形态
  ['绒仙子', '小绒茧', '绒绒'],
  // 火红尾：暂未确认进化链，先单独占位以便用户输入直接命中图鉴
  ['火红尾'],
];

// 预构建一个 normalize(name) → familyIndex 的映射，加速 O(1) 查找
const _FAMILY_INDEX_BY_NAME = (() => {
  const map = new Map();
  EVO_FAMILIES.forEach((family, idx) => {
    family.forEach(member => {
      map.set(normalize(member), idx);
    });
  });
  return map;
})();

/**
 * 根据用户填写的精灵名，找到该家族在图鉴 (ALL_SHINIES) 中的代表异色名。
 * - 精确归一化匹配优先（去空格、中点等）
 * - 若没命中，再用 fuzzyMatch 兜底（容忍 1-2 字偏差，比如手抖错字）
 * - 找不到家族 / 家族里没有任何成员属于 ALL_SHINIES 时，返回 null
 *
 * @param {string} spiritName 用户填的精灵名（任意进化形态都行）
 * @returns {string|null} 该家族在 ALL_SHINIES 里的代表异色名，或 null
 */
export function findFamilyShinyName(spiritName) {
  if (!spiritName) return null;
  const nq = normalize(spiritName);
  if (!nq) return null;

  // 1) 精确归一化命中
  let familyIdx = _FAMILY_INDEX_BY_NAME.get(nq);

  // 2) fuzzyMatch 兜底
  if (familyIdx === undefined) {
    for (const [memberKey, idx] of _FAMILY_INDEX_BY_NAME.entries()) {
      if (fuzzyMatch(memberKey, spiritName)) {
        familyIdx = idx;
        break;
      }
    }
  }
  if (familyIdx === undefined) return null;

  // 在该家族里找第一个属于 ALL_SHINIES 的成员
  const family = EVO_FAMILIES[familyIdx];
  const shinySet = new Set(ALL_SHINIES);
  for (const member of family) {
    if (shinySet.has(member)) return member;
  }
  return null;
}

/**
 * 把"用户填写的精灵名"映射成"图鉴中要点亮的精灵名"。
 * - 如果输入名本身就在 ALL_SHINIES，直接返回它（不绕进化家族查）
 * - 否则尝试家族查找；找不到就返回原名（让上层按原名判断 spirits[name] 是否存在）
 */
export function resolveShinyKey(spiritName) {
  if (!spiritName) return spiritName;
  if (ALL_SHINIES.includes(spiritName)) return spiritName;
  return findFamilyShinyName(spiritName) || spiritName;
}

// ─── 精灵名 → 果实名 反查表（用于自定义方案输入精灵名时自动定位果实） ──────────
//
// 数据生成规则：
//   1) 基础映射：FRUIT_ATTR 的每个 key（"xxx果实"）去掉 "果实" 后缀 → 默认精灵名
//      （如 "小灵面果实" → "小灵面"）
//   2) 进化形态扩展：用 EVO_FAMILIES，把家族成员都映射到家族头精灵的果实
//      （如 "帽兜娃娃" / "雪影娃娃" → "大耳帽兜果实"）
//   3) 特殊别名手补：
//      - 燃了鸭 → 鸭吉吉果实（fruitGuide 已标注）
//      - 梦悠悠 → 梦游果实
//      - 各种"xx 异色 / xx（xxx的样子）"等形态名，用 normalize 后匹配
const SPIRIT_TO_FRUIT = (() => {
  const map = {};

  // 1) 基础：果实名前缀作为精灵名
  for (const fruitName of Object.keys(FRUIT_ATTR)) {
    if (fruitName.endsWith('果实')) {
      const spiritName = fruitName.slice(0, -2);
      if (spiritName) map[spiritName] = fruitName;
    }
  }

  // 2) 进化家族：家族中每个成员都指向家族头精灵的果实
  for (const family of EVO_FAMILIES) {
    if (family.length === 0) continue;
    const head = family[0];
    const headFruit = `${head}果实`;
    // 家族头果实必须在 FRUIT_ATTR 里才有意义（否则跳过本家族的进化扩展）
    if (!FRUIT_ATTR[headFruit]) continue;
    for (const member of family) {
      // 不覆盖已有映射（基础映射优先）
      if (!map[member]) map[member] = headFruit;
    }
  }

  // 3) 特殊别名手补（精灵名与果实名前缀不一致的情况）
  const ALIAS = {
    '燃了鸭':   '鸭吉吉果实',
    '梦悠悠':   '梦游果实',
    '奇丽果':   '奇丽草果实', // 同家族进化前
    '奇丽叶':   '奇丽草果实',
    '奇丽花':   '奇丽草果实',
    '格兰花':   '格兰种子果实',
    '格兰球':   '格兰种子果实',
    '红丝绒':   '治愈兔果实',
    '红绒十字': '治愈兔果实',
    '酷拉':     '拉特果实',
    '獠牙猪':   '呼呼猪果实',
    '光纤兽':   '犀角鸟果实',  // 疾光千兽家族用犀角鸟果实
    '小绒茧':   '绒绒果实',
    '帽兜娃娃': '大耳帽兜果实',
    '雪影娃娃': '大耳帽兜果实',
    '夜宿颅':   '空空颅果实',
    '夜枭':     '空空颅果实',
    '燃薪虫':   '柴渣虫果实',
    '窃光蚊':   '嗜光嗡嗡果实',
    '利灯鱼':   '双灯鱼果实',
    '贝加尔':   '贝瑟果实',
    '贝古斯':   '贝瑟果实',
    '粉耳星兔': '粉星仔果实',
    '落陨星兔': '粉星仔果实',
    '小皮球':   '粉粉星果实',
    '多彩方方': '机械方方果实',
    '立方人':   '机械方方果实',
    '音速犬':   '护主犬果实',
  };
  for (const [spirit, fruit] of Object.entries(ALIAS)) {
    if (FRUIT_ATTR[fruit]) map[spirit] = fruit;
  }

  return map;
})();

/**
 * 精灵名 → 果实名（仅用于自定义方案输入辅助）
 * @param {string} spiritName 用户输入的精灵名
 * @returns {string|null} 对应的果实名（如"小灵面" → "小灵面果实"），找不到返回 null
 */
export function getFruitBySpirit(spiritName) {
  if (!spiritName) return null;
  const trimmed = spiritName.trim();
  if (!trimmed) return null;
  // 1) 直接命中
  if (SPIRIT_TO_FRUIT[trimmed]) return SPIRIT_TO_FRUIT[trimmed];
  // 2) normalize 后查（去空格、中点）
  const nq = normalize(trimmed);
  for (const [k, v] of Object.entries(SPIRIT_TO_FRUIT)) {
    if (normalize(k) === nq) return v;
  }
  // 注：故意不再做 fuzzyMatch 兜底——
  //   该函数主要用于「输入框实时预览大图」和「自定义方案 alias 反查」两个 UI 场景，
  //   宁可显示首字头像（FruitTag 兜底），也不能因 1 字之差错配果实图（如"恶魔叮"→"恶魔狼"）。
  //   三池识别的容错由 classifyPool / lookupAttr 内部的 fuzzyMatch 单独负责，不受影响。
  return null;
}

/** 取所有已知精灵名（带对应果实名），用于输入框补全候选 */
export function getAllSpiritFruitPairs() {
  return Object.entries(SPIRIT_TO_FRUIT).map(([spirit, fruit]) => ({ spirit, fruit }));
}
