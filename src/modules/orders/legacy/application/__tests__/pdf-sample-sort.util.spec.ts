import { Sample } from '../../model/sample.entity';
import { sortSamplesByPathogen } from '../pdf-sample-sort.util';

function makeSample(
    pathogen: string,
    sampleId: string,
    sampleIdAvv: string
): Sample {
    const values: Record<string, string> = {
        pathogen_avv: pathogen,
        sample_id: sampleId,
        sample_id_avv: sampleIdAvv
    };
    return {
        getValueFor: (property: string) => values[property]
    } as unknown as Sample;
}

function keys(samples: Sample[]): string[] {
    return samples.map(
        s =>
            `${s.getValueFor('pathogen_avv')}|${s.getValueFor(
                'sample_id'
            )}|${s.getValueFor('sample_id_avv')}`
    );
}

describe('sortSamplesByPathogen', () => {
    it('sorts by pathogen ascending, case-insensitively', () => {
        const result = sortSamplesByPathogen([
            makeSample('Salmonella spp.', '1', 'A'),
            makeSample('escherichia coli', '2', 'B'),
            makeSample('Campylobacter jejuni', '3', 'C')
        ]);
        expect(keys(result)).toEqual([
            'Campylobacter jejuni|3|C',
            'escherichia coli|2|B',
            'Salmonella spp.|1|A'
        ]);
    });

    it('uses "Ihre Probenummer" (numeric-aware) as second key', () => {
        const result = sortSamplesByPathogen([
            makeSample('Escherichia coli', '10', 'A'),
            makeSample('Escherichia coli', '2', 'B'),
            makeSample('Escherichia coli', '1', 'C')
        ]);
        expect(keys(result)).toEqual([
            'Escherichia coli|1|C',
            'Escherichia coli|2|B',
            'Escherichia coli|10|A'
        ]);
    });

    it('falls back to "Probenummer nach AVV DatA" when sample id is missing or equal', () => {
        const result = sortSamplesByPathogen([
            makeSample('Escherichia coli', '', '26-003'),
            makeSample('Escherichia coli', '', '26-001'),
            makeSample('Escherichia coli', '5', '26-009'),
            makeSample('Escherichia coli', '5', '26-002')
        ]);
        expect(keys(result)).toEqual([
            'Escherichia coli|5|26-002',
            'Escherichia coli|5|26-009',
            'Escherichia coli||26-001',
            'Escherichia coli||26-003'
        ]);
    });

    it('does not mutate the input array', () => {
        const input = [makeSample('B', '1', ''), makeSample('A', '1', '')];
        sortSamplesByPathogen(input);
        expect(input[0].getValueFor('pathogen_avv')).toBe('B');
    });
});
