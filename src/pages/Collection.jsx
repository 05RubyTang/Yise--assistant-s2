import { useState } from 'react';
import { useStore } from '../store';
import { PLANS, ATTR_SHINIES, SEASON_SHINIES, findPlansForSpirit, SPECIAL_FORMS } from '../data/plans';
import SpiritAvatar from '../components/SpiritAvatar';
import PlanIcon from '../components/PlanIcon';
import { getWikiSpiritImg } from '../data/spirits-wiki';
import { getWikiFruitImg } from '../data/fruits-wiki';

const base = import.meta.env.BASE_URL;

// 精灵名 → 本地图片文件名映射
const SPIRIT_IMG_FILE = { '柴渣虫': '燃薪虫' };

// 全部精灵列表（保留顺序：先赛季奇遇，再普通异色，各自内部去重）
const ALL_SPIRITS = [
  ...SEASON_SHINIES,
  ...ATTR_SHINIES,
];

// 判断某精灵属于哪类
const SEASON_SET = new Set(SEASON_SHINIES);
function getSpiritTag(name) {
  return SEASON_SET.has(name) ? 'adventure' : 'attr';
}

function getSpiritRecords(name, state) {
  return (state.completedTasks || [])
    .filter(t => t.resultSpirit === name && t.resultType !== 'abandoned')
    .map(t => ({
      taskId: t.id,
      planId: t.planId,
      shieldBreakCount: t.shieldBreakCount,
      ballsUsed: t.ballsUsed,
      completedAt: t.completedAt,
    }));
}

