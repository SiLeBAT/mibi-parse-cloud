import { orderContainerDTOSchema } from '../../dto/submission.dto';

import { string } from 'yup';
import { loggedController } from '../../../shared/core/controller';
import { HTTPRequest } from '../../../shared/infrastructure/request';
import { Order, SampleEntry, SampleEntryTuple } from '../../domain';
import { OrderDTO } from '../../dto';
import { OrderDTOMapper } from '../../mappers/order-dto.mapper';
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

const createSubmissionFileController = loggedController(
    async (
        request: CreateSubmissionFileRequest
    ): Promise<CreateSubmissionFileResponse> => {
        const orderContainerDTO = request.params;
        const version = orderContainerDTO.order.sampleSet.meta.version || '18';

        const order: Order<SampleEntry<SampleEntryTuple>[]> =
            await OrderDTOMapper.fromDTO(
                orderContainerDTO.order,
                '',
                samples => {
                    return samples.map(s =>
                        SampleEntryDTOMapper.fromDTO(version)(s, t => ({
                            value: t.value,
                            oldValue: t.oldValue || ''
                        }))
                    );
                }
            );
        const fileInformation = await createSubmissionFileUseCase.execute(
            order
        );
        return {
            fileName: fileInformation.fileName,
            type: fileInformation.type,
            data: fileInformation.data
        };
    }
);

const CreateSubmissionFileRequestValidation = async (
    request: CreateSubmissionFileRequest
) => {
    await orderContainerDTOSchema.validate(request.params);
    await string().required(request.params.order.sampleSet.meta.fileName);
};

export {
    createSubmissionFileController,
    CreateSubmissionFileRequestValidation
};
