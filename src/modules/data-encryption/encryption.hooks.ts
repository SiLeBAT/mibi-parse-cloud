import {
    decryptFields,
    encryptFields,
    getEncryptionKey
} from '../shared/infrastructure/encryption';

type BeforeSaveRequest = { object: Parse.Object };
type AfterFindRequest = { results: Parse.Object[] };

// beforeSave: encrypts the sensitive fields just before Parse writes them,
// whoever saves the object (cloud code, portal server or Parse Dashboard).
export const createBeforeSaveEncryptHook =
    (fields: string[]) => (request: BeforeSaveRequest) => {
        encryptFields(request.object, fields, getEncryptionKey());
    };

// afterFind: decrypts them again on every query and get, so callers only
// ever see plaintext. Note that afterFind does not run for objects pulled in
// via query.include(), nor for the object returned by save().
export const createAfterFindDecryptHook =
    (fields: string[]) => (request: AfterFindRequest) => {
        // Parse Server passes the found objects as request.objects; the SDK
        // typings call the field results.
        const { objects } = request as unknown as { objects: Parse.Object[] };
        const key = getEncryptionKey();
        objects.forEach(object => decryptFields(object, fields, key));
        return objects;
    };
