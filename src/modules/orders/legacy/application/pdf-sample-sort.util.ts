import { Sample } from '../model/sample.entity';

const collator = new Intl.Collator('de', {
    sensitivity: 'base',
    numeric: true
});

// Empty values sort after filled ones, so a missing "Ihre Probenummer" falls
// through to the next key instead of jumping to the top of its group.
function compareValues(a: string, b: string): number {
    const left = (a ?? '').trim();
    const right = (b ?? '').trim();
    if (!left && !right) return 0;
    if (!left) return 1;
    if (!right) return -1;
    return collator.compare(left, right);
}

/**
 * MPC-921: sorts samples ascending by
 *  1. Erreger (Text aus AVV DatA-Kat-Nr. 324)  -> pathogen_avv
 *  2. Ihre Probenummer                         -> sample_id
 *  3. Probenummer nach AVV DatA                -> sample_id_avv
 * Returns a new array; the input is not mutated. The sort is stable, so rows
 * equal on all three keys keep their original order.
 */
export function sortSamplesByPathogen(samples: Sample[]): Sample[] {
    return [...samples].sort(
        (a, b) =>
            compareValues(
                a.getValueFor('pathogen_avv'),
                b.getValueFor('pathogen_avv')
            ) ||
            compareValues(
                a.getValueFor('sample_id'),
                b.getValueFor('sample_id')
            ) ||
            compareValues(
                a.getValueFor('sample_id_avv'),
                b.getValueFor('sample_id_avv')
            )
    );
}
