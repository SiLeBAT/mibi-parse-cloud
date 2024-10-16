import { AbstractRepository } from '../../../shared/infrastructure';
import {
    AdditionalPathogensObject,
    ObjectKeys
} from '../../../shared/infrastructure/parse-types';

export class AdditionalPathogensRepository extends AbstractRepository<AdditionalPathogensObject> {}

const additionalPathogensRepository = new AdditionalPathogensRepository(
    ObjectKeys.AdditionalPathogens
);

export { additionalPathogensRepository };
