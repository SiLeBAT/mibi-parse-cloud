import { getLogger } from '../../../shared/core/logging-context';
import { AbstractRepository } from '../../../shared/infrastructure';
import {
    ZomoPlanFileAttributes,
    ZomoPlanFileObject,
    ObjectKeys
} from '../../../shared/infrastructure/parse-types';
import { ZomoPlanFileInformation } from '../../domain';
import { ZomoPlanFileInformationMapper } from '../../mappers';

export class ZomoPlanFileInformationRepository extends AbstractRepository<ZomoPlanFileObject> {
    constructor() {
        super(ObjectKeys.ZomoPlanFile);
    }

    async getAllEntriesWith<T>({
        key,
        value
    }: {
        key: keyof ZomoPlanFileAttributes;
        value: T;
    }): Promise<ZomoPlanFileInformation[]> {
        try {
            const query = this.getQuery();
            query.equalTo(key, value);
            const results = await query.find({
                useMasterKey: true
            });
            const zomoPlanFileInformation = results.map(
                async (obj: ZomoPlanFileObject) =>
                    await ZomoPlanFileInformationMapper.fromPersistence(obj)
            );
            return Promise.all(zomoPlanFileInformation);
        } catch (error) {
            getLogger().error(error.message);
        }

        return [];
    }

    async getAllEntries(): Promise<ZomoPlanFileInformation[]> {
        try {
            const query = this.getQuery();
            const results = await query.findAll({
                useMasterKey: true
            });
            const zomoPlanFileInformation = results.map(
                async (obj: ZomoPlanFileObject) =>
                    await ZomoPlanFileInformationMapper.fromPersistence(obj)
            );
            return Promise.all(zomoPlanFileInformation);
        } catch (error) {
            getLogger().error(error.message);
        }

        return [];
    }
}
