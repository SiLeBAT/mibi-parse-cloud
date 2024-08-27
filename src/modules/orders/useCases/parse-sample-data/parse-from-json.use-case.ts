import { Order, SampleEntry, SubmissionFormInput } from '../../domain';
import { OrderContainerDTO } from '../../dto';
import { SampleEntryDTOMapper } from '../../mappers';
import { OrderDTOMapper } from '../../mappers/order-dto.mapper';
import { ParseSampleDataUseCase } from './parse-sample-data.use-case';

export class ParseFromJSONUseCase extends ParseSampleDataUseCase {
    async execute(
        params: SubmissionFormInput
    ): Promise<Order<SampleEntry<string>[]>> {
        const file = new Parse.File(params.fileName, { base64: params.data });
        const buff = Buffer.from(await file.getData(), 'base64');
        const jsonString = buff.toString('utf8');
        const dto: OrderContainerDTO = JSON.parse(jsonString);
        const submission = await OrderDTOMapper.fromDTO(
            dto.order,
            '',
            samples => {
                return samples.map(s =>
                    SampleEntryDTOMapper.fromDTO(s, t => t.value)
                );
            }
        );
        return submission;
    }
}
