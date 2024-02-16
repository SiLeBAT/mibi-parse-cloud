import { SubmissionDTOMapper } from 'modules/submission/mappers';
import { HTTPRequest } from '../../../shared/infrastructure/request';
import { SubmissionFormInput } from '../../domain';
import { CreateSubmissionFromJSONUseCase } from './create-submission-from-json.use-case';
import { CreateSubmissionFromXLSXUseCase } from './create-submission-from-xlsx.use-case';
import { OrderDTO } from './create-submission.dto';
import { SubmissionCreationFailedError } from './create-submission.error';
import { CreateSubmissionUseCase } from './create-submission.use-case';

enum RESOURCE_VIEW_TYPE {
    JSON,
    XLSX
}

type CreateSubmissionResponse = {
    order: OrderDTO;
};
type CreateSubmissionRequestParameters = {
    readonly data: string;
    readonly filename: string;
    readonly type: 'xml' | 'json';
};
type CreateSubmissionRequest = HTTPRequest<CreateSubmissionRequestParameters>;

/*
 * The job of the Controller is simply to:
 * 1) Accept the input
 * 2) Transform the input DTO to a useful domain object
 * 3) Call the use cases using the objects
 * 4) Transform the use case result to a DTO and return to caller.
 * Request validation is handled previously by the validator function.
 */

const createSubmissionController = async (
    request: CreateSubmissionRequest
): Promise<CreateSubmissionResponse> => {
    const type = getResourceViewType(request.params.type);
    const submissionFormInput: SubmissionFormInput = SubmissionFormInput.create(
        {
            data: request.params.data,
            fileName: request.params.filename
        }
    );

    try {
        const createSubmission: CreateSubmissionUseCase =
            CreateSubmissionUseCaseFactory(type);
        const submission = await createSubmission.execute(submissionFormInput);
        return { order: SubmissionDTOMapper.toDTO(submission) };
    } catch (error) {
        throw new SubmissionCreationFailedError(
            'Unable to create a submission',
            error
        );
    }
};

function getResourceViewType(typeString: string = 'json'): RESOURCE_VIEW_TYPE {
    let returnType = RESOURCE_VIEW_TYPE.JSON;
    if (typeString.toLowerCase().includes('xml')) {
        returnType = RESOURCE_VIEW_TYPE.XLSX;
    }
    return returnType;
}

function CreateSubmissionUseCaseFactory(
    type: RESOURCE_VIEW_TYPE
): CreateSubmissionUseCase {
    switch (type) {
        case RESOURCE_VIEW_TYPE.XLSX:
            return new CreateSubmissionFromXLSXUseCase();
        case RESOURCE_VIEW_TYPE.JSON:
        default: {
            return new CreateSubmissionFromJSONUseCase();
        }
    }
}

const CreateSubmissionRequestValidationSchema = {
    fields: {
        data: {
            required: true,
            type: String,
            error: 'data is a required field'
        },
        filename: {
            required: true,
            type: String,
            error: 'filename is a required field'
        },
        type: {
            required: true,
            type: String,
            options: (val: string) => {
                return (
                    val.toLowerCase() === 'xml' || val.toLowerCase() === 'json'
                );
            },
            error: "type must be 'xml' or 'json'"
        }
    }
};
export { CreateSubmissionRequestValidationSchema, createSubmissionController };
