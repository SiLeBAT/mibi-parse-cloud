import * as fs from 'fs';
import * as path from 'path';
import { CatalogService } from '../../../../orders/legacy/application/catalog.service';
import { matchesZoMo } from '../../../../orders/legacy/model/custom-validator-functions';
import { MatchesZoMoOptions } from '../../../../orders/legacy/model/legacy.model';
import { zoMoConstraints } from '../../../../orders/legacy/model/validation-constraints';
import { ZomoPlanRepository } from '../../../../orders/infrastructure/repository';
import { SetZomoPlanCacheUseCase } from '../../../../orders/use-cases/set-zomo-plan-cache/set-zomo-plan-cache.use-case';
import { ZomoPlanCache } from '../../../../shared/infrastructure/cache/zomo-plan.cache';
import { beforeZomoPlanSaveHook } from '../before-zomo-plan-save.hook';
import { ZomoPlanDuplicationError } from '../create-zomo-plan.error';

// Runs a real ZoMo plan CSV through the whole chain: the before-save hook
// (read file, parse, integrity checks, map), the stored Parse object, the cache
// refresh and finally the matchesZoMo sample validation. Only Parse itself is
// replaced by the in-memory fake below.

const FIXTURE = path.join(
    __dirname,
    '../../../infrastructure/csv-parser/__tests__/fixtures/ZoMo-Plan_forbidden-codes.csv'
);

const database = new Map<string, FakeParseObject[]>();

class FakeParseObject {
    id?: string;
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
    destroyed = false;
    constructor(
        public readonly name: string,
        private readonly data: { base64: string }
    ) {}
    async save() {
        return this;
    }
    async getData() {
        return this.data.base64;
    }
    url() {
        return `https://files.example/${this.name}`;
    }
    destroy() {
        this.destroyed = true;
    }
}

class FakeParseQuery {
    private filters: Array<[string, unknown]> = [];
    constructor(private readonly className: string) {}
    equalTo(key: string, value: unknown) {
        this.filters.push([key, value]);
    }
    async find() {
        return (database.get(this.className) ?? []).filter(object =>
            this.filters.every(([key, value]) => object.get(key) === value)
        );
    }
    async findAll() {
        return this.find();
    }
}

const noopLog = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };

const uploadCsv = (csv: string) =>
    new FakeParseFile('ZoMo-Plan.csv', {
        base64: Buffer.from(csv, 'utf-8').toString('base64')
    });

// What Parse does on save: run the beforeSave hook and store the object.
const saveZomoPlanUpload = async (file: FakeParseFile) => {
    const zomoPlanObject = new FakeParseObject('Zomo_Plan', {
        zomoFile: file
    });
    await beforeZomoPlanSaveHook({
        object: zomoPlanObject,
        log: noopLog
    } as never);
    zomoPlanObject.id = `zomo-${database.get('Zomo_Plan')?.length ?? 0}`;
    database.set('Zomo_Plan', [
        ...(database.get('Zomo_Plan') ?? []),
        zomoPlanObject
    ]);
    return zomoPlanObject;
};

// The sample attributes a ZoMo sample of program 213058|211507| (fixture
// row 2) needs; each test overrides the field it validates.
const zomoSample = (attributes: Record<string, string>) =>
    ({
        control_program_avv: '70564|53075|',
        program_reason_text: '',
        program_avv: '213058|211507|',
        sampling_date: '15.06.2026',
        ...attributes
    } as never);

const rule = (field: string): MatchesZoMoOptions => {
    const { error, ...options } = zoMoConstraints[field]['matchesZoMo'];
    return {
        ...options,
        message: { code: error, level: 2, message: `error ${error}` }
    } as MatchesZoMoOptions;
};

