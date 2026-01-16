import { Entity } from '../../shared/domain/entities';
import { EntityId } from '../../shared/domain/valueObjects';
import {
    SampleEntryV18,
    SampleEntryTuple as SampleEntryV18Tuple
} from './sample-entry-v18.entity';

export type SampleSetV18Props = {
    data: SampleEntryV18<SampleEntryV18Tuple>[];
};

export class SampleSetV18 extends Entity<SampleSetV18Props> {
    static create(props: SampleSetV18Props, id?: EntityId): SampleSetV18 {
        const sampleEntry = new SampleSetV18(props, id);
        return sampleEntry;
    }

    private constructor(props: SampleSetV18Props, id?: EntityId) {
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
