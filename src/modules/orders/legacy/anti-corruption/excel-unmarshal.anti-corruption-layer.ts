import { Email } from '../../../shared/domain/valueObjects';
import {
    Contact,
    Customer,
    Order,
    SampleEntry,
    SampleEntryTuple,
    SubmissionFormInfo
} from '../../domain';
import { ExcelUnmarshalService } from '../application/excel-unmarshal.service';
import { SampleSheetService } from '../application/sample-sheet.service';
import {
    UnmarshalSample,
    UnmarshalSampleSheet,
    UnmarshalSampleSet
} from '../model/legacy.model';

export class ExcelUnmarshalAntiCorruptionLayer {
    constructor(
        private excelUnmarshalService: ExcelUnmarshalService,
        private sampleSheetService: SampleSheetService
    ) {}

    async convertExcelToJSJson(buffer: Buffer, fileName: string) {
        const legacySampleSheet: UnmarshalSampleSheet =
            await this.excelUnmarshalService.convertExcelToJSJson(
                buffer,
                fileName
            );

        const legacySampleSet =
            this.sampleSheetService.fromSampleSheetToSampleSet(
                legacySampleSheet
            );

        const order: Order<SampleEntry<SampleEntryTuple>[]> =
            await this.convertFromLegacy(legacySampleSet);

        return order;
    }

    private async convertFromLegacy(
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
