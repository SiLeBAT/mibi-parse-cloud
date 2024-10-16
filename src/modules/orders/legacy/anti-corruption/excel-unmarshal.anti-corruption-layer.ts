import { Email, Name } from '../../../shared/domain/valueObjects';
import {
    Contact,
    Customer,
    Order,
    SampleEntry,
    SampleEntryTuple,
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
        const order: Order<SampleEntry<SampleEntryTuple>[]> =
            await this.convertFromLegacy(legacySampleSheet);
        return order;
    }

    private async convertFromLegacy(
        sampleSheet: UnmarshalSampleSheet
    ): Promise<Order<SampleEntry<SampleEntryTuple>[]>> {
        const contact = Contact.create({
            ...sampleSheet.meta.sender,
            email: await Email.create({ value: sampleSheet.meta.sender.email }),
            stateShort: Bundesland.UNKNOWN
        });

        const customer = Customer.create({
            contact: contact,
            firstName: sampleSheet.meta.sender.contactPerson.split(' ')[0]
                ? await Name.create({
                      value: sampleSheet.meta.sender.contactPerson.split(' ')[0]
                  })
                : undefined,
            lastName: sampleSheet.meta.sender.contactPerson.split(' ')[1]
                ? await Name.create({
                      value: sampleSheet.meta.sender.contactPerson.split(' ')[1]
                  })
                : undefined,
            customerRefNumber: sampleSheet.meta.customerRefNumber || ''
        });

        const order = Order.create({
            sampleEntryCollection: sampleSheet.samples.map(
                (s: UnmarshalSample) =>
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
                fileName: sampleSheet.meta.fileName || '',
                version: sampleSheet.meta.version || ''
            }),
            signatureDate: sampleSheet.meta.signatureDate || '',
            comment: ''
        });

        return order;
    }
}
