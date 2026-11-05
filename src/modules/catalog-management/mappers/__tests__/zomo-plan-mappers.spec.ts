import { ZomoPlan, ZomoPlanInformation } from '../../domain';
import {
    ZomoPlanFileInformationMapper,
    ZomoPlanFileInformationMappingError
} from '../zomo-plan-file-information-to-persistence.mapper';
import {
    ZomoPlanInformationMapper,
    ZomoPlanInformationMappingError
} from '../zomo-plan-information-to-persistence.mapper';
import { ZomoPlanMapper } from '../zomo-plan-to-persistence.mapper';

class FakeParseObject {
    private fields = new Map<string, unknown>();
    constructor(
        public readonly className: string,
        attributes: Record<string, unknown> = {}
    ) {
        Object.entries(attributes).forEach(([key, value]) =>
            this.fields.set(key, value)
        );
    }
    get(key: string) {
        return this.fields.get(key);
    }
    set(key: string, value: unknown) {
        this.fields.set(key, value);
    }
}

class FakeParseFile {
    static saveResult: 'self' | undefined = 'self';
    public saveOptions: unknown;
    constructor(
        public readonly name: string,
        public readonly data: { base64: string }
    ) {}
    async save(options: unknown) {
        this.saveOptions = options;
        return FakeParseFile.saveResult === 'self' ? this : undefined;
    }
}

const zomoPlanObject = (attributes: Record<string, unknown>) =>
    new FakeParseObject('Zomo_Plan', attributes) as never;

const noopLog = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };

beforeAll(() => {
    (globalThis as unknown as { Parse: unknown }).Parse = {
        Object: FakeParseObject,
        File: FakeParseFile
    };
    jest.spyOn(console, 'error').mockImplementation(noopLog.error);
});

afterAll(() => {
    jest.restoreAllMocks();
});

describe('ZomoPlanInformationMapper', () => {
    it('maps the stored year', async () => {
        const information = await ZomoPlanInformationMapper.fromPersistence(
            zomoPlanObject({ year: '2026' })
        );

        expect(information.year).toBe('2026');
    });

    it('fails without a stored year', async () => {
        await expect(
            ZomoPlanInformationMapper.fromPersistence(zomoPlanObject({}))
        ).rejects.toThrow(ZomoPlanInformationMappingError);
    });
});

describe('ZomoPlanFileInformationMapper', () => {
    it('maps the stored year', async () => {
        const information = await ZomoPlanFileInformationMapper.fromPersistence(
            zomoPlanObject({ year: '2026' })
        );

        expect(information.year).toBe('2026');
    });

    it('fails without a stored year', async () => {
        await expect(
            ZomoPlanFileInformationMapper.fromPersistence(zomoPlanObject({}))
        ).rejects.toThrow(ZomoPlanFileInformationMappingError);
    });
});

describe('ZomoPlanMapper', () => {
    let zomoPlan: ZomoPlan<unknown>;

    beforeEach(async () => {
        FakeParseFile.saveResult = 'self';
        zomoPlan = ZomoPlan.create({
            zomoPlanInformation: await ZomoPlanInformation.create({
                year: '2026'
            }),
            data: [{ Programm: 'ZoMo 2026' }]
        });
    });

    it('creates a new object with year, data and a JSON file of the plan', async () => {
        const stored = (await ZomoPlanMapper.toPersistence(
            zomoPlan
        )) as unknown as FakeParseObject;

        expect(stored.className).toBe('Zomo_Plan');
        expect(stored.get('year')).toBe('2026');
        expect(stored.get('zomoData')).toBe(zomoPlan.JSON);

        const file = stored.get('zomoFile') as FakeParseFile;
        expect(file.name).toBe('zomoPlan2026.json');
        expect(Buffer.from(file.data.base64, 'base64').toString('utf-8')).toBe(
            zomoPlan.JSON
        );
        expect(file.saveOptions).toEqual({ useMasterKey: true });
    });

    it('updates a given object instead of creating one', async () => {
        const existing = zomoPlanObject({ year: '2025', zomoData: 'old' });

        const stored = await ZomoPlanMapper.toPersistence(zomoPlan, existing);

        expect(stored).toBe(existing);
        expect(stored.get('year')).toBe('2026');
        expect(stored.get('zomoData')).toBe(zomoPlan.JSON);
    });

    it('fails if the JSON file cannot be saved', async () => {
        FakeParseFile.saveResult = undefined;

        await expect(ZomoPlanMapper.toPersistence(zomoPlan)).rejects.toThrow(
            'Failed to create zomo plan file.'
        );
    });
});
