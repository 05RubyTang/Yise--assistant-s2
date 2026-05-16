import { useState, useEffect, useCallback } from 'react';
import { StoreProvider, useStore } from './store';
import TabBar from './components/TabBar';
import Home from './pages/Home';
import PlanList from './pages/PlanList';
import PlanEditor from './pages/PlanEditor';
import AttrPlanDetail from './pages/AttrPlanDetail';
import Checklist from './pages/Checklist';
import Recorder from './pages/Recorder';
import Report from './pages/Report';
import Collection from './pages/Collection';
import Profile from './pages/Profile';
import ManualShinyPage from './pages/ManualShinyPage';
import FruitGuide from './pages/FruitGuide';
import SpecialForms from './pages/SpecialForms';
import CustomChecklist from './pages/CustomChecklist';
import MyCustomPlans from './pages/MyCustomPlans';
import SilhouettePattern from './components/SilhouettePattern';
import './App.css';

// 动态注入自定义字体（使用 BASE_URL 保证 GitHub Pages 路径正确）
const _base = import.meta.env.BASE_URL;
const _fontStyle = document.createElement('style');
_fontStyle.textContent = `
  @font-face {
    font-family: 'AaFengKuangYuanShiRen';
    src: url('${_base}fonts/AaFengKuangYuanShiRen.ttf') format('truetype');
    font-weight: normal;
    font-style: normal;
    font-display: swap;
  }
`;
document.head.appendChild(_fontStyle);

const TAB_PAGES = ['home', 'plans', 'collection', 'profile', 'history'];

// ─── 绑定成功全局 Toast ───────────────────────────────────────────────────────
function AuthToast() {
  const { authToast, clearAuthToast, retryOfflineNow } = useStore();

  // networkWarn 不自动消失（需用户手动点重试或关闭）；offline / syncError 10s；其他 6s
  const isWarning     = authToast?.type === 'offline' || authToast?.type === 'syncError';
  const isNetworkWarn = authToast?.type === 'networkWarn';

  useEffect(() => {
    if (!authToast) return;
    if (isNetworkWarn) return; // networkWarn 不设超时，由用户主动关闭
    const timer = setTimeout(clearAuthToast, isWarning ? 10000 : 6000);
    return () => clearTimeout(timer);
  }, [authToast, clearAuthToast, isWarning, isNetworkWarn]);

  if (!authToast) return null;

  const toastCfg = {
    bind:        { icon: '🎉', title: '邮箱绑定成功！' },
    login:       { icon: '✅', title: '登录成功，数据已恢复！' },
    switch:      { icon: '🔄', title: '已切换账号！' },
    offline:     { icon: '📴', title: '网络连接失败', sub: '已切换至本地模式，数据暂不同步' },
    syncError:   { icon: '⚠️', title: '云端同步失败', sub: '数据已保存在本地，联网后将自动重试' },
    networkWarn: { icon: '📡', title: '云端同步失败，数据保存在本地' },
  }[authToast.type] ?? { icon: '✅', title: '操作成功！' };

  function handleRetry() {
    retryOfflineNow();
    clearAuthToast();
  }

  return (
    <div
      className={`auth-toast${(isWarning || isNetworkWarn) ? ' auth-toast--warn' : ''}`}
      // networkWarn 有操作按钮，整体不响应点击关闭（避免误触）
      onClick={isNetworkWarn ? undefined : clearAuthToast}
      style={isNetworkWarn ? { cursor: 'default' } : undefined}
    >
      <div className="auth-toast-icon">{toastCfg.icon}</div>
      <div className="auth-toast-body">
        <div className="auth-toast-title">{toastCfg.title}</div>
        {!isNetworkWarn && (authToast.email
          ? <div className="auth-toast-email">{authToast.email}</div>
          : toastCfg.sub
            ? <div className="auth-toast-email">{toastCfg.sub}</div>
            : null
        )}
        {/* networkWarn 专属：重试按钮嵌在 body 内，与标题同行排列 */}
        {isNetworkWarn && (
          <button className="auth-toast-retry" onClick={handleRetry}>重试连接</button>
        )}
      </div>
      <button className="auth-toast-close" onClick={isNetworkWarn ? clearAuthToast : undefined}>✕</button>
    </div>
  );
}

