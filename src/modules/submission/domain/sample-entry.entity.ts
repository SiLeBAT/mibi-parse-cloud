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

export type SampleEntryProps = {
    sample_id: SampleEntryValue;
    sample_id_avv: SampleEntryValue;
    partial_sample_id: SampleEntryValue;
    pathogen_avv: SampleEntryValue;
    pathogen_text: SampleEntryValue;
    sampling_date: SampleEntryValue;
    isolation_date: SampleEntryValue;
    sampling_location_avv: SampleEntryValue;
    sampling_location_zip: SampleEntryValue;
    sampling_location_text: SampleEntryValue;
    animal_avv: SampleEntryValue;
    matrix_avv: SampleEntryValue;
    animal_matrix_text: SampleEntryValue;
    primary_production_avv: SampleEntryValue;
    control_program_avv: SampleEntryValue;
    sampling_reason_avv: SampleEntryValue;
    program_reason_text: SampleEntryValue;
    operations_mode_avv: SampleEntryValue;
    operations_mode_text: SampleEntryValue;
    vvvo: SampleEntryValue;
    program_avv: SampleEntryValue;
    comment: SampleEntryValue;
    nrl: SampleEntryValue;
    urgency: SampleEntryValue;
    analysis: Partial<AnalysisSelection>;
};

export class SampleEntry extends Entity<SampleEntryProps> {
    static create(props: SampleEntryProps, id?: EntityId): SampleEntry {
        const sampleEntry = new SampleEntry(props, id);
        return sampleEntry;
    }

    private constructor(props: SampleEntryProps, id?: EntityId) {
        super(props, id);
    }
    get data(): SampleEntryProps {
        return this.props;
    }
}
