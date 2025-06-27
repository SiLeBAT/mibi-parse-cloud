import { getLogger } from '../../../shared/core/logging-context';
import { AbstractRepository } from '../../../shared/infrastructure';
import {
    ZomoPlanAttributes,
    ZomoPlanObject,
    ObjectKeys
} from '../../../shared/infrastructure/parse-types';
import { ZomoPlanInformation } from '../../domain';
import { ZomoPlanInformationMapper } from '../../mappers';

export class ZomoPlanInformationRepository extends AbstractRepository<ZomoPlanObject> {
    constructor() {
        super(ObjectKeys.ZomoPlan);
    }

    async getAllEntriesWith<T>({
        key,
        value
    }: {
        key: keyof ZomoPlanAttributes;
        value: T;
    }): Promise<ZomoPlanInformation[]> {
        try {
            const query = this.getQuery();
            query.equalTo(key, value);
            const results = await query.find({
                useMasterKey: true
            });
            const zomoPlanInformation = results.map(
                async (obj: ZomoPlanObject) =>
                    await ZomoPlanInformationMapper.fromPersistence(obj)
            );
            return Promise.all(zomoPlanInformation);
        } catch (error) {
            getLogger().error(error.message);
        }

        return [];
    }

    async getAllEntries(): Promise<ZomoPlanInformation[]> {
        try {
            const query = this.getQuery();
            const results = await query.findAll({
                useMasterKey: true
            });
            const zomoPlanInformation = results.map(
                async (obj: ZomoPlanObject) =>
                    await ZomoPlanInformationMapper.fromPersistence(obj)
            );
            return Promise.all(zomoPlanInformation);
        } catch (error) {
            getLogger().error(error.message);
        }

        return [];
    }
}
