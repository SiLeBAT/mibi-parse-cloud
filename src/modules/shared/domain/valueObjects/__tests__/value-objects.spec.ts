import { Email } from '../email.vo';
import { EntityId } from '../entity-id.vo';
import { Name } from '../name.vo';
import { NRLId, NRL_ID_VALUE } from '../nrl-id.vo';
import { PLZ } from '../plz.vo';

// ---------------------------------------------------------------------------
// Email
// ---------------------------------------------------------------------------

describe('Email.create', () => {
    it('creates a valid Email and returns its value', async () => {
        const email = await Email.create({ value: 'test@example.com' });
        expect(email.value).toBe('test@example.com');
        expect(email.toString()).toBe('test@example.com');
    });

    it('trims whitespace from the email value', async () => {
        const email = await Email.create({ value: '  user@example.com  ' });
        expect(email.value).toBe('user@example.com');
    });

    it('throws EmailValidationError for an invalid email', async () => {
        await expect(Email.create({ value: 'not-an-email' })).rejects.toThrow(
            'Email Validation failed'
        );
    });

    it('throws for an empty string', async () => {
        await expect(Email.create({ value: '' })).rejects.toThrow();
    });

    it('two Email instances with the same value are equal', async () => {
        const a = await Email.create({ value: 'same@example.com' });
        const b = await Email.create({ value: 'same@example.com' });
        expect(a.equals(b)).toBe(true);
    });

    it('two Email instances with different values are not equal', async () => {
        const a = await Email.create({ value: 'a@example.com' });
        const b = await Email.create({ value: 'b@example.com' });
        expect(a.equals(b)).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// PLZ
// ---------------------------------------------------------------------------

describe('PLZ.create', () => {
    it('creates a valid PLZ and returns its value', async () => {
        const plz = await PLZ.create({ value: '10115' });
        expect(plz.value).toBe('10115');
        expect(plz.toString()).toBe('10115');
    });

    it('trims whitespace from the value', async () => {
        const plz = await PLZ.create({ value: '  10115  ' });
        expect(plz.value).toBe('10115');
    });

    it('throws for an empty string', async () => {
        await expect(PLZ.create({ value: '' })).rejects.toThrow();
    });

    it('two PLZ instances with the same value are equal', async () => {
        const a = await PLZ.create({ value: '10115' });
        const b = await PLZ.create({ value: '10115' });
        expect(a.equals(b)).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// Name
// ---------------------------------------------------------------------------

describe('Name.create', () => {
    it('creates a valid Name and returns its value', async () => {
        const name = await Name.create({ value: 'Mahtab' });
        expect(name.value).toBe('Mahtab');
        expect(name.toString()).toBe('Mahtab');
    });

    it('trims whitespace from the value', async () => {
        const name = await Name.create({ value: '  Max  ' });
        expect(name.value).toBe('Max');
    });

    it('throws for an empty string', async () => {
        await expect(Name.create({ value: '' })).rejects.toThrow();
    });

    it('throws when value exceeds 30 characters', async () => {
        await expect(Name.create({ value: 'A'.repeat(31) })).rejects.toThrow(
            'Must be 30 characters or less'
        );
    });

    it('accepts exactly 30 characters', async () => {
        const name = await Name.create({ value: 'A'.repeat(30) });
        expect(name.value).toHaveLength(30);
    });
});

// ---------------------------------------------------------------------------
// EntityId
// ---------------------------------------------------------------------------

describe('EntityId.create', () => {
    it('creates an EntityId and returns its value', () => {
        const id = EntityId.create({ value: 'abc-123' });
        expect(id.value).toBe('abc-123');
        expect(id.toString()).toBe('abc-123');
    });

    it('two EntityIds with the same value are equal', () => {
        const a = EntityId.create({ value: 'same' });
        const b = EntityId.create({ value: 'same' });
        expect(a.equals(b)).toBe(true);
    });

    it('two EntityIds with different values are not equal', () => {
        const a = EntityId.create({ value: 'aaa' });
        const b = EntityId.create({ value: 'bbb' });
        expect(a.equals(b)).toBe(false);
    });

    it('equals returns false when compared to undefined', () => {
        const a = EntityId.create({ value: 'x' });
        expect(a.equals(undefined)).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// NRLId — mapNRLStringToEnum
// ---------------------------------------------------------------------------

describe('NRLId.create / mapNRLStringToEnum', () => {
    const cases: [string, NRL_ID_VALUE][] = [
        ['KL-Vibrio', NRL_ID_VALUE.KL_Vibrio],
        ['Konsiliarlabor für Vibrionen', NRL_ID_VALUE.KL_Vibrio],
        ['NRL-VTEC', NRL_ID_VALUE.NRL_VTEC],
        [
            'NRL für Escherichia coli einschließl. verotoxinbildende E. coli',
            NRL_ID_VALUE.NRL_VTEC
        ],
        ['L-Bacillus', NRL_ID_VALUE.L_Bacillus],
        ['Labor für Sporenbildner, Bacillus spp.', NRL_ID_VALUE.L_Bacillus],
        ['L-Clostridium', NRL_ID_VALUE.L_Clostridium],
        [
            'Labor für Sporenbildner, Clostridium spp.',
            NRL_ID_VALUE.L_Clostridium
        ],
        ['NRL-Staph', NRL_ID_VALUE.NRL_Staph],
        [
            'NRL für koagulasepositive Staphylokokken einschl. Staphylococcus aureus',
            NRL_ID_VALUE.NRL_Staph
        ],
        ['NRL-Salm', NRL_ID_VALUE.NRL_Salm],
        ['NRL für Salmonella', NRL_ID_VALUE.NRL_Salm],
        ['NRL-Listeria', NRL_ID_VALUE.NRL_Listeria],
        ['NRL für Listeria monocytogenes', NRL_ID_VALUE.NRL_Listeria],
        ['NRL-Campy', NRL_ID_VALUE.NRL_Campy],
        ['NRL für Campylobacter', NRL_ID_VALUE.NRL_Campy],
        ['NRL-AR', NRL_ID_VALUE.NRL_AR],
        ['NRL für Antibiotikaresistenz', NRL_ID_VALUE.NRL_AR],
        ['NRL-AR-Kleb', NRL_ID_VALUE.NRL_AR_Kleb],
        ['KL-Yersinia', NRL_ID_VALUE.KL_Yersinia],
        ['Konsiliarlabor für Yersinia', NRL_ID_VALUE.KL_Yersinia],
        ['Labor nicht erkannt', NRL_ID_VALUE.UNKNOWN],
        ['completely unknown', NRL_ID_VALUE.UNKNOWN]
    ];

    it.each(cases)('maps "%s" → %s', (input, expected) => {
        const nrlId = NRLId.create(input);
        expect(nrlId.value).toBe(expected);
        expect(nrlId.toString()).toBe(expected.toString());
    });

    it('trims whitespace before mapping', () => {
        const nrlId = NRLId.create('  NRL-Salm  ');
        expect(nrlId.value).toBe(NRL_ID_VALUE.NRL_Salm);
    });
});
