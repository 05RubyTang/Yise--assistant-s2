import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './App.jsx'

// ── 注册 Service Worker（图片缓存 + 自动更新）──────────────────────────────────
// BASE_URL 自动适配 GitHub Pages 的子路径（如 /Luoke-yise-test/）
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .catch(() => {/* 注册失败静默处理，不影响页面正常运行 */});
  });

  // 监听 SW 广播：新版本激活后，等页面切到后台再刷新
  // 避免用户正在操作时被强制打断，后台刷新后回来就是新版本
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'SW_UPDATED') {
      if (document.visibilityState === 'hidden') {
        // 已在后台，直接刷新
        window.location.reload();
      } else {
        // 前台中：监听下次切到后台时刷新
        const onHide = () => {
          if (document.visibilityState === 'hidden') {
            document.removeEventListener('visibilitychange', onHide);
            window.location.reload();
          }
        };
        document.addEventListener('visibilitychange', onHide);
      }
    }
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
