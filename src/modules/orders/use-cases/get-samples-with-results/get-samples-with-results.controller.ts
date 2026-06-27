import { loggedController } from '../../../shared/core/controller';
import { EmailValidationError } from '../../../shared/domain/valueObjects/email-validation.error';
import { HTTPRequest } from '../../../shared/infrastructure/request';
import { SERVER_ERROR_CODE } from '../../domain/enums';
import { SamplesWithResultsCollectionDTO } from '../../dto';
import { getSamplesWithResults } from './get-samples-with-results.use-case';
import {
    GetSamplesWithResultsError,
    OrderAccessForbiddenError,
    OrderNotFoundError
} from './get-samples-with-results.error';

type GetSamplesWithResultsRequestParameters = {
    readonly orderId: string;
    readonly userEmail: string;
};

type GetSamplesWithResultsRequest =
    HTTPRequest<GetSamplesWithResultsRequestParameters>;

type ErrorDTO = {
    code: number;
    message: string;
};

export interface EmailValidationErrorDTO extends ErrorDTO {}
export interface DefaultServerErrorDTO extends ErrorDTO {}

const getSamplesWithResultsController = loggedController(
    async (
        request: GetSamplesWithResultsRequest
    ): Promise<SamplesWithResultsCollectionDTO | ErrorDTO> => {
        try {
            const samples = await getSamplesWithResults.execute({
                orderId: request.params.orderId,
                userEmail: request.params.userEmail
            });
            return { orderId: request.params.orderId, samples };
        } catch (error) {
            if (error instanceof EmailValidationError) {
                const dto: EmailValidationErrorDTO = {
                    code: SERVER_ERROR_CODE.INVALID_EMAIL,
                    message: error.message
                };
                return dto;
            }

            if (error instanceof OrderNotFoundError) {
                return {
                    code: SERVER_ERROR_CODE.ORDER_NOT_FOUND,
                    message: error.message
                };
            }

            if (error instanceof OrderAccessForbiddenError) {
                return {
                    code: SERVER_ERROR_CODE.ORDER_ACCESS_FORBIDDEN,
                    message: error.message
                };
            }

            throw new GetSamplesWithResultsError(
                'Unable to get samples with results',
                error
            );
        }
    }
);

const GetSamplesWithResultsRequestValidation = {
    fields: {
        orderId: {
            required: true,
            type: String,
            error: 'orderId is a required field'
        },
        userEmail: {
            required: true,
            type: String,
            error: 'userEmail is a required field'
        }
    }
};

export {
    getSamplesWithResultsController,
    GetSamplesWithResultsRequestValidation
};
