/**
 * 将方案数据统一转换为 fruits 数组（兼容新旧两种数据结构）
 * 返回格式：[{ fruit, spirit, attr? }, ...]
 *   - 新方案：直接读取 plan.fruits 数组
 *   - 旧方案：从 fruitA/spiritA + fruitB/spiritB 构建
 *
 * @param {Object} plan - 方案对象
 * @returns {Array<{fruit: string, spirit: string, attr?: string}>} 果实数组
 */
export function getPlanFruitsArray(plan) {
  if (!plan) return [];

  // 优先新字段 fruits[]（多果实方案支持）
  if (Array.isArray(plan.fruits) && plan.fruits.length > 0) {
    return plan.fruits.filter(f => f && f.fruit);
  }

  // 兼容旧字段 fruitA/fruitB（向后兼容）
  const result = [];
  if (plan.fruitA) result.push({ fruit: plan.fruitA, spirit: plan.spiritA || '' });
  if (plan.fruitB) result.push({ fruit: plan.fruitB, spirit: plan.spiritB || '' });
  return result;
}
