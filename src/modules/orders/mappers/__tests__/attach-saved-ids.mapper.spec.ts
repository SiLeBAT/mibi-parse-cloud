import { Email } from '../../../shared/domain/valueObjects';
import {
    AnnotatedSampleDataEntry,
    Contact,
    Order,
    SampleEntry,
    SampleEntryProps
} from '../../domain';
import { Customer } from '../../domain/customer.entity';
import { OrderDTO, SampleDTO } from '../../dto';
import { AttachSavedIdsMapper } from '../attach-saved-ids.mapper';

const makeAnnotated = (value: string): AnnotatedSampleDataEntry => ({
    value,
    errors: [],
    correctionOffer: []
});

const makeSampleEntry = (
    sampleId: string
): SampleEntry<AnnotatedSampleDataEntry> => {
    const props: SampleEntryProps<AnnotatedSampleDataEntry> = {
        sample_id: makeAnnotated(sampleId),
        sample_id_avv: makeAnnotated(''),
        partial_sample_id: makeAnnotated(''),
        pathogen_avv: makeAnnotated(''),
        pathogen_text: makeAnnotated(''),
        sequence_id: makeAnnotated(''),
        sequence_status: makeAnnotated(''),
        sampling_date: makeAnnotated(''),
        isolation_date: makeAnnotated(''),
        sampling_location_avv: makeAnnotated(''),
        sampling_location_zip: makeAnnotated(''),
        sampling_location_text: makeAnnotated(''),
        animal_avv: makeAnnotated(''),
        matrix_avv: makeAnnotated(''),
        animal_matrix_text: makeAnnotated(''),
        additional_marks_avv: makeAnnotated(''),
        control_program_avv: makeAnnotated(''),
        sampling_reason_avv: makeAnnotated(''),
        program_reason_text: makeAnnotated(''),
        operations_mode_avv: makeAnnotated(''),
        operations_mode_text: makeAnnotated(''),
        vvvo: makeAnnotated(''),
        program_avv: makeAnnotated(''),
        comment: makeAnnotated(''),
        nrl: '',
        urgency: '',
        analysis: {}
    };
    return SampleEntry.create(props);
};

const buildOrder = async (
    sampleIds: string[]
): Promise<Order<SampleEntry<AnnotatedSampleDataEntry>[]>> => {
    const email = await Email.create({ value: 'test@test.com' });
    const contact = Contact.create({
        instituteName: '',
        department: '',
        street: '',
        zip: '',
        city: '',
        contactPerson: '',
        telephone: '',
        email
    });
    const customer = Customer.create({
        contact,
        customerRefNumber: ''
    });
    return Order.create({
        sampleEntryCollection: sampleIds.map(makeSampleEntry),
        customer,
        submissionFormInfo: null,
        signatureDate: '',
        comment: ''
    });
};

const buildSavedOrderDTO = (
    orderObjectId: string | undefined,
    sampleObjectIds: (string | undefined)[]
): OrderDTO => {
    const samples: SampleDTO[] = sampleObjectIds.map(objectId => ({
        sampleData: {} as SampleDTO['sampleData'],
        sampleMeta: {} as SampleDTO['sampleMeta'],
        objectId
    }));
    return {
        objectId: orderObjectId,
        sampleSet: {
            samples,
            meta: {
                sender: {
                    instituteName: '',
                    street: '',
                    zip: '',
                    city: '',
                    contactPerson: '',
                    telephone: '',
                    email: ''
                }
            }
        }
    };
};

describe('AttachSavedIdsMapper', () => {
    it('attaches each saved objectId to the SampleEntry at the same index', async () => {
        const order = await buildOrder(['S1', 'S2', 'S3']);
        const savedOrder = buildSavedOrderDTO('order-1', [
            'oid-1',
            'oid-2',
            'oid-3'
        ]);

        const enriched = AttachSavedIdsMapper.attach(order, savedOrder);

        expect(enriched.id.value).toBe('order-1');
        const entries = enriched.sampleEntryCollection;
        expect(entries).toHaveLength(3);
        expect(entries[0].data.sample_id.value).toBe('S1');
        expect(entries[0].id.value).toBe('oid-1');
        expect(entries[1].data.sample_id.value).toBe('S2');
        expect(entries[1].id.value).toBe('oid-2');
        expect(entries[2].data.sample_id.value).toBe('S3');
        expect(entries[2].id.value).toBe('oid-3');
    });

    it('preserves order metadata from the domain order', async () => {
        const order = await buildOrder(['S1']);
        const savedOrder = buildSavedOrderDTO('order-1', ['oid-1']);

        const enriched = AttachSavedIdsMapper.attach(order, savedOrder);

        expect(enriched.customer).toBe(order.customer);
        expect(enriched.submissionFormInfo).toBe(order.submissionFormInfo);
        expect(enriched.signatureDate).toBe(order.signatureDate);
        expect(enriched.comment).toBe(order.comment);
    });

    it('throws if savedOrder is missing its objectId', async () => {
        const order = await buildOrder(['S1']);
        const savedOrder = buildSavedOrderDTO(undefined, ['oid-1']);

        expect(() => AttachSavedIdsMapper.attach(order, savedOrder)).toThrow(
            /savedOrder is missing objectId/
        );
    });

    it('throws if a saved sample is missing its objectId', async () => {
        const order = await buildOrder(['S1', 'S2']);
        const savedOrder = buildSavedOrderDTO('order-1', ['oid-1', undefined]);

        expect(() => AttachSavedIdsMapper.attach(order, savedOrder)).toThrow(
            /sample at index 1 is missing objectId/
        );
    });

    it('throws if sample counts differ between order and savedOrder', async () => {
        const order = await buildOrder(['S1', 'S2']);
        const savedOrder = buildSavedOrderDTO('order-1', ['oid-1']);

        expect(() => AttachSavedIdsMapper.attach(order, savedOrder)).toThrow(
            /sample count mismatch/
        );
    });
});
