import { Mapper } from '../../shared/mappers';
import { Institute, InstituteProps } from '../domain';
import { InstituteObject } from '../infrastructure';

export class InstitutePersistenceMapper extends Mapper {
    public static toDomain(instituteObject: InstituteObject): Institute {
        try {
            const props: InstituteProps = {
                state_short: instituteObject.get('state_short')
            };
            return Institute.create(props);
        } catch (e) {
            console.error('could not construct Log Entry from Object.');
            throw e;
        }
    }
}
