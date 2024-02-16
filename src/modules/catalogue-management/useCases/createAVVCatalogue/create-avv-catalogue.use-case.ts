import { AVVCatalogueParserAntiCorruptionLayer } from 'modules/catalogue-management/legacy';
import { UseCase } from '../../../shared/useCases';
import { Catalogue, CatalogueCreateFromFileContentProps } from '../../domain';

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
