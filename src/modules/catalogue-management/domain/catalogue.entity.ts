import { Entity } from '../../shared/domain/entities';
import { EntityId } from '../../shared/domain/valueObjects';
import { AVVCatalogueParser } from '../legacy';
import { LegacyCatalog } from '../legacy/avv-catalogue-parser';
import { FileContentType } from './enums';
import { FileContent } from './file-content.vo';

export interface CreateFromFileContentProps {
    fileContent: FileContent;
}

interface CreateFromLegacyCatalogProps<T> {
    legacyCatalog: LegacyCatalog<T>;
    catalogueNumber: string;
    version: string;
    validFrom: Date | null;
}

export interface CatalogueProps<T> {
    catalogueNumber: string;
    validFrom: Date | null;
    version: string;
    data: T;
    uId: string;
}
export class Catalogue<T> extends Entity<CatalogueProps<T>> {
    //TODO: Should be replaced by an inner helper class?
    private static avvCatalogueParser = new AVVCatalogueParser();

    public static async create<T>(
        props: CreateFromFileContentProps
    ): Promise<Catalogue<T>> {
        const legacyProps = await this.parseFileContent<T>(props);
        return this.createFromLegacyCatalogProps<T>(legacyProps);
    }

    private static createFromLegacyCatalogProps<T>({
        legacyCatalog,
        catalogueNumber,
        version,
        validFrom
    }: CreateFromLegacyCatalogProps<T>): Catalogue<T> {
        return new Catalogue({
            ...legacyCatalog,
            catalogueNumber,
            version,
            validFrom
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

    constructor(props: CatalogueProps<T>, id?: EntityId) {
        super(props, id);
    }

    get catalogueNumber(): string {
        return this.props.catalogueNumber;
    }

    get version(): string {
        return this.props.version;
    }

    get validFrom(): Date | null {
        return this.props.validFrom;
    }

    set validFrom(date: Date | null) {
        this.props.validFrom = date;
    }

    get JSON(): string {
        return JSON.stringify(
            {
                data: this.props.data,
                uId: this.props.uId
            },
            null,
            2
        );
    }
}
