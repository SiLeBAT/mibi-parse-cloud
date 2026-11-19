import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

// Stored format: "enc:v1:" + base64(iv | authTag | ciphertext).
// The version lets a later key or algorithm change tell old values apart.
export const ENCRYPTED_PREFIX = 'enc:v1:';
export const KEY_LENGTH = 32;

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

export function isEncrypted(value: string): boolean {
    return value.startsWith(ENCRYPTED_PREFIX);
}

export function encryptValue(plaintext: string, key: Buffer): string {
    // A fresh IV per value: reusing an IV with the same key breaks GCM.
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, key, iv, {
        authTagLength: AUTH_TAG_LENGTH
    });
    const ciphertext = Buffer.concat([
        cipher.update(plaintext, 'utf8'),
        cipher.final()
    ]);
    const authTag = cipher.getAuthTag();

    return (
        ENCRYPTED_PREFIX +
        Buffer.concat([iv, authTag, ciphertext]).toString('base64')
    );
}

// Values without the prefix are returned unchanged: rows written before
// encryption was introduced stay plaintext until the startup migration
// (encryptExistingData) has saved them again.
export function decryptValue(value: string, key: Buffer): string {
    if (!isEncrypted(value)) {
        return value;
    }

    const payload = Buffer.from(value.slice(ENCRYPTED_PREFIX.length), 'base64');
    if (payload.length < IV_LENGTH + AUTH_TAG_LENGTH) {
        throw new Error('Encrypted value is malformed.');
    }

    const iv = payload.subarray(0, IV_LENGTH);
    const authTag = payload.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const ciphertext = payload.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

    const decipher = createDecipheriv(ALGORITHM, key, iv, {
        authTagLength: AUTH_TAG_LENGTH
    });
    decipher.setAuthTag(authTag);

    // final() throws if the key is wrong or the value was tampered with.
    return Buffer.concat([
        decipher.update(ciphertext),
        decipher.final()
    ]).toString('utf8');
}
