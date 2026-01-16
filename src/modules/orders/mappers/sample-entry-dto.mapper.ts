import { Mapper } from '../../shared/mappers';
import {
    SampleEntry,
    SampleEntryProps,
    SampleEntryV18,
    SampleEntryV18Props
} from '../domain';
import { SampleDTO, SampleDataEntryDTO } from '../dto';

export class SampleEntryDTOMapper extends Mapper {
    static arrayFromDTO<T>(
        samples: SampleDTO[],
        mapperFunction: (entry: SampleDataEntryDTO) => T
    ): SampleEntry<T>[] {
        return samples.map(s =>
            SampleEntryDTOMapper.mapFromDTO(s, mapperFunction)
        );
    }

    static toDTO(version: string) {
        switch (version) {
            case '17': {
                return SampleEntryDTOMapper.mapToDTO;
            }
            case '18':
            default: {
                return SampleEntryDTOMapper.mapToDTOV18;
            }
        }
    }

    static mapToDTO<T>(
        sampleEntry: SampleEntry<T>,
        mapperFunction: (entry: T) => SampleDataEntryDTO
    ): SampleDTO {
        return {
            sampleData: {
                sample_id: mapperFunction(sampleEntry.data.sample_id),
                sample_id_avv: mapperFunction(sampleEntry.data.sample_id_avv),
                partial_sample_id: mapperFunction(
                    sampleEntry.data.partial_sample_id
                ),
                pathogen_avv: mapperFunction(sampleEntry.data.pathogen_avv),
                pathogen_text: mapperFunction(sampleEntry.data.pathogen_text),
                sampling_date: mapperFunction(sampleEntry.data.sampling_date),
                isolation_date: mapperFunction(sampleEntry.data.isolation_date),
                sampling_location_avv: mapperFunction(
                    sampleEntry.data.sampling_location_avv
                ),
                sampling_location_zip: mapperFunction(
                    sampleEntry.data.sampling_location_zip
                ),
                sampling_location_text: mapperFunction(
                    sampleEntry.data.sampling_location_text
                ),
                animal_avv: mapperFunction(sampleEntry.data.animal_avv),
                matrix_avv: mapperFunction(sampleEntry.data.matrix_avv),
                animal_matrix_text: mapperFunction(
                    sampleEntry.data.animal_matrix_text
                ),
                primary_production_avv: mapperFunction(
                    sampleEntry.data.primary_production_avv
                ),
                control_program_avv: mapperFunction(
                    sampleEntry.data.control_program_avv
                ),
                sampling_reason_avv: mapperFunction(
                    sampleEntry.data.sampling_reason_avv
                ),
                program_reason_text: mapperFunction(
                    sampleEntry.data.program_reason_text
                ),
                operations_mode_avv: mapperFunction(
                    sampleEntry.data.operations_mode_avv
                ),
                operations_mode_text: mapperFunction(
                    sampleEntry.data.operations_mode_text
                ),
                vvvo: mapperFunction(sampleEntry.data.vvvo),
                program_avv: mapperFunction(sampleEntry.data.program_avv),
                comment: mapperFunction(sampleEntry.data.comment)
            },
            sampleMeta: {
                nrl: sampleEntry.data.nrl,
                analysis: {
                    species: sampleEntry.data.analysis.species || false,
                    serological: sampleEntry.data.analysis.serological || false,
                    resistance: sampleEntry.data.analysis.resistance || false,
                    vaccination: sampleEntry.data.analysis.vaccination || false,
                    molecularTyping:
                        sampleEntry.data.analysis.molecularTyping || false,
                    toxin: sampleEntry.data.analysis.toxin || false,
                    esblAmpCCarbapenemasen:
                        sampleEntry.data.analysis.esblAmpCCarbapenemasen ||
                        false,
                    sample: sampleEntry.data.analysis.sample || false,
                    other: sampleEntry.data.analysis.other || '',
                    compareHuman: {
                        value:
                            sampleEntry.data.analysis.compareHuman?.value || '',
                        active:
                            sampleEntry.data.analysis.compareHuman?.active ||
                            false
                    }
                },
                urgency: sampleEntry.data.urgency
            }
        };
    }

