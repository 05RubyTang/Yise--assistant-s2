/**
 * 赛季数据配置
 * 用于区分 S1「暗夜时光」和 S2「狂欢怪谈」赛季
 */

export const SEASONS = {
  S1: {
    id: 'S1',
    name: '暗夜时光',
    label: 'S1 暗夜时光',
    desc: 'S1 赛季异色精灵（历史赛季）',
    startDate: '2024-01-01',  // 根据实际上线时间调整
    endDate: null,  // S1 结束时间待定
    isActive: false,  // S2 上线后设为 false
    isHistorical: true,  // 标记为历史赛季
  },
  S2: {
    id: 'S2',
    name: '狂欢怪谈',
    label: 'S2 狂欢怪谈',
    desc: 'S2 赛季异色精灵（当前赛季）',
    startDate: '2026-05-15',  // 根据实际上线时间调整
    endDate: null,
    isActive: true,  // 当前赛季
    isHistorical: false,
  },
};

/**
 * 默认赛季（新用户默认显示 S2，老用户根据存储判断）
 */
export const DEFAULT_SEASON = 'S2';

/**
 * 赛季列表（用于切换器）
 */
export const SEASON_LIST = [
  SEASONS.S2,  // 当前赛季在前
  SEASONS.S1,  // 历史赛季在后
];

/**
 * 根据赛季 ID 获取赛季信息
 */
export function getSeasonById(seasonId) {
  return SEASONS[seasonId] || SEASONS.S2;
}

/**
 * 判断是否为历史赛季
 */
export function isHistoricalSeason(seasonId) {
  return SEASONS[seasonId]?.isHistorical || false;
}
