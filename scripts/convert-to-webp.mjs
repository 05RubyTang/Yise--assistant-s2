/**
 * 构建时图片优化脚本
 * 把 public/ 下所有 PNG 转成同名 WebP（透明通道完整保留）
 * 原 PNG 保留，作为不支持 WebP 的浏览器回退
 *
 * 用法：node scripts/convert-to-webp.mjs
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(__dirname, '../public');

// 跳过已经是 WebP 的文件夹，或者不需要转换的文件
const SKIP_FILES = new Set(['favicon.svg', 'sw.js', 'dashboard.html']);

function collectPngs(dir, result = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectPngs(full, result);
    } else if (/\.png$/i.test(entry.name) && !SKIP_FILES.has(entry.name)) {
      result.push(full);
    }
  }
  return result;
}

const pngs = collectPngs(PUBLIC_DIR);
console.log(`找到 ${pngs.length} 个 PNG 文件，开始转换…`);

let converted = 0, skipped = 0, saved = 0;

for (const pngPath of pngs) {
  const webpPath = pngPath.replace(/\.png$/i, '.webp');
  const pngSize = fs.statSync(pngPath).size;

  // 若 WebP 已存在且比 PNG 新，跳过
  if (fs.existsSync(webpPath)) {
    const webpMtime = fs.statSync(webpPath).mtimeMs;
    const pngMtime  = fs.statSync(pngPath).mtimeMs;
    if (webpMtime >= pngMtime) {
      skipped++;
      continue;
    }
  }

  try {
    await sharp(pngPath)
      .webp({ quality: 85, lossless: false, effort: 4 })
      .toFile(webpPath);

    const webpSize = fs.statSync(webpPath).size;
    const savePct = ((1 - webpSize / pngSize) * 100).toFixed(1);
    const rel = path.relative(PUBLIC_DIR, pngPath);
    console.log(`  ✓ ${rel}  ${(pngSize/1024).toFixed(0)}KB → ${(webpSize/1024).toFixed(0)}KB  (-${savePct}%)`);
    saved += pngSize - webpSize;
    converted++;
  } catch (err) {
    console.warn(`  ✗ 转换失败: ${path.relative(PUBLIC_DIR, pngPath)}  ${err.message}`);
  }
}

console.log(`\n完成：转换 ${converted} 个，跳过 ${skipped} 个`);
console.log(`总节省：${(saved / 1024 / 1024).toFixed(2)} MB`);