    static mapToDTOV18<T>(
        sampleEntry: SampleEntryV18<T>,
        mapperFunction: (entry: T) => SampleDataEntryDTO
    ): SampleDTO {
        return {
            sampleData: {
                sample_id: mapperFunction(sampleEntry.data.sample_id),
                sample_id_avv: mapperFunction(sampleEntry.data.sample_id_avv),
                partial_sample_id: mapperFunction(
                    sampleEntry.data.partial_sample_id
                ),
                pathogen_avv: mapperFunction(sampleEntry.data.pathogen_avv),
                pathogen_text: mapperFunction(sampleEntry.data.pathogen_text),

                sequence_id: mapperFunction(sampleEntry.data.sequence_id),
                sequence_status: mapperFunction(
                    sampleEntry.data.sequence_status
                ),

                sampling_date: mapperFunction(sampleEntry.data.sampling_date),
                isolation_date: mapperFunction(sampleEntry.data.isolation_date),
                sampling_location_avv: mapperFunction(
                    sampleEntry.data.sampling_location_avv
                ),
                sampling_location_zip: mapperFunction(
                    sampleEntry.data.sampling_location_zip
                ),
                sampling_location_text: mapperFunction(
                    sampleEntry.data.sampling_location_text
                ),
                animal_avv: mapperFunction(sampleEntry.data.animal_avv),
                matrix_avv: mapperFunction(sampleEntry.data.matrix_avv),
                animal_matrix_text: mapperFunction(
                    sampleEntry.data.animal_matrix_text
                ),
                primary_production_avv: mapperFunction(
                    sampleEntry.data.primary_production_avv
                ),
                control_program_avv: mapperFunction(
                    sampleEntry.data.control_program_avv
                ),
                sampling_reason_avv: mapperFunction(
                    sampleEntry.data.sampling_reason_avv
                ),
                program_reason_text: mapperFunction(
                    sampleEntry.data.program_reason_text
                ),
                operations_mode_avv: mapperFunction(
                    sampleEntry.data.operations_mode_avv
                ),
                operations_mode_text: mapperFunction(
                    sampleEntry.data.operations_mode_text
                ),
                vvvo: mapperFunction(sampleEntry.data.vvvo),
                program_avv: mapperFunction(sampleEntry.data.program_avv),
                comment: mapperFunction(sampleEntry.data.comment)
            },
            sampleMeta: {
                nrl: sampleEntry.data.nrl,
                analysis: {
                    species: sampleEntry.data.analysis.species || false,
                    serological: sampleEntry.data.analysis.serological || false,
                    resistance: sampleEntry.data.analysis.resistance || false,
                    vaccination: sampleEntry.data.analysis.vaccination || false,
                    molecularTyping:
                        sampleEntry.data.analysis.molecularTyping || false,
                    toxin: sampleEntry.data.analysis.toxin || false,
                    esblAmpCCarbapenemasen:
                        sampleEntry.data.analysis.esblAmpCCarbapenemasen ||
                        false,
                    sample: sampleEntry.data.analysis.sample || false,
                    other: sampleEntry.data.analysis.other || '',
                    compareHuman: {
                        value:
                            sampleEntry.data.analysis.compareHuman?.value || '',
                        active:
                            sampleEntry.data.analysis.compareHuman?.active ||
                            false
                    }
                },
                urgency: sampleEntry.data.urgency
            }
        };
    }

    static fromDTO(version: string) {
        switch (version) {
            case '17': {
                return SampleEntryDTOMapper.mapFromDTO;
            }
            case '18':
            default: {
                return SampleEntryDTOMapper.mapFromDTOV18;
            }
        }
    }

