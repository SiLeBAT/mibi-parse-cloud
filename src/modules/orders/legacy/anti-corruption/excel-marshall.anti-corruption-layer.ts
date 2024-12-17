import { NRLId } from '../../../shared/domain/valueObjects';
import {
    FileInformation,
    Order,
    SampleEntry,
    SampleEntryTuple
} from '../../domain';
import { SampleService } from '../application/sample.service';
import { fromUrgencyStringToEnum } from './urgency.mapper';
import { Sample } from '../model/sample.entity';

export class ExcelMarshallAntiCorruptionLayer {
    constructor(private sampleService: SampleService) {}

    async convertToExcel(
        order: Order<SampleEntry<SampleEntryTuple>[]>
    ): Promise<FileInformation> {
        const props = await this.sampleService.convertToExcel({
            samples: order.sampleEntryCollection.map(
                (entry: SampleEntry<SampleEntryTuple>) => {
                    const data = {
                        sample_id: {
                            value: entry.data.sample_id.value,
                            oldValue: entry.data.sample_id.oldValue,
                            errors: [],
                            correctionOffer: []
                        },
                        sample_id_avv: {
                            value: entry.data.sample_id_avv.value,
                            oldValue: entry.data.sample_id_avv.oldValue,
                            errors: [],
                            correctionOffer: []
                        },
                        partial_sample_id: {
                            value: entry.data.partial_sample_id.value,
                            oldValue: entry.data.partial_sample_id.oldValue,
                            errors: [],
                            correctionOffer: []
                        },
                        pathogen_avv: {
                            value: entry.data.pathogen_avv.value,
                            oldValue: entry.data.pathogen_avv.oldValue,
                            errors: [],
                            correctionOffer: []
                        },
                        pathogen_text: {
                            value: entry.data.pathogen_text.value,
                            oldValue: entry.data.pathogen_text.oldValue,
                            errors: [],
                            correctionOffer: []
                        },
                        sampling_date: {
                            value: entry.data.sampling_date.value,
                            oldValue: entry.data.sampling_date.oldValue,
                            errors: [],
                            correctionOffer: []
                        },
                        isolation_date: {
                            value: entry.data.isolation_date.value,
                            oldValue: entry.data.isolation_date.oldValue,
                            errors: [],
                            correctionOffer: []
                        },
                        sampling_location_avv: {
                            value: entry.data.sampling_location_avv.value,
                            oldValue: entry.data.sampling_location_avv.oldValue,
                            errors: [],
                            correctionOffer: []
                        },
                        sampling_location_zip: {
                            value: entry.data.sampling_location_zip.value,
                            oldValue: entry.data.sampling_location_zip.oldValue,
                            errors: [],
                            correctionOffer: []
                        },
                        sampling_location_text: {
                            value: entry.data.sampling_location_text.value,
                            oldValue:
                                entry.data.sampling_location_text.oldValue,
                            errors: [],
                            correctionOffer: []
                        },
                        animal_avv: {
                            value: entry.data.animal_avv.value,
                            oldValue: entry.data.animal_avv.oldValue,
                            errors: [],
                            correctionOffer: []
                        },
                        matrix_avv: {
                            value: entry.data.matrix_avv.value,
                            oldValue: entry.data.matrix_avv.oldValue,
                            errors: [],
                            correctionOffer: []
                        },
                        animal_matrix_text: {
                            value: entry.data.animal_matrix_text.value,
                            oldValue: entry.data.animal_matrix_text.oldValue,
                            errors: [],
                            correctionOffer: []
                        },
                        primary_production_avv: {
                            value: entry.data.primary_production_avv.value,
                            oldValue:
                                entry.data.primary_production_avv.oldValue,
                            errors: [],
                            correctionOffer: []
                        },
                        control_program_avv: {
                            value: entry.data.control_program_avv.value,
                            oldValue: entry.data.control_program_avv.oldValue,
                            errors: [],
                            correctionOffer: []
                        },
                        sampling_reason_avv: {
                            value: entry.data.sampling_reason_avv.value,
                            oldValue: entry.data.sampling_reason_avv.oldValue,
                            errors: [],
                            correctionOffer: []
                        },
                        program_reason_text: {
                            value: entry.data.program_reason_text.value,
                            oldValue: entry.data.program_reason_text.oldValue,
                            errors: [],
                            correctionOffer: []
                        },
                        operations_mode_avv: {
                            value: entry.data.operations_mode_avv.value,
                            oldValue: entry.data.operations_mode_avv.oldValue,
                            errors: [],
                            correctionOffer: []
                        },
                        operations_mode_text: {
                            value: entry.data.operations_mode_text.value,
                            oldValue: entry.data.operations_mode_text.oldValue,
                            errors: [],
                            correctionOffer: []
                        },
                        vvvo: {
                            value: entry.data.vvvo.value,
                            oldValue: entry.data.vvvo.oldValue,
                            errors: [],
                            correctionOffer: []
                        },
                        program_avv: {
                            value: entry.data.program_avv.value,
                            oldValue: entry.data.program_avv.oldValue,
                            errors: [],
                            correctionOffer: []
                        },
                        comment: {
                            value: entry.data.comment.value,
                            oldValue: entry.data.comment.oldValue,
                            errors: [],
                            correctionOffer: []
                        }
                    };
                    const meta = {
                        nrl: NRLId.create(entry.data.nrl).value,
                        urgency: fromUrgencyStringToEnum(entry.data.urgency),
                        analysis: entry.data.analysis
                    };
                    return Sample.create(data, meta);
                }
            ),
            meta: {
                sender: {
                    instituteName: order.customer.contact.instituteName,
                    street: order.customer.contact.street,
                    zip: order.customer.contact.zip,
                    city: order.customer.contact.city,
                    contactPerson: order.customer.fullName,
                    telephone: order.customer.contact.telephone,
                    email: order.customer.contact.email.value
                },
                fileName: order.submissionFormInfo?.fileName || '',
                customerRefNumber: order.customer.customerRefNumber,
                signatureDate: order.signatureDate,
                version: order.submissionFormInfo?.version || ''
            }
        });
        return FileInformation.create(props);
    }
}
