import { logger } from '../../system/logging';
import {
    ENCRYPTED_FIELDS,
    getEncryptionKey
} from '../shared/infrastructure/encryption';
import {
    createAfterFindDecryptHook,
    createBeforeSaveEncryptHook
} from './encryption.hooks';

try {
    getEncryptionKey();
} catch (error) {
    // Don't stop the server; saves and reads of encrypted classes fail
    // until the key is configured.
    logger.error(`Parse Cloud: Data encryption key invalid. ${error.message}`);
}

for (const [className, fields] of Object.entries(ENCRYPTED_FIELDS)) {
    Parse.Cloud.beforeSave(className, createBeforeSaveEncryptHook(fields));
    Parse.Cloud.afterFind(className, createAfterFindDecryptHook(fields));
}

logger.info('Parse Cloud: Data Encryption module loaded.');
