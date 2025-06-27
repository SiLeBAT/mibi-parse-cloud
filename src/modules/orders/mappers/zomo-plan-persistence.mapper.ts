import { ZomoPlan } from '../../shared/domain/valueObjects';
import { ZomoPlanObject } from '../../shared/infrastructure/parse-types';
import { Mapper, MappingError } from '../../shared/mappers';

export class ZomoPlanPersistenceMapper extends Mapper {
    static async fromPersistence(
        zomoPlanObject: ZomoPlanObject
    ): Promise<ZomoPlan> {
        try {
            return await ZomoPlan.create({
                year: zomoPlanObject.get('year'),
                data: zomoPlanObject.get('zomoData')
            });
        } catch (error) {
            throw new PersistenceToZomoPlanMappingError(
                'Unable to map Zomo Plan Persistence to Zomo Plan',
                error
            );
        }
    }
}

export class PersistenceToZomoPlanMappingError extends MappingError {}
