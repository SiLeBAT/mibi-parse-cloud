import { loggedController } from '../../../shared/core/controller';
import { HTTPRequest } from '../../../shared/infrastructure/request';
import { SERVER_ERROR_CODE } from '../../domain/enums';
import { StoreResultsCollectionDTO, StoreResultsPayloadDTO } from '../../dto';
import {
    InvalidResultPayloadError,
    StoreResultsError,
    UnknownSamplesError
} from './store-results.error';
import { storeResults } from './store-results.use-case';

type StoreResultsRequestParameters = {
    readonly results: StoreResultsPayloadDTO;
};

type StoreResultsRequest = HTTPRequest<StoreResultsRequestParameters>;

type ErrorDTO = {
    code: number;
    message: string;
};

/**
 * Deliberately registered without a declarative field validation object: the
 * payload is a nested array, which Parse's `fields` spec cannot describe, and
 * a rejected validation surfaces as a Parse error rather than as the error DTO
 * the portal server maps to 422. Validation lives in the use case instead, so
 * every refusal comes back the same way.
 */
const storeResultsController = loggedController(
    async (
        request: StoreResultsRequest
    ): Promise<StoreResultsCollectionDTO | ErrorDTO> => {
        try {
            return await storeResults.execute({
                results: request.params.results
            });
        } catch (error) {
            if (error instanceof InvalidResultPayloadError) {
                return {
                    code: SERVER_ERROR_CODE.RESULTS_INVALID_PAYLOAD,
                    message: error.message
                };
            }

            if (error instanceof UnknownSamplesError) {
                return {
                    code: SERVER_ERROR_CODE.RESULTS_UNKNOWN_SAMPLES,
                    message: error.message
                };
            }

            throw new StoreResultsError('Unable to store results', error);
        }
    }
);

export { storeResultsController };
