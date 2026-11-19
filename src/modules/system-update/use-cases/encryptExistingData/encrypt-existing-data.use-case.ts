import { logger } from '../../../../system/logging';
import {
    ENCRYPTED_FIELDS,
    ENCRYPTED_PREFIX,
    getEncryptionKey
} from '../../../shared/infrastructure/encryption';
import { UseCase } from '../../../shared/use-cases';

// Matches any stored value that does not start with the encryption prefix.
// On an Array field Mongo applies it per element.
const PLAINTEXT_PATTERN = new RegExp(`^(?!${ENCRYPTED_PREFIX})`);

/**
 * Encrypts rows saved before data encryption was introduced. Safe to run on
 * every startup: once all rows are encrypted the queries find nothing.
 */
class EncryptExistingDataUseCase implements UseCase<null, null> {
    async execute(): Promise<null> {
        try {
            getEncryptionKey();
        } catch {
            logger.warn(
                'Skipping encryption of existing data: no valid encryption key configured.'
            );
            return null;
        }

        for (const [className, fields] of Object.entries(ENCRYPTED_FIELDS)) {
            try {
                const count = await this.encryptClass(className, fields);
                if (count > 0) {
                    logger.info(
                        `Encrypted ${count} existing ${className} entries.`
                    );
                }
            } catch (error) {
                logger.error(
                    `Error encrypting existing ${className} entries: ${error.message}`
                );
            }
        }
        return null;
    }

    private async encryptClass(
        className: string,
        fields: string[]
    ): Promise<number> {
        const query = Parse.Query.or(
            ...fields.map(field =>
                new Parse.Query(className).matches(field, PLAINTEXT_PATTERN, '')
            )
        );

        let count = 0;
        await query.each(
            async object => {
                // afterFind has already decrypted every field, so setting the
                // values again hands plaintext to the beforeSave hook, which
                // encrypts it.
                for (const field of fields) {
                    const value = object.get(field);
                    if (value !== undefined && value !== null) {
                        object.set(field, value);
                    }
                }
                await object.save(null, { useMasterKey: true });
                count++;
            },
            { useMasterKey: true }
        );
        return count;
    }
}

const encryptExistingData = new EncryptExistingDataUseCase();

export { encryptExistingData };
