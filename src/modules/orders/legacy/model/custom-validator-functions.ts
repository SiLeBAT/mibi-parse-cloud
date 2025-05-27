import _ from 'lodash';
import moment from 'moment';
import { NRL_ID_VALUE } from '../../../shared/domain/valueObjects';
import { CatalogService } from '../application/catalog.service';
import {
    AVVCatalogData,
    AtLeastOneOfOptions,
    MatchesZoMoOptions,
    MatchesProgramZoMoOptions,
    DependentFieldsOptions,
    InCatalogOptions,
    MatchAVVCodeOrStringOptions,
    MatchIdToYearOptions,
    MatchRegexPatternOptions,
    MibiCatalogData,
    MibiCatalogFacettenData,
    ReferenceDateOptions,
    RequiredIfOtherOptions,
    SampleDataValues,
    SampleProperty,
    ValidatorFunction,
    ValidatorFunctionOptions,
    ZOMO_ID,
    CodeType,
    ZomoData
} from '../model/legacy.model';
import { AVVCatalog } from './avvcatalog.entity';

moment.locale('de');
const SAMPLING_DATE = 'sampling_date';

function nrlExists(
    value: string,
    options: ValidatorFunctionOptions,
    key: SampleProperty,
    attributes: Record<string, string>
) {
    if (attributes.nrl === NRL_ID_VALUE.UNKNOWN) {
        return { ...options.message };
    }
    return null;
}

function noPlanprobeForNRL_AR(
    value: string,
    options: ValidatorFunctionOptions,
    key: SampleProperty,
    attributes: Record<string, string>
) {
    const planprobenCode = '22562|126354|';

    const isNrlAr = attributes.nrl === NRL_ID_VALUE.NRL_AR;
    const isPlanprobenCode = value === planprobenCode;
    const isZomoCode = attributes.control_program_avv === ZOMO_ID.code;

    return isNrlAr && isPlanprobenCode && !isZomoCode
        ? { ...options.message }
        : null;
}

function requiredIfOther(
    value: string,
    options: RequiredIfOtherOptions,
    key: SampleProperty,
    attributes: Record<string, string>
) {
    const re = new RegExp(options.regex);
    const matchResult = re.test(attributes[options.field].toString());
    if (matchResult && isEmptyString(attributes[key])) {
        return { ...options.message };
    }
    return null;
}

function numbersOnlyValue(value: string): boolean {
    const numbersOnly = /^\d+$/;
    return numbersOnly.test(value);
}

function isAVVKodeValue(value: string): boolean {
    const avvKode = /^\d+\|\d+\|$/;
    return avvKode.test(value);
}

function matchesRegexPattern(value: string, options: MatchRegexPatternOptions) {
    if (!value || !options.regex.length) {
        return null;
    }
    if (options.ignoreNumbers && numbersOnlyValue(value)) {
        return null;
    }
    let success = false;
    const regexpAry = options.regex.map((str: string) => {
        return new RegExp(str, options.caseInsensitive ? 'i' : undefined);
    });
    regexpAry.forEach((regexp: RegExp) => {
        if (regexp.test(value)) {
            success = true;
        }
    });
    return success ? null : { ...options.message };
}

