import { EntityId } from '../../../shared/domain/valueObjects';
import { SampleObject } from '../../../shared/infrastructure/parse-types';
import { UseCase } from '../../../shared/use-cases';
import {
    ResultDataDTO,
    ResultDataValueDTO,
    StoredResultDTO,
    StoredResultsOrderDTO,
    StoreResultsCollectionDTO,
    StoreResultsPayloadDTO
} from '../../dto';
import {
    orderRepository,
    OrderRepository,
    resultRepository,
    ResultRepository,
    sampleRepository,
    SampleRepository
} from '../../infrastructure/repository';
import { NewResult } from '../../infrastructure/repository/result.repository';
import {
    InvalidResultPayloadError,
    UnknownSamplesError
} from './store-results.error';

type StoreResultsInput = {
    results: StoreResultsPayloadDTO;
};

/** A validated payload element. */
type ResultEntry = {
    sampleObjectId: string;
    resultData: ResultDataDTO;
};

export class StoreResultsUseCase
    implements UseCase<StoreResultsInput, Promise<StoreResultsCollectionDTO>>
{
    constructor(
        private orderRepo: OrderRepository,
        private sampleRepo: SampleRepository,
        private resultRepo: ResultRepository
    ) {}

    async execute({
        results
    }: StoreResultsInput): Promise<StoreResultsCollectionDTO> {
        const entries = this.validatePayload(results);

        const samples = await this.resolveSamples(entries);
        const samplesById = new Map<string, SampleObject>();
        for (const sample of samples) {
            if (sample.id) {
                samplesById.set(sample.id, sample);
            }
        }

        const newResults = await this.buildNewResults(entries, samplesById);
        const savedResults = await this.resultRepo.saveResults(newResults);

        const created: StoredResultDTO[] = savedResults.map(
            (savedResult, index) => ({
                objectId: savedResult.id ?? '',
                sampleObjectId: newResults[index].sample.id ?? '',
                position: newResults[index].position
            })
        );

        return {
            storedResultCount: created.length,
            orders: await this.recountOrders(samples),
            created
        };
    }

    /**
     * Every referenced sample must exist before anything is written: the import
     * is all-or-nothing, so a typo in a hand-edited file leaves the database
     * untouched rather than half-populated.
     */
    private async resolveSamples(
        entries: ResultEntry[]
    ): Promise<SampleObject[]> {
        const requestedIds = [
            ...new Set(entries.map(entry => entry.sampleObjectId))
        ];
        const samples = await this.sampleRepo.findByIds(requestedIds);
        const foundIds = new Set(samples.map(sample => sample.id));

        const unknownIds = requestedIds.filter(id => !foundIds.has(id));
        if (unknownIds.length > 0) {
            throw new UnknownSamplesError(
                `No sample exists for the following objectIds, nothing was stored: ${unknownIds.join(
                    ', '
                )}`,
                null
            );
        }

        return samples;
    }

    /**
     * Results are appended, so positions continue from the highest one each
     * sample already carries. Two entries naming the same sample therefore get
     * consecutive positions, which is how a sample ends up with two results.
     */
    private async buildNewResults(
        entries: ResultEntry[],
        samplesById: Map<string, SampleObject>
    ): Promise<NewResult[]> {
        const samples = [...samplesById.values()];
        const nextPositions = await this.resultRepo.findMaxPositionsBySample(
            samples
        );

        return entries.map(entry => {
            const position = (nextPositions.get(entry.sampleObjectId) ?? 0) + 1;
            nextPositions.set(entry.sampleObjectId, position);

            return {
                // Non-null: resolveSamples has already proved every id exists.
                sample: samplesById.get(entry.sampleObjectId) as SampleObject,
                position,
                resultData: JSON.stringify(entry.resultData)
            };
        });
    }

    /**
     * Recalculates the "<samples with results>/<samples>" counter of every
     * order the import touched, so the order list reflects the new results.
     */
    private async recountOrders(
        samples: SampleObject[]
    ): Promise<StoredResultsOrderDTO[]> {
        const orderIds = [
            ...new Set(
                samples
                    .map(sample => sample.get('order')?.id)
                    .filter((orderId): orderId is string => Boolean(orderId))
            )
        ];

        const counters: StoredResultsOrderDTO[] = [];
        for (const orderId of orderIds) {
            const id = EntityId.create({ value: orderId });
            const orderSamples = await this.sampleRepo.findByOrder(id);
            const covered = await this.resultRepo.countSamplesWithResults(
                orderSamples
            );

            const results = `${covered}/${orderSamples.length}`;
            await this.orderRepo.updateResultsCounter(id, results);
            counters.push({ orderId, results });
        }

        return counters;
    }

    private validatePayload(results: StoreResultsPayloadDTO): ResultEntry[] {
        if (!Array.isArray(results)) {
            throw new InvalidResultPayloadError(
                'The payload must be an array of result objects. An object keyed by sample objectId cannot carry two results for the same sample.',
                null
            );
        }
        if (results.length === 0) {
            throw new InvalidResultPayloadError(
                'The payload contains no results.',
                null
            );
        }

        return results.map((entry, index) => this.validateEntry(entry, index));
    }

    private validateEntry(entry: unknown, index: number): ResultEntry {
        if (!this.isPlainObject(entry)) {
            throw new InvalidResultPayloadError(
                `Element ${index} of the payload is not an object.`,
                null
            );
        }

        const keys = Object.keys(entry);
        if (keys.length !== 1) {
            throw new InvalidResultPayloadError(
                `Element ${index} of the payload must have exactly one property, the sample objectId, but has ${keys.length}.`,
                null
            );
        }

        const sampleObjectId = keys[0];
        const resultData = entry[sampleObjectId];
        if (!this.isPlainObject(resultData)) {
            throw new InvalidResultPayloadError(
                `Element ${index} of the payload (sample ${sampleObjectId}) must map the sample objectId to an object of result values.`,
                null
            );
        }

        for (const [key, value] of Object.entries(resultData)) {
            if (!this.isResultValue(value)) {
                throw new InvalidResultPayloadError(
                    `Element ${index} of the payload (sample ${sampleObjectId}) has an unsupported value for "${key}". Result values must be a string, a number, a boolean or null.`,
                    null
                );
            }
        }

        return {
            sampleObjectId,
            resultData: resultData as ResultDataDTO
        };
    }

    /**
     * Values are stored as the LIMS sent them, so the client receives what the
     * lab reported: text, but also numbers ("Biotyp": 4) and null for an empty
     * measurement.
     *
     * Arrays and nested objects stay rejected. The client renders a value with
     * String(), which would turn them into "1,2" or "[object Object]", so
     * accepting them would put unreadable text in the grid and the CSV.
     */
    private isResultValue(value: unknown): value is ResultDataValueDTO {
        return (
            value === null ||
            typeof value === 'string' ||
            typeof value === 'number' ||
            typeof value === 'boolean'
        );
    }

    private isPlainObject(value: unknown): value is Record<string, unknown> {
        return (
            typeof value === 'object' && value !== null && !Array.isArray(value)
        );
    }
}

const storeResults = new StoreResultsUseCase(
    orderRepository,
    sampleRepository,
    resultRepository
);

export { storeResults };
