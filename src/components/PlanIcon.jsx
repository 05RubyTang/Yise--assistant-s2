/**
 * PlanIcon — 方案属性图标
 * 优先使用 iconImg（PNG），其次按 resolvePlanIconImg 推导（自定义方案的同属性/异属性图标），
 * 最后回退到 icon（emoji）
 */
import { PLANS, resolvePlanIconImg } from '../data/plans';

export default function PlanIcon({ plan, size = 28, style = {} }) {
  if (!plan) return null;
  // 推导：plan.iconImg 优先；若无则按 attrId 查 attrBase 走 resolvePlanIconImg
  let iconImg = plan.iconImg;
  if (!iconImg) {
    const attrBase = plan.attrId ? PLANS.find(p => p.id === plan.attrId) : null;
    iconImg = resolvePlanIconImg(plan, attrBase);
  }
  if (iconImg) {
    return (
      <img
        src={iconImg}
        alt={plan.type || ''}
        style={{
          width: size,
          height: size,
          objectFit: 'contain',
          display: 'block',
          ...style,
        }}
      />
    );
  }
  return (
    <span style={{ fontSize: size * 0.85, lineHeight: 1, ...style }}>
      {plan.icon}
    </span>
  );
}
