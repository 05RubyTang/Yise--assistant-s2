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
        const isActive = current === tab.id;
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
