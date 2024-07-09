import { Contact, Submission, SubmissionProps } from '../domain';
import { OrderDTO, SampleDTO } from '../dto/submission.dto';

import { Mapper, MappingError } from '../../shared/mappers';

export class SubmissionDTOMapper extends Mapper {
    static toDTO<T>(
        submission: Submission<T>,
        mapperFunction: (sampleEntryCollection: T) => SampleDTO[]
    ): OrderDTO {
        try {
            return {
                sampleSet: {
                    samples: mapperFunction(submission.sampleEntryCollection),
                    meta: {
                        sender: {
                            ...submission.contact.props
                        },
                        fileName: submission.fileName,
                        customerRefNumber: submission.customerRefNumber,
                        signatureDate: submission.signatureDate,
                        version: submission.version
                    }
                }
            };
        } catch (error) {
            throw new SubmissionToOrderDTOMappingError(
                'Unable to map Submission to OrderDTO',
                error
            );
        }
    }

    static fromDTO<T>(
        order: OrderDTO,
        mapperFunction: (sample: SampleDTO[]) => T
    ): Submission<T> {
        try {
            const props: SubmissionProps<T> = {
                sampleEntryCollection: mapperFunction(order.sampleSet.samples),
                contact: Contact.create({
                    ...order.sampleSet.meta.sender
                }),
                fileName: order.sampleSet.meta.fileName,
                customerRefNumber: order.sampleSet.meta.customerRefNumber,
                signatureDate: order.sampleSet.meta.signatureDate,
                version: order.sampleSet.meta.version
            };
            return Submission.create(props);
        } catch (error) {
            throw new OrderDTOToSubmissionMappingError(
                'Unable to map OrderDTO to Submission',
                error
            );
        }
    }
}

export class SubmissionToOrderDTOMappingError extends MappingError {}
export class OrderDTOToSubmissionMappingError extends MappingError {}
