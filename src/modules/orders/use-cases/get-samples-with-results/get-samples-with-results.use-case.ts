import { Email, EntityId } from '../../../shared/domain/valueObjects';
import { UseCase } from '../../../shared/use-cases';
import {
    ResultDataDTO,
    SampleDataDTO,
    SampleMetaDTO,
    SampleWithResultsDTO
} from '../../dto';
import {
    orderRepository,
    OrderRepository,
    sampleRepository,
    SampleRepository,
    userRepository,
    UserRepository
} from '../../infrastructure/repository';
import { SampleWithResults } from '../../infrastructure/repository/sample.repository';
import {
    OrderAccessForbiddenError,
    OrderNotFoundError
} from './get-samples-with-results.error';

type GetSamplesWithResultsInput = {
    orderId: string;
    userEmail: string;
};

export class GetSamplesWithResultsUseCase
    implements
        UseCase<GetSamplesWithResultsInput, Promise<SampleWithResultsDTO[]>>
{
    constructor(
        private orderRepo: OrderRepository,
        private sampleRepo: SampleRepository,
        private userRepo: UserRepository
    ) {}

    async execute({
        orderId,
        userEmail
    }: GetSamplesWithResultsInput): Promise<SampleWithResultsDTO[]> {
        const email = await Email.create({ value: userEmail });
        const userId: EntityId = await this.userRepo.getIdForEmail(email);
        const id = EntityId.create({ value: orderId });

        const order = await this.orderRepo.findById(id);
        if (!order) {
            throw new OrderNotFoundError(
                `Order not found. id=${orderId}`,
                null
            );
        }
        if (order.get('user')?.id !== userId.value) {
            throw new OrderAccessForbiddenError(
                `Order does not belong to the requesting user. id=${orderId}`,
                null
            );
        }

        const samplesWithResults = await this.sampleRepo.findByOrderWithResults(
            id
        );

        return samplesWithResults.map(entry => this.toDTO(entry));
    }

    private toDTO({
        sample,
        results
    }: SampleWithResults): SampleWithResultsDTO {
        return {
            id: sample.id ?? '',
            position: sample.get('position') ?? 0,
            sampleData: this.parseJSON<SampleDataDTO>(sample.get('sampleData')),
            sampleMeta: this.parseJSON<SampleMetaDTO>(sample.get('sampleMeta')),
            results: results.map(result => ({
                id: result.id ?? '',
                position: result.get('position') ?? 0,
                resultData: this.parseJSON<ResultDataDTO>(
                    result.get('resultData')
                )
            }))
        };
    }

    private parseJSON<T = unknown>(raw: unknown): T {
        if (typeof raw !== 'string' || raw.length === 0) {
            return null as T;
        }
        try {
            return JSON.parse(raw) as T;
        } catch {
            return raw as T;
        }
    }
}

const getSamplesWithResults = new GetSamplesWithResultsUseCase(
    orderRepository,
    sampleRepository,
    userRepository
);

export { getSamplesWithResults };
