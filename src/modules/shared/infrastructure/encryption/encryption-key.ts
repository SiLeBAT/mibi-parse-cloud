import config from 'config';
import { KEY_LENGTH } from './field-cipher';

// Read from the portal server's config, because the cloud code runs inside
// that process. Set via the MIBI_DATA_ENCRYPTION_KEY environment variable.
export const ENCRYPTION_KEY_CONFIG_PATH = 'general.dataEncryptionKey';

let cachedKey: Buffer | undefined;

export function getEncryptionKey(): Buffer {
    if (cachedKey) {
        return cachedKey;
    }

    const encoded = config.has(ENCRYPTION_KEY_CONFIG_PATH)
        ? config.get<string>(ENCRYPTION_KEY_CONFIG_PATH)
        : '';
    const key = Buffer.from(encoded, 'base64');

    if (key.length !== KEY_LENGTH) {
        throw new Error(
            `${ENCRYPTION_KEY_CONFIG_PATH} must be a base64-encoded ${KEY_LENGTH}-byte key. ` +
                "Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('base64'))\""
        );
    }

    cachedKey = key;
    return key;
}
