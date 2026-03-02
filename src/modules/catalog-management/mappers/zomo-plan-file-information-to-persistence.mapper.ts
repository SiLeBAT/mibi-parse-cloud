import { getLogger } from '../../shared/core/logging-context';
import { ZomoPlanFileObject } from '../../shared/infrastructure/parse-types';
import { Mapper, MappingError } from '../../shared/mappers';
import { ZomoPlanFileInformation } from '../domain';

export class ZomoPlanFileInformationMapper extends Mapper {
    public static async fromPersistence(
        zomoPlanFileObject: ZomoPlanFileObject
    ): Promise<ZomoPlanFileInformation> {
        try {
            const year = zomoPlanFileObject.get('year');
            if (!year) {
                throw new Error(
                    'Unable to create ZomoPlanFileInformation: year missing.'
                );
            }

            return await ZomoPlanFileInformation.create({
                year
            });
        } catch (error) {
            getLogger().error(error.message);
            throw new ZomoPlanFileInformationMappingError(
                'Unable to map ZomoPlanFileInformation',
                error
            );
        }
    }
}

export class ZomoPlanFileInformationMappingError extends MappingError {}
