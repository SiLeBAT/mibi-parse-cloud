import { Email, Name } from '../../../shared/domain/valueObjects';
import {
    Contact,
    Customer,
    Order,
    SampleEntry,
    SubmissionFormInfo
} from '../../domain';
import { Bundesland } from '../../domain/enums';
import { ExcelUnmarshalService } from '../application/excel-unmarshal.service';
import { UnmarshalSample, UnmarshalSampleSheet } from '../model/legacy.model';

export class ExcelUnmarshalAntiCorruptionLayer {
    constructor(private excelUnmarshalService: ExcelUnmarshalService) {}

    async convertExcelToJSJson(buffer: Buffer, fileName: string) {
        const legacySampleSheet: UnmarshalSampleSheet =
            await this.excelUnmarshalService.convertExcelToJSJson(
                buffer,
                fileName
            );

        const order: Order<SampleEntry<string>[]> =
            await this.convertFromLegacy(legacySampleSheet);
        return order;
    }

    private async convertFromLegacy(
        sampleSheet: UnmarshalSampleSheet
    ): Promise<Order<SampleEntry<string>[]>> {
        const contact = Contact.create({
            ...sampleSheet.meta.sender,
            email: await Email.create({ value: sampleSheet.meta.sender.email }),
            stateShort: Bundesland.UNKNOWN
        });
        return Order.create({
            sampleEntryCollection: sampleSheet.samples.map(
                (s: UnmarshalSample) =>
                    SampleEntry.create({
                        sample_id: s.data.sample_id.value,
                        sample_id_avv: s.data.sample_id_avv.value,
                        partial_sample_id: s.data.partial_sample_id.value,
                        pathogen_avv: s.data.pathogen_avv.value,
                        pathogen_text: s.data.pathogen_text.value,
                        sampling_date: s.data.sampling_date.value,
                        isolation_date: s.data.isolation_date.value,
                        sampling_location_avv:
                            s.data.sampling_location_avv.value,
                        sampling_location_zip:
                            s.data.sampling_location_zip.value,
                        sampling_location_text:
                            s.data.sampling_location_text.value,
                        animal_avv: s.data.animal_avv.value,
                        matrix_avv: s.data.matrix_avv.value,
                        animal_matrix_text: s.data.animal_matrix_text.value,
                        primary_production_avv:
                            s.data.primary_production_avv.value,
                        control_program_avv: s.data.control_program_avv.value,
                        sampling_reason_avv: s.data.sampling_reason_avv.value,
                        program_reason_text: s.data.program_reason_text.value,
                        operations_mode_avv: s.data.operations_mode_avv.value,
                        operations_mode_text: s.data.operations_mode_text.value,
                        vvvo: s.data.vvvo.value,
                        program_avv: s.data.program_avv.value,
                        comment: s.data.comment.value,
                        nrl: s.meta.nrl,
                        urgency: s.meta.urgency,
                        analysis: s.meta.analysis
                    })
            ),
            customer: Customer.create({
                contact: contact,
                firstName: await Name.create({
                    value: sampleSheet.meta.sender.contactPerson.split(' ')[0]
                }),
                lastName: await Name.create({
                    value: sampleSheet.meta.sender.contactPerson.split(' ')[1]
                }),
                customerRefNumber: sampleSheet.meta.customerRefNumber || ''
            }),
            submissionFormInfo: SubmissionFormInfo.create({
                fileName: sampleSheet.meta.fileName || '',
                version: sampleSheet.meta.version || ''
            }),
            signatureDate: sampleSheet.meta.signatureDate || '',
            comment: ''
        });
    }
}
