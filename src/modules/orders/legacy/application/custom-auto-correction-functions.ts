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

    const catalogEnhancements = createCatalogEnhancements(
        catalogService,
        catalogName
    ) as CatalogEnhancement[];

    const fuse = catalogService
        .getAVVCatalog<AVV324Data>(catalogName)
        .getFuzzyIndex(options);

    const searchCache: Record<string, CorrectionSuggestions> = {};

    return (sampleData: SampleData): CorrectionSuggestions | null => {
        const samplingDateValue = sampleData.sampling_date.value;
        const catalog = catalogService.getAVVCatalog<AVV324Data>(
            catalogName,
            samplingDateValue
        );

        const originalValue = sampleData[property].value;
        const trimmedEntry = originalValue.trim();
        // Ignore empty entries
        if (!trimmedEntry) {
            return null;
        }
        // Return cached result
        if (searchCache[trimmedEntry]) {
            return searchCache[trimmedEntry];
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
                searchCache[trimmedEntry] = createCacheEntry(
                    property,
                    originalValue,
                    [eintrag.Text],
                    88
                );
                return searchCache[trimmedEntry];
            }
        }

        // Search for Genus
        const genusEntry = 'Genus ' + trimmedEntry;
        if (catalog.containsTextEintrag(genusEntry)) {
            searchCache[trimmedEntry] = {
                field: property,
                original: originalValue,
                correctionOffer: [genusEntry],
                code: 88
            };
            return searchCache[trimmedEntry];
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
        searchCache[trimmedEntry] = doFuzzySearch(
            alteredEntry,
            fuse,
            resultOptions
        );
        return searchCache[trimmedEntry];
    };
}

// Utility functions
function createCacheEntry(
    field: SampleProperty,
    original: string,
    correctionOffer: string[],
    code: number
) {
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

export { autoCorrectAVV324 };
