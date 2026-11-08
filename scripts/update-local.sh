#!/usr/bin/env bash
set -euo pipefail
smartfit_dir="${1:-$PWD}"
if ! command -v node >/dev/null 2>&1; then
  echo '請先安裝 Node.js 24 或以上版本。'; exit 1
fi
if [ "$(node -p 'Number(process.versions.node.split(".")[0])')" -lt 24 ]; then
  echo 'SmartFit 需要 Node.js 24 或以上版本。請升級後再執行更新。'; exit 1
fi
if [ ! -f "$smartfit_dir/package.json" ]; then
  echo '找不到專案。請先 cd 到包含 package.json 的 SmartFit-main 資料夾。'; exit 1
fi
smartfit_dir="$(cd "$smartfit_dir" && pwd)"
smartfit_name="$(node -e 'const fs=require("node:fs");console.log(JSON.parse(fs.readFileSync(process.argv[1],"utf8")).name)' "$smartfit_dir/package.json")"
if [ "$smartfit_name" != 'smartfit-app' ]; then echo '這不是 SmartFit 專案，已停止更新。'; exit 1; fi
smartfit_stage="$(mktemp -d "${TMPDIR:-/tmp}/smartfit-update.XXXXXX")"
trap 'rm -rf "$smartfit_stage"' EXIT
printf '\n正在下載 SmartFit 最新版…\n'
curl -fL --retry 2 'https://github.com/vivi-enzz/SmartFit/archive/refs/heads/main.zip' -o "$smartfit_stage/source.zip"
unzip -q "$smartfit_stage/source.zip" -d "$smartfit_stage"
smartfit_source="$smartfit_stage/SmartFit-main"
if [ ! -f "$smartfit_source/backend/src/dev.js" ]; then echo '下載內容不完整，未修改本機專案。'; exit 1; fi
smartfit_backup_dir="$(dirname "$smartfit_dir")/SmartFit-source-backups"
mkdir -p "$smartfit_backup_dir"
smartfit_backup="$smartfit_backup_dir/source-$(date +%Y%m%d-%H%M%S)-$$.tar.gz"
tar --exclude=node_modules --exclude=backend/data --exclude=.git --exclude=work -czf "$smartfit_backup" -C "$smartfit_dir" .
# The repository contains no user database or .env. Copy only versioned source;
# do not delete backend/data, .env, or personal images from the existing project.
cp -R "$smartfit_source/." "$smartfit_dir/"
printf '\n源碼已備份：%s\n個人資料仍保留在原 backend/data 中。\n' "$smartfit_backup"
cd "$smartfit_dir"
npm ci
printf '\n更新完成。正在啟動 SmartFit 2.0…\n'
exec npm run dev
