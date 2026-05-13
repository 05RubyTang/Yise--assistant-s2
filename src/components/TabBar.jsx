const base = import.meta.env.BASE_URL;
const TABS = [
  { id: 'home',       img: `${base}tab-home.png`,       label: '首页' },
  { id: 'plans',      img: `${base}tab-plans.png`,      label: '方案' },
  { id: 'collection', img: `${base}tab-collection.png`, label: '图鉴' },
  { id: 'profile',    img: `${base}tab-profile.png`,    label: '我的' },
];

export default function TabBar({ current, onChange }) {
  return (
    <nav
      className="tabbar"
      style={{ backgroundImage: `url(${base}tab-bg.png?v=2)` }}
    >
      {TABS.map(tab => {
            // 'history' 属于「我的」tab 的子状态，高亮 profile
            const effectiveCurrent = current === 'history' ? 'profile' : current;
            const isActive = effectiveCurrent === tab.id;
        return (
          <button
            key={tab.id}
            className={`tabbar-item${isActive ? ' active' : ''}`}
            onClick={() => onChange(tab.id)}
          >
            <div className="tabbar-icon-wrap">
              <img
                src={tab.img}
                alt={tab.label}
                className="tabbar-img"
              />
              {isActive && (
                <img
                  src={`${base}dimo-icon.png`}
                  alt=""
                  className="tabbar-dimo"
                />
              )}
            </div>
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
