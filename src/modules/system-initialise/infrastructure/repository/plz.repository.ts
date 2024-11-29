import { AbstractRepository } from '../../../shared/infrastructure';
import {
    ObjectKeys,
    PLZObject
} from '../../../shared/infrastructure/parse-types';

export class PLZRepository extends AbstractRepository<PLZObject> {}

const plzRepository = new PLZRepository(ObjectKeys.AllowedPLZ);

export { plzRepository };