function matchesIdToSpecificYear(
    value: string,
    options: MatchIdToYearOptions,
    key: SampleProperty,
    attributes: SampleDataValues
) {
    if (!value) {
        return null;
    }
    let currentYear = moment();
    let nextYear = moment().add(1, 'year');
    let lastYear = moment().subtract(1, 'year');
    if (attributes[SAMPLING_DATE]) {
        currentYear = moment(attributes[SAMPLING_DATE], 'DD.MM.YYYY');
        nextYear = moment(attributes[SAMPLING_DATE], 'DD.MM.YYYY').add(
            1,
            'year'
        );
        lastYear = moment(attributes[SAMPLING_DATE], 'DD.MM.YYYY').subtract(
            1,
            'year'
        );
    }

    const changedArray = _.flatMap(options.regex, (entry: string) => {
        const result: string[] = [];
        if (entry.includes('yyyy')) {
            const currentEntry = entry.replace(
                'yyyy',
                currentYear.format('YYYY')
            );
            const nextEntry = entry.replace('yyyy', nextYear.format('YYYY'));
            const lastEntry = entry.replace('yyyy', lastYear.format('YYYY'));
            result.push(lastEntry);
            result.push(currentEntry);
            result.push(nextEntry);
        } else if (entry.includes('yy')) {
            const currentEntry = entry.replace('yy', currentYear.format('YY'));
            const nextEntry = entry.replace('yy', nextYear.format('YY'));
            const lastEntry = entry.replace('yy', lastYear.format('YY'));
            result.push(lastEntry);
            result.push(currentEntry);
            result.push(nextEntry);
        } else {
            result.push(entry);
        }
        return result;
    });
    options.regex = changedArray;
    return matchesRegexPattern(value, {
        ...options,
        ...{ ignoreNumbers: false }
    });
}

function inPLZCatalog(
    catalogService: CatalogService
): ValidatorFunction<InCatalogOptions> {
    return (
        value: string,
        options: InCatalogOptions,
        key: SampleProperty,
        attributes: SampleDataValues
    ) => {
        const trimmedValue = value.trim();
        if (attributes[key]) {
            const cat = catalogService.getPLZCatalog();
            let plzOk: string | boolean = false;

            if (cat) {
                const key: string = options.key
                    ? options.key
                    : cat.getUniqueId();

                plzOk = key && cat.containsEntryWithKeyValue(key, trimmedValue);
            }

            if (!plzOk) {
                return { ...options.message };
            }
        }
        return null;
    };
}

function inAVVCatalog(
    catalogService: CatalogService
): ValidatorFunction<InCatalogOptions> {
    return (
        value: string,
        options: InCatalogOptions,
        key: SampleProperty,
        attributes: SampleDataValues
    ) => {
        const trimmedValue = value.trim();
        if (attributes[key]) {
            const catalogNames = options.catalog.split(',');
            const samplingDate = attributes[SAMPLING_DATE];
            const catalogWithKode = _.filter(
                catalogNames,
                (catalogName: string) => {
                    const cat = catalogService.getAVVCatalog<AVVCatalogData>(
                        catalogName,
                        samplingDate
                    );

                    if (cat) {
                        return (
                            cat.containsEintragWithAVVKode(trimmedValue) ||
                            cat.containsTextEintrag(trimmedValue)
                        );
                    }
                }
            );

            if (catalogWithKode.length === 0) {
                return { ...options.message };
            }
        }
        return null;
    };
}

