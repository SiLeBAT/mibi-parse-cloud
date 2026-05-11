import { setLoggingContext } from '../../../shared/core/logging-context';
import { EntityId } from '../../../shared/domain/valueObjects';
import { HTTPRequest } from '../../../shared/infrastructure';
import {
    AnnotatedSampleDataEntry,
    Order,
    SampleEntry,
    SampleEntryTuple,
    SampleSet
} from '../../domain';
import { SERVER_ERROR_CODE } from '../../domain/enums';
import { OrderDTO, SampleDTO } from '../../dto';
import { SampleEntryDTOMapper } from '../../mappers';
import { OrderDTOMapper } from '../../mappers/order-dto.mapper';
import { createSubmitterId } from '../create-submitter-id';
import { OrderSavingError, saveOrder } from '../save-order';
import { validateOrder } from '../validate-order';
import {
    AutoCorrectedInputError,
    InvalidInputError,
    OrderSubmissionError
} from './submit-order.error';
import { submitOrderUseCase } from './submit-order.use-case';

type SubmitOrderRequestParameters = {
    readonly order: OrderDTO;
    readonly comment?: string;
    readonly receiveAs?: string;
    readonly userEmail: string;
};
type SubmitOrderRequest = HTTPRequest<SubmitOrderRequestParameters>;

type SubmitOrderResponseDTO = {
    order: OrderDTO;
};

type SampleEntryCollection = SampleEntry<AnnotatedSampleDataEntry>[];

type ErrorDTO = {
    code: number;
    message: string;
};

export interface DefaultServerErrorDTO extends ErrorDTO {}
export interface InvalidInputErrorDTO extends DefaultServerErrorDTO {
    order: OrderDTO;
}

export interface AutoCorrectedInputErrorDTO extends DefaultServerErrorDTO {
    order: OrderDTO;
}

export interface OrderSavingErrorDTO extends DefaultServerErrorDTO {
    order: OrderDTO;
}

export interface OrderSubmissionErrorDTO extends DefaultServerErrorDTO {
    order: OrderDTO;
}

const submitOrderController = async (
    request: SubmitOrderRequest
): Promise<SubmitOrderResponseDTO | ErrorDTO> => {
    const requestDTO: SubmitOrderRequestParameters = request.params;
    try {
        // Setting the logging context manually because the catch block requires request information.
        setLoggingContext(request.log);

        const submitterId: EntityId = await createSubmitterId.execute(request);
        const order: Order<SampleEntryCollection> =
            await OrderDTOMapper.fromDTO(
                requestDTO.order,
                requestDTO.comment,
                samples => {
                    return samples.map((sample: SampleDTO) => {
                        return SampleEntryDTOMapper.fromDTO(sample, t => ({
                            value: t.value,
                            errors: t.errors || [],
                            correctionOffer: t.correctionOffer || [],
                            oldValue: t.oldValue
                        }));
                    });
                }
            );

        // Step 1: Validate the order.
        const sampleSet = SampleSet.create({
            data: order.sampleEntryCollection
        });
        const validatedSampleSet = await validateOrder.execute({
            submitterId,
            sampleSet
        });

        if (validatedSampleSet.hasErrors()) {
            throw new InvalidInputError(
                'Input validation failed',
                new Error('Input validation failed')
            );
        }
        if (validatedSampleSet.hasAutoCorrections()) {
            throw new AutoCorrectedInputError(
                'Has been auto-corrected',
                new Error('Has been auto-corrected')
            );
        }

        const validatedOrderDTO: OrderDTO = {
            sampleSet: {
                samples: validatedSampleSet.data.map(
                    (sampleEntry: SampleEntry<SampleEntryTuple>) =>
                        SampleEntryDTOMapper.toDTO(sampleEntry, t => t)
                ),
                meta: requestDTO.order.sampleSet.meta
            }
        };

        // Step 2: Save the order — throws OrderSavingError on failure (internal rollback already done).
        const savedOrderDTO = await saveOrder.execute({
            order: validatedOrderDTO,
            userId: submitterId
        });

        // Step 3: Submit the order — on failure, roll back the save to keep the two steps transactional.
        try {
            await submitOrderUseCase.execute({
                order,
                savedOrder: savedOrderDTO,
                submitterId
            });
        } catch (submitError) {
            await saveOrder.rollback(savedOrderDTO);
            throw new OrderSubmissionError(
                'Order was saved but submission failed; the saved order and samples have been rolled back.',
                submitError
            );
        }

        return { order: savedOrderDTO };
    } catch (error) {
        if (error instanceof InvalidInputError) {
            const errorDTO: InvalidInputErrorDTO = {
                code: SERVER_ERROR_CODE.INVALID_INPUT,
                message: 'Contains errors',
                order: requestDTO.order
            };
            return errorDTO;
        } else if (error instanceof AutoCorrectedInputError) {
            const errorDTO: AutoCorrectedInputErrorDTO = {
                code: SERVER_ERROR_CODE.AUTOCORRECTED_INPUT,
                message: 'Has been auto-corrected',
                order: requestDTO.order
            };
            return errorDTO;
        } else if (error instanceof OrderSavingError) {
            const dto: OrderSavingErrorDTO = {
                code: SERVER_ERROR_CODE.ORDER_SAVING_FAILED,
                message:
                    'The order was validated successfully but could not be saved to the database. Please try again.',
                order: requestDTO.order
            };
            return dto;
        } else if (error instanceof OrderSubmissionError) {
            const dto: OrderSubmissionErrorDTO = {
                code: SERVER_ERROR_CODE.ORDER_SUBMISSION_FAILED,
                message:
                    'The order was saved successfully but the submission step failed. The saved order has been rolled back. Please try again.',
                order: requestDTO.order
            };
            return dto;
        } else {
            const dto: DefaultServerErrorDTO = {
                code: SERVER_ERROR_CODE.UNKNOWN_ERROR,
                message: 'An unknown error occured'
            };
            return dto;
        }
    } finally {
        setLoggingContext(null);
    }
};

export { submitOrderController };