    static mapFromDTO<T>(
        sample: SampleDTO,
        mapperFunction: (entry: SampleDataEntryDTO) => T
    ): SampleEntry<T> {
        const props: SampleEntryProps<T> = {
            sample_id: mapperFunction(sample.sampleData.sample_id),
            sample_id_avv: mapperFunction(sample.sampleData.sample_id_avv),
            partial_sample_id: mapperFunction(
                sample.sampleData.partial_sample_id
            ),
            pathogen_avv: mapperFunction(sample.sampleData.pathogen_avv),
            pathogen_text: mapperFunction(sample.sampleData.pathogen_text),
            sampling_date: mapperFunction(sample.sampleData.sampling_date),
            isolation_date: mapperFunction(sample.sampleData.isolation_date),
            sampling_location_avv: mapperFunction(
                sample.sampleData.sampling_location_avv
            ),
            sampling_location_zip: mapperFunction(
                sample.sampleData.sampling_location_zip
            ),
            sampling_location_text: mapperFunction(
                sample.sampleData.sampling_location_text
            ),
            animal_avv: mapperFunction(sample.sampleData.animal_avv),
            matrix_avv: mapperFunction(sample.sampleData.matrix_avv),
            animal_matrix_text: mapperFunction(
                sample.sampleData.animal_matrix_text
            ),
            primary_production_avv: mapperFunction(
                sample.sampleData.primary_production_avv
            ),
            control_program_avv: mapperFunction(
                sample.sampleData.control_program_avv
            ),
            sampling_reason_avv: mapperFunction(
                sample.sampleData.sampling_reason_avv
            ),
            program_reason_text: mapperFunction(
                sample.sampleData.program_reason_text
            ),
            operations_mode_avv: mapperFunction(
                sample.sampleData.operations_mode_avv
            ),
            operations_mode_text: mapperFunction(
                sample.sampleData.operations_mode_text
            ),
            vvvo: mapperFunction(sample.sampleData.vvvo),
            program_avv: mapperFunction(sample.sampleData.program_avv),
            comment: mapperFunction(sample.sampleData.comment),
            nrl: sample.sampleMeta.nrl,
            urgency: sample.sampleMeta.urgency,
            analysis: sample.sampleMeta.analysis
        };
        return SampleEntry.create(props);
    }

    static mapFromDTOV18<T>(
        sample: SampleDTO,
        mapperFunction: (entry: SampleDataEntryDTO) => T
    ): SampleEntryV18<T> {
        const props: SampleEntryV18Props<T> = {
            sample_id: mapperFunction(sample.sampleData.sample_id),
            sample_id_avv: mapperFunction(sample.sampleData.sample_id_avv),
            partial_sample_id: mapperFunction(
                sample.sampleData.partial_sample_id
            ),
            pathogen_avv: mapperFunction(sample.sampleData.pathogen_avv),
            pathogen_text: mapperFunction(sample.sampleData.pathogen_text),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            sequence_id: mapperFunction((sample.sampleData as any).sequence_id),
            sequence_status: mapperFunction(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (sample.sampleData as any).sequence_status
            ),
            sampling_date: mapperFunction(sample.sampleData.sampling_date),
            isolation_date: mapperFunction(sample.sampleData.isolation_date),
            sampling_location_avv: mapperFunction(
                sample.sampleData.sampling_location_avv
            ),
            sampling_location_zip: mapperFunction(
                sample.sampleData.sampling_location_zip
            ),
            sampling_location_text: mapperFunction(
                sample.sampleData.sampling_location_text
            ),
            animal_avv: mapperFunction(sample.sampleData.animal_avv),
            matrix_avv: mapperFunction(sample.sampleData.matrix_avv),
            animal_matrix_text: mapperFunction(
                sample.sampleData.animal_matrix_text
            ),
            primary_production_avv: mapperFunction(
                sample.sampleData.primary_production_avv
            ),
            control_program_avv: mapperFunction(
                sample.sampleData.control_program_avv
            ),
            sampling_reason_avv: mapperFunction(
                sample.sampleData.sampling_reason_avv
            ),
            program_reason_text: mapperFunction(
                sample.sampleData.program_reason_text
            ),
            operations_mode_avv: mapperFunction(
                sample.sampleData.operations_mode_avv
            ),
            operations_mode_text: mapperFunction(
                sample.sampleData.operations_mode_text
            ),
            vvvo: mapperFunction(sample.sampleData.vvvo),
            program_avv: mapperFunction(sample.sampleData.program_avv),
            comment: mapperFunction(sample.sampleData.comment),
            nrl: sample.sampleMeta.nrl,
            urgency: sample.sampleMeta.urgency,
            analysis: sample.sampleMeta.analysis
        };
        return SampleEntryV18.create(props);
    }
}