function inAVVFacettenCatalog(
    catalogService: CatalogService
): ValidatorFunction<InCatalogOptions> {
    return (
        value: string,
        options: InCatalogOptions,
        key: SampleProperty,
        attributes: SampleDataValues
    ) => {
        const trimmedValue = value.trim();
        if (attributes[key]) {
            const [begriffsIdEintrag, id, facettenValues, currentAttributes] =
                trimmedValue.split('|');
            const catalogName = options.catalog;
            const samplingDate = attributes[SAMPLING_DATE];

            const catalog =
                catalogService.getAVVCatalog<MibiCatalogFacettenData>(
                    catalogName,
                    samplingDate
                );

            if (catalog) {
                if (!(begriffsIdEintrag && id)) {
                    return { ...options.message };
                }

                // simple AVV code without facetten
                if (catalog.isBasicCode(trimmedValue)) {
                    if (
                        isAVVKodeValue(trimmedValue) &&
                        catalog.containsEintragWithAVVKode(trimmedValue)
                    ) {
                        return null;
                    } else {
                        return { ...options.message };
                    }
                }

                if (!catalog.hasFacettenInfo(trimmedValue)) {
                    return { ...options.message };
                }

                const avvKode = catalog.assembleAVVKode(begriffsIdEintrag, id);
                let found = catalog.containsEintragWithAVVKode(avvKode);
                found =
                    found &&
                    checkEintragAttributes(currentAttributes, avvKode, catalog);

                const facettenIds = catalog.getFacettenIdsWithKode(avvKode);
                if (facettenIds && facettenValues) {
                    const currentFacetten = facettenValues.split(',');
                    found =
                        found &&
                        currentFacetten.every(facettenValue => {
                            const matches = facettenValue.match(/-/g);
                            const [facettenBeginnId, facettenEndeIds] =
                                matches && matches.length === 1
                                    ? facettenValue.split('-')
                                    : [''];
                            facettenValue.split('-');
                            const facettenEndeIdList = facettenEndeIds
                                ? facettenEndeIds.split(':')
                                : [''];
                            const facette =
                                catalog.getFacetteWithBegriffsId(
                                    facettenBeginnId
                                );
                            let facettenWertPresent: boolean = false;
                            if (
                                facette &&
                                facettenIds.includes(facette.FacettenId)
                            ) {
                                facettenWertPresent = facettenEndeIdList.every(
                                    facettenEndeId => {
                                        const facettenWert =
                                            catalog.getFacettenWertWithBegriffsId(
                                                facettenEndeId,
                                                facettenBeginnId
                                            );
                                        return !!facettenWert;
                                    }
                                );
                            }
                            return facettenWertPresent;
                        });
                }
                if (!found) {
                    return { ...options.message };
                }
            }
        }

        return null;
    };
}

function hasObligatoryFacettenValues(
    catalogService: CatalogService
): ValidatorFunction<InCatalogOptions> {
    return (
        value: string,
        options: InCatalogOptions,
        key: SampleProperty,
        attributes: SampleDataValues
    ) => {
        const trimmedValue = value.trim();
        if (attributes[key]) {
            const [begriffsIdEintrag, id, facettenValues] =
                trimmedValue.split('|');
            const catalogName = options.catalog;
            const samplingDate = attributes[SAMPLING_DATE];
            const catalog =
                catalogService.getAVVCatalog<MibiCatalogFacettenData>(
                    catalogName,
                    samplingDate
                );
            if (catalog) {
                if (begriffsIdEintrag && id) {
                    const avvKode = catalog.assembleAVVKode(
                        begriffsIdEintrag,
                        id
                    );
                    const eintrag = catalog.getEintragWithAVVKode(avvKode);
                    if (eintrag && eintrag.Basiseintrag === true) {
                        const facettenZuordnungen =
                            catalog.getObligatoryFacettenzuordnungen(avvKode);

                        // The entry does not need obligatory facetten values
                        if (facettenZuordnungen.length === 0) {
                            return null;
                        }

                        // The entry needs obligatory facetten values but the values are missing in the avv code
                        if (!facettenValues) {
                            return { ...options.message };
                        }

                        // The entry needs obligatory facetten values, check if they are present
                        const catalogData = catalog.dump();
                        const facettenMap = createFacettenMap(facettenValues);
                        let found = true;
                        found =
                            found &&
                            facettenZuordnungen.every(facettenZuordnung => {
                                const zuordnungFacettenId =
                                    facettenZuordnung.FacettenId;
                                const zuordnungFacettenWertId =
                                    facettenZuordnung.FacettenwertId;
                                const zuordnungFestgelegt =
                                    facettenZuordnung.Festgelegt;
                                const facettenWert =
                                    catalogData.facettenIds?.[
                                        zuordnungFacettenId
                                    ]?.[zuordnungFacettenWertId];
                                // eslint-disable-next-line
                                const facettenWertIds = !!facettenWert
                                    ? facettenMap.get(
                                          facettenWert?.FacettenNameBegriffsId
                                      )
                                    : undefined;
                                if (zuordnungFestgelegt === true) {
                                    found =
                                        found &&
                                        !!facettenWert &&
                                        !!facettenWertIds
                                            ? facettenWertIds.includes(
                                                  facettenWert.WertNameBegriffsId
                                              )
                                            : false;
                                }

                                return found;
                            });

                        if (!found) {
                            return { ...options.message };
                        }
                    }
                }
            }
        }
        return null;
    };
}

