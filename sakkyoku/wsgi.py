"""
WSGI config for sakkyoku project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/3.2/howto/deployment/wsgi/
"""

import os
import sys

from django.core.wsgi import get_wsgi_application
#from _env_prod import ENV_SAKKYOKU_VIEW_BASE_DIR, ENV_DOMAIN_NAME, ENV_DEPLOY_IP
from . import _env_prod as _e

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sakkyoku.settings')
os.environ.setdefault('DEPLOY_ENV', 'prod')
os.environ.setdefault('SAKKYOKU_VIEW_BASE_DIR', _e.ENV_SAKKYOKU_VIEW_BASE_DIR)
os.environ.setdefault('DEPLOY_DOMAIN_NAME', _e.ENV_DOMAIN_NAME)
os.environ.setdefault('DEPLOY_IP', _e.ENV_DEPLOY_IP)

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.dirname(os.path.abspath(__file__)) + '/..' )

application = get_wsgi_application()
