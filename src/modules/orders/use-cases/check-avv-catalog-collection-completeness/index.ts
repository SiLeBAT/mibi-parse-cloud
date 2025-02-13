import { logger } from '../../../../system/logging';
import { checkAVVCollectionCompleteness } from './check-avv-catalog-collection-completeness.use-case';

logger.info('Parse Cloud: Checking AVV Collection for completeness.');
checkAVVCollectionCompleteness.execute();