function isHierarchyCode(
    catalogService: CatalogService
): ValidatorFunction<InCatalogOptions> {
    return (
        value: string,
        options: InCatalogOptions,
        key: SampleProperty,
        attributes: SampleDataValues
    ) => {
        const trimmedValue = value.trim();
        if (attributes[key]) {
            const [begriffsIdEintrag, id, facettenValues] =
                trimmedValue.split('|');
            const catalogName = options.catalog;
            const samplingDate = attributes[SAMPLING_DATE];
            const catalog =
                catalogService.getAVVCatalog<MibiCatalogFacettenData>(
                    catalogName,
                    samplingDate
                );
            if (catalog) {
                if (begriffsIdEintrag && id) {
                    const avvKode = catalog.assembleAVVKode(
                        begriffsIdEintrag,
                        id
                    );
                    const eintrag = catalog.getEintragWithAVVKode(avvKode);

                    if (facettenValues) {
                        return null;
                    }

                    if (eintrag && eintrag.Basiseintrag === false) {
                        return { ...options.message };
                    }
                }
            }
        }
        return null;
    };
}

function multipleFacettenAllowed(
    catalogService: CatalogService
): ValidatorFunction<InCatalogOptions> {
    return (
        value: string,
        options: InCatalogOptions,
        key: SampleProperty,
        attributes: SampleDataValues
    ) => {
        const trimmedValue = value.trim();
        if (attributes[key]) {
            const [begriffsIdEintrag, id, facettenValues] =
                trimmedValue.split('|');
            const catalogName = options.catalog;
            const samplingDate = attributes[SAMPLING_DATE];
            const catalog =
                catalogService.getAVVCatalog<MibiCatalogFacettenData>(
                    catalogName,
                    samplingDate
                );
            if (catalog) {
                if (begriffsIdEintrag && id) {
                    const avvKode = catalog.assembleAVVKode(
                        begriffsIdEintrag,
                        id
                    );

                    if (!catalog.containsEintragWithAVVKode(avvKode)) {
                        return null;
                    }

                    if (!facettenValues) {
                        return null;
                    }

                    const eintrag = catalog.getEintragWithAVVKode(avvKode);
                    if (eintrag && eintrag.Basiseintrag === false) {
                        return null;
                    }

                    const facettenMap = createFacettenMap(facettenValues);
                    const keys = Array.from(facettenMap.keys());
                    const found = keys.some(key => {
                        let hasNotAllowedMultipleFacetten = false;
                        const facette = catalog.getFacetteWithBegriffsId(
                            key.toString()
                        );

                        if (facette && facette.MehrfachAuswahl === false) {
                            const facettenValues = facettenMap.get(key);
                            if (facettenValues) {
                                hasNotAllowedMultipleFacetten =
                                    facettenValues.length > 1;
                            }
                        }

                        return hasNotAllowedMultipleFacetten;
                    });

                    if (found) {
                        return { ...options.message };
                    }
                }
            }
        }
        return null;
    };
}

function createFacettenMap(facettenValues: string): Map<number, number[]> {
    const facettenMap: Map<number, number[]> = new Map();
    const facetten = facettenValues.split(',');

    facetten.forEach(facette => {
        const ids = facette.split('-');
        const facettenNameBegriffsId = convertStringToNumber(ids[0]);
        const wertNameBegriffsIds: number[] = [];
        if (ids.length > 1) {
            ids[1].split(':').forEach(wertNameBegriffsId => {
                const id = convertStringToNumber(wertNameBegriffsId);
                if (!(id instanceof Error)) {
                    wertNameBegriffsIds.push(id);
                }
            });
        }

        if (!(facettenNameBegriffsId instanceof Error)) {
            facettenMap.set(facettenNameBegriffsId, wertNameBegriffsIds);
        }
    });

    return facettenMap;
}

