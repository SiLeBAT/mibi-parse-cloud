import Fuse from 'fuse.js';
import _ from 'lodash';

import {
    ADVCatalogEntry,
    AVV324Data,
    CatalogEnhancement,
    CorrectionFunction,
    CorrectionSuggestions,
    FuzzyEintrag,
    ResultOptions,
    SampleData,
    SampleProperty,
    SearchAlias
} from '../model/legacy.model';
import { CatalogService } from './catalog.service';

function autoCorrectAVV324(catalogService: CatalogService): CorrectionFunction {
    const catalogName = 'avv324';
    const property: SampleProperty = 'pathogen_avv';
    const options = getFuseOptions();

    return (sampleData: SampleData): CorrectionSuggestions | null => {
        const catalogEnhancements = createCatalogEnhancements(
            catalogService,
            catalogName
        ) as CatalogEnhancement[];

        const samplingDateValue = sampleData.sampling_date.value;
        const catalog = catalogService.getAVVCatalog<AVV324Data>(
            catalogName,
            samplingDateValue
        );
        const fuse = catalog.getFuzzyIndex(options);

        const originalValue = sampleData[property].value;
        const trimmedEntry = originalValue.trim();

        // Ignore empty entries
        if (!trimmedEntry) {
            return null;
        }

        if (catalog.containsTextEintrag(trimmedEntry)) {
            return null;
        }

        // Check AVV codes
        if (
            catalog.isBasicCode(trimmedEntry) &&
            catalog.containsEintragWithAVVKode(trimmedEntry)
        ) {
            const eintrag = catalog.getEintragWithAVVKode(trimmedEntry);
            if (eintrag) {
                return createCorrectionSuggestion(
                    property,
                    originalValue,
                    [eintrag.Text],
                    88
                );
            }
        }

        // Search for Genus
        const genusEntry = 'Genus ' + trimmedEntry;
        if (catalog.containsTextEintrag(genusEntry)) {
            return createCorrectionSuggestion(
                property,
                originalValue,
                [genusEntry],
                88
            );
        }

        // Search catalog enhancements
        const alias: string = searchCatalogEnhancements(
            trimmedEntry,
            catalogEnhancements
        );

        // Do fuzzy search
        const noSpaceDot = /\.(\S)/g;
        let alteredEntry = trimmedEntry;
        if (noSpaceDot.test(trimmedEntry)) {
            alteredEntry = trimmedEntry.replace(noSpaceDot, '. $1');
        }

        const resultOptions: ResultOptions = {
            property,
            numberOfResults: 20,
            alias,
            original: originalValue
        };

        const correctionSuggestions: CorrectionSuggestions | null =
            doFuzzySearch(alteredEntry, fuse, resultOptions);

        return correctionSuggestions;
    };
}

function autoCorrectSequenceStatus(): CorrectionFunction {
    const property: SampleProperty = 'sequence_status';
    const QC_FAIL = 'QC-FAIL';
    const QC_PASS = 'QC-PASS';
    const IN_PROGRESS = 'in Bearbeitung';
    const IN_PLANNING = 'in Planung';

    return (sampleData: SampleData): CorrectionSuggestions | null => {
        if (!sampleData[property]) {
            return null;
        }

        const originalValue = sampleData[property].value;
        const trimmedEntry = originalValue.trim();

        // Ignore empty entries or exact terms
        if (
            !trimmedEntry ||
            trimmedEntry === QC_FAIL ||
            trimmedEntry === QC_PASS ||
            trimmedEntry === IN_PROGRESS ||
            trimmedEntry === IN_PLANNING
        ) {
            return null;
        }

        const passRegex = /^qc[- ]pass$/i;
        if (passRegex.test(trimmedEntry)) {
            return createCorrectionSuggestion(
                property,
                originalValue,
                [QC_PASS],
                -1
            );
        }

        const failRegex = /^qc[- ]fail$/i;
        if (failRegex.test(trimmedEntry)) {
            return createCorrectionSuggestion(
                property,
                originalValue,
                [QC_FAIL],
                -1
            );
        }

        const progressRegex = /^in bearbeitung$/i;
        if (progressRegex.test(trimmedEntry)) {
            return createCorrectionSuggestion(
                property,
                originalValue,
                [IN_PROGRESS],
                -1
            );
        }

        const planningRegex = /^in planung$/i;
        if (planningRegex.test(trimmedEntry)) {
            return createCorrectionSuggestion(
                property,
                originalValue,
                [IN_PLANNING],
                -1
            );
        }

        const correctionSuggestions: CorrectionSuggestions = {
            field: property,
            original: trimmedEntry,
            correctionOffer: [
                'QC-PASS',
                'QC-FAIL',
                'in Bearbeitung',
                'in Planung'
            ],
            code: 0
        };

        return correctionSuggestions;
    };
}

// Utility functions
function createCorrectionSuggestion(
    field: SampleProperty,
    original: string,
    correctionOffer: string[],
    code: number
): CorrectionSuggestions {
    return {
        field,
        original,
        correctionOffer,
        code
    };
}

function doFuzzySearch(
    value: string,
    fuse: Fuse<ADVCatalogEntry | FuzzyEintrag>,
    options: ResultOptions
) {
    // eslint-disable-next-line
    let { property, numberOfResults, alias, original } = { ...options };

    // remove fuse extended search flags
    value = value.replace(/[|='!^$]/g, ' ');
    // remove special chars
    value = value.replace(/[,.;]/g, ' ');

    const fuseResults = fuse.search(value);
    // sort first by score, second alphabetically
    fuseResults.sort((a, b) => a.item.Text.localeCompare(b.item.Text));
    fuseResults.sort((a, b) => (a.score as number) - (b.score as number));

    let result = fuseResults.map(v => v.item.Text);
    if (alias) {
        result = [alias].concat(_.filter(result, f => f !== alias));
        numberOfResults = 10;
    }
    const slicedResult = result.slice(0, numberOfResults);
    return {
        field: property,
        original: original,
        correctionOffer: slicedResult,
        code: 0
    };
}

function searchCatalogEnhancements(
    value: string,
    catalogEnhancements: CatalogEnhancement[]
): string {
    let alias: string = '';
    catalogEnhancements.forEach(enhancement => {
        const cleanedAlias = cleanText(enhancement.alias);
        const cleanedValue = cleanText(value);
        if (cleanedAlias === cleanedValue) {
            alias = enhancement.text;
        }
    });
    return alias;
}

function cleanText(str: string) {
    let cleaned = str.replace(',', '');
    cleaned = cleaned.replace(/\s*/g, '');
    return cleaned.toLowerCase();
}

function getFuseOptions(): Fuse.IFuseOptions<FuzzyEintrag> {
    return {
        shouldSort: false,
        includeScore: true,
        threshold: 0.6,
        minMatchCharLength: 1,
        ignoreLocation: true,
        useExtendedSearch: true, // searching for each space delimited substring
        keys: [
            {
                name: 'Text',
                weight: 0.9
            },
            {
                name: 'Kode',
                weight: 0.1
            }
        ]
    };
}

function createCatalogEnhancements(
    catalogService: CatalogService,
    catalogName: string
) {
    return _(catalogService.getCatalogSearchAliases(catalogName))
        .map((e: SearchAlias) => {
            return e.alias.map(alias => ({
                text: e.token,
                alias: alias
            }));
        })
        .flattenDeep()
        .value();
}

export { autoCorrectAVV324, autoCorrectSequenceStatus };
