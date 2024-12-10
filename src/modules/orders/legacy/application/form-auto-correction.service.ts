import {
    CorrectionFunction,
    CorrectionSuggestions,
    SampleData
} from '../model/legacy.model';
import { Sample } from '../model/sample.entity';
import { CatalogService } from './catalog.service';
import { autoCorrectAVV324 } from './custom-auto-correction-functions';
import { ValidationErrorProvider } from './validation-error-provider.service';

export class FormAutoCorrectionService {
    private correctionFunctions: CorrectionFunction[] = [];

    constructor(
        private catalogService: CatalogService,
        private validationErrorProvider: ValidationErrorProvider
    ) {
        this.registerCorrectionFunctions();
    }

    async applyAutoCorrection(sampleCollection: Sample[]): Promise<Sample[]> {
        const results = sampleCollection.map(sample => {
            const newSample: Sample = sample.clone();
            const sampleData: SampleData = newSample.getAnnotatedData();
            this.correctionFunctions.forEach(fn => {
                const correction: CorrectionSuggestions | null = fn(sampleData);
                if (correction) {
                    const targetField = correction.field.toString();
                    newSample.addCorrectionTo(
                        targetField,
                        correction.correctionOffer
                    );
                    if (correction.code) {
                        const err = this.validationErrorProvider.getError(
                            correction.code
                        );
                        newSample.addErrorTo(targetField, err);
                    }
                }
            });
            return newSample;
        });
        return results;
    }

    private registerCorrectionFunctions() {
        this.correctionFunctions.push(autoCorrectAVV324(this.catalogService));
    }
}
