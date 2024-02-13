import { UseCase } from '../../../shared/useCases';
import { Catalogue, CatalogueCreateFromFileContentProps } from '../../domain';

export class CreateAVVCatalogueUseCase<T>
    implements UseCase<CatalogueCreateFromFileContentProps, Catalogue<T>>
{
    constructor() {}

    async execute({
        fileContent
    }: CatalogueCreateFromFileContentProps): Promise<Catalogue<T>> {
        return Catalogue.create({ fileContent });
    }
}

const createAVVCatalogue = new CreateAVVCatalogueUseCase();

export { createAVVCatalogue };
