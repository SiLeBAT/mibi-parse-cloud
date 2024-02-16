import { FileContentType } from '../domain';
import {
    Catalogue,
    CreateFromFileContentProps
} from '../domain/catalogue.entity';
import { AVVCatalogueParser, LegacyCatalog } from './avv-catalogue-parser';

interface CreateFromLegacyCatalogProps<T> {
    legacyCatalog: LegacyCatalog<T>;
    catalogueNumber: string;
    version: string;
    validFrom: Date | null;
}

class AVVCatalogueParserAntiCorruptionLayer {
    constructor() {}
    private static avvCatalogueParser = new AVVCatalogueParser();

    public static async create<T>(
        props: CreateFromFileContentProps
    ): Promise<Catalogue<T>> {
        const legacyProps = await this.parseFileContent<T>(props);
        return Catalogue.create({
            catalogueNumber: legacyProps.catalogueNumber,
            validFrom: legacyProps.validFrom,
            version: legacyProps.version,
            data: legacyProps.legacyCatalog.data,
            uId: legacyProps.legacyCatalog.uId
        });
    }

    private static async parseFileContent<T>({
        fileContent
    }: CreateFromFileContentProps): Promise<CreateFromLegacyCatalogProps<T>> {
        switch (fileContent.type) {
            case FileContentType.JSON: {
                const legacyCatalog = JSON.parse(fileContent.content);
                return {
                    legacyCatalog,
                    catalogueNumber: legacyCatalog.data.katalogNummer,
                    version: legacyCatalog.data.version,
                    validFrom: legacyCatalog.data.gueltigAb
                        ? new Date(legacyCatalog.data.gueltigAb)
                        : null
                };
            }
            case FileContentType.XML: {
                const legacyCatalog = await this.avvCatalogueParser.parseXML<T>(
                    fileContent.content
                );
                const catalogueNumber =
                    this.avvCatalogueParser.determineCatalogueNumber(
                        fileContent.content
                    );
                const version = this.avvCatalogueParser.determineVersion(
                    fileContent.content
                );
                const validFromString =
                    this.avvCatalogueParser.determineValidFrom(
                        fileContent.content
                    );
                const validFrom = validFromString
                    ? new Date(validFromString)
                    : null;
                return { legacyCatalog, catalogueNumber, version, validFrom };
            }
            default:
                throw new Error('Filetype not supported');
        }
    }
}

export { AVVCatalogueParserAntiCorruptionLayer };
