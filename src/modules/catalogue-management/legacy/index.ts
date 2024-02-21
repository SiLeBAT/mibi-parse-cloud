import { getLogger } from '../../shared/core/logging-context';
import { CatalogueInformation, FileContent, FileContentType } from '../domain';
import { Catalogue } from '../domain/catalogue.entity';
import { AVVCatalogueParser, LegacyCatalog } from './avv-catalogue-parser';

interface CreateFromFileContentProps {
    fileContent: FileContent;
}
interface CreateFromLegacyCatalogProps<T> {
    legacyCatalog: LegacyCatalog<T>;
    catalogueCode: string;
    version: string;
    validFrom: Date;
}

class AVVCatalogueParserAntiCorruptionLayer {
    constructor() {}
    private static avvCatalogueParser = new AVVCatalogueParser();

    public static async create<T>(
        props: CreateFromFileContentProps
    ): Promise<Catalogue<T>> {
        const legacyProps = await this.parseFileContent<T>(props);
        getLogger().info(
            `Legacy props parsed successfully: ${legacyProps.catalogueCode} - ${legacyProps.version} - ${legacyProps.validFrom}`
        );
        const catalogueInformation = await CatalogueInformation.create({
            catalogueCode: legacyProps.catalogueCode,
            validFrom: legacyProps.validFrom,
            version: legacyProps.version
        });
        return Catalogue.create({
            catalogueInformation,
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
                    catalogueCode: legacyCatalog.data.katalogNummer,
                    version: legacyCatalog.data.version,
                    validFrom: new Date(legacyCatalog.data.gueltigAb)
                };
            }
            case FileContentType.XML: {
                const legacyCatalog = await this.avvCatalogueParser.parseXML<T>(
                    fileContent.content
                );
                const catalogueCode =
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
                const validFrom = new Date(validFromString);

                return { legacyCatalog, catalogueCode, version, validFrom };
            }
            default:
                throw new Error('Filetype not supported');
        }
    }
}

export { AVVCatalogueParserAntiCorruptionLayer };
