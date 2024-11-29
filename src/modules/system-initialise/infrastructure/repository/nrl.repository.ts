import { AbstractRepository } from '../../../shared/infrastructure';
import {
    NRLObject,
    ObjectKeys
} from '../../../shared/infrastructure/parse-types';

export class NRLRepository extends AbstractRepository<NRLObject> {}

const nrlRepository = new NRLRepository(ObjectKeys.NRL);

export { nrlRepository };
