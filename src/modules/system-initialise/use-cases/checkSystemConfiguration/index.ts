import { logger } from '../../../../system/logging';
import { checkSystemConfiguration } from './check-system-configuration.use-case';

logger.info('Parse Cloud: Checking System Configuration.');
checkSystemConfiguration.execute();
