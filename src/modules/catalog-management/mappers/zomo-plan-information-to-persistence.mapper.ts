import { getLogger } from '../../shared/core/logging-context';
import { ZomoPlanObject } from '../../shared/infrastructure/parse-types';
import { Mapper, MappingError } from '../../shared/mappers';
import { ZomoPlanInformation } from '../domain';

export class ZomoPlanInformationMapper extends Mapper {
    public static async fromPersistence(
        zomoPlanObject: ZomoPlanObject
    ): Promise<ZomoPlanInformation> {
        try {
            const year = zomoPlanObject.get('year');
            if (!year) {
                throw new Error(
                    'Unable to create ZomoPlanInformation: year missing.'
                );
            }

            return await ZomoPlanInformation.create({
                year
            });
        } catch (error) {
            getLogger().error(error.message);
            throw new ZomoPlanInformationMappingError(
                'Unable to map ZomoPlanInformation',
                error
            );
        }
    }
}

export class ZomoPlanInformationMappingError extends MappingError {}
