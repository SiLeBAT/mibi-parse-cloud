import { randomBytes } from 'crypto';
import {
    ENCRYPTED_PREFIX,
    decryptValue,
    encryptValue,
    isEncrypted
} from '../field-cipher';

describe('field-cipher', () => {
    const key = randomBytes(32);

    it('decrypts what it encrypted', () => {
        const plaintext = '{"vvvo":"276123456789","comment":"Ünïcödé"}';

        const encrypted = encryptValue(plaintext, key);

        expect(isEncrypted(encrypted)).toBe(true);
        expect(encrypted).not.toContain('vvvo');
        expect(decryptValue(encrypted, key)).toBe(plaintext);
    });

    it('produces a different ciphertext for the same value each time', () => {
        expect(encryptValue('Mustermann', key)).not.toBe(
            encryptValue('Mustermann', key)
        );
    });

    it('encrypts an empty string', () => {
        const encrypted = encryptValue('', key);

        expect(isEncrypted(encrypted)).toBe(true);
        expect(decryptValue(encrypted, key)).toBe('');
    });

    it('returns values without the prefix unchanged', () => {
        expect(decryptValue('legacy plaintext', key)).toBe('legacy plaintext');
    });

    it('fails with the wrong key', () => {
        const encrypted = encryptValue('Mustermann', key);

        expect(() => decryptValue(encrypted, randomBytes(32))).toThrow();
    });

    it('fails when the ciphertext was tampered with', () => {
        const encrypted = encryptValue('Mustermann', key);
        const payload = Buffer.from(
            encrypted.slice(ENCRYPTED_PREFIX.length),
            'base64'
        );
        payload[payload.length - 1] ^= 0x01;
        const tampered = ENCRYPTED_PREFIX + payload.toString('base64');

        expect(() => decryptValue(tampered, key)).toThrow();
    });

    it('fails on a malformed value', () => {
        expect(() => decryptValue(ENCRYPTED_PREFIX + 'abc', key)).toThrow(
            'Encrypted value is malformed.'
        );
    });
});
