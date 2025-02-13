import { Order, OrderProps, SubmissionFormInfo } from '../domain';
import { OrderDTO, SampleDTO } from '../dto/submission.dto';

import { Mapper, MappingError } from '../../shared/mappers';
import { CustomerDTOMapper } from './customer-dto.mapper';

export class OrderDTOMapper extends Mapper {
    static toDTO<T>(
        order: Order<T>,
        mapperFunction: (sampleEntryCollection: T) => SampleDTO[]
    ): OrderDTO {
        try {
            return {
                sampleSet: {
                    samples: mapperFunction(order.sampleEntryCollection),
                    meta: {
                        sender: {
                            instituteName: order.customer.contact.instituteName,
                            department: order.customer.contact.department,
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
                }
            };
        } catch (error) {
            throw new ToOrderDTOMappingError(
                'Unable to map Order to OrderDTO',
                error
            );
        }
    }

    static async fromDTO<T>(
        order: OrderDTO,
        comment: string = '',
        mapperFunction: (sample: SampleDTO[]) => T
    ): Promise<Order<T>> {
        try {
            const props: OrderProps<T> = {
                sampleEntryCollection: mapperFunction(order.sampleSet.samples),
                customer: await CustomerDTOMapper.fromDTO(order.sampleSet.meta),
                submissionFormInfo: SubmissionFormInfo.create({
                    fileName: order.sampleSet.meta.fileName || '',
                    version: order.sampleSet.meta.version || ''
                }),
                signatureDate: order.sampleSet.meta.signatureDate || '',
                comment: comment
            };
            return Order.create(props);
        } catch (error) {
            throw new ToOrderMappingError(
                'Unable to map OrderDTO to Order',
                error
            );
        }
    }
}

export class ToOrderDTOMappingError extends MappingError {}
export class ToOrderMappingError extends MappingError {}
