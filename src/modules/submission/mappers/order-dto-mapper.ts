import {
    Contact,
    SampleEntry,
    SampleEntryProps,
    Submission,
    SubmissionProps
} from '../domain';
import {
    OrderDTO,
    SampleDTO
} from '../useCases/createSubmission/parse-submission-form.dto';

import { Mapper } from '../../shared/mappers';

export class OrderDTOMapper extends Mapper {
    static toDTO(submission: Submission): OrderDTO {
        return {
            sampleSet: {
                samples: submission.sampleEntryCollection.map(sampleEntry =>
                    SampleEntryDTOMapper.toDTO(sampleEntry)
                ),
                meta: {
                    sender: {
                        instituteName: submission.contact.props.instituteName,
                        street: submission.contact.props.street,
                        zip: submission.contact.props.zip,
                        city: submission.contact.props.city,
                        contactPerson: submission.contact.props.contactPerson,
                        telephone: submission.contact.props.telephone,
                        email: submission.contact.props.email
                    },
                    fileName: submission.fileName,
                    customerRefNumber: submission.customerRefNumber,
                    signatureDate: submission.signatureDate,
                    version: submission.version
                }
            }
        };
    }

    static fromDTO(order: OrderDTO): Submission {
        const props: SubmissionProps = {
            sampleEntryCollection: order.sampleSet.samples.map(sample =>
                SampleEntryDTOMapper.fromDTO(sample)
            ),
            contact: Contact.create({
                instituteName: order.sampleSet.meta.sender.instituteName,
                department: order.sampleSet.meta.sender.department,
                street: order.sampleSet.meta.sender.street,
                zip: order.sampleSet.meta.sender.zip,
                city: order.sampleSet.meta.sender.city,
                contactPerson: order.sampleSet.meta.sender.contactPerson,
                telephone: order.sampleSet.meta.sender.telephone,
                email: order.sampleSet.meta.sender.email
            }),
            fileName: order.sampleSet.meta.fileName,
            customerRefNumber: order.sampleSet.meta.customerRefNumber,
            signatureDate: order.sampleSet.meta.signatureDate,
            version: order.sampleSet.meta.version
        };
        return Submission.create(props);
    }
}

class SampleEntryDTOMapper extends Mapper {
    static toDTO(sampleEntry: SampleEntry): SampleDTO {
        return {
            sampleData: {
                sample_id: { value: sampleEntry.data.sample_id },
                sample_id_avv: { value: sampleEntry.data.sample_id_avv },
                partial_sample_id: {
                    value: sampleEntry.data.partial_sample_id
                },
                pathogen_avv: { value: sampleEntry.data.pathogen_avv },
                pathogen_text: { value: sampleEntry.data.pathogen_text },
                sampling_date: { value: sampleEntry.data.sampling_date },
                isolation_date: { value: sampleEntry.data.isolation_date },
                sampling_location_avv: {
                    value: sampleEntry.data.sampling_location_avv
                },
                sampling_location_zip: {
                    value: sampleEntry.data.sampling_location_zip
                },
                sampling_location_text: {
                    value: sampleEntry.data.sampling_location_text
                },
                animal_avv: { value: sampleEntry.data.animal_avv },
                matrix_avv: { value: sampleEntry.data.matrix_avv },
                animal_matrix_text: {
                    value: sampleEntry.data.animal_matrix_text
                },
                primary_production_avv: {
                    value: sampleEntry.data.primary_production_avv
                },
                control_program_avv: {
                    value: sampleEntry.data.control_program_avv
                },
                sampling_reason_avv: {
                    value: sampleEntry.data.sampling_reason_avv
                },
                program_reason_text: {
                    value: sampleEntry.data.program_reason_text
                },
                operations_mode_avv: {
                    value: sampleEntry.data.operations_mode_avv
                },
                operations_mode_text: {
                    value: sampleEntry.data.operations_mode_text
                },
                vvvo: { value: sampleEntry.data.vvvo },
                program_avv: { value: sampleEntry.data.program_avv },
                comment: { value: sampleEntry.data.comment }
            },
            sampleMeta: {
                nrl: sampleEntry.data.nrl,
                analysis: {
                    species: sampleEntry.data.analysis.species || false,
                    serological: sampleEntry.data.analysis.serological || false,
                    resistance: sampleEntry.data.analysis.resistance || false,
                    vaccination: sampleEntry.data.analysis.vaccination || false,
                    molecularTyping:
                        sampleEntry.data.analysis.molecularTyping || false,
                    toxin: sampleEntry.data.analysis.toxin || false,
                    esblAmpCCarbapenemasen:
                        sampleEntry.data.analysis.esblAmpCCarbapenemasen ||
                        false,
                    sample: sampleEntry.data.analysis.sample || false,
                    other: sampleEntry.data.analysis.other || '',
                    compareHuman: {
                        value:
                            sampleEntry.data.analysis.compareHuman?.value || '',
                        active:
                            sampleEntry.data.analysis.compareHuman?.active ||
                            false
                    }
                },
                urgency: sampleEntry.data.urgency
            }
        };
    }
    static fromDTO(sample: SampleDTO): SampleEntry {
        const props: SampleEntryProps = {
            sample_id: sample.sampleData.sample_id.value,
            sample_id_avv: sample.sampleData.sample_id_avv.value,
            partial_sample_id: sample.sampleData.partial_sample_id.value,
            pathogen_avv: sample.sampleData.pathogen_avv.value,
            pathogen_text: sample.sampleData.pathogen_text.value,
            sampling_date: sample.sampleData.sampling_date.value,
            isolation_date: sample.sampleData.isolation_date.value,
            sampling_location_avv:
                sample.sampleData.sampling_location_avv.value,
            sampling_location_zip:
                sample.sampleData.sampling_location_zip.value,
            sampling_location_text:
                sample.sampleData.sampling_location_text.value,
            animal_avv: sample.sampleData.animal_avv.value,
            matrix_avv: sample.sampleData.matrix_avv.value,
            animal_matrix_text: sample.sampleData.animal_matrix_text.value,
            primary_production_avv:
                sample.sampleData.primary_production_avv.value,
            control_program_avv: sample.sampleData.control_program_avv.value,
            sampling_reason_avv: sample.sampleData.sampling_reason_avv.value,
            program_reason_text: sample.sampleData.program_reason_text.value,
            operations_mode_avv: sample.sampleData.operations_mode_avv.value,
            operations_mode_text: sample.sampleData.operations_mode_text.value,
            vvvo: sample.sampleData.vvvo.value,
            program_avv: sample.sampleData.program_avv.value,
            comment: sample.sampleData.comment.value,
            nrl: sample.sampleMeta.nrl,
            urgency: sample.sampleMeta.urgency,
            analysis: sample.sampleMeta.analysis
        };
        return SampleEntry.create(props);
    }
}