function convertStringToNumber(str: string): number | Error {
    if (!/^\d+\.?\d*$/.test(str)) {
        return new Error();
    }
    const num = parseInt(str, 10);
    if (isNaN(num)) {
        return new Error();
    }

    return num;
}

function checkEintragAttributes<
    T extends MibiCatalogData | MibiCatalogFacettenData
>(currentAttributes: string, avvKode: string, catalog: AVVCatalog<T>) {
    if (currentAttributes) {
        const eintragAttributes = catalog.getAttributeWithAVVKode(avvKode);
        if (eintragAttributes) {
            return currentAttributes
                .split(':')
                .every(attr => eintragAttributes.includes(attr));
        }
    }

    return true;
}

function matchAVVCodeOrString(
    catalogService: CatalogService
): ValidatorFunction<InCatalogOptions> {
    return (
        value: string,
        options: MatchAVVCodeOrStringOptions,
        key: SampleProperty,
        attributes: SampleDataValues
    ) => {
        const trimmedValue = value.trim();
        const altKey = options.alternateKey || '';

        if (attributes[key]) {
            const samplingDate = attributes[SAMPLING_DATE];
            const cat = catalogService.getAVVCatalog<AVVCatalogData>(
                options.catalog,
                samplingDate
            );
            if (cat) {
                const key: string = options.key
                    ? options.key
                    : cat.getUniqueId();

                if (!key) {
                    return null;
                }

                if (isAVVKodeValue(trimmedValue)) {
                    if (!cat.containsEintragWithAVVKode(trimmedValue)) {
                        return { ...options.message };
                    }

                    return null;
                }

                if (altKey === 'Text') {
                    if (!cat.containsTextEintrag(trimmedValue)) {
                        return { ...options.message };
                    }

                    return null;
                }

                return { ...options.message };
            }
        }
        return null;
    };
}

function isZoMo(attributes: SampleDataValues): boolean {
    return (
        attributes['control_program_avv'] === ZOMO_ID.code ||
        (attributes['program_reason_text']
            .toLowerCase()
            .includes(ZOMO_ID.string1) &&
            attributes['program_reason_text']
                .toLowerCase()
                .includes(ZOMO_ID.string2))
    );
}

function presenceZoMo(
    value: string,
    options: ValidatorFunctionOptions,
    key: SampleProperty,
    attributes: Record<string, string>
) {
    const sampleIsZoMo = isZoMo(attributes);

    if (!sampleIsZoMo) {
        return null;
    }

    if (!value.trim()) {
        return { ...options.message };
    }

    return null;
}

function presenceNotZoMo(
    value: string,
    options: ValidatorFunctionOptions,
    key: SampleProperty,
    attributes: Record<string, string>
) {
    const sampleIsZoMo = isZoMo(attributes);

    if (sampleIsZoMo) {
        return null;
    }

    if (!value.trim()) {
        return { ...options.message };
    }

    return null;
}

function matchesProgramZoMo(
    catalogService: CatalogService
): ValidatorFunction<MatchesProgramZoMoOptions> {
    return (
        value: string,
        options: MatchesZoMoOptions,
        key: SampleProperty,
        attributes: SampleDataValues
    ) => {
        const sampleIsZoMo = isZoMo(attributes);

        if (!sampleIsZoMo) {
            return null;
        }

        const programValue = value.trim();

        if (!programValue) {
            return null;
        }

        const sampleDate = attributes[options.date];

        if (!sampleDate) {
            return null;
        }

        const zomoPlan = catalogService.getZomoPlan(sampleDate);

        if (!zomoPlan) {
            return null;
        }

        const programKey = options.zomoKey;
        const zomoPlanIndex = getProgramIndexForZomo(
            zomoPlan,
            programValue,
            programKey
        );

        if (zomoPlanIndex === -1) {
            return { ...options.message };
        }

        return null;
    };
}

