import { EntityId } from '../../../shared/domain/valueObjects';
import { UseCase } from '../../../shared/useCases';
import {
    SampleEntry,
    SampleEntryTuple,
    SampleSet,
    ValidationParameter
} from '../../domain';
import { antiCorruptionLayers } from '../../legacy';
import { createValidationOptions } from '../create-validation-options';

export class ValidateOrderUseCase
    implements
        UseCase<
            { submitterId: EntityId | null; sampleSet: SampleSet },
            SampleSet
        >
{
    async execute({
        submitterId,
        sampleSet
    }: {
        submitterId: EntityId | null;
        sampleSet: SampleSet;
    }): Promise<SampleSet> {
        const validationOptions = await createValidationOptions.execute({
            submitterId
        });

        const validationParameter = await ValidationParameter.create({
            data: sampleSet.data as SampleEntry<SampleEntryTuple>[],
            options: validationOptions
        });

        const { validationAntiCorruptionLayer } = await antiCorruptionLayers;
        const validationACLayer = await validationAntiCorruptionLayer;
        const validatedSamples = await validationACLayer.validateSamples(
            validationParameter
        );
        return validatedSamples;
    }
}

const validateOrder = new ValidateOrderUseCase();

export { validateOrder };
