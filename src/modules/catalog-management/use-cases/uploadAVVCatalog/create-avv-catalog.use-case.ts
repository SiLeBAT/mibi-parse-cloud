import { UseCase } from '../../../shared/use-cases';
import { Catalog, FileContent } from '../../domain';
import { AVVCatalogParserAntiCorruptionLayer } from '../../legacy';

export interface CreateFromFileContentProps {
    fileContent: FileContent;
}

class CreateAVVCatalogUseCase<T>
    implements UseCase<CreateFromFileContentProps, Catalog<T>>
{
    constructor() {}

    async execute({
        fileContent
    }: CreateFromFileContentProps): Promise<Catalog<T>> {
        return AVVCatalogParserAntiCorruptionLayer.create({ fileContent });
    }
}

const createAVVCatalog = new CreateAVVCatalogUseCase();

export { createAVVCatalog };
