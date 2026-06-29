import * as fs from 'fs';
import * as path from 'path';
import { AVVCatalogXmlParser } from '../avv-catalog-xml-parser';
import { FileContent, FileContentType } from '../../../domain';
import { UnsupportedFileTypeError } from '../../../use-cases/readFileContent';

async function parseXml(xml: string) {
    const fileContent = await FileContent.create({
        content: xml,
        type: FileContentType.XML
    });
    const parser = new AVVCatalogXmlParser();
    const catalog = await parser.parse({ fileContent });
    return { catalog, json: JSON.parse(catalog.JSON) };
}

describe('AVVCatalogXmlParser (XML)', () => {
    const FIXTURE = path.join(__dirname, 'fixtures', 'avv337.trimmed.xml');
    const xml = fs.readFileSync(FIXTURE, 'utf-8');

    it('reads the catalog information from the metadata', async () => {
        const { catalog } = await parseXml(xml);

        expect(catalog.catalogInformation.catalogCode).toEqual('337');
        expect(catalog.catalogInformation.version).toEqual('9.00');
        expect(catalog.catalogInformation.validFrom).toEqual(
            new Date('2026-01-01')
        );
    });

    it('builds the entries map keyed by "begriffsid|id|" (uId = "Kode")', async () => {
        const { json } = await parseXml(xml);

        expect(json.uId).toEqual('Kode');
        expect(json.data.katalogNummer).toEqual('337');
        expect(json.data.version).toEqual('9.00');
        expect(json.data.gueltigAb).toEqual('2026-01-01');
        expect(json.data.facettenErlaubt).toEqual(false);

        expect(json.data.eintraege['21394|12184|']).toEqual({
            Text: 'Kenntlichmachung/Kennzeichnung/Auslobung',
            Basiseintrag: false
        });
        expect(json.data.eintraege['185141|211542|']).toEqual({
            Text: 'wasserabweisend',
            Basiseintrag: true
        });
        expect(json.data.eintraege['21395|12185|']).toEqual({
            Text: 'Allergene und Spurenhinweise',
            Basiseintrag: true
        });
    });

    it('collects nested sub-entries and skips entries marked aktion="DELETE"', async () => {
        const { json } = await parseXml(xml);

        // "Ölabweisend" is a nested sub-entry and must be present.
        expect(json.data.eintraege['213093|211541|']).toEqual({
            Text: 'Ölabweisend'.normalize('NFC'),
            Basiseintrag: true
        });
        // The DELETE entry (begriffsid 213094) must NOT be present.
        expect(json.data.eintraege['213094|211540|']).toBeUndefined();
    });
});

describe('AVVCatalogXmlParser (JSON)', () => {
    it('round-trips an already-parsed JSON catalog', async () => {
        const data = {
            version: '9.00',
            gueltigAb: '2026-01-01',
            katalogName: 'Zusatzangaben in der Kennzeichnung',
            katalogNummer: '337',
            facettenErlaubt: false,
            eintraege: {
                '21395|12185|': {
                    Text: 'Allergene und Spurenhinweise',
                    Basiseintrag: true
                }
            }
        };
        const fileContent = await FileContent.create({
            content: JSON.stringify({ data, uId: 'Kode' }),
            type: FileContentType.JSON
        });

        const catalog = await new AVVCatalogXmlParser().parse({ fileContent });
        const json = JSON.parse(catalog.JSON);

        expect(catalog.catalogInformation.catalogCode).toEqual('337');
        expect(catalog.catalogInformation.version).toEqual('9.00');
        expect(catalog.catalogInformation.validFrom).toEqual(
            new Date('2026-01-01')
        );
        expect(json).toEqual({ data, uId: 'Kode' });
    });
});

describe('AVVCatalogXmlParser (unsupported file type)', () => {
    it('throws UnsupportedFileTypeError for a non XML/JSON file', async () => {
        const fileContent = await FileContent.create({
            content: 'irrelevant',
            type: FileContentType.CSV
        });

        await expect(
            new AVVCatalogXmlParser().parse({ fileContent })
        ).rejects.toBeInstanceOf(UnsupportedFileTypeError);
    });
});

