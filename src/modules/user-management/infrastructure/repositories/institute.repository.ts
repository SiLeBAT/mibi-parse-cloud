import { AbstractRepository } from '../../../shared/infrastructure';
import {
    InstituteObject,
    ObjectKeys
} from '../../../shared/infrastructure/parse-types';

export class InstituteRepository extends AbstractRepository<InstituteObject> {
    getInstituteById(instituteId: string) {
        const query = this.getQuery();
        const instituteObject = query.get(instituteId);
        return instituteObject;
    }
}

const instituteRepository = new InstituteRepository(ObjectKeys.Institute);

export { instituteRepository };
