import { HTTPRequest } from '../../../shared/infrastructure/request';
import {
    AnnotatedSampleDataEntry,
    SampleEntry,
    SampleEntryTuple,
    SampleSet
} from '../../domain';
import { OrderContainerDTO, SampleDTO } from '../../dto';
import { SampleEntryDTOMapper } from '../../mappers';
import { createSubmitterId } from '../create-submitter-id';

import { OrderValidationFailedError } from './validate-order.error';
import { validateOrder } from './validate-order.use-case';

type ValidateOrderResponse = OrderContainerDTO;
interface ValidateOrderRequestParameters extends OrderContainerDTO {
    userEmail: string;
}
type ValidateOrderRequest = HTTPRequest<ValidateOrderRequestParameters>;


/*
 * The job of the Controller is simply to:
 * 1) Accept the input
 * 2) Transform the input DTO to a useful domain object
 * 3) Call the use cases using the objects
 * 4) Transform the use case result to a DTO and return to caller.
 * Request validation is handled previously by the validator function.
 */

const validateOrderController = async (
    request: ValidateOrderRequest
): Promise<ValidateOrderResponse> => {
    let submitterId = null;
    try {
        submitterId = await createSubmitterId.execute(request);
    } catch (error) {
        request.log.error("Unable to determine submitter. SubmitterId not set.")
        request.log.error(error.message)
    }
    try {

        const submittedOrder: ValidateOrderRequestParameters = request.params;

        const sampleData: SampleEntry<SampleEntryTuple>[] =
            submittedOrder.order.sampleSet.samples.map((sample: SampleDTO) => {
                return SampleEntryDTOMapper.fromDTO(sample, t => t);
            });

        const sampleSet = SampleSet.create({ data: sampleData });

        const validatedSubmission: SampleSet = await validateOrder.execute({
            submitterId,
            sampleSet
        });

        const result: OrderContainerDTO = {
            order: {
                sampleSet: {
                    samples: validatedSubmission.data.map(
                        (
                            sampleEntry: SampleEntry<AnnotatedSampleDataEntry>
                        ) => {
                            return SampleEntryDTOMapper.toDTO(
                                sampleEntry,
                                t => t
                            );
                        }
                    ),
                    meta: submittedOrder.order.sampleSet.meta
                }
            }
        };

        return result;
    } catch (error) {
        throw new OrderValidationFailedError('Unable to validate order', error);
    }
};

const ValidateOrderRequestValidation = {
    fields: {
        order: {
            required: true,
            type: Object,
            error: 'order is a required field'
        }
    }
};
export { validateOrderController, ValidateOrderRequestValidation };
