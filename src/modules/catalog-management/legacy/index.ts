import { getLogger } from '../../shared/core/logging-context';
import { CatalogInformation, FileContent, FileContentType } from '../domain';
import { Catalog } from '../domain/catalog.entity';
import { AVVCatalogParser, LegacyCatalog } from './avv-catalog-parser';

interface CreateFromFileContentProps {
    fileContent: FileContent;
}
interface CreateFromLegacyCatalogProps<T> {
    legacyCatalog: LegacyCatalog<T>;
    catalogCode: string;
    version: string;
    validFrom: Date;
}

class AVVCatalogParserAntiCorruptionLayer {
    constructor() {}
    private static avvCatalogParser = new AVVCatalogParser();

    public static async create<T>(
        props: CreateFromFileContentProps
    ): Promise<Catalog<T>> {
        const legacyProps = await this.parseFileContent<T>(props);
        getLogger().info(
            `Legacy props parsed successfully: ${legacyProps.catalogCode} - ${legacyProps.version} - ${legacyProps.validFrom}`
        );
        const catalogInformation = await CatalogInformation.create({
            catalogCode: legacyProps.catalogCode,
            validFrom: legacyProps.validFrom,
            version: legacyProps.version
        });
        return Catalog.create({
            catalogInformation,
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
                    catalogCode: legacyCatalog.data.katalogNummer,
                    version: legacyCatalog.data.version,
                    validFrom: new Date(legacyCatalog.data.gueltigAb)
                };
            }
            case FileContentType.XML: {
                const legacyCatalog = await this.avvCatalogParser.parseXML<T>(
                    fileContent.content
                );
                const catalogCode =
                    this.avvCatalogParser.determineCatalogNumber(
                        fileContent.content
                    );
                const version = this.avvCatalogParser.determineVersion(
                    fileContent.content
                );
                const validFromString =
                    this.avvCatalogParser.determineValidFrom(
                        fileContent.content
                    );
                const validFrom = new Date(validFromString);

                return { legacyCatalog, catalogCode, version, validFrom };
            }
            default:
                throw new Error('Filetype not supported');
        }
    }
}

export { AVVCatalogParserAntiCorruptionLayer };
