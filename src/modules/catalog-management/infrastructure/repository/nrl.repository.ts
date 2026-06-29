import { getLogger } from '../../../shared/core/logging-context';
import { AbstractRepository } from '../../../shared/infrastructure';
import {
    NRLObject,
    ObjectKeys
} from '../../../shared/infrastructure/parse-types';

export class NRLRepository extends AbstractRepository<NRLObject> {
    constructor() {
        super(ObjectKeys.NRL);
    }

    async getAllRegexValues(): Promise<string[]> {
        try {
            const query = this.getQuery();
            const allNRLs = await query.findAll({ useMasterKey: true });
            const regexValues = allNRLs.flatMap(
                (nrl: NRLObject) => nrl.get('selector') ?? []
            );

            return regexValues;
        } catch (error) {
            getLogger().error(error.message);
        }
        return [];
    }
}
