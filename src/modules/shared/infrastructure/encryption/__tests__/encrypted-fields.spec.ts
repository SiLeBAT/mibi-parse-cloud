import { randomBytes } from 'crypto';
import {
    ENCRYPTED_FIELDS,
    decryptFields,
    encryptFields
} from '../encrypted-fields';
import { encryptValue, isEncrypted } from '../field-cipher';

class FakeParseObject {
    readonly setCalls: string[] = [];
    constructor(private attributes: Record<string, unknown>) {}
    get(key: string) {
        return this.attributes[key];
    }
    set(key: string, value: unknown) {
        this.setCalls.push(key);
        this.attributes[key] = value;
    }
}

const asParseObject = (fake: FakeParseObject) =>
    fake as unknown as Parse.Object;

describe('encrypted-fields', () => {
    const key = randomBytes(32);
    const orderFields = ENCRYPTED_FIELDS['Order']!;

    it('does not encrypt users.email, which the server queries', () => {
        expect(ENCRYPTED_FIELDS['users']).not.toContain('email');
    });

    it('encrypts strings and each element of arrays, then decrypts them back', () => {
        const original = {
            fileName: 'proben.xlsx',
            meta: '{"version":"18"}',
            results: '0/3',
            pathogens: ['Salmonella spp.', 'Listeria monocytogenes'],
            nrls: ['NRL-Salm']
        };
        const order = new FakeParseObject({ ...original, sampleCount: 3 });

        encryptFields(asParseObject(order), orderFields, key);

        expect(isEncrypted(order.get('fileName') as string)).toBe(true);
        expect(isEncrypted(order.get('meta') as string)).toBe(true);
        expect(isEncrypted(order.get('results') as string)).toBe(true);
        expect(order.get('pathogens')).toHaveLength(2);
        (order.get('pathogens') as string[]).forEach(element =>
            expect(isEncrypted(element)).toBe(true)
        );
        expect(order.get('sampleCount')).toBe(3);

        decryptFields(asParseObject(order), orderFields, key);

        expect(order.get('fileName')).toBe(original.fileName);
        expect(order.get('meta')).toBe(original.meta);
        expect(order.get('results')).toBe(original.results);
        expect(order.get('pathogens')).toEqual(original.pathogens);
        expect(order.get('nrls')).toEqual(original.nrls);
    });

    it('does not encrypt a value twice', () => {
        const alreadyEncrypted = encryptValue('Erika', key);
        const userInfo = new FakeParseObject({ firstName: alreadyEncrypted });

        encryptFields(asParseObject(userInfo), ['firstName', 'lastName'], key);

        expect(userInfo.get('firstName')).toBe(alreadyEncrypted);
        expect(userInfo.setCalls).toEqual([]);
    });

    it('leaves missing fields and plaintext reads untouched', () => {
        const legacy = new FakeParseObject({ firstName: 'Erika' });

        decryptFields(asParseObject(legacy), ['firstName', 'lastName'], key);

        expect(legacy.get('firstName')).toBe('Erika');
        expect(legacy.get('lastName')).toBeUndefined();
        expect(legacy.setCalls).toEqual([]);
    });
});