describe('AVVCatalogXmlParser (AVV324 selector filtering)', () => {
    const FIXTURE = path.join(__dirname, 'fixtures', 'avv324.trimmed.xml');
    const xml = fs.readFileSync(FIXTURE, 'utf-8');

    // Parses the AVV324 fixture offline: the two repository-backed lookups
    // (NRL selectors and additional pathogens) are stubbed so no DB is needed.
    async function parseAvv324(
        selectors: string[],
        additionalPathogens: string[] = []
    ) {
        const fileContent = await FileContent.create({
            content: xml,
            type: FileContentType.XML
        });
        const parser = new AVVCatalogXmlParser();
        jest.spyOn(
            parser as unknown as {
                getAllNRLRegexValues: () => Promise<string[]>;
            },
            'getAllNRLRegexValues'
        ).mockResolvedValue(selectors);
        jest.spyOn(
            parser as unknown as {
                getAdditionalPathogens: () => Promise<string[]>;
            },
            'getAdditionalPathogens'
        ).mockResolvedValue(additionalPathogens);

        const catalog = await parser.parse({ fileContent });
        return JSON.parse(catalog.JSON);
    }

    afterEach(() => jest.restoreAllMocks());

    it('keeps only entries whose text matches one of the NRL selectors', async () => {
        const json = await parseAvv324(['^Salmonella$', '^.*Listeria.*$']);

        expect(Object.keys(json.data.eintraege).sort()).toEqual([
            '200|2|',
            '300|3|'
        ]);
        expect(json.data.eintraege['200|2|']).toEqual({
            Text: 'Salmonella',
            Basiseintrag: true
        });
        expect(json.data.eintraege['300|3|']).toEqual({
            Text: 'Listeria monocytogenes',
            Basiseintrag: true
        });
    });

    it('discards entries matching no selector and the non-matching parent category', async () => {
        const json = await parseAvv324(['^Salmonella$', '^.*Listeria.*$']);

        // "Campylobacter" matches no selector.
        expect(json.data.eintraege['400|4|']).toBeUndefined();
        // The "Mikroorganismen" parent category itself matches no selector.
        expect(json.data.eintraege['100|1|']).toBeUndefined();
    });

    it('excludes entries below categories not in the AVV324 name filter', async () => {
        // "Salmonella" (600|6|) lives under "Sonstiges", which is not one of
        // the accepted top-level categories, so it is never collected even
        // though its text matches the selector.
        const json = await parseAvv324(['^Salmonella$']);

        expect(json.data.eintraege['600|6|']).toBeUndefined();
        expect(json.data.eintraege['200|2|']).toBeDefined();
    });

    it('discards every entry when no selector matches', async () => {
        const json = await parseAvv324(['^does-not-exist$']);

        expect(json.data.eintraege).toEqual({});
        expect(json.data.fuzzyEintraege).toEqual([]);
    });

    it('builds textEintraege and fuzzyEintraege for the kept entries', async () => {
        const json = await parseAvv324(['^Salmonella$', '^.*Listeria.*$']);

        expect(json.data.textEintraege).toEqual({
            Salmonella: '200|2|',
            'Listeria monocytogenes': '300|3|'
        });
        expect(json.data.fuzzyEintraege).toEqual([
            { Kode: '200|2|', Text: 'Salmonella', Basiseintrag: true },
            {
                Kode: '300|3|',
                Text: 'Listeria monocytogenes',
                Basiseintrag: true
            }
        ]);
    });

    it('appends additional pathogens, skipping those already present as entries', async () => {
        const json = await parseAvv324(
            ['^Salmonella$'],
            ['Salmonella', 'Norovirus']
        );

        // "Salmonella" is already a kept entry -> not added again as a
        // catalog-less ("") pathogen; "Norovirus" is appended with empty Kode.
        expect(json.data.textEintraege).toEqual({
            Salmonella: '200|2|',
            Norovirus: ''
        });
        expect(json.data.fuzzyEintraege).toEqual([
            { Kode: '200|2|', Text: 'Salmonella', Basiseintrag: true },
            { Kode: '', Text: 'Norovirus', Basiseintrag: true }
        ]);
    });
});
