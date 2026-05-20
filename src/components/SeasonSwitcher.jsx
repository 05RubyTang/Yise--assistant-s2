import { useStore } from '../store';
import { SEASON_LIST } from '../data/seasons';

const base = import.meta.env.BASE_URL;

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
      display: 'inline-flex',
      gap: 6,
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
              flex: '0 0 auto',
              whiteSpace: 'nowrap',
              padding: '7px 12px',
              border: 'none',
              borderRadius: 8,
              background: isActive
                ? isHistorical
                  ? 'linear-gradient(135deg, #8B7355 0%, #675D53 100%)' // S1 历史赛季：棕色
                  : 'linear-gradient(135deg, #E8733A 0%, #D85D28 100%)' // S2 当前赛季：橙色
                : 'transparent',
              color: isActive ? '#fff' : 'var(--text)',
              fontSize: 12,
              fontWeight: isActive ? 700 : 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              opacity: isActive ? 1 : 0.6,
              boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.12)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
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
            <img
              src={season.id === 'S1' ? `${base}s1-icon.png` : `${base}s2-icon.png`}
              alt={season.id}
              style={{ width: 22, height: 22, objectFit: 'contain', flexShrink: 0 }}
            />

            {/* 赛季标签 */}
            <span>{season.label}</span>

          </button>
        );
      })}
    </div>
  );
}
