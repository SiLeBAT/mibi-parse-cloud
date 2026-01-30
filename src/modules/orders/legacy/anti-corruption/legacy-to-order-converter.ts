import {
    AnySampleEntry,
    Contact,
    Customer,
    Order,
    SampleEntry,
    SampleEntryTuple,
    SampleEntryV18,
    SampleEntryV18Tuple,
    SubmissionFormInfo
} from '../../../orders/domain';
import {
    ExcelVersion,
    UnmarshalSample,
    UnmarshalSampleSet
} from '../model/legacy.model';
import { Email } from '../../../shared/domain/valueObjects';

export interface LegacyConverterStrategy {
    convertFromLegacy(
        sampleSet: UnmarshalSampleSet
    ): Promise<Order<AnySampleEntry[]>>;
}

export class LegacyConverterFactory {
    private readonly strategies = {
        [ExcelVersion.V17]: new LegacyConverterV17(),
        [ExcelVersion.V18]: new LegacyConverterV18()
    };

    getLegacyConverter(
        version: string | undefined | null
    ): LegacyConverterStrategy {
        const excelVersion = this.parseVersion(version);
        const strategy =
            this.strategies[excelVersion] ?? this.strategies[ExcelVersion.V18];

        return strategy;
    }

    private parseVersion(version: string | undefined | null): ExcelVersion {
        const excelVersion = String(version ?? '')
            .trim()
            .toUpperCase()
            .replace(/^V/, '');

        switch (excelVersion) {
            case ExcelVersion.V17:
                return ExcelVersion.V17;
            case ExcelVersion.V18:
                return ExcelVersion.V18;
            default:
                return ExcelVersion.V18;
        }
    }
}

export class LegacyConverterV17 implements LegacyConverterStrategy {
    async convertFromLegacy(
        sampleSet: UnmarshalSampleSet
    ): Promise<Order<SampleEntry<SampleEntryTuple>[]>> {
        const contact = Contact.create({
            ...sampleSet.meta.sender,
            email: await Email.create({ value: sampleSet.meta.sender.email })
        });

        const customer = Customer.create({
            contact: contact,
            customerRefNumber: sampleSet.meta.customerRefNumber || ''
        });

        const order = Order.create({
            sampleEntryCollection: sampleSet.samples.map((s: UnmarshalSample) =>
                SampleEntry.create({
                    sample_id: s.data.sample_id,
                    sample_id_avv: s.data.sample_id_avv,
                    partial_sample_id: s.data.partial_sample_id,
                    pathogen_avv: s.data.pathogen_avv,
                    pathogen_text: s.data.pathogen_text,
                    sampling_date: s.data.sampling_date,
                    isolation_date: s.data.isolation_date,
                    sampling_location_avv: s.data.sampling_location_avv,
                    sampling_location_zip: s.data.sampling_location_zip,
                    sampling_location_text: s.data.sampling_location_text,
                    animal_avv: s.data.animal_avv,
                    matrix_avv: s.data.matrix_avv,
                    animal_matrix_text: s.data.animal_matrix_text,
                    primary_production_avv: s.data.primary_production_avv,
                    control_program_avv: s.data.control_program_avv,
                    sampling_reason_avv: s.data.sampling_reason_avv,
                    program_reason_text: s.data.program_reason_text,
                    operations_mode_avv: s.data.operations_mode_avv,
                    operations_mode_text: s.data.operations_mode_text,
                    vvvo: s.data.vvvo,
                    program_avv: s.data.program_avv,
                    comment: s.data.comment,
                    nrl: s.meta.nrl,
                    urgency: s.meta.urgency,
                    analysis: s.meta.analysis
                })
            ),
            customer,
            submissionFormInfo: SubmissionFormInfo.create({
                fileName: sampleSet.meta.fileName || '',
                version: sampleSet.meta.version || ''
            }),
            signatureDate: sampleSet.meta.signatureDate || '',
            comment: ''
        });

        return order;
    }
}

export class LegacyConverterV18 implements LegacyConverterStrategy {
    async convertFromLegacy(
        sampleSet: UnmarshalSampleSet
    ): Promise<Order<SampleEntryV18<SampleEntryV18Tuple>[]>> {
        const contact = Contact.create({
            ...sampleSet.meta.sender,
            email: await Email.create({ value: sampleSet.meta.sender.email })
        });

        const customer = Customer.create({
            contact: contact,
            customerRefNumber: sampleSet.meta.customerRefNumber || ''
        });

        const order = Order.create({
            sampleEntryCollection: sampleSet.samples.map((s: UnmarshalSample) =>
                SampleEntryV18.create({
                    sample_id: s.data.sample_id,
                    sample_id_avv: s.data.sample_id_avv,
                    partial_sample_id: s.data.partial_sample_id,
                    pathogen_avv: s.data.pathogen_avv,
                    pathogen_text: s.data.pathogen_text,
                    sequence_id: s.data.sequence_id,
                    sequence_status: s.data.sequence_status,
                    sampling_date: s.data.sampling_date,
                    isolation_date: s.data.isolation_date,
                    sampling_location_avv: s.data.sampling_location_avv,
                    sampling_location_zip: s.data.sampling_location_zip,
                    sampling_location_text: s.data.sampling_location_text,
                    animal_avv: s.data.animal_avv,
                    matrix_avv: s.data.matrix_avv,
                    animal_matrix_text: s.data.animal_matrix_text,
                    primary_production_avv: s.data.primary_production_avv,
                    control_program_avv: s.data.control_program_avv,
                    sampling_reason_avv: s.data.sampling_reason_avv,
                    program_reason_text: s.data.program_reason_text,
                    operations_mode_avv: s.data.operations_mode_avv,
                    operations_mode_text: s.data.operations_mode_text,
                    vvvo: s.data.vvvo,
                    program_avv: s.data.program_avv,
                    comment: s.data.comment,
                    nrl: s.meta.nrl,
                    urgency: s.meta.urgency,
                    analysis: s.meta.analysis
                })
            ),
            customer,
            submissionFormInfo: SubmissionFormInfo.create({
                fileName: sampleSet.meta.fileName || '',
                version: sampleSet.meta.version || ''
            }),
            signatureDate: sampleSet.meta.signatureDate || '',
            comment: ''
        });

        return order;
    }
}

const legacyConverterFactory = new LegacyConverterFactory();
export { legacyConverterFactory };
