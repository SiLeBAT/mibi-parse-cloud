import { orderContainerDTOSchema } from './../../dto/submission.dto';

import { SubmissionDTOMapper } from 'modules/submission/mappers';
import { string } from 'yup';
import { setLoggingContext } from '../../../shared/core/logging-context';
import { HTTPRequest } from '../../../shared/infrastructure/request';
import { SampleEntry, SampleEntryTuple, Submission } from '../../domain';
import { OrderDTO } from '../../dto';
import { SampleEntryDTOMapper } from '../../mappers/sample-entry-dto.mapper';
import { createSubmissionFileUseCase } from './create-submission-file.use-case';

type CreateSubmissionFileRequestParameters = {
    readonly order: OrderDTO;
};
type CreateSubmissionFileRequest =
    HTTPRequest<CreateSubmissionFileRequestParameters>;

type CreateSubmissionFileResponse = {
    fileName: string;
    type: string;
    data: string;
};

const createSubmissionFileController = async (
    request: CreateSubmissionFileRequest
): Promise<CreateSubmissionFileResponse> => {
    try {
        setLoggingContext(request.log);
        const orderContainerDTO = request.params;
        const submission: Submission<SampleEntry<SampleEntryTuple>[]> =
            SubmissionDTOMapper.fromDTO(orderContainerDTO.order, samples => {
                return samples.map(s =>
                    SampleEntryDTOMapper.fromDTO(s, t => ({
                        value: t.value,
                        oldValue: t.oldValue || ''
                    }))
                );
            });
        const fileInformation = await createSubmissionFileUseCase.execute(
            submission
        );
        return {
            fileName: fileInformation.fileName,
            type: fileInformation.type,
            data: fileInformation.data
        };
    } finally {
        setLoggingContext(null);
    }
};

const CreateSubmissionFileRequestValidation = async (
    request: CreateSubmissionFileRequest
) => {
    await orderContainerDTOSchema.validate(request.params);
    await string().required(request.params.order.sampleSet.meta.fileName);
};

export {
    CreateSubmissionFileRequestValidation,
    createSubmissionFileController
};