function matchesZoMo(
    catalogService: CatalogService
): ValidatorFunction<MatchesZoMoOptions> {
    return (
        value: string,
        options: MatchesZoMoOptions,
        key: SampleProperty,
        attributes: SampleDataValues
    ) => {
        const sampleDate = attributes[options.date];

        if (!sampleDate) {
            return null;
        }

        const zomoPlan = catalogService.getZomoPlan(sampleDate);

        if (!zomoPlan) {
            return null;
        }

        const zomoKey = options.zomoKey;
        const codeType = options.codeType;
        const keyValue = value.trim();
        const programField = options.programField;
        const programValue = attributes[programField.attr];
        const programKey = options.programField.zomoKey;
        const zomoPlanIndex = getProgramIndexForZomo(
            zomoPlan,
            programValue,
            programKey
        );

        if (zomoPlanIndex === -1) {
            return { ...options.message };
        }

        const codeCheckResult = executeMatchingCodeType(
            zomoPlan[zomoPlanIndex][zomoKey] as object[],
            keyValue,
            codeType
        );

        if (!codeCheckResult) {
            return { ...options.message };
        }

        return null;
    };
}

function executeMatchingCodeType(
    zomoPlanEntry: object[],
    value: string,
    codeType: CodeType
) {
    let codeCheckResult = false;

    switch (codeType) {
        case CodeType.BASIC:
            codeCheckResult = checkBasicCodeForZomo(
                zomoPlanEntry as Record<string, object>[],
                value
            );
            break;
        case CodeType.FACETTEN:
            codeCheckResult = checkFacettenCodeForZomo(
                zomoPlanEntry as Record<string, object>[],
                value
            );
            break;
        case CodeType.PATHOGEN:
            codeCheckResult = checkPathogenForZomo(
                zomoPlanEntry as unknown as string[],
                value
            );
            break;
        default:
            console.log('CodeType not known');
    }

    return codeCheckResult;
}

function getProgramIndexForZomo(
    zomoPlan: ZomoData[],
    programValue: string,
    programKey: keyof ZomoData
) {
    if (isZomoPlanEntryEmpty(zomoPlan)) {
        return -1;
    }

    const index = zomoPlan.findIndex((zomoPlanRow: ZomoData) => {
        const programEntry = zomoPlanRow[programKey] as object[];

        if (isZomoPlanEntryEmpty(programEntry)) {
            return -1;
        }

        return _.has(programEntry[0], programValue);
    });

    return index;
}

function checkFacettenCodeForZomo(
    zomoPlanEntry: Array<Record<string, object>>,
    value: string
) {
    if (isZomoPlanEntryEmpty(zomoPlanEntry)) {
        return true;
    }

    if (!value && zomoPlanHasEmptyProperty(zomoPlanEntry)) {
        return true;
    }

    const basicCodeRegex: RegExp = /^\d+\|\d+\|$/;
    const codeRegexGroup: RegExp =
        /^(?<basicCode>\d+\|\d+\|)(?<facettenPart>.+)$/;
    let basicCode = '';
    let facettenPart = '';

    if (basicCodeRegex.test(value)) {
        // value is a basic code without facetten
        basicCode = value;
        const basicCodeResult = checkBasicCodeWithEmptyFacetten(
            zomoPlanEntry,
            basicCode
        );

        return basicCodeResult;
    }

    const match = value.match(codeRegexGroup);
    if (match && match.groups) {
        // value is a code with facetten
        basicCode = match.groups['basicCode'];
        facettenPart = match.groups['facettenPart'];
        const facettenResult = checkBasicCodeWithFacetten(
            zomoPlanEntry,
            basicCode,
            facettenPart
        );

        return facettenResult;
    }

    return false;
}