describe('ZoMo plan from upload to sample validation', () => {
    let catalogService: CatalogService;
    let validate: ReturnType<typeof matchesZoMo>;

    const validateField = (
        field: string,
        value: string,
        attributes: Record<string, string> = {}
    ) =>
        validate(
            value,
            rule(field),
            field as never,
            zomoSample({ [field]: value, ...attributes })
        );

    beforeAll(async () => {
        (globalThis as unknown as { Parse: unknown }).Parse = {
            Object: FakeParseObject,
            File: FakeParseFile,
            Query: FakeParseQuery
        };
        // Only the date is faked; the CSV parser stream needs real timers.
        jest.useFakeTimers({
            now: new Date('2026-06-15T10:00:00.000Z'),
            doNotFake: [
                'nextTick',
                'setImmediate',
                'clearImmediate',
                'setTimeout',
                'clearTimeout',
                'setInterval',
                'clearInterval',
                'queueMicrotask'
            ]
        });
        jest.spyOn(console, 'log').mockImplementation(() => undefined);

        await saveZomoPlanUpload(uploadCsv(fs.readFileSync(FIXTURE, 'utf-8')));

        const zomoPlanCache = new ZomoPlanCache();
        await new SetZomoPlanCacheUseCase(
            zomoPlanCache,
            new ZomoPlanRepository('Zomo_Plan')
        ).execute();
        catalogService = new CatalogService(
            undefined as never,
            undefined as never,
            undefined as never,
            zomoPlanCache
        );
        validate = matchesZoMo(catalogService);
    });

    afterAll(() => {
        jest.useRealTimers();
        jest.restoreAllMocks();
    });

    describe('upload', () => {
        it('stores the plan with the year from the CSV', () => {
            const [stored] = database.get('Zomo_Plan')!;

            expect(stored.get('year')).toBe('2026');
            expect(
                JSON.parse(stored.get('zomoData') as string).data.zomoData
            ).toHaveLength(20);
        });

        it('replaces the uploaded CSV with a JSON file of the plan', () => {
            const [stored] = database.get('Zomo_Plan')!;

            expect((stored.get('zomoFile') as FakeParseFile).name).toBe(
                'zomoPlan2026.json'
            );
        });

        it('rejects a second plan for 2026 and removes its file', async () => {
            const secondUpload = uploadCsv(fs.readFileSync(FIXTURE, 'utf-8'));

            await expect(saveZomoPlanUpload(secondUpload)).rejects.toThrow(
                ZomoPlanDuplicationError
            );
            expect(secondUpload.destroyed).toBe(true);
            expect(database.get('Zomo_Plan')).toHaveLength(1);
        });

        it('serves the uploaded plan for 2026 samples only', () => {
            expect(catalogService.getZomoPlan('15.06.2026')).toHaveLength(20);
            expect(catalogService.getZomoPlan('15.06.2025')).toBeUndefined();
        });
    });

    describe('validation against the uploaded plan', () => {
        it('accepts a matrix listed for the program', () => {
            expect(validateField('matrix_avv', '189009|187134|')).toBeNull();
        });

        it('rejects a matrix listed only for another program', () => {
            expect(validateField('matrix_avv', '8232|185713|')).toEqual(
                expect.objectContaining({ code: 114 })
            );
        });

        it('rejects a sample whose program is not in the plan', () => {
            expect(
                validateField('matrix_avv', '189009|187134|', {
                    program_avv: '999999|999999|'
                })
            ).toEqual(expect.objectContaining({ code: 114 }));
        });

        it('accepts an obligatory additional mark', () => {
            expect(
                validateField('additional_marks_avv', '21537|12168|')
            ).toBeNull();
        });

        it('rejects a forbidden additional mark', () => {
            expect(
                validateField('additional_marks_avv', '21525|12304|')
            ).toEqual(expect.objectContaining({ code: 126 }));
        });

        it('accepts a pathogen matching the program', () => {
            expect(
                validateField('pathogen_avv', 'Escherichia coli')
            ).toBeNull();
        });

        it('rejects a pathogen the program does not cover', () => {
            expect(
                validateField('pathogen_avv', 'Salmonella Enteritidis')
            ).toEqual(expect.objectContaining({ code: 115 }));
        });

        it('does not validate samples of a year without a plan', () => {
            expect(
                validateField('matrix_avv', '8232|185713|', {
                    sampling_date: '15.06.2025'
                })
            ).toBeNull();
        });
    });
});
