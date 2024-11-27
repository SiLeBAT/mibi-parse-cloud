import { UseCase } from '../../../shared/use-cases';
import { Catalogue, FileContent } from '../../domain';
import { AVVCatalogueParserAntiCorruptionLayer } from '../../legacy';

export interface CreateFromFileContentProps {
    fileContent: FileContent;
}

class CreateAVVCatalogueUseCase<T>
    implements UseCase<CreateFromFileContentProps, Catalogue<T>>
{
    constructor() {}

    async execute({
        fileContent
    }: CreateFromFileContentProps): Promise<Catalogue<T>> {
        return AVVCatalogueParserAntiCorruptionLayer.create({ fileContent });
    }
}

const createAVVCatalogue = new CreateAVVCatalogueUseCase();

export { createAVVCatalogue };
