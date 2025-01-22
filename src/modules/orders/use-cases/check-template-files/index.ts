import { logger } from '../../../../system/logging';
import { checkTemplateFilesUseCase } from './check-template-files.use-case';

logger.info('Parse Cloud: Checking for presence of Template files.');
checkTemplateFilesUseCase.execute();
