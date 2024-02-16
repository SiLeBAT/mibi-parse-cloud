import { ObjectKeys } from '../../infrastructure';
import { NRL } from '../model/legacy.model';
import { NRLPersistenceMapper } from './../../mappers/nrl-persistence.mapper';

/*
 *   This repository exists to handle the legacy codebase:
 *   excel-unmarshal.service.ts.
 *   If another object requires an NRL repository, one could consider writing a *   proper implementation (i.e. extends the AbstractRepository)
 */
export class NRLRepository {
    async retrieve(): Promise<NRL[]> {
        const query = new Parse.Query(ObjectKeys.NRL);
        query.include('standardProcedures');
        query.include('optionalProcedures');
        const nrlObjects: Parse.Object[] = await query.find();
        const result = nrlObjects.map(nrl =>
            NRLPersistenceMapper.fromPersistence(nrl)
        );
        return result;
    }
}

const nrlRepository = new NRLRepository();

export { nrlRepository };
