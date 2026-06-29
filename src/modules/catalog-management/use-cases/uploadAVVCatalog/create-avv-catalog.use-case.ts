import { UseCase } from '../../../shared/use-cases';
import { Catalog, FileContent } from '../../domain';
import { avvCatalogXmlParser } from '../../infrastructure/xml-parser';

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
        return avvCatalogXmlParser.parse<T>({ fileContent });
    }
}

const createAVVCatalog = new CreateAVVCatalogUseCase();

export { createAVVCatalog };
