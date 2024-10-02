import { AbstractRepository } from '../../../shared/infrastructure';
import { NRL } from '../../domain/nrl.entity';
import { NRLPersistenceMapper } from '../../mappers/nrl-persistence.mapper';
import { NRLObject, ObjectKeys } from '../parse-types';

export class NRLRepository extends AbstractRepository<NRLObject> {
    async retrieve(): Promise<NRL[]> {
        const query = this.getQuery();
        query.include('standardProcedures');
        query.include('optionalProcedures');
        const nrlObjects: NRLObject[] = await query.find({
            useMasterKey: true
        });

        const result = nrlObjects.map(
            async nrl => await NRLPersistenceMapper.fromPersistence(nrl)
        );
        return Promise.all(result);
    }
}

const nrlRepository = new NRLRepository(ObjectKeys.NRL);

export { nrlRepository };
