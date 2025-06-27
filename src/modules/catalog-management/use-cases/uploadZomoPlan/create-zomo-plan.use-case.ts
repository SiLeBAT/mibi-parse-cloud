import { UseCase } from '../../../shared/use-cases';
import { FileContent, ZomoPlan } from '../../domain';
import { zomoCsvParser } from '../../infrastructure/csv-parser';

export interface CreateFromZomoFileContentProps {
    fileContent: FileContent;
}

class CreateZomoPlanUseCase<T>
    implements UseCase<CreateFromZomoFileContentProps, ZomoPlan<T>>
{
    constructor() {}

    async execute({
        fileContent
    }: CreateFromZomoFileContentProps): Promise<ZomoPlan<T>> {
        const parserResult = (await zomoCsvParser.parse({
            fileContent
        })) as ZomoPlan<T>;

        return parserResult;
    }
}

const createZomoPlan = new CreateZomoPlanUseCase();

export { createZomoPlan };
