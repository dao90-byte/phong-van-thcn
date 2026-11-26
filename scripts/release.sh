#!/usr/bin/env bash
set -euo pipefail

# 1 lệnh phát hành duy nhất cho dự án v3:
# 1) Chạy toàn bộ unit test (Backend GAS + Logic trình duyệt) & kiểm tra cú pháp JS
# 2) Kiểm tra không sót danh xưng 'bạn' trong docs/ và gas/
# 3) Đồng bộ đúng 9 file phẳng từ gas/ sang nhánh 'gas' cho Google Apps Script GitHub Assistant
# 4) Nếu truyền cờ --push thì đẩy cả 'main' và 'gas' lên GitHub

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

JSC="/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc"
PUSH_FLAG="${1:-}"

echo "=== 0. Đồng bộ bản Web độc lập docs/admin.html từ gas/CommandCenter.html ==="
python3 - <<'PY'
from pathlib import Path
src = Path("gas/CommandCenter.html").read_text(encoding="utf-8")
out = src.replace(
    '  <base target="_top">',
    '  <!-- Bản Web độc lập (GitHub Pages) đồng bộ tự động từ gas/CommandCenter.html -->\n  <link rel="manifest" href="manifest.json">\n  <link rel="icon" type="image/svg+xml" href="icon.svg">\n  <meta name="theme-color" content="#0f5257">\n  <meta name="apple-mobile-web-app-capable" content="yes">'
).replace(
    '  <!-- Dữ liệu khởi tạo được Apps Script nhúng thẳng lúc mở hộp thoại -> 0ms chờ tải -->\n  <script id="thcn-bootstrap" type="application/json"><?!= initialSnapshotJson ?></script>',
    '  <script src="config.js"></script>'
)
assert "<?!=" not in out and "initialSnapshotJson" not in out, "Lỗi đồng bộ docs/admin.html: còn sót thẻ template Apps Script!"
Path("docs/admin.html").write_text(out, encoding="utf-8")
print("✅ Đã đồng bộ docs/admin.html từ gas/CommandCenter.html")
PY

echo "=== 1. Chạy kiểm thử tự động (GAS v3 + Client Logic) ==="
"$JSC" tests/test_gas.js
"$JSC" tests/test_client_logic.js
"$JSC" -e "checkSyntax('docs/config.js'); checkSyntax('docs/logic.js'); checkSyntax('docs/app.js'); print('✅ Syntax client JS OK');"

echo "=== 2. Kiểm tra danh xưng anh/chị ==="
if grep -rn -i "bạn" docs/ gas/ >/dev/null 2>&1; then
  echo "❌ Phát hiện còn chữ 'bạn' trong docs/ hoặc gas/:"
  grep -rn -i "bạn" docs/ gas/
  exit 1
fi
echo "✅ 0 lỗi danh xưng trong docs/ và gas/"

CURRENT_BRANCH="$(git branch --show-current)"
if [[ "$CURRENT_BRANCH" != "main" ]]; then
  echo "❌ Vui lòng đứng ở nhánh main trước khi đồng bộ (hiện tại: $CURRENT_BRANCH)."
  exit 1
fi

echo "=== 3. Đồng bộ đúng 9 file phẳng sang nhánh 'gas' ==="
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT
cp gas/appsscript.json gas/*.gs gas/*.html "$TMP_DIR/"

if git show-ref --verify --quiet refs/heads/gas; then
  git checkout gas >/dev/null
  git rm -rf . >/dev/null 2>&1 || true
else
  git checkout --orphan gas >/dev/null
  git rm -rf . >/dev/null 2>&1 || true
fi

cp "$TMP_DIR"/* .
git add appsscript.json Core.gs SeedData.gs Setup.gs ClientApi.gs ExportEngine.gs CommandCenterApi.gs MenuAndBackup.gs CommandCenter.html

if git diff --cached --quiet; then
  echo "ℹ️ Nhánh 'gas' đã mới nhất."
else
  git commit -m "Sync v3 flat Apps Script bundle (9 files)"
  echo "✅ Đã đồng bộ nhánh 'gas' (9 file phẳng ở thư mục gốc)."
fi

git checkout main >/dev/null

echo "=== Danh sách file trên nhánh 'gas' ==="
git ls-tree -r --name-only gas

if [[ "$PUSH_FLAG" == "--push" ]]; then
  echo "=== 4. Đẩy nhánh main và gas lên GitHub ==="
  git push origin main gas
  echo "✅ Đã đẩy cả main và gas lên GitHub!"
fi
