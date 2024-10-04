import { NRLObject } from '../../orders/infrastructure';
import { NRL } from '../../shared/domain/entities/nrl.entity';
import {
    AnalysisProcedure,
    Email,
    NRLId
} from '../../shared/domain/valueObjects';
import { Mapper, MappingError } from '../../shared/mappers';

export class NRLPersistenceMapper extends Mapper {
    static async fromPersistence(object: NRLObject): Promise<NRL> {
        try {
            const sp = object.get('standardProcedures') || [];

            const op = object.get('optionalProcedures') || [];
            const standardProcedures = sp.map(async (p: Parse.Object) => {
                return await AnalysisProcedure.create({
                    value: p.get('value'),
                    key: p.get('key')
                });
            });
            const optionalProcedures = op.map(
                async (p: Parse.Object) =>
                    await AnalysisProcedure.create({
                        value: p.get('value'),
                        key: p.get('key')
                    })
            );

            return NRL.create({
                nrlId: NRLId.create(object.get('name')).value,
                selectors: object.get('selector') || [],
                email: await Email.create({ value: object.get('email') || '' }),
                standardProcedures: await Promise.all(standardProcedures),
                optionalProcedures: await Promise.all(optionalProcedures)
            });
        } catch (error) {
            throw new PersistenceToNRLMappingError(
                'Unable to map NRL Persistence to NRL',
                error
            );
        }
    }
}

export class PersistenceToNRLMappingError extends MappingError {}