// 支持 wiki 兜底的果实图卡
function FruitImg({ name, size = 60 }) {
  const localSrc = `${base}fruits/${encodeURIComponent(name)}.png?v=3`;
  const rawWikiSrc = getWikiFruitImg(name);
  // v=3 用于破除浏览器对旧 wiki CDN URL 的缓存（果实图标 URL 有过变更）
  const wikiSrc = rawWikiSrc ? `${rawWikiSrc}?v=3` : null;
  const [src, setSrc] = useState(localSrc);
  const [triedWiki, setTriedWiki] = useState(false);

  const handleError = (e) => {
    if (!triedWiki && wikiSrc) { setTriedWiki(true); setSrc(wikiSrc); }
    else { e.target.style.opacity = 0.15; }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
      <div style={{
        width: size, height: size, borderRadius: 10,
        background: '#F7F7F7', border: '1.5px solid rgba(103,93,83,0.14)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}>
        <img src={src} alt={name}
          style={{ width: size - 8, height: size - 8, objectFit: 'contain' }}
          onError={handleError} />
      </div>
      <span style={{
        fontSize: 9, color: 'var(--text-muted)', fontWeight: 600,
        textAlign: 'center', maxWidth: size + 8,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>{name}</span>
    </div>
  );
}

// 支持 wiki 兜底的精灵图卡
function SpiritImg({ name, size = 60 }) {
  const fileName = SPIRIT_IMG_FILE[name] || name;
  const localSrc = `${base}spirits/${encodeURIComponent(fileName)}.png?v=2`;
  const wikiSrc = getWikiSpiritImg(name);
  const [src, setSrc] = useState(localSrc);
  const [triedWiki, setTriedWiki] = useState(false);

  const handleError = (e) => {
    if (!triedWiki && wikiSrc) { setTriedWiki(true); setSrc(wikiSrc); }
    else { e.target.style.opacity = 0.15; }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
      <div style={{
        width: size, height: size, borderRadius: 10,
        background: '#F7F7F7', border: '1.5px solid rgba(103,93,83,0.14)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}>
        <img src={src} alt={name}
          style={{ width: size - 8, height: size - 8, objectFit: 'contain' }}
          onError={handleError} />
      </div>
      <span style={{
        fontSize: 9, color: 'var(--text-muted)', fontWeight: 600,
        textAlign: 'center', maxWidth: size + 8,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>{name}</span>
    </div>
  );
}

// ─── 攻略卡（升级版：区分属性池/单刷池）──────────────────────────────────────
function PlanInfo({ plan }) {
  const relatedForms = SPECIAL_FORMS.filter(f => f.planIds.includes(plan.id));
  const isSeasonPlan = !!plan.season;
  const isNoShiny = !!plan.noShiny;

  // 判断是否为单刷池（无 fruitB）还是属性池（有 fruitB）
  const isSingleFruit = !plan.fruitB;

  // = 右侧展示的精灵：noShiny 方案用 poolShinies，普通方案用 shinies
  const visibleShinies = isNoShiny
    ? (plan.poolShinies || [])
    : (plan.shinies || []);

  // 标签文字与颜色
  const poolLabel = isSeasonPlan
    ? '赛季单刷池'
    : isNoShiny ? '积累属系池'
    : isSingleFruit ? '单刷池' : '属性池';
  const poolColor = isSeasonPlan
    ? { bg: 'rgba(244,143,177,0.12)', border: 'rgba(244,143,177,0.4)', text: '#C0568A' }
    : isNoShiny
      ? { bg: 'rgba(255,193,7,0.1)', border: 'rgba(255,193,7,0.35)', text: '#9A7208' }
      : isSingleFruit
        ? { bg: 'rgba(91,156,246,0.1)', border: 'rgba(91,156,246,0.3)', text: '#4A80D0' }
        : { bg: 'rgba(103,170,92,0.1)', border: 'rgba(103,170,92,0.3)', text: '#4A8C40' };

  return (
    <div style={{
      background: 'var(--card-inner)', borderRadius: 12,
      padding: '10px 12px 12px', marginBottom: 8,
    }}>
      {/* 顶部：属性图标 + 方案名 + 池子类型标签 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
        <div style={{
          width: 26, height: 26, borderRadius: 6, background: '#F0E8D5',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, overflow: 'hidden', padding: 3,
        }}>
          <PlanIcon plan={plan} size={18} />
        </div>
        <span style={{ fontSize: 13, fontWeight: 800, flexShrink: 0 }}>
          {plan.season ? (plan.type || '') : `${plan.label || plan.type || '自定义'}方案`}
        </span>
        {/* 池子类型 tag */}
        <span style={{
          fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 20,
          background: poolColor.bg, color: poolColor.text,
          border: `1px solid ${poolColor.border}`, flexShrink: 0,
        }}>{poolLabel}</span>

        {/* 积累属系池方案专属：回顾价格高 tag */}
        {isNoShiny && (
          <span style={{
            fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 20,
            background: 'rgba(255,193,7,0.18)', color: '#B8860B',
            border: '1px solid rgba(255,193,7,0.5)', flexShrink: 0,
          }}>回顾价格高</span>
        )}

        {/* 同池精灵文字提示（非赛季、非单刷、非积累属系池方案）*/}
        {!isSeasonPlan && !plan.singleSpirit && !isNoShiny && visibleShinies.length > 0 && (
          <span style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.4 }}>
            同池：{plan.shinies.join('、')}
          </span>
        )}
      </div>

      {/* 果实公式：fruitA [+ fruitB] ＝ 精灵列表 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'nowrap', overflowX: 'auto', paddingBottom: 2 }}>
        {plan.fruitA && <FruitImg name={plan.fruitA} size={56} />}
        {plan.fruitB && (
          <>
            <span style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-muted)', flexShrink: 0 }}>+</span>
            <FruitImg name={plan.fruitB} size={56} />
          </>
        )}
        <span style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-muted)', flexShrink: 0 }}>＝</span>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'nowrap' }}>
          {visibleShinies.length > 0
            ? visibleShinies.map(n => <SpiritImg key={n} name={n} size={56} />)
            : <span style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                {isNoShiny ? '积累属系池权重' : (plan.shinies?.join('、') || '—')}
              </span>
          }
        </div>
      </div>

      {/* 赛季庇护所 */}
      {plan.season && plan.sanctuary && (
        <div style={{
          marginTop: 10, padding: '7px 10px', borderRadius: 8,
          background: 'rgba(91,156,246,0.07)', border: '1px solid rgba(91,156,246,0.2)',
          fontSize: 11, lineHeight: 1.6, color: 'var(--text-muted)',
        }}>
          <span style={{ color: '#5B9CF6', fontWeight: 800 }}>📍 推荐放置庇护所：</span>
          <span style={{ color: 'var(--text)', fontWeight: 700 }}>{plan.sanctuary}</span>
          {plan.sanctuaryTip && (
            <span style={{ color: 'var(--text-muted)' }}>（{plan.sanctuaryTip}）</span>
          )}
        </div>
      )}

      {/* 特殊形态庇护所 */}
      {relatedForms.map((form, i) => (
        <div key={i} style={{
          marginTop: 8, padding: '8px 10px', borderRadius: 8,
          background: 'rgba(156,111,224,0.06)', border: '1px solid rgba(156,111,224,0.22)',
          fontSize: 11, lineHeight: 1.7,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3, flexWrap: 'wrap' }}>
            <span style={{
              fontSize: 9, fontWeight: 800, padding: '1px 6px', borderRadius: 6,
              background: 'rgba(156,111,224,0.15)', color: '#9C6FE0',
              border: '1px solid rgba(156,111,224,0.3)',
            }}>🌰 特殊形态</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#2B2A2E' }}>{form.spirit}</span>
            <span style={{ color: 'var(--text-muted)' }}>→</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#9C6FE0' }}>{form.hiddenForm}</span>
          </div>
          <div style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
            <span style={{ color: '#5B9CF6', fontWeight: 700 }}>📍 推荐庇护所：</span>
            <span style={{ color: 'var(--text)', fontWeight: 700 }}>{form.sanctuary}</span>
          </div>
          <div style={{ color: 'var(--text-muted)', marginTop: 2 }}>
            将{form.acornDesc}放入此底护所，可解锁隐藏形态
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── 获取记录行 ───────────────────────────────────────────────────────────────
function RecordRow({ rec, index }) {
  const { dispatch } = useStore();
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState(rec.ballsUsed != null ? String(rec.ballsUsed) : '');
  const plan = PLANS.find(p => p.id === rec.planId);

  const handleSave = () => {
    const val = inputVal.trim();
    const num = val ? parseInt(val, 10) : null;
    dispatch({
      type: 'UPDATE_COMPLETED_BALLS',
      taskId: rec.taskId,
      ballsUsed: (num != null && !isNaN(num) && num >= 0) ? num : null,
    });
    setEditing(false);
  };

  if (editing) {
    return (
      <div style={{ padding: '10px 0', borderTop: '1px solid var(--divider)' }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          {plan && <PlanIcon plan={plan} size={14} />}
          第{index + 1}次 · {plan?.type} · {rec.shieldBreakCount}次触发污染
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="number" inputMode="numeric"
            value={inputVal} onChange={e => setInputVal(e.target.value)}
            placeholder="消耗球数" autoFocus
            className="input-field" style={{ flex: 1 }} />
          <button onClick={handleSave} style={{
            flexShrink: 0, padding: '10px 14px', border: '2px solid #2B2A2E',
            borderRadius: 'var(--radius-sm)', background: '#2B2A2E', color: '#FBF7EC',
            fontSize: 12, fontWeight: 800, fontFamily: 'var(--font-body)', cursor: 'pointer',
            boxShadow: '0 2px 0 #111014',
          }}>保存</button>
          <button onClick={() => setEditing(false)} style={{
            flexShrink: 0, padding: '10px 10px', border: '1.5px solid rgba(103,93,83,0.3)',
            borderRadius: 'var(--radius-sm)', background: '#FBF7EC',
            color: 'var(--text-light)', fontSize: 12, fontFamily: 'var(--font-body)', cursor: 'pointer',
          }}>取消</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      padding: '10px 0', borderTop: '1px solid var(--divider)',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-light)' }}>
          {plan && <PlanIcon plan={plan} size={14} />}
          第{index + 1}次 · {plan?.type}
        </span>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--cta)' }}>
          {rec.shieldBreakCount}次触发污染
        </span>
        {rec.ballsUsed != null
          ? <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>{rec.ballsUsed} 咕噜球</span>
          : <span style={{ fontSize: 11, fontStyle: 'italic', color: 'rgba(160,144,128,0.7)' }}>待输入消耗咕噜球数量</span>
        }
      </div>
      <button onClick={() => setEditing(true)} style={{
        flexShrink: 0, border: '1px solid rgba(103,93,83,0.25)', background: 'var(--card-inner)',
        borderRadius: 4, padding: '4px 10px', fontSize: 10,
        color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'var(--font-body)',
      }}>编辑</button>
    </div>
  );
}

// ─── 筛选项配置 ───────────────────────────────────────────────────────────────
const FILTERS = [
  { key: 'all',       label: '全部' },
  { key: 'obtained',  label: '已获得' },
  { key: 'missing',   label: '未获得' },
  { key: 'adventure', label: '奇遇异色' },
  { key: 'attr',      label: '普通异色' },
];

// ─── 主页面 ───────────────────────────────────────────────────────────────────
export default function Collection() {
  const { state } = useStore();
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);

  // 统计
  const totalCount  = ALL_SPIRITS.length;
  const obtainedCount = ALL_SPIRITS.filter(n => state.spirits[n]?.obtained).length;
  const pct = totalCount > 0 ? Math.round((obtainedCount / totalCount) * 100) : 0;

  const attrObtained    = ATTR_SHINIES.filter(n => state.spirits[n]?.obtained).length;
  const seasonObtained  = SEASON_SHINIES.filter(n => state.spirits[n]?.obtained).length;

  // 按筛选条件过滤
  const visibleSpirits = ALL_SPIRITS.filter(name => {
    const obtained = !!state.spirits[name]?.obtained;
    const tag = getSpiritTag(name);
    if (filter === 'obtained')  return obtained;
    if (filter === 'missing')   return !obtained;
    if (filter === 'adventure') return tag === 'adventure';
    if (filter === 'attr')      return tag === 'attr';
    return true;
  });

  const selectedPlans   = selected ? findPlansForSpirit(selected) : [];
  const selectedRecords = selected ? getSpiritRecords(selected, state) : [];
  const selectedTag     = selected ? getSpiritTag(selected) : null;

  return (
    <div style={{ paddingBottom: 28 }}>

      {/* ── 收集进度条（含标题+说明） ── */}
      <div style={{ margin: '16px 16px 14px', padding: '12px 14px', background: 'var(--card)', border: '1.5px solid var(--card-border)', borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-card)' }}>
        {/* 活动标题 + 说明 */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--text)', fontFamily: 'var(--font-display)', marginBottom: 3 }}>
            S1 赛季 · 异色&奇遇
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.7 }}>
            属性果实循环产出异色精灵；赛季奇遇精灵需完成第六章赛季任务后刷取
          </div>
        </div>
        {/* 分隔线 */}
        <div style={{ height: 1, background: 'var(--divider)', margin: '0 0 10px' }} />
        {/* 总进度 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 7 }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text)' }}>收集进度</span>
          <span style={{ fontSize: 13, fontWeight: 900, color: obtainedCount === totalCount ? 'var(--success)' : 'var(--cta)', fontFamily: 'var(--font-display)' }}>
            {obtainedCount === totalCount ? '✓ 全收！' : `${obtainedCount} / ${totalCount}`}
          </span>
        </div>
        <div style={{ height: 7, borderRadius: 99, background: 'rgba(103,93,83,0.1)', overflow: 'hidden', marginBottom: 10 }}>
          <div style={{
            height: '100%', borderRadius: 99,
            width: `${pct}%`,
            background: obtainedCount === totalCount
              ? 'var(--success)'
              : 'linear-gradient(90deg, var(--cta), #E8733A)',
            transition: 'width 0.5s ease',
          }} />
        </div>
        {/* 分类小计 */}
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{
              fontSize: 8, fontWeight: 800, padding: '1px 5px', borderRadius: 20,
              background: 'rgba(244,143,177,0.13)', color: '#C0568A',
              border: '1px solid rgba(244,143,177,0.35)',
            }}>奇遇异色</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>
              {seasonObtained}/{SEASON_SHINIES.length}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{
              fontSize: 8, fontWeight: 800, padding: '1px 5px', borderRadius: 20,
              background: 'rgba(103,170,92,0.12)', color: '#4A8C40',
              border: '1px solid rgba(103,170,92,0.3)',
            }}>普通异色</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>
              {attrObtained}/{ATTR_SHINIES.length}
            </span>
          </div>
        </div>
      </div>

      {/* ── 筛选栏 ── */}
      <div style={{
        display: 'flex', gap: 6, padding: '0 16px 12px',
        overflowX: 'auto', scrollbarWidth: 'none',
      }}>
        {FILTERS.map(f => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                flexShrink: 0,
                padding: '5px 12px',
                border: active ? '2px solid var(--text)' : '1.5px solid var(--divider)',
                borderRadius: 20,
                background: active ? 'var(--text)' : 'var(--card)',
                color: active ? 'var(--bg)' : 'var(--text-muted)',
                fontSize: 12, fontWeight: active ? 800 : 600,
                fontFamily: 'var(--font-body)',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >{f.label}</button>
          );
        })}
      </div>

      {/* ── 精灵图鉴网格 ── */}
      {visibleSpirits.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)', fontSize: 13 }}>
          暂无符合条件的精灵
        </div>
      ) : (
        <div className="collection-grid">
          {visibleSpirits.map(name => {
            const isObtained = !!state.spirits[name]?.obtained;
            const tag = getSpiritTag(name);
            return (
              <div
                key={name}
                className="collection-item"
                onClick={() => setSelected(name)}
                style={{ position: 'relative' }}
              >
                {/* 精灵立绘（未获得灰阶）*/}
                <div style={{ position: 'relative', width: 58, height: 58, flexShrink: 0 }}>
                  <SpiritAvatar
                    name={name}
                    obtained={isObtained}
                    size={58}
                    showName={false}
                    bare
                  />
                  {/* 已获得 ✓ 角标 */}
                  {isObtained && (
                    <span style={{
                      position: 'absolute', bottom: 0, right: 0,
                      fontSize: 9, fontWeight: 900, lineHeight: 1,
                      background: '#4B9C46', color: '#fff',
                      borderRadius: '50%', width: 15, height: 15,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>✓</span>
                  )}
                  {/* 未获得 锁 图标 */}
                  {!isObtained && (
                    <span style={{
                      position: 'absolute', bottom: 0, right: 0,
                      fontSize: 9, lineHeight: 1,
                      background: 'rgba(43,42,46,0.55)', color: 'rgba(255,255,255,0.8)',
                      borderRadius: '50%', width: 15, height: 15,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>🔒</span>
                  )}
                </div>

                {/* 精灵名 */}
                <div style={{
                  fontSize: 10, fontWeight: 800,
                  color: isObtained ? 'var(--text)' : 'var(--text-muted)',
                  textAlign: 'center', lineHeight: 1.2,
                  width: '100%', overflow: 'hidden',
                  textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  padding: '0 2px',
                }}>{name}</div>

                {/* 类型小 tag */}
                <span style={{
                  fontSize: 8, fontWeight: 700,
                  padding: '1px 5px', borderRadius: 20,
                  ...(tag === 'adventure'
                    ? { background: 'rgba(244,143,177,0.15)', color: '#C0568A', border: '1px solid rgba(244,143,177,0.4)' }
                    : { background: 'rgba(103,170,92,0.13)', color: '#4A8C40', border: '1px solid rgba(103,170,92,0.3)' }
                  ),
                }}>
                  {tag === 'adventure' ? '奇遇' : '异色'}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* ── 精灵详情弹窗 ── */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-content modal-content--fixed" onClick={e => e.stopPropagation()}>
            {/* 弹窗把手（固定在顶部，不随内容滚动）*/}
            <div style={{ flexShrink: 0, padding: '0 16px', position: 'relative' }}>
              <div className="modal-handle" />
              <button
                onClick={() => setSelected(null)}
                style={{
                  position: 'absolute', top: -2, right: 16,
                  border: '1.5px solid rgba(103,93,83,0.3)', background: 'var(--card-inner)',
                  borderRadius: '50%', width: 28, height: 28, fontSize: 14,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--text-light)', cursor: 'pointer', padding: 0, flexShrink: 0,
                }}
              >✕</button>
            </div>

            {/* 可滚动内容区（弹窗外框固定，只有此区域滚动）*/}
            <div className="modal-body">
              {/* 头部：头像 + 名字 + 状态 + tag */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, paddingRight: 36 }}>
                <SpiritAvatar name={selected} obtained={state.spirits[selected]?.obtained} size={60} showName={false} />
                <div>
                  <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 5, fontFamily: 'var(--font-display)' }}>
                    {selected}
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* 获取状态 */}
                    <span style={{
                      display: 'inline-block', fontSize: 11, fontWeight: 700,
                      padding: '2px 10px', borderRadius: 20,
                      ...(state.spirits[selected]?.obtained
                        ? { background: 'var(--success-dim)', color: 'var(--success)', border: '1.5px solid rgba(75,156,70,0.3)' }
                        : { background: 'var(--card-inner)', color: 'var(--text-muted)', border: '1px solid var(--divider)' })
                    }}>
                      {state.spirits[selected]?.obtained ? '✓ 已获得' : '🔒 未获得'}
                    </span>
                    {/* 类型 tag */}
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                      ...(selectedTag === 'adventure'
                        ? { background: 'rgba(244,143,177,0.15)', color: '#C0568A', border: '1px solid rgba(244,143,177,0.4)' }
                        : { background: 'rgba(103,170,92,0.13)', color: '#4A8C40', border: '1px solid rgba(103,170,92,0.3)' }
                      ),
                    }}>
                      {selectedTag === 'adventure' ? '赛季奇遇' : '赛季异色'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 刷取攻略标题 */}
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-light)', marginBottom: 8, letterSpacing: 0.5 }}>
                刷取攻略
              </div>

              {/* 所有关联方案：积累属系池方案优先 */}
              {selectedPlans.length > 0
                ? [...selectedPlans]
                    .sort((a, b) => (b.noShiny ? 1 : 0) - (a.noShiny ? 1 : 0))
                    .map(plan => <PlanInfo key={plan.id} plan={plan} />)
                : <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: 12 }}>暂无攻略数据</div>
              }

              {/* 获取记录 */}
              {selectedRecords.length > 0 && (
                <>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-light)', margin: '12px 0 4px', letterSpacing: 0.5 }}>
                    获取记录
                  </div>
                  {selectedRecords.map((rec, i) => (
                    <RecordRow key={rec.taskId} rec={rec} index={i} />
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