function AppInner() {
  const [pageStack, setPageStack] = useState([{ name: 'home', params: {} }]);
  const current = pageStack[pageStack.length - 1];

  const navigate = useCallback((name, params = {}) => {
    if (TAB_PAGES.includes(name)) {
      setPageStack([{ name, params }]);
    } else {
      setPageStack(prev => [...prev, { name, params }]);
    }
  }, []);

  const goBack = useCallback(() => {
    setPageStack(prev => prev.length > 1 ? prev.slice(0, -1) : prev);
  }, []);

  const showTabBar = TAB_PAGES.includes(current.name);

  const renderPage = () => {
    switch (current.name) {
      case 'home':
        return <Home navigate={navigate} />;
      case 'plans':
        return <PlanList navigate={navigate} mode="library" />;
      case 'attrPlanDetail':
        return (
          <AttrPlanDetail
            planId={current.params.planId}
            navigate={navigate}
            goBack={goBack}
          />
        );
      case 'planPicker':
        return <PlanList navigate={navigate} mode="picker" goBack={goBack} />;
      case 'planEditor':
        return (
          <PlanEditor
            basePlanId={current.params.basePlanId}
            userPlanId={current.params.userPlanId}
            goBack={goBack}
          />
        );
      case 'checklist':
        return (
          <Checklist
            planId={current.params.planId}
            basePlanId={current.params.basePlanId ?? current.params.planId}
            navigate={navigate}
            goBack={goBack}
          />
        );
      case 'recorder':
      // report 时背景依然渲染 Recorder
      case 'report':
        return <Recorder planId={current.params.planId} navigate={navigate} />;
      case 'collection':
        return <Collection />;
      case 'history':
        return <Profile navigate={navigate} initialDetailTaskId={current.params.openTaskId ?? null} />;
      case 'profile':
        return <Profile navigate={navigate} />;
      case 'manualShiny':
        return <ManualShinyPage goBack={goBack} />;
      case 'fruitGuide':
        return <FruitGuide goBack={goBack} />;
      case 'specialForms':
        return <SpecialForms goBack={goBack} />;
      case 'customChecklist':
        return <CustomChecklist navigate={navigate} goBack={goBack} saveOnly={!!current.params.saveOnly} />;
      case 'myCustomPlans':
        return <MyCustomPlans goBack={goBack} navigate={navigate} />;
      default:
        return <Home navigate={navigate} />;
    }
  };

  return (
    <div className="app-content">
      {/* 剪影纹样背景层，position:absolute 被 app-content overflow:hidden 裁剪 */}
      <SilhouettePattern />
      <AuthToast />
      <div className="page-container" style={{ position: 'relative', zIndex: 1 }}>
        {renderPage()}
      </div>
      {/* Report 弹窗：直接挂在 app-content 上，position:absolute 覆盖全屏，Recorder 在背景可见 */}
      {current.name === 'report' && (
        <Report
          planId={current.params.planId}
          spiritName={current.params.spiritName}
          resultType={current.params.resultType}
          navigate={navigate}
        />
      )}
      {showTabBar && (
        <>
          <div style={{
            textAlign: 'center',
            fontSize: '10px',
            color: 'rgba(120,100,80,0.6)',
            padding: '2px 8px',
            lineHeight: 1.4,
            background: 'transparent',
          }}>
            精灵图片来源：
            <a
              href="https://wiki.biligame.com/rocom"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'rgba(100,80,160,0.7)', textDecoration: 'none' }}
            >
              洛克王国手游BWIKI
            </a>
            ，遵循{' '}
            <a
              href="https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hans"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'rgba(100,80,160,0.7)', textDecoration: 'none' }}
            >
              CC BY-NC-SA 4.0
            </a>
          </div>
          <TabBar current={current.name} onChange={(tab) => navigate(tab)} />
        </>
      )}
      {/* Portal 挂载点：弹窗 createPortal 指向此节点，
          使其在桌面端被约束在样机壳内，手机端保持全屏行为不变 */}
      <div id="modal-root" />
    </div>
  );
}

const bgUrl = `url(${import.meta.env.BASE_URL}bg.webp)`;

export default function App() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 500);

  useEffect(() => {
    document.body.style.backgroundImage = bgUrl;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundAttachment = 'fixed';
    document.body.style.backgroundRepeat = 'no-repeat';
    return () => { document.body.style.backgroundImage = ''; };
  }, []);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 500);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const inner = (
    <StoreProvider>
      <AppInner />
    </StoreProvider>
  );

  if (isMobile) {
    return (
      <div className="mobile-wrapper" style={{ backgroundImage: bgUrl }}>
        {inner}
      </div>
    );
  }

  return (
    <div className="mockup-wrapper" style={{ backgroundImage: bgUrl }}>
      <div className="mockup-phone">
        <div className="mockup-screen">{inner}</div>
      </div>
    </div>
  );
}
