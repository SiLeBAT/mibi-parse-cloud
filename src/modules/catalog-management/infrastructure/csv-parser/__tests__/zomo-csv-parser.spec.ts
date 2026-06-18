import * as fs from 'fs';
import * as path from 'path';
import { ZomoCsvParser } from '../zomo-csv-parser';
import { FileContent, FileContentType } from '../../../domain';

// Helper that builds a CSV string from a header list and row objects so the
// tests read closely to the ticket's example data.
function buildCsv(headers: string[], rows: Record<string, string>[]): string {
    const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const headerLine = headers.map(escape).join(',');
    const rowLines = rows.map(row =>
        headers.map(header => escape(row[header] ?? '')).join(',')
    );
    return [headerLine, ...rowLines].join('\n');
}

async function parseCsv(csv: string) {
    const fileContent = await FileContent.create({
        content: csv,
        type: FileContentType.CSV
    });
    const parser = new ZomoCsvParser();
    const zomoPlan = await parser.parse({ fileContent });
    return JSON.parse(zomoPlan.JSON);
}

const HEADERS = ['303', '337', '319', '324', '328', '339', 'Berichtsjahr'];

describe('ZomoCsvParser', () => {
    it('uses the Berichtsjahr value as the year', async () => {
        const csv = buildCsv(HEADERS, [
            {
                '303': '62726|57604|',
                '337': '',
                '319': '',
                '324': '',
                '328': '',
                '339': '',
                Berichtsjahr: '2026'
            }
        ]);

        const result = await parseCsv(csv);

        expect(result.data.year).toEqual('2026');
    });

    it('returns a list with one empty object for an empty field', async () => {
        const csv = buildCsv(HEADERS, [
            {
                '303': '62726|57604|',
                '337': '',
                '319': '',
                '324': '',
                '328': '',
                '339': '',
                Berichtsjahr: '2026'
            }
        ]);

        const result = await parseCsv(csv);

        expect(result.data.zomoData[0]['337']).toEqual([{}]);
        expect(result.data.zomoData[0]['319']).toEqual([{}]);
    });

    it('parses a basic code without facetten into an empty object', async () => {
        const csv = buildCsv(HEADERS, [
            {
                '303': '62726|57604|',
                '337': '',
                '319': '189009|187134|',
                '324': '',
                '328': '',
                '339': '',
                Berichtsjahr: '2026'
            }
        ]);

        const result = await parseCsv(csv);

        expect(result.data.zomoData[0]['303']).toEqual([
            { '62726|57604|': {} }
        ]);
        expect(result.data.zomoData[0]['319']).toEqual([
            { '189009|187134|': {} }
        ]);
    });

    it('parses the 324 field into a list of regular expressions', async () => {
        const csv = buildCsv(HEADERS, [
            {
                '303': '62726|57604|',
                '337': '',
                '319': '',
                '324': "['^.*Salmonella.*$','^.*Campy.*$','^Escherichia coli$']",
                '328': '',
                '339': '',
                Berichtsjahr: '2026'
            }
        ]);

        const result = await parseCsv(csv);

        expect(result.data.zomoData[0]['324']).toEqual([
            '^.*Salmonella.*$',
            '^.*Campy.*$',
            '^Escherichia coli$'
        ]);
    });

    it('parses facetten parts with and/or semantics', async () => {
        const csv = buildCsv(HEADERS, [
            {
                '303': '',
                '337': '',
                '319': '',
                '324': '',
                '328': '',
                '339': '67211|186526|1212-67466,63421-1508:1512,1334-(1350,1352,1356)',
                Berichtsjahr: '2026'
            }
        ]);

        const result = await parseCsv(csv);

        expect(result.data.zomoData[0]['339']).toEqual([
            {
                '67211|186526|': {
                    '1212': { and: [67466] },
                    '63421': { and: [1508, 1512] },
                    '1334': { or: [1350, 1352, 1356] }
                }
            }
        ]);
    });

    it('aggregates a forbidden-only field into a single "not" entry', async () => {
        const csv = buildCsv(HEADERS, [
            {
                '303': '62726|57604|',
                '337': '!21525|12304|',
                '319': '',
                '324': '',
                '328': '',
                '339': '',
                Berichtsjahr: '2026'
            }
        ]);

        const result = await parseCsv(csv);

        expect(result.data.zomoData[0]['337']).toEqual([
            { not: { '21525|12304|': {} } }
        ]);
    });

    it('parses the forbidden code (incl. facetten) into the "not" entry and appends it after obligatory codes', async () => {
        const csv = buildCsv(HEADERS, [
            {
                '303': '62729|57612|;62724|57624|;!62724|57624|2-68041,63420-2295:2803,63422-10492:63515:63559,63423-10565',
                '337': '21525|12304|;',
                '319': '9171|187178|185142-61004',
                '324': '',
                '328': '',
                '339': '',
                Berichtsjahr: '2026'
            }
        ]);

        const result = await parseCsv(csv);

        expect(result.data.zomoData[0]['303']).toEqual([
            { '62729|57612|': {} },
            { '62724|57624|': {} },
            {
                not: {
                    '62724|57624|': {
                        '2': { and: [68041] },
                        '63420': { and: [2295, 2803] },
                        '63422': { and: [10492, 63515, 63559] },
                        '63423': { and: [10565] }
                    }
                }
            }
        ]);

        // Trailing ";" means the field may also be left empty -> { "": {} }.
        expect(result.data.zomoData[0]['337']).toEqual([
            { '21525|12304|': {} },
            { '': {} }
        ]);

        expect(result.data.zomoData[0]['319']).toEqual([
            { '9171|187178|': { '185142': { and: [61004] } } }
        ]);
    });
});

