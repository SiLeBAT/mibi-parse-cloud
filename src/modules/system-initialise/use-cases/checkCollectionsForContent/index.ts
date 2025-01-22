import { logger } from '../../../../system/logging';
import { checkCollectionsForContent } from './check-collections-for-content.use-case';

logger.info('Parse Cloud: Checking Collections for content.');
checkCollectionsForContent.execute();
