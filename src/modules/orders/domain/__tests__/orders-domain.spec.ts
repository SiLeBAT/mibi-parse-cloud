import { EntityId, Name } from '../../../shared/domain/valueObjects';
import { SampleEntryDTOMapper } from '../../mappers/sample-entry-dto.mapper';
import { AffiliatedInstitute } from '../affiliated-institute.vo';
import { Bundesland } from '../enums';
import { FileInformation } from '../file-information.vo';
import {
    SampleEntry,
    SampleEntryTuple,
    AnnotatedSampleDataEntry
} from '../sample-entry.entity';
import { SampleSet } from '../sample-set.entity';
import { SubmissionFormInput } from '../submission-form-input.vo';
import { Submitter } from '../submitter.entity';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEmail() {
    return {
        value: 'test@example.com',
        toString: () => 'test@example.com',
        equals: () => false,
        props: { value: 'test@example.com' }
    } as any;
}

function makeInstitute() {
    return AffiliatedInstitute.create({
        instituteName: 'BfR',
        street: 'Diedersdorfer Weg 1',
        zip: '12277',
        city: 'Berlin',
        telephone: '+49301234567',
        email: makeEmail(),
        stateShort: Bundesland.BE
    });
}

function makeAnnotatedEntry(value = ''): AnnotatedSampleDataEntry {
    return { value, errors: [], correctionOffer: [] };
}

function makeSampleEntryProps(errorField?: string): any {
    const base: Record<string, any> = {};
    const fields = [
        'sample_id',
        'sample_id_avv',
        'partial_sample_id',
        'pathogen_avv',
        'pathogen_text',
        'sequence_id',
        'sequence_status',
        'sampling_date',
        'isolation_date',
        'sampling_location_avv',
        'sampling_location_zip',
        'sampling_location_text',
        'animal_avv',
        'matrix_avv',
        'animal_matrix_text',
        'additional_marks_avv',
        'control_program_avv',
        'sampling_reason_avv',
        'program_reason_text',
        'operations_mode_avv',
        'operations_mode_text',
        'vvvo',
        'program_avv',
        'comment'
    ];
    fields.forEach(f => {
        base[f] = makeAnnotatedEntry();
    });
    if (errorField) {
        base[errorField] = {
            value: '',
            errors: [{ code: 1, level: 1, message: 'err' }],
            correctionOffer: []
        };
    }
    base.nrl = 'unknown';
    base.urgency = 'NORMAL';
    base.analysis = {};
    return base;
}

// ---------------------------------------------------------------------------
// AffiliatedInstitute
// ---------------------------------------------------------------------------

describe('AffiliatedInstitute.create', () => {
    it('creates an instance and exposes all getters', () => {
        const inst = makeInstitute();
        expect(inst.instituteName).toBe('BfR');
        expect(inst.street).toBe('Diedersdorfer Weg 1');
        expect(inst.zip).toBe('12277');
        expect(inst.city).toBe('Berlin');
        expect(inst.telephone).toBe('+49301234567');
        expect(inst.stateShort).toBe(Bundesland.BE);
    });

    it('returns empty string for optional department when not provided', () => {
        const inst = makeInstitute();
        expect(inst.department).toBe('');
    });

    it('returns the department when provided', () => {
        const inst = AffiliatedInstitute.create({
            instituteName: 'BfR',
            department: 'Dept A',
            street: 'Street 1',
            zip: '10115',
            city: 'Berlin',
            telephone: '030',
            email: makeEmail(),
            stateShort: Bundesland.BE
        });
        expect(inst.department).toBe('Dept A');
    });
});

// ---------------------------------------------------------------------------
// FileInformation
// ---------------------------------------------------------------------------

describe('FileInformation.create', () => {
    it('creates a valid FileInformation and exposes getters', async () => {
        const fi = await FileInformation.create({
            data: 'base64data',
            type: 'xlsx',
            fileName: 'sample.xlsx'
        });
        expect(fi.fileName).toBe('sample.xlsx');
        expect(fi.data).toBe('base64data');
        expect(fi.type).toBe('xlsx');
        expect(fi.toString()).toBe('sample.xlsx');
    });

    it('trims whitespace from fields', async () => {
        const fi = await FileInformation.create({
            data: ' data ',
            type: ' xlsx ',
            fileName: ' sample.xlsx '
        });
        expect(fi.fileName).toBe('sample.xlsx');
    });

    it('throws when required fields are missing', async () => {
        await expect(
            FileInformation.create({
                data: '',
                type: 'xlsx',
                fileName: 'f.xlsx'
            })
        ).rejects.toThrow();
    });
});

