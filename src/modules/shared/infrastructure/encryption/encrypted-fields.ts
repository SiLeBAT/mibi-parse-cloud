import { ObjectKeys } from '../parse-types';
import { decryptValue, encryptValue, isEncrypted } from './field-cipher';

// The portal server's own user class (not Parse's _User).
const LEGACY_USER_CLASS = 'users';

// Fields stored encrypted, per Parse class. Only list fields that are never
// used in a query, sort or index: the stored value changes on every save, so
// a query on it can never match. That is why users.email is not listed — the
// server looks users up by email.
export const ENCRYPTED_FIELDS: Record<string, string[]> = {
    [ObjectKeys.Sample]: ['sampleData', 'sampleMeta'],
    [ObjectKeys.Result]: ['resultData'],
    [ObjectKeys.Order]: ['results', 'meta', 'fileName', 'pathogens', 'nrls'],
    [ObjectKeys.UserInformation]: ['firstName', 'lastName'],
    [LEGACY_USER_CLASS]: ['firstName', 'lastName']
};

type FieldValue = unknown;

// Arrays (Order.pathogens, Order.nrls) are encrypted element by element so the
// column keeps its Array type in the Parse schema.
function mapStrings(
    value: FieldValue,
    transform: (text: string) => string
): FieldValue {
    if (typeof value === 'string') {
        return transform(value);
    }
    if (Array.isArray(value)) {
        return value.map(element =>
            typeof element === 'string' ? transform(element) : element
        );
    }
    return value;
}

function hasChanged(before: FieldValue, after: FieldValue): boolean {
    if (Array.isArray(before) && Array.isArray(after)) {
        return before.some((element, index) => element !== after[index]);
    }
    return before !== after;
}

export function encryptFields(
    object: Parse.Object,
    fields: string[],
    key: Buffer
): void {
    for (const field of fields) {
        const value = object.get(field);
        const encrypted = mapStrings(value, text =>
            isEncrypted(text) ? text : encryptValue(text, key)
        );
        if (hasChanged(value, encrypted)) {
            object.set(field, encrypted);
        }
    }
}

export function decryptFields(
    object: Parse.Object,
    fields: string[],
    key: Buffer
): void {
    for (const field of fields) {
        const value = object.get(field);
        const decrypted = mapStrings(value, text => decryptValue(text, key));
        if (hasChanged(value, decrypted)) {
            object.set(field, decrypted);
        }
    }
}
