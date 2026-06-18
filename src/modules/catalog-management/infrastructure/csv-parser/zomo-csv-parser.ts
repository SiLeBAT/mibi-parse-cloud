import { parseString } from '@fast-csv/parse';
import { CreateFromZomoFileContentProps } from '../../use-cases/uploadZomoPlan/create-zomo-plan.use-case';
import { ZomoPlanInformation, ZomoPlan, FileContentType } from '../../domain';
import { UnsupportedFileTypeError } from '../../use-cases/readFileContent';

interface ZomoPlanOutput<T> {
    data: {
        year: string;
        zomoData: T;
    };
}

type ZomoPlanInput = {
    [key: string]: string;
};

type BasicCodeObj = {
    [basicCode: string]: Facetten;
};

// A forbidden code is represented as a single aggregating "not" object that
// holds the forbidden codes parsed in the same way as obligatory codes, so a
// facetten code keeps its nested facetten structure (basic code -> facetten).
type ForbiddenCodeObj = {
    not: BasicCodeObj;
};

type CodeFieldEntry = BasicCodeObj | ForbiddenCodeObj;

type Facetten = {
    [facettenId: string]: FacettenDetail;
};

type FacettenDetail =
    | {
          and: number[];
          or?: never;
      }
    | {
          or: number[];
          and?: never;
      };

export class ZomoCsvParser {
    private readonly ROW_VALUE_SEPARATOR = ';';
    private readonly COMMA_SEPARATOR = ',';
    private readonly HYPHEN_SEPARATOR = '-';
    private readonly COLON_SEPARATOR = ':';
    private readonly PARENTESIS_OPEN = '(';
    private readonly PARENTESIS_CLOSE = ')';
    private readonly AND_SEMANTIC = 'and';
    private readonly OR_SEMANTIC = 'or';
    private readonly FORBIDDEN_PREFIX = '!';
    private readonly NOT_KEY = 'not';
    // Key for the "empty field is allowed" entry, signalled by a trailing ";".
    private readonly EMPTY_CODE = '';
    private readonly CODE_REGEX_GROUP: RegExp =
        /^(?<basicCode>\d+\|\d+\|)(?<facettenPart>.+)$/;

    constructor() {}

    public async parse<T>({
        fileContent
    }: CreateFromZomoFileContentProps): Promise<ZomoPlan<T>> {
        const zomoPlanRows: ZomoPlanInput[] = [];

        if (fileContent.type !== FileContentType.CSV) {
            throw new UnsupportedFileTypeError(
                'Unsupported file type',
                new Error()
            );
        }

        await new Promise((resolve, reject) => {
            parseString(fileContent.content, { headers: true })
                .on('error', error => {
                    console.error('error: ', error);
                    reject(error);
                })
                .on('data', (row: ZomoPlanInput) => {
                    zomoPlanRows.push(row);
                })
                .on('end', (rowCount: number) => {
                    console.log(`Parsed ${rowCount} rows`);
                    resolve(zomoPlanRows);
                });
        });

        const transformationResult =
            this.transformZomoPlanInput<T>(zomoPlanRows);

        const zomoPlanInformation = await ZomoPlanInformation.create({
            year: transformationResult.data.year
        });

        const zomoPlan = await ZomoPlan.create({
            zomoPlanInformation,
            data: transformationResult.data.zomoData
        });

        return zomoPlan;
    }

    private transformZomoPlanInput<T>(
        zomoPlanRows: ZomoPlanInput[]
    ): ZomoPlanOutput<T> {
        if (zomoPlanRows.length === 0) {
            return {
                data: {
                    year: '',
                    zomoData: [] as T
                }
            };
        }

        const year = zomoPlanRows[0]['Berichtsjahr'] || '';
        const zomoData = zomoPlanRows.map((row: ZomoPlanInput) => {
            return {
                '303': this.parseCodeField(row['303']),
                '337': this.parseCodeField(row['337']),
                '319': this.parseCodeField(row['319']),
                '324': this.parse324(row['324']),
                '328': this.parseCodeField(row['328']),
                '339': this.parseCodeField(row['339'])
            };
        });

        const result: ZomoPlanOutput<T> = {
            data: {
                year: year,
                zomoData: zomoData as T
            }
        };

        return result;
    }

