import { UseCase } from '../../../shared/useCases';
import {
    RESOURCE_VIEW_TYPE,
    Submission,
    SubmissionFormInput
} from '../../domain';
import { OrderDTOMapper } from './../../mappers';

export class CreateSubmissionUseCase
    implements UseCase<SubmissionFormInput, Submission>
{
    constructor() {}

    async execute(params: SubmissionFormInput): Promise<Submission> {
        const file = new Parse.File(params.fileName, { base64: params.data });

        switch (params.type) {
            case RESOURCE_VIEW_TYPE.XLSX:
                throw new Error('XLSX not yet implemented');
            case RESOURCE_VIEW_TYPE.JSON:
            default: {
                const jsonData = await file.getData();
                return OrderDTOMapper.fromDTO(JSON.parse(jsonData));
            }
        }
    }
}

const createSubmission = new CreateSubmissionUseCase();

export { createSubmission };
