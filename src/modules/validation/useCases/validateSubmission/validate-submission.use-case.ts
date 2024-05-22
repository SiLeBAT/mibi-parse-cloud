import { UseCase } from '../../../shared/useCases';
import {
    SampleEntry,
    SampleEntryTuple,
    ValidationParameter
} from '../../domain';
import { validationAntiCorruptionLayer } from '../../legacy';

export class ValidateSubmissionUseCase
    implements UseCase<ValidationParameter, SampleEntry<SampleEntryTuple>[]>
{
    async execute(
        validationParameter: ValidationParameter
    ): Promise<SampleEntry<SampleEntryTuple>[]> {
        const validationacLayer = await validationAntiCorruptionLayer;
        const validatedSamples = await validationacLayer.validateSamples(
            validationParameter
        );
        return validatedSamples;
    }
}

const validateSubmission = new ValidateSubmissionUseCase();

export { validateSubmission };
