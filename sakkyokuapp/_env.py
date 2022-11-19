import os

from enum import Enum

class DeploymentEnvironment(Enum):
    PRODUCTION = 'prod'
    DEVELOPMENT = 'dev'
    STAGING = 'stage'
    
    def __str__(self) -> str:
        return str(self.value)

DEPLOY_ENV_VAR_NAME = 'DEPLOY_ENV'
VIEW_BASE_DIR_VAR_NAME = 'SAKKYOKU_VIEW_BASE_DIR'
DEPLOY_ENV_VAR_VALUE = os.environ.get(DEPLOY_ENV_VAR_NAME, default='').strip().lower()
VIEW_BASE_DIR = os.environ.get(VIEW_BASE_DIR_VAR_NAME, default='').strip().lower()

DEPLOYMENT_ENVIRONMENT_REPRESENTATIONS = {
    DeploymentEnvironment.DEVELOPMENT: {'dev', 'development', 'trunk'},
    DeploymentEnvironment.STAGING: {'stage','staging', 'demo'},
    DeploymentEnvironment.PRODUCTION: {'prod','production', 'live'},
}
DEPLOYMENT_ENVIRONMENT = None
for deploy_env in DeploymentEnvironment:
    if DEPLOY_ENV_VAR_VALUE in DEPLOYMENT_ENVIRONMENT_REPRESENTATIONS[deploy_env]:
        DEPLOYMENT_ENVIRONMENT = deploy_env
        break
else:
    DEPLOYMENT_ENVIRONMENT = DeploymentEnvironment.DEVELOPMENT