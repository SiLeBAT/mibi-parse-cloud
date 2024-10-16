import { AbstractRepository } from '../../../shared/infrastructure';
import {
    AnalysisProcedureObject,
    ObjectKeys
} from '../../../shared/infrastructure/parse-types';

export class AnalysisProceduresRepository extends AbstractRepository<AnalysisProcedureObject> {}

const analysisProceduresRepository = new AnalysisProceduresRepository(
    ObjectKeys.AnalysisProcedure
);

export { analysisProceduresRepository };
