import { EntityId } from '../../../shared/domain/valueObjects';
import { UseCase } from '../../../shared/use-cases';
import {
    SampleEntry,
    SampleEntryTuple,
    SampleEntryV18,
    SampleEntryV18Tuple,
    SampleSet,
    SampleSetV18,
    ValidationParameter
} from '../../domain';
import { antiCorruptionLayers } from '../../legacy';
import { createValidationOptions } from '../create-validation-options';

export class ValidateOrderUseCase
    implements
        UseCase<
            {
                submitterId: EntityId | null;
                sampleSet: SampleSet | SampleSetV18;
            },
            SampleSet | SampleSetV18
        >
{
    async execute({
        submitterId,
        sampleSet
    }: {
        submitterId: EntityId | null;
        sampleSet: SampleSet | SampleSetV18;
    }): Promise<SampleSet | SampleSetV18> {
        const validationOptions = await createValidationOptions.execute({
            submitterId
        });

        const validationParameter = await ValidationParameter.create({
            data: sampleSet.data as
                | SampleEntry<SampleEntryTuple>[]
                | SampleEntryV18<SampleEntryV18Tuple>[],
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
