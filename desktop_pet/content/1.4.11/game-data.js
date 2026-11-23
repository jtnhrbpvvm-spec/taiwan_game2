// JSON 和圖集共用官方資料版本，避免改版後把新版圖示索引配到舊圖。
function assetRequest(relPath, versions = {}) {
  const key = relPath.startsWith('data/') ? relPath.slice(5) : relPath === 'icons/items.webp' ? 'icons.json' : undefined;
  const revision = key && versions[key];
  if (!revision || !/^[A-Za-z0-9_-]{1,128}$/.test(revision)) return { url: relPath, cachePath: relPath };
  return { url: `${relPath}?v=${encodeURIComponent(revision)}`, cachePath: `versions/${revision}/${relPath}` };
}

module.exports = { assetRequest };
