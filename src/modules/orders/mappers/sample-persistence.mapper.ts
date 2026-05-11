import { Mapper } from '../../shared/mappers';
import { SampleDTO } from '../dto';

export type SamplePersistenceAttributes = {
    sampleData: string;
    sampleMeta: string;
    position: number;
};

export class SamplePersistenceMapper extends Mapper {
    public static toPersistence(
        sampleDTO: SampleDTO,
        position: number
    ): SamplePersistenceAttributes {
        return {
            sampleData: JSON.stringify(sampleDTO.sampleData, null, 2),
            sampleMeta: JSON.stringify(sampleDTO.sampleMeta, null, 2),
            position
        };
    }
}
