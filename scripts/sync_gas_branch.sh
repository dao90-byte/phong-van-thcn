#!/usr/bin/env bash
set -euo pipefail

# Đồng bộ toàn bộ nội dung thư mục gas/ từ nhánh main sang nhánh phẳng 'gas'
# để extension Google Apps Script GitHub Assistant Pull 1-click không bị dính prefix thư mục con.

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

CURRENT_BRANCH="$(git branch --show-current)"
if [[ "$CURRENT_BRANCH" != "main" ]]; then
  echo "Vui lòng đứng ở nhánh main trước khi chạy script này (hiện tại: $CURRENT_BRANCH)."
  exit 1
fi

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT
cp -R gas/* "$TMP_DIR/"

if git show-ref --verify --quiet refs/heads/gas; then
  git checkout gas
  git rm -rf . >/dev/null 2>&1 || true
else
  git checkout --orphan gas
  git rm -rf . >/dev/null 2>&1 || true
fi

cp -R "$TMP_DIR"/* .
git add AdminMenu.gs Api.gs Backup.gs Config.gs Export.gs SeedData.gs Setup.gs appsscript.json Dialog*.html
if git diff --cached --quiet; then
  echo "Nhánh gas đã mới nhất, không có thay đổi."
else
  git commit -m "Sync flat Apps Script files for GitHub Assistant"
  echo "✅ Đã cập nhật nhánh 'gas' với $(ls -1 | wc -l | tr -d ' ') file phẳng ở thư mục gốc."
fi

git checkout main