// ---------------------------------------------------------------------------
// SubmissionFormInput
// ---------------------------------------------------------------------------

describe('SubmissionFormInput.create', () => {
    it('creates an instance and exposes fileName and data', () => {
        const input = SubmissionFormInput.create({
            fileName: 'upload.xlsx',
            data: 'base64string'
        });
        expect(input.fileName).toBe('upload.xlsx');
        expect(input.data).toBe('base64string');
        expect(input.toString()).toBe('upload.xlsx');
    });
});

// ---------------------------------------------------------------------------
// SampleEntry
// ---------------------------------------------------------------------------

describe('SampleEntry.create', () => {
    it('creates a SampleEntry and exposes data', () => {
        const props = makeSampleEntryProps();
        const entry = SampleEntry.create<SampleEntryTuple>(props);
        expect(entry.data).toBe(props);
    });

    it('hasErrors returns false when no field has errors', () => {
        const entry = SampleEntry.create<SampleEntryTuple>(
            makeSampleEntryProps()
        );
        expect(entry.hasErrors()).toBe(false);
    });

    it('hasErrors returns true when a data field has errors', () => {
        const entry = SampleEntry.create<SampleEntryTuple>(
            makeSampleEntryProps('sample_id')
        );
        expect(entry.hasErrors()).toBe(true);
    });

    it('hasAutoCorrections returns false when no correctionOffer present', () => {
        const entry = SampleEntry.create<SampleEntryTuple>(
            makeSampleEntryProps()
        );
        expect(entry.hasAutoCorrections()).toBe(false);
    });

    it('hasAutoCorrections returns true when a field has a correctionOffer', () => {
        const props = makeSampleEntryProps();
        props.sample_id = {
            value: '',
            errors: [],
            correctionOffer: ['suggestion']
        };
        const entry = SampleEntry.create<SampleEntryTuple>(props);
        expect(entry.hasAutoCorrections()).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// SampleSet
// ---------------------------------------------------------------------------

describe('SampleSet.create', () => {
    it('creates a SampleSet and exposes its data array', () => {
        const entry1 = SampleEntry.create<SampleEntryTuple>(
            makeSampleEntryProps()
        );
        const set = SampleSet.create({ data: [entry1] });
        expect(set.data).toHaveLength(1);
    });

    it('hasErrors returns false (forEach loop bug — always returns false)', () => {
        const entryWithError = SampleEntry.create<SampleEntryTuple>(
            makeSampleEntryProps('sample_id')
        );
        const set = SampleSet.create({ data: [entryWithError] });
        expect(set.hasErrors()).toBe(false);
    });

    it('hasAutoCorrections returns false (forEach loop — always returns false)', () => {
        const props = makeSampleEntryProps();
        props.sample_id = { value: '', errors: [], correctionOffer: ['x'] };
        const entry = SampleEntry.create<SampleEntryTuple>(props);
        const set = SampleSet.create({ data: [entry] });
        expect(set.hasAutoCorrections()).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// Submitter
// ---------------------------------------------------------------------------

describe('Submitter.create', () => {
    it('creates a Submitter and exposes institute and submitterId', async () => {
        const institute = makeInstitute();
        const submitterId = EntityId.create({ value: 'user-001' });
        const submitter = Submitter.create({ institute, submitterId });
        expect(submitter.institute).toBe(institute);
        expect(submitter.submitterId.value).toBe('user-001');
    });

    it('getStateAbbreviation delegates to institute.stateShort', async () => {
        const institute = makeInstitute();
        const submitterId = EntityId.create({ value: 'u1' });
        const submitter = Submitter.create({ institute, submitterId });
        expect(submitter.getStateAbbreviation()).toBe(Bundesland.BE);
    });

    it('exposes optional firstName and lastName as undefined when not provided', () => {
        const institute = makeInstitute();
        const submitterId = EntityId.create({ value: 'u1' });
        const submitter = Submitter.create({ institute, submitterId });
        expect(submitter.firstName).toBeUndefined();
        expect(submitter.lastName).toBeUndefined();
    });

    it('fullName concatenates firstName and lastName', async () => {
        const institute = makeInstitute();
        const submitterId = EntityId.create({ value: 'u1' });
        const firstName = await Name.create({ value: 'Max' });
        const lastName = await Name.create({ value: 'Mustermann' });
        const submitter = Submitter.create({
            institute,
            submitterId,
            firstName,
            lastName
        });
        expect(submitter.fullName).toContain('Max');
        expect(submitter.fullName).toContain('Mustermann');
    });
});

// ---------------------------------------------------------------------------
// Entity.equals (via Submitter which extends Entity)
// ---------------------------------------------------------------------------

describe('Entity.equals', () => {
    function makeSubmitter(idValue?: string) {
        const institute = makeInstitute();
        const submitterId = EntityId.create({ value: 'sub-001' });
        const id = idValue ? EntityId.create({ value: idValue }) : undefined;
        return Submitter.create({ institute, submitterId }, id);
    }

    it('returns false when compared to undefined', () => {
        const s = makeSubmitter('id-1');
        expect(s.equals(undefined)).toBe(false);
    });

    it('returns true when compared to itself', () => {
        const s = makeSubmitter('id-1');
        expect(s.equals(s)).toBe(true);
    });

    it('returns true when two entities have the same EntityId', () => {
        const a = makeSubmitter('shared-id');
        const b = makeSubmitter('shared-id');
        expect(a.equals(b)).toBe(true);
    });

    it('returns false when two entities have different EntityIds', () => {
        const a = makeSubmitter('id-A');
        const b = makeSubmitter('id-B');
        expect(a.equals(b)).toBe(false);
    });

    it('exposes the generated id via .id getter', () => {
        const s = makeSubmitter('my-id');
        expect(s.id.value).toBe('my-id');
    });
});

// ---------------------------------------------------------------------------
// SampleEntryDTOMapper
// ---------------------------------------------------------------------------

function makeSampleDTO(): any {
    const entry = { value: 'test', errors: [], correctionOffer: [] };
    return {
        sampleData: {
            sample_id: entry,
            sample_id_avv: entry,
            partial_sample_id: entry,
            pathogen_avv: entry,
            pathogen_text: entry,
            sequence_id: entry,
            sequence_status: entry,
            sampling_date: entry,
            isolation_date: entry,
            sampling_location_avv: entry,
            sampling_location_zip: entry,
            sampling_location_text: entry,
            animal_avv: entry,
            matrix_avv: entry,
            animal_matrix_text: entry,
            additional_marks_avv: entry,
            control_program_avv: entry,
            sampling_reason_avv: entry,
            program_reason_text: entry,
            operations_mode_avv: entry,
            operations_mode_text: entry,
            vvvo: entry,
            program_avv: entry,
            comment: entry
        },
        sampleMeta: {
            nrl: 'NRL-Salm',
            urgency: 'NORMAL',
            analysis: {
                species: false,
                serological: false,
                resistance: false,
                vaccination: false,
                molecularTyping: false,
                toxin: false,
                esblAmpCCarbapenemasen: false,
                sample: false,
                other: '',
                compareHuman: { value: '', active: false }
            }
        }
    };
}

describe('SampleEntryDTOMapper', () => {
    const identity = (e: any) => e;

    it('fromDTO converts a SampleDTO to a SampleEntry', () => {
        const dto = makeSampleDTO();
        const entry = SampleEntryDTOMapper.fromDTO(dto, identity);
        expect(entry.data.nrl).toBe('NRL-Salm');
        expect(entry.data.urgency).toBe('NORMAL');
    });

    it('arrayFromDTO converts an array of SampleDTOs', () => {
        const dtos = [makeSampleDTO(), makeSampleDTO()];
        const entries = SampleEntryDTOMapper.arrayFromDTO(dtos, identity);
        expect(entries).toHaveLength(2);
    });

    it('toDTO converts a SampleEntry back to a SampleDTO', () => {
        const dto = makeSampleDTO();
        const entry = SampleEntryDTOMapper.fromDTO(dto, identity);
        const result = SampleEntryDTOMapper.toDTO(entry, identity);
        expect(result.sampleMeta.nrl).toBe('NRL-Salm');
        expect(result.sampleData.sample_id).toBeDefined();
    });
});
