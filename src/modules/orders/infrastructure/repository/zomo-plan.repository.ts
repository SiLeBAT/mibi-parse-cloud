import { logger } from '../../../../system/logging';
import { ZomoPlan } from '../../../shared/domain/valueObjects/zomo-plan.vo';
import { AbstractRepository } from '../../../shared/infrastructure';
import { ZomoPlanObject } from '../../../shared/infrastructure/parse-types';
import { ZomoPlanPersistenceMapper } from '../../mappers';

export class ZomoPlanRepository extends AbstractRepository<ZomoPlanObject> {
    async retrieve(): Promise<ZomoPlan[]> {
        logger.info(
            `${this.constructor.name}.${this.retrieve.name}, loading Zomo Plan data from Database.`
        );

        const query = this.getQuery();
        const allZomoPlans = await query.findAll({ useMasterKey: true });

        const zomoPlans = Promise.all(
            allZomoPlans.map(zomoPlan =>
                ZomoPlanPersistenceMapper.fromPersistence(zomoPlan)
            )
        );

        logger.info(
            `${this.constructor.name}.${this.retrieve.name}, finished loading Zomo Plan data from Database.`
        );

        return zomoPlans;
    }
}
