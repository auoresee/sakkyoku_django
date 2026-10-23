#!/bin/sh
# DBの起動は docker-compose のヘルスチェックで待つ
set -e
python manage.py migrate
exec gunicorn sakkyoku.wsgi --bind 0.0.0.0:8000