    // Parses a field value (like from "303", "319", "328", "339", "337")
    // which is either an empty string or one or more codes separated by semicolon.
    // A code prefixed with "!" is a forbidden code: all forbidden codes of the
    // field are aggregated into a single trailing "not" entry. Forbidden codes
    // are parsed like obligatory codes, so a facetten code keeps its nested
    // facetten structure (basic code -> facetten).
    // A semicolon that yields an empty code (e.g. a trailing ";") means the
    // field may also be left empty; this is represented by an `{ "": {} }` entry.
    private parseCodeField(rowValue: string): CodeFieldEntry[] {
        if (!rowValue || rowValue.trim() === '') {
            return [{}];
        }

        const codes = rowValue
            .split(this.ROW_VALUE_SEPARATOR)
            .map(code => code.trim());

        const obligatoryEntries: BasicCodeObj[] = [];
        const forbiddenCodes: BasicCodeObj = {};
        let emptyFieldAllowed = false;

        for (const code of codes) {
            if (code === '') {
                emptyFieldAllowed = true;
            } else if (code.startsWith(this.FORBIDDEN_PREFIX)) {
                const forbiddenCode = code.slice(this.FORBIDDEN_PREFIX.length);
                Object.assign(
                    forbiddenCodes,
                    this.parseObligatoryCode(forbiddenCode)
                );
            } else {
                obligatoryEntries.push(this.parseObligatoryCode(code));
            }
        }

        const resultList: CodeFieldEntry[] = [...obligatoryEntries];

        if (emptyFieldAllowed) {
            resultList.push({ [this.EMPTY_CODE]: {} });
        }

        if (Object.keys(forbiddenCodes).length > 0) {
            resultList.push({ [this.NOT_KEY]: forbiddenCodes });
        }

        // Could happen if the field contained only empty/whitespace codes.
        if (resultList.length === 0) {
            return [{}];
        }

        return resultList;
    }

    // Splits a single code into its basic code part and its facetten part.
    // A pure basic code (e.g. "9171|187178|") has an empty facetten part.
    private splitCode(code: string): {
        basicCode: string;
        facettenPart: string;
    } {
        const match = code.match(this.CODE_REGEX_GROUP);
        if (match && match.groups) {
            return {
                basicCode: match.groups['basicCode'],
                facettenPart: match.groups['facettenPart']
            };
        }

        return { basicCode: code, facettenPart: '' };
    }

    // Turns a single obligatory code into a "{ basicCode: facetten }" object.
    private parseObligatoryCode(code: string): BasicCodeObj {
        const { basicCode, facettenPart } = this.splitCode(code);
        const parsed =
            facettenPart !== '' ? this.parseFacettenPart(facettenPart) : {};

        return { [basicCode]: parsed };
    }

    // Parses the field "324" which is a stringified array using single quotes.
    // It replaces single quotes with double quotes and then parses it.
    private parse324(regexList: string) {
        if (!regexList || regexList.trim() === '') {
            return [];
        }

        try {
            const jsonStr = regexList.replace(/'/g, '"');
            return JSON.parse(jsonStr);
        } catch (err) {
            console.error('Unable to parse 324 field:', err);
            return [];
        }
    }

    // Parses the facetten string, e.g. "1212-1019,63421-1508:1512,1334-(1346,1356,1357)"
    private parseFacettenPart(facettenPart: string) {
        const result: Facetten = {};

        // Split by comma to get facetten details
        const facetten = this.splitByCommaIgnoringParentheses(facettenPart)
            .map(facette => facette.trim())
            .filter(facette => facette);

        for (const facette of facetten) {
            const facettenObj = this.parseFacette(facette);

            for (const facettenId in facettenObj) {
                result[facettenId] = facettenObj[facettenId];
            }
        }

        return result;
    }

    // splits a string by comma but not if the comma is inside parenthesis
    private splitByCommaIgnoringParentheses(input: string): string[] {
        const parts: string[] = [];
        let currentPart = '';
        let parenthesesLevel = 0;

        for (let i = 0; i < input.length; i++) {
            const char = input[i];
            if (char === this.COMMA_SEPARATOR && parenthesesLevel === 0) {
                parts.push(currentPart);
                currentPart = '';
            } else {
                if (char === this.PARENTESIS_OPEN) {
                    parenthesesLevel++;
                } else if (char === this.PARENTESIS_CLOSE) {
                    // Ensure parenthesesLevel will not be negative
                    parenthesesLevel = Math.max(parenthesesLevel - 1, 0);
                }
                currentPart += char;
            }
        }
        if (currentPart) {
            parts.push(currentPart);
        }
        return parts;
    }

    // This function parses a detail facette like "1212-1019" or "63421-1508:1512" or "1334-(1346,1356,1357)"
    private parseFacette(facette: string): Facetten {
        const facettenParts = facette.split(this.HYPHEN_SEPARATOR);

        if (facettenParts.length < 2) {
            return {};
        }

        const facettenId = facettenParts[0].trim();
        const facettenAuspraegungen = facettenParts[1].trim();

        // Check if the FacettenAuspraegungen are wrapped in parentheses => "or" semantic
        if (
            facettenAuspraegungen.startsWith(this.PARENTESIS_OPEN) &&
            facettenAuspraegungen.endsWith(this.PARENTESIS_CLOSE)
        ) {
            const auspraegungen = facettenAuspraegungen.slice(1, -1);
            const auspreagungsList = auspraegungen
                .split(this.COMMA_SEPARATOR)
                .map(auspraegung => Number(auspraegung.trim()))
                .filter(auspraegung => !isNaN(auspraegung));
            return { [facettenId]: { [this.OR_SEMANTIC]: auspreagungsList } };
        } else {
            // Otherwise use colon as separator => "and" semantic
            const auspraegungsList = facettenAuspraegungen
                .split(this.COLON_SEPARATOR)
                .map(auspraegung => Number(auspraegung.trim()))
                .filter(auspraegung => !isNaN(auspraegung));

            return {
                [facettenId]: {
                    [this.AND_SEMANTIC]: auspraegungsList
                }
            };
        }
    }
}
