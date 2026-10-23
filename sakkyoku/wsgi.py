"""
WSGI config for sakkyoku project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/3.2/howto/deployment/wsgi/
"""

import os
import sys

from django.core.wsgi import get_wsgi_application

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.dirname(os.path.abspath(__file__)) + '/..' )

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sakkyoku.settings')
os.environ.setdefault('DEPLOY_ENV', 'prod')

#_env_prod.py は本番の設定ファイル(Apache + mod_wsgi など、環境変数を渡せない場合に使う)
#開発環境(runserver もこのファイルを読み込む)や、環境変数で設定する Docker では無くてもよい
try:
    from _env_prod import ENV_SAKKYOKU_VIEW_BASE_DIR, ENV_DOMAIN_NAME, ENV_DEPLOY_IP
except ModuleNotFoundError as e:
    if e.name != '_env_prod':
        raise
else:
    os.environ.setdefault('SAKKYOKU_VIEW_BASE_DIR', ENV_SAKKYOKU_VIEW_BASE_DIR)
    os.environ.setdefault('DEPLOY_DOMAIN_NAME', ENV_DOMAIN_NAME)
    os.environ.setdefault('DEPLOY_IP', ENV_DEPLOY_IP)



application = get_wsgi_application()