function checkAllFacettenIdsInCode(
    facettenField: (string | string[])[][],
    zomoPlanFacettenIds: object
) {
    const facettenIdsCode = facettenField.map(([facettenId]) => facettenId);
    const facettenIdsPlan = Object.keys(zomoPlanFacettenIds);

    const allFacettenIn = facettenIdsPlan.every(facettenId => {
        return facettenIdsCode.includes(facettenId);
    });

    if (!allFacettenIn) {
        return false;
    }

    return true;
}

function checkBasicCodeWithFacetten(
    zomoPlanEntry: Array<Record<string, object>>,
    basicCode: string,
    facettenPart: string
) {
    const facetten = facettenPart.split(',');
    const facettenField: (string | string[])[][] = [];

    facetten.forEach(facette => {
        const [id, details] = facette.split('-');
        const detailsField = details.split(':');
        facettenField.push([id, detailsField]);
    });

    const zomoPlanEntryResult = zomoPlanEntry.some(
        (entry: Record<string, object>) => {
            const basicCodeEntry = entry[basicCode];

            if (!basicCodeEntry) {
                return false;
            }

            const allFacettenIn = checkAllFacettenIdsInCode(
                facettenField,
                basicCodeEntry
            );
            const planFacettenIds = Object.keys(basicCodeEntry);

            const facettenFieldResult = planFacettenIds.every(facettenId => {
                const facettenIdEntry: {
                    and?: number[];
                    or?: number[];
                } = (basicCodeEntry as Record<string, object>)[facettenId];

                const facettenFieldEntry = facettenField.find(
                    ([facettenFieldId]: [string, string[]]) => {
                        return facettenFieldId === facettenId;
                    }
                );

                if (!(facettenIdEntry && facettenFieldEntry)) {
                    return false;
                }

                if (facettenIdEntry['and']) {
                    const numericDetails = (
                        facettenFieldEntry[1] as string[]
                    ).map(value => Number(value));
                    const andValues = facettenIdEntry['and'] as number[];

                    if (!andValues) {
                        return false;
                    }

                    const andResult = andValues.every(planValue =>
                        numericDetails.includes(planValue)
                    );

                    return andResult;
                }

                if (facettenIdEntry['or']) {
                    const numericDetails = (
                        facettenFieldEntry[1] as string[]
                    ).map(value => Number(value));
                    const orValues = facettenIdEntry['or'] as number[];

                    if (!orValues) {
                        return false;
                    }

                    const orResult = numericDetails.some(detailValue =>
                        orValues.includes(detailValue)
                    );

                    return orResult;
                }
            });

            return facettenFieldResult && allFacettenIn;
        }
    );

    return zomoPlanEntryResult;
}

function checkBasicCodeWithEmptyFacetten(
    zomoPlanEntry: Array<Record<string, object>>,
    value: string
) {
    const hasEntry = zomoPlanEntry.some(entry => {
        if (!(value in entry)) {
            return false;
        }

        const propertyValue = entry[value];
        const hasEmptyValue = isEmptyObject(propertyValue);

        return hasEmptyValue;
    });

    return hasEntry;
}

function checkBasicCodeForZomo(zomoPlanEntry: object[], value: string) {
    if (isZomoPlanEntryEmpty(zomoPlanEntry)) {
        return true;
    }

    if (!value && zomoPlanHasEmptyProperty(zomoPlanEntry)) {
        return true;
    }

    const hasEntry = zomoPlanEntry.some(entry => {
        return value in entry;
    });

    return hasEntry;
}

function isZomoPlanEntryEmpty(zomoPlanEntry: object[]) {
    if (zomoPlanEntry.length === 1 && isEmptyObject(zomoPlanEntry[0])) {
        return true;
    }

    return false;
}

function zomoPlanHasEmptyProperty(zomoPlanEntry: object[]) {
    return zomoPlanEntry.some(entry => {
        return '' in entry;
    });
}

function isEmptyObject(obj: object) {
    return Object.keys(obj).length === 0;
}

