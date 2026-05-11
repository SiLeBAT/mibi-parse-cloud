import { EntityId } from '../../shared/domain/valueObjects';
import { OrderAttributes } from '../../shared/infrastructure/parse-types';
import { Mapper } from '../../shared/mappers';
import { OrderDTO } from '../dto';

type OrderAggregations = {
    pathogens: string[];
    nrls: string[];
    sampleCount: number;
    results: string;
};

export class OrderPersistenceMapper extends Mapper {
    public static toPersistence(
        orderDTO: OrderDTO,
        userId: EntityId,
        aggregations: OrderAggregations
    ): OrderAttributes {
        const user = new Parse.User();
        user.id = userId.value;

        return {
            user,
            fileName: orderDTO.sampleSet.meta.fileName,
            pathogens: aggregations.pathogens,
            nrls: aggregations.nrls,
            sampleCount: aggregations.sampleCount,
            results: aggregations.results,
            meta: JSON.stringify(orderDTO.sampleSet.meta, null, 2)
        };
    }
}
