import { useStore } from '../store';
import { SEASON_LIST } from '../data/seasons';

/**
 * 赛季切换器组件
 * 用于在 S1「暗夜时光」和 S2「马戏团奇旅」之间切换
 */
export default function SeasonSwitcher({ style }) {
  const { state, dispatch } = useStore();
  const currentSeason = state.currentSeason || 'S2';

  const handleSwitch = (seasonId) => {
    if (seasonId === currentSeason) return;
    dispatch({ type: 'SWITCH_SEASON', season: seasonId });
  };

  return (
    <div style={{
      display: 'flex',
      gap: 8,
      padding: '8px 16px',
      background: '#FAFAFA',
      borderRadius: 12,
      border: '1px solid rgba(103,93,83,0.1)',
      ...style,
    }}>
      {SEASON_LIST.map(season => {
        const isActive = season.id === currentSeason;
        const isHistorical = season.isHistorical;

        return (
          <button
            key={season.id}
            onClick={() => handleSwitch(season.id)}
            style={{
              flex: 1,
              padding: '10px 16px',
              border: 'none',
              borderRadius: 8,
              background: isActive
                ? isHistorical
                  ? 'linear-gradient(135deg, #8B7355 0%, #675D53 100%)' // S1 历史赛季：棕色
                  : 'linear-gradient(135deg, #E8733A 0%, #D85D28 100%)' // S2 当前赛季：橙色
                : 'transparent',
              color: isActive ? '#fff' : 'var(--text)',
              fontSize: 13,
              fontWeight: isActive ? 600 : 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              opacity: isActive ? 1 : 0.6,
              boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.12)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
            onMouseEnter={e => {
              if (!isActive) {
                e.currentTarget.style.opacity = '0.8';
                e.currentTarget.style.background = 'rgba(103,93,83,0.05)';
              }
            }}
            onMouseLeave={e => {
              if (!isActive) {
                e.currentTarget.style.opacity = '0.6';
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            {/* 赛季图标 */}
            <span style={{ fontSize: 16 }}>
              {season.id === 'S1' ? '🌙' : '🎪'}
            </span>

            {/* 赛季标签 */}
            <span>{season.label}</span>

            {/* 历史赛季标记 */}
            {isHistorical && !isActive && (
              <span style={{
                fontSize: 10,
                padding: '2px 6px',
                borderRadius: 4,
                background: 'rgba(103,93,83,0.1)',
                color: 'var(--text-muted)',
              }}>
                历史
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
