import { PLZ } from '../../../shared/domain/valueObjects/plz.vo';
import { AbstractRepository } from '../../../shared/infrastructure';
import {
    ObjectKeys,
    PLZObject
} from '../../../shared/infrastructure/parse-types';

export class PLZRepository extends AbstractRepository<PLZObject> {
    async retrieve(): Promise<PLZ[]> {
        const query = this.getQuery();
        const allowedPLZs = await query.findAll({ useMasterKey: true });
        return Promise.all(
            allowedPLZs.map(allowedPLZ => this.mapToPLZ(allowedPLZ))
        );
    }

    private async mapToPLZ(plz: PLZObject): Promise<PLZ> {
        const value = plz.get('plz');
        return await PLZ.create({ value });
    }
}

const plzRepository = new PLZRepository(ObjectKeys.AllowedPLZ);

export { plzRepository };