describe('ZomoCsvParser empty field semantic (trailing ";")', () => {
    async function parseField(field: string, value: string) {
        const csv = buildCsv(HEADERS, [
            {
                '303': '',
                '337': '',
                '319': '',
                '324': '',
                '328': '',
                '339': '',
                [field]: value,
                Berichtsjahr: '2026'
            }
        ]);
        const result = await parseCsv(csv);
        return result.data.zomoData[0][field];
    }

    it('adds an empty-field entry { "": {} } for a trailing ";" after a basic code', async () => {
        expect(await parseField('337', '21525|12304|;')).toEqual([
            { '21525|12304|': {} },
            { '': {} }
        ]);
    });

    it('adds an empty-field entry after a facetten code', async () => {
        expect(await parseField('303', '62726|57604|2-1566;')).toEqual([
            { '62726|57604|': { '2': { and: [1566] } } },
            { '': {} }
        ]);
    });

    it('keeps a single empty-field entry after multiple obligatory codes', async () => {
        expect(await parseField('337', '21525|12304|;21537|12168|;')).toEqual([
            { '21525|12304|': {} },
            { '21537|12168|': {} },
            { '': {} }
        ]);
    });

    it('orders entries obligatory, then empty-field, then forbidden "not"', async () => {
        expect(await parseField('337', '21537|12168|;!21525|12304|;')).toEqual([
            { '21537|12168|': {} },
            { '': {} },
            { not: { '21525|12304|': {} } }
        ]);
    });

    it('allows an empty field together with only a forbidden code', async () => {
        expect(await parseField('337', '!21525|12304|;')).toEqual([
            { '': {} },
            { not: { '21525|12304|': {} } }
        ]);
    });

    it('does NOT add an empty-field entry when there is no trailing ";"', async () => {
        expect(await parseField('337', '21525|12304|')).toEqual([
            { '21525|12304|': {} }
        ]);
    });

    it('returns [{}] (not an empty-field entry) for a fully empty field', async () => {
        expect(await parseField('337', '')).toEqual([{}]);
    });
});

