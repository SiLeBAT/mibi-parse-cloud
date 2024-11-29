/**
 * The system initialise module includes functions that:
 * - set the system up to function properly and check system is working as plannned
 */
import { logger } from '../../system/logging';
import {
    checkCollectionsForContent,
    checkSystemConfiguration
} from './use-cases';

logger.info('Parse Cloud: Checking System Configuration.');
checkSystemConfiguration.execute();
logger.info('Parse Cloud: Checking Collections for content.');
checkCollectionsForContent.execute();

logger.info('Parse Cloud: System initialise module loaded.');
