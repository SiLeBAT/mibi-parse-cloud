import { loggedController } from '../../../shared/core/controller';
import { HTTPRequest } from '../../../shared/infrastructure/request';
import {
    SampleEntry,
    SampleEntryV18,
    SampleEntryTuple,
    SampleEntryV18Tuple,
    SampleSet,
    SampleSetV18
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

const validateOrderController = loggedController(
    async (request: ValidateOrderRequest): Promise<ValidateOrderResponse> => {
        let submitterId = null;
        try {
            submitterId = await createSubmitterId.execute(request);
        } catch (error) {
            request.log.warn(
                'Unable to determine submitter from request. SubmitterId not set.'
            );
            request.log.warn(error.message);
        }
        try {
            const submittedOrder: ValidateOrderRequestParameters =
                request.params;
            const version = submittedOrder.order.sampleSet.meta.version || '18';
            const sampleData:
                | SampleEntry<SampleEntryTuple>[]
                | SampleEntryV18<SampleEntryV18Tuple>[] = submittedOrder.order.sampleSet.samples.map(
                (sample: SampleDTO) => {
                    return SampleEntryDTOMapper.fromDTO(version)(
                        sample,
                        t => t
                    );
                }
            );
            const sampleSet = sampleSetCreator(version)({ data: sampleData });

            const validatedSubmission: SampleSet | SampleSetV18 =
                await validateOrder.execute({
                    submitterId,
                    sampleSet
                });

            const result: OrderContainerDTO = {
                order: {
                    sampleSet: {
                        samples: validatedSubmission.data.map(sampleEntry => {
                            return SampleEntryDTOMapper.toDTO(version)(
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                sampleEntry as any,
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                (t: any) => t as any
                            );
                        }),
                        meta: submittedOrder.order.sampleSet.meta
                    }
                }
            };

            return result;
        } catch (error) {
            throw new OrderValidationFailedError(
                'Unable to validate order',
                error
            );
        }
    }
);
function sampleSetCreator(version: string) {
    switch (version) {
        case '17':
            return SampleSet.create;
        case '18':
        default: {
            return SampleSetV18.create;
        }
    }
}

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
