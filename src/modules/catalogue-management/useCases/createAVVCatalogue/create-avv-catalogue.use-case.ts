import { UseCase } from '../../../shared/useCases';
import { Catalogue, CatalogueCreateFromFileContentProps } from '../../domain';
import { AVVCatalogueParserAntiCorruptionLayer } from '../../legacy';

class CreateAVVCatalogueUseCase<T>
    implements UseCase<CatalogueCreateFromFileContentProps, Catalogue<T>>
{
    constructor() {}

    async execute({
        fileContent
    }: CatalogueCreateFromFileContentProps): Promise<Catalogue<T>> {
        return AVVCatalogueParserAntiCorruptionLayer.create({ fileContent });
    }
}

const createAVVCatalogue = new CreateAVVCatalogueUseCase();

export { createAVVCatalogue };
