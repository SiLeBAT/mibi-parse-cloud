import { Mapper, MappingError } from '../../shared/mappers';
import { NRLId } from '../domain/nrl-id.vo';
import { NRLObject } from '../infrastructure';
import { NRL } from '../legacy/model/legacy.model';

export class NRLPersistenceMapper extends Mapper {
    static fromPersistence(object: NRLObject): NRL {
        try {
            const sp = object.get('standardProcedure') || [];
            const op = object.get('optionalProcedure') || [];
            return {
                id: NRLId.create(object.get('name')).value,
                selectors: object.get('selector') || [],
                email: object.get('email') || '',
                standardProcedures: sp.map((p: Parse.Object) => ({
                    value: p.get('value'),
                    key: p.get('key')
                })),
                optionalProcedures: op.map((p: Parse.Object) => ({
                    value: p.get('value'),
                    key: p.get('key')
                }))
            };
        } catch (error) {
            throw new PersistenceToNRLMappingError(
                'Unable to map NRL Persistence to NRL',
                error
            );
        }
    }
}

export class PersistenceToNRLMappingError extends MappingError {}
