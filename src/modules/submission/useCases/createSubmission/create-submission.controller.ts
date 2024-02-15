import { SubmissionFormInput } from 'modules/submission/domain';
import { HTTPRequest } from '../../../shared/infrastructure/request';
import { OrderDTOMapper } from '../../mappers';
import { createSubmission } from './create-submission.use-case';
import { OrderDTO } from './parse-submission-form.dto';

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
    const submissionFormInput: SubmissionFormInput = SubmissionFormInput.create(
        {
            type: request.params.type,
            data: request.params.data,
            fileName: request.params.filename
        }
    );

    const submission = await createSubmission.execute(submissionFormInput);

    return { order: OrderDTOMapper.toDTO(submission) };
};

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
