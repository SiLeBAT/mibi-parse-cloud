import { Entity } from '../../shared/domain/entities';
import { EntityId } from '../../shared/domain/valueObjects';

export type AnalysisSelection = {
    species: boolean;
    serological: boolean;
    resistance: boolean;
    vaccination: boolean;
    molecularTyping: boolean;
    toxin: boolean;
    esblAmpCCarbapenemasen: boolean;
    sample: boolean;
    other: string;
    compareHuman: {
        value: string;
        active: boolean;
    };
};
export type SampleEntryValue = string;

export type SampleEntryTuple = {
    value: string;
    oldValue?: string;
};

export type SampleEntryProps<T> = {
    sample_id: T;
    sample_id_avv: T;
    partial_sample_id: T;
    pathogen_avv: T;
    pathogen_text: T;
    sampling_date: T;
    isolation_date: T;
    sampling_location_avv: T;
    sampling_location_zip: T;
    sampling_location_text: T;
    animal_avv: T;
    matrix_avv: T;
    animal_matrix_text: T;
    primary_production_avv: T;
    control_program_avv: T;
    sampling_reason_avv: T;
    program_reason_text: T;
    operations_mode_avv: T;
    operations_mode_text: T;
    vvvo: T;
    program_avv: T;
    comment: T;
    nrl: string;
    urgency: string;
    analysis: Partial<AnalysisSelection>;
};

export class SampleEntry<T> extends Entity<SampleEntryProps<T>> {
    static create<T>(
        props: SampleEntryProps<T>,
        id?: EntityId
    ): SampleEntry<T> {
        const sampleEntry = new SampleEntry(props, id);
        return sampleEntry;
    }

    private constructor(props: SampleEntryProps<T>, id?: EntityId) {
        super(props, id);
    }
    get data(): SampleEntryProps<T> {
        return this.props;
    }
}
