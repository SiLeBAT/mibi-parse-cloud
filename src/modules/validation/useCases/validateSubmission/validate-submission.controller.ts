import { EntityId } from '../../../shared/domain/valueObjects';
import { HTTPRequest } from '../../../shared/infrastructure/request';
import { ValidationParameter } from '../../domain';
import {
    SampleEntry,
    SampleEntryTuple
} from '../../domain/sample-entry.entity';
import { OrderContainerDTO, SampleDTO } from '../../dto';
import { SampleEntryDTOMapper } from '../../mappers/sample-entry-dto.mapper';
import { getUserInformation } from './get-user-information.use-case';
import { SubmissionValidationFailedError } from './validate-submission.error';
import { validateSubmission } from './validate-submission.use-case';

type ValidateSubmissionResponse = unknown;
type ValidateSubmissionRequestParameters = OrderContainerDTO;
type ValidateSubmissionRequest =
    HTTPRequest<ValidateSubmissionRequestParameters>;

/*
 * The job of the Controller is simply to:
 * 1) Accept the input
 * 2) Transform the input DTO to a useful domain object
 * 3) Call the use cases using the objects
 * 4) Transform the use case result to a DTO and return to caller.
 * Request validation is handled previously by the validator function.
 */

async function createValidationOptions(request: ValidateSubmissionRequest) {
    const user = request.user;
    const options = {
        state: ''
    };

    if (user) {
        try {
            const userId = EntityId.create({ value: user.id });
            const userInformation = await getUserInformation.execute({
                userId
            });
            options.state = userInformation.institute.stateShort;
        } catch (error) {
            request.log.error(
                `Unable to retrieve user information for user: ${user.id}. Ignoring state information.`
            );
            options.state = '';
        }
    }

    return options;
}

const validateSubmissionController = async (
    request: ValidateSubmissionRequest
): Promise<ValidateSubmissionResponse> => {
    const validationOptions = await createValidationOptions(request);

    try {
        const submittedOrder: OrderContainerDTO = request.params;
        const sampleData: SampleEntry<SampleEntryTuple>[] =
            submittedOrder.order.sampleSet.samples.map((sample: SampleDTO) => {
                return SampleEntryDTOMapper.fromDTO(sample, t => t);
            });

        const validationParameter = await ValidationParameter.create({
            data: sampleData,
            options: validationOptions
        });
        const validatedSubmission =
            validateSubmission.execute(validationParameter);
        return validatedSubmission;
    } catch (error) {
        throw new SubmissionValidationFailedError(
            'Unable to validate submission',
            error
        );
    }
};

const ValidateSubmissionRequestValidation = {
    fields: {
        order: {
            required: true,
            type: Object,
            error: 'order is a required field'
        }
    }
};
export { ValidateSubmissionRequestValidation, validateSubmissionController };