describe('ZomoCsvParser with the #cloud202 forbidden-code fixture', () => {
    const FIXTURE = path.join(
        __dirname,
        'fixtures',
        'ZoMo-Plan_forbidden-codes.csv'
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let zomoData: any[];

    beforeAll(async () => {
        const csv = fs.readFileSync(FIXTURE, 'utf-8');
        const result = await parseCsv(csv);
        zomoData = result.data.zomoData;
    });

    it('parses all 20 data rows', () => {
        expect(zomoData).toHaveLength(20);
    });

    it('splits multiple obligatory codes of a field into one entry each', () => {
        // 303 of the first row: four basic codes separated by ";".
        expect(zomoData[0]['303']).toEqual([
            { '62722|57621|': {} },
            { '62724|57624|': {} },
            { '10469|57619|': {} },
            { '20398|57599|': {} }
        ]);
    });

    it('parses a basic code and a facetten code within the same field', () => {
        // 319 of the first row: one basic code and one facetten code.
        expect(zomoData[0]['319']).toEqual([
            { '8232|185713|': {} },
            { '8235|184948|': { '185085': { and: [189059] } } }
        ]);
    });

    it('returns [{}] for empty 339 and 337 fields', () => {
        expect(zomoData[0]['339']).toEqual([{}]);
        expect(zomoData[0]['337']).toEqual([{}]);
    });

    it('parses obligatory codes plus a forbidden code in 337 (obligatory first, "not" last)', () => {
        // Row index 1 (328 "213058|211507|") has
        // 337 = "!21525|12304|;21537|12168|;59143|192041|".
        expect(zomoData[1]['337']).toEqual([
            { '21537|12168|': {} },
            { '59143|192041|': {} },
            { not: { '21525|12304|': {} } }
        ]);
    });

    it('treats a trailing ";" after an obligatory code as an "empty field allowed" entry', () => {
        // Row index 2 has 337 = "21525|12304|;".
        expect(zomoData[2]['337']).toEqual([
            { '21525|12304|': {} },
            { '': {} }
        ]);
    });

    it('parses the forbidden facetten code into the "not" entry after obligatory codes', () => {
        // Row index 5: two obligatory codes plus one forbidden facetten code.
        expect(zomoData[5]['303']).toEqual([
            { '62729|57612|': {} },
            { '62724|57624|': {} },
            {
                not: {
                    '62724|57624|': {
                        '2': { and: [68041] },
                        '63420': { and: [2295, 2803] },
                        '63422': { and: [10492, 63515, 63559] },
                        '63423': { and: [10565] }
                    }
                }
            }
        ]);
    });

    it('parses and/or facetten details (parentheses => or, colon => and)', () => {
        // Row index 1, 339: 1212-67466 (and), 63421-1508:1512 (and), 1334-(...) (or).
        expect(zomoData[1]['339']).toEqual([
            {
                '67211|186526|': {
                    '1212': { and: [67466] },
                    '63421': { and: [1508, 1512] },
                    '1334': {
                        or: [
                            1350, 1352, 1356, 1365, 1370, 1373, 1374, 1380,
                            68061, 68062, 188089, 188090, 188091, 188092
                        ]
                    }
                }
            }
        ]);
    });

    it('keeps each ";"-separated facetten code of 339 as its own entry', () => {
        // Row index 9, 339: two codes sharing the same basic code.
        expect(zomoData[9]['339']).toEqual([
            { '193680|192187|': { '1334': { and: [1342] } } },
            { '193680|192187|': { '1334': { and: [1343] } } }
        ]);
    });

    it('parses every ";"-separated 319 facetten code into its own entry', () => {
        // Row index 17, 319: four codes sharing the same basic code.
        expect(zomoData[17]['319']).toHaveLength(4);
        expect(zomoData[17]['319'][0]).toEqual({
            '6141|185643|': {
                '6843': { and: [6899] },
                '185142': { and: [185151] }
            }
        });
    });

    it('parses the (multi-line) 324 field into a list of regular expressions', () => {
        expect(zomoData[0]['324']).toEqual(['^.*Salmonella.*$']);
        expect(zomoData[8]['324']).toEqual(['^.*Salmonella.*$']);
    });

    it('uses 2026 as the year for the whole plan', async () => {
        const csv = fs.readFileSync(FIXTURE, 'utf-8');
        const result = await parseCsv(csv);
        expect(result.data.year).toEqual('2026');
    });
});
