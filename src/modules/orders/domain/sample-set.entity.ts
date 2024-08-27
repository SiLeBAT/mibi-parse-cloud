import { Entity } from '../../shared/domain/entities';
import { EntityId } from '../../shared/domain/valueObjects';
import { SampleEntry, SampleEntryTuple } from './sample-entry.entity';

export type SampleSetProps = {
    data: SampleEntry<SampleEntryTuple>[];
};

export class SampleSet extends Entity<SampleSetProps> {
    static create(props: SampleSetProps, id?: EntityId): SampleSet {
        const sampleEntry = new SampleSet(props, id);
        return sampleEntry;
    }

    private constructor(props: SampleSetProps, id?: EntityId) {
        super(props, id);
    }
    hasErrors(): boolean {
        this.data.forEach(entry => {
            if (entry.hasErrors()) {
                return true;
            }
        });

        return false;
    }

    hasAutoCorrections(): boolean {
        this.data.forEach(entry => {
            if (entry.hasAutoCorrections()) {
                return true;
            }
        });

        return false;
    }

    get data() {
        return this.props.data;
    }
}
