#!/usr/bin/env bash
#
# Ручная заливка сайта на прод. Обычно правки уезжают сами при push в main
# через .github/workflows/deploy.yml — этот скрипт нужен, когда результат
# требуется немедленно или GitHub недоступен.
#
# Реквизиты берутся из файла .env.deploy в корне репозитория. Он в .gitignore
# и в репозиторий не попадает. Формат:
#
#   FTP_SERVER=адрес.из.панели
#   FTP_USERNAME=логин
#   FTP_PASSWORD=пароль
#
set -euo pipefail

cd "$(dirname "$0")/.."
ROOT="$(cd .. && pwd)"
ENV_FILE="$ROOT/.env.deploy"
REMOTE_DIR="/www/xn--80aagbm4b1a.xn--p1ai"

if [ ! -f "$ENV_FILE" ]; then
  echo "Нет файла $ENV_FILE с реквизитами FTP." >&2
  echo "Создайте его по образцу из DEPLOY.md — в git он не попадёт." >&2
  exit 1
fi

if ! command -v lftp >/dev/null 2>&1; then
  echo "Нужен lftp: brew install lftp" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
. "$ENV_FILE"
set +a

: "${FTP_SERVER:?не задан в .env.deploy}"
: "${FTP_USERNAME:?не задан в .env.deploy}"
: "${FTP_PASSWORD:?не задан в .env.deploy}"

echo "Собираю сайт…"
npm run build

for f in dist/index.html dist/404.html dist/.htaccess dist/robots.txt; do
  [ -f "$f" ] || { echo "В сборке нет $f — заливку отменяю." >&2; exit 1; }
done
[ -d dist/gallery ] || { echo "В сборке нет галереи — заливку отменяю." >&2; exit 1; }
echo "В сборке файлов: $(find dist -type f | wc -l | tr -d ' ')"

echo "Заливаю в $REMOTE_DIR на $FTP_SERVER…"
# mirror -R заливает локальное в удалённое, --delete убирает лишнее на сервере,
# чтобы не копились файлы удалённых снимков.
lftp -u "$FTP_USERNAME","$FTP_PASSWORD" "$FTP_SERVER" <<LFTP
set ssl:verify-certificate no
set net:max-retries 3
mirror -R --delete --parallel=4 --verbose dist "$REMOTE_DIR"
bye
LFTP

echo "Готово. Проверьте https://гармаев.рф/"