function checkPathogenForZomo(regexPatterns: string[], value: string) {
    const isMatch = regexPatterns.some(pattern => {
        return new RegExp(pattern).test(value);
    });

    return isMatch;
}

function atLeastOneOf(
    value: string,
    options: AtLeastOneOfOptions,
    key: SampleProperty,
    attributes: SampleDataValues
) {
    if (isEmptyString(attributes[key])) {
        for (let i = 0; i < options.additionalMembers.length; i++) {
            const element = options.additionalMembers[i];
            if (!isEmptyString(attributes[element])) {
                return null;
            }
        }
        return { ...options.message };
    }
    return null;
}

function dateAllowEmpty(value: string, options: AtLeastOneOfOptions) {
    if (isEmptyString(value)) {
        return null;
    } else if (
        moment
            .utc(
                value,
                ['DD.MM.YYYY', 'D.MM.YYYY', 'D.M.YYYY', 'DD.M.YYYY'],
                true
            )
            .isValid()
    ) {
        return null;
    } else {
        return { ...options.message };
    }
}

function dependentFields(
    value: string,
    options: DependentFieldsOptions,
    key: SampleProperty,
    attributes: SampleDataValues
) {
    if (attributes[key]) {
        for (let i = 0; i < options.dependents.length; i++) {
            const element = options.dependents[i];
            if (!attributes[element]) {
                return { ...options.message };
            }
        }
    }
    return null;
}

function referenceDate(
    value: string,
    options: ReferenceDateOptions,
    key: SampleProperty,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    attributes: any
) {
    if (moment.utc(value, 'DD-MM-YYYY').isValid()) {
        let referenceDateId;
        let refereceOperation;
        let referenceDate;

        if (options.earliest) {
            referenceDateId = options.earliest;
            refereceOperation = dateIsSameOrBeforeReference;
        } else if (options.latest) {
            referenceDateId = options.latest;
            refereceOperation = dateIsSameOrAfterReference;
        } else {
            throw new Error('Error occured trying to validate');
        }

        if (attributes[referenceDateId]) {
            referenceDate = moment.utc(
                attributes[referenceDateId],
                'DD-MM-YYYY'
            );
        } else if (referenceDateId === 'NOW') {
            referenceDate = moment();
        } else {
            referenceDate = moment.utc(referenceDateId, 'DD-MM-YYYY');
        }

        if (options.earliest) {
            if (options.modifier) {
                referenceDate = referenceDate.subtract(
                    options.modifier.value,
                    options.modifier.unit
                );
            }
        } else if (options.latest) {
            if (options.modifier) {
                referenceDate = referenceDate.add(
                    options.modifier.value,
                    options.modifier.unit
                );
            }
        }

        if (
            !referenceDate.isValid() ||
            refereceOperation(moment.utc(value, 'DD-MM-YYYY'), referenceDate)
        ) {
            return null;
        } else {
            return { ...options.message };
        }
    }
    return null;
}

function dateIsSameOrAfterReference(
    date: moment.Moment,
    referenceDate: moment.Moment
) {
    return referenceDate.isSameOrAfter(date, 'day');
}

function dateIsSameOrBeforeReference(
    date: moment.Moment,
    referenceDate: moment.Moment
) {
    return referenceDate.isSameOrBefore(date, 'day');
}

function isEmptyString(str: string): boolean {
    return !('' + str).trim();
}

export {
    atLeastOneOf,
    dateAllowEmpty,
    dependentFields,
    hasObligatoryFacettenValues,
    inAVVCatalog,
    inAVVFacettenCatalog,
    inPLZCatalog,
    isHierarchyCode,
    matchAVVCodeOrString,
    matchesIdToSpecificYear,
    matchesRegexPattern,
    multipleFacettenAllowed,
    noPlanprobeForNRL_AR,
    nrlExists,
    referenceDate,
    matchesZoMo,
    matchesProgramZoMo,
    presenceZoMo,
    presenceNotZoMo,
    requiredIfOther
};
