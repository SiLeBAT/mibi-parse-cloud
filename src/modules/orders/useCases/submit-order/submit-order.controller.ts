import { setLoggingContext } from '../../../shared/core/logging-context';
import { EntityId } from '../../../shared/domain/valueObjects';
import { HTTPRequest } from '../../../shared/infrastructure';
import {
    AnnotatedSampleDataEntry,
    Order,
    SampleEntry,
    SampleEntryTuple
} from '../../domain';
import { SERVER_ERROR_CODE } from '../../domain/enums';
import { OrderDTO, SampleDTO } from '../../dto';
import { SampleEntryDTOMapper } from '../../mappers';
import { OrderDTOMapper } from '../../mappers/order-dto.mapper';
import { createSubmitterId } from '../create-submitter-id';
import {
    AutoCorrectedInputError,
    InvalidInputError
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
const submitOrderController = async (
    request: SubmitOrderRequest
): Promise<SubmitOrderResponseDTO | ErrorDTO> => {
    const requestDTO: SubmitOrderRequestParameters = request.params;
    try {
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

        const validatedSubmission = await submitOrderUseCase.execute({
            order,
            submitterId
        });

        const result = {
            order: {
                sampleSet: {
                    samples: validatedSubmission.data.map(
                        (sampleEntry: SampleEntry<SampleEntryTuple>) => {
                            return SampleEntryDTOMapper.toDTO(
                                sampleEntry,
                                t => t
                            );
                        }
                    ),
                    meta: requestDTO.order.sampleSet.meta
                }
            }
        };

        return result;
    } catch (error) {
        request.log.error(JSON.stringify(error));
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
