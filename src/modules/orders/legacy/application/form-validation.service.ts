import _ from 'lodash';
import { ValidationOptions } from '../../domain/validation-parameter.vo';
import {
    AnnotatedSampleDataEntry,
    SampleProperty,
    ValidationConstraints,
    ValidationRule,
    ValidationRuleSet,
    Validator
} from '../model/legacy.model';
import { Sample } from '../model/sample.entity';
import {
    baseConstraints,
    standardConstraints,
    zoMoConstraints
} from '../model/validation-constraints';
import { createValidator } from '../model/validator.entity';
import { AVVFormatProvider } from './avv-format-provider.service';
import { CatalogService } from './catalog.service';
import { ValidationErrorProvider } from './validation-error-provider.service';

enum ConstraintSet {
    STANDARD = 'standard',
    ZOMO = 'ZoMo'
}

interface DuplicateIdConfig {
    sampleId: SampleProperty;
    error: number;
    uniqueIdSelector: (sample: Sample) => string | undefined;
}

const duplicatePathogenIdConfig: DuplicateIdConfig = {
    sampleId: 'sample_id',
    error: 3,
    uniqueIdSelector: (sample: Sample) => sample.pathogenId
};

const duplicatePathogenIdAVVConfig: DuplicateIdConfig = {
    sampleId: 'sample_id_avv',
    error: 6,
    uniqueIdSelector: (sample: Sample) => sample.pathogenIdAVV
};

export class FormValidatorService {
    private validator: Validator;

    constructor(
        private catalogService: CatalogService,
        private avvFormatProvider: AVVFormatProvider,
        private validationErrorProvider: ValidationErrorProvider
    ) {
        this.validator = createValidator({
            dateFormat: 'DD-MM-YYYY',
            dateTimeFormat: 'DD-MM-YYYY hh:mm:ss',
            catalogService: this.catalogService
        });
    }

    async validateSamples(
        sampleCollection: Sample[],
        validationOptions: ValidationOptions
    ): Promise<Sample[]> {
        console.log(
            `${this.constructor.name}.${this.validateSamples.name}, starting Sample validation`
        );

        let results = this.validateIndividualSamples(
            sampleCollection,
            validationOptions
        );

        if (results.length > 1) {
            results = this.validateSamplesBatch(results);
        }

        console.log(
            `${this.constructor.name}.${this.validateSamples.name}, finishing Sample validation`
        );
        sampleCollection = results;
        return sampleCollection;
    }

    private validateIndividualSamples(
        samples: Sample[],
        validationOptions: ValidationOptions
    ): Sample[] {
        return samples.map(sample => {
            const constraintSet = sample.isZoMo()
                ? this.getConstraints(ConstraintSet.ZOMO, validationOptions)
                : this.getConstraints(
                      ConstraintSet.STANDARD,
                      validationOptions
                  );

            const validationErrors = this.validator.validateSample(
                sample,
                constraintSet
            );

            // Ticket #mpc514
            this.supplementAVV313Data(sample);

            sample.addErrors(validationErrors);

            return sample;
        });
    }

    private validateSamplesBatch(samples: Sample[]): Sample[] {
        const checkedForDuplicateIds = this.checkForDuplicateIdEntries(
            samples,
            duplicatePathogenIdConfig
        );
        return this.checkForDuplicateIdEntries(
            checkedForDuplicateIds,
            duplicatePathogenIdAVVConfig
        );
    }

    private checkForDuplicateIdEntries(
        samples: Sample[],
        config: DuplicateIdConfig
    ): Sample[] {
        const pathogenArrayIdDuplicates = this.getDuplicateEntries(
            samples,
            config
        );

        _.filter(samples, sample =>
            _.includes(
                pathogenArrayIdDuplicates,
                config.uniqueIdSelector(sample)
            )
        ).forEach(filteredSample => {
            const err = this.validationErrorProvider.getError(config.error);
            filteredSample.addErrorTo(config.sampleId, err);
        });

        return [...samples];
    }

    private getDuplicateEntries(samples: Sample[], config: DuplicateIdConfig) {
        const pathogenArrayId = samples
            .map(sample => config.uniqueIdSelector(sample))
            .filter(x => x);
        return _.filter(pathogenArrayId, (value, index, iteratee) => {
            return _.includes(iteratee, value, index + 1);
        });
    }

    private getConstraints(set: ConstraintSet, options: ValidationOptions) {
        let newConstraints: ValidationConstraints =
            _.cloneDeep(baseConstraints) || {};

        switch (set) {
            case ConstraintSet.ZOMO:
                _.forEach(newConstraints, (value: ValidationRuleSet, key) => {
                    // eslint-disable-next-line no-prototype-builtins
                    if (zoMoConstraints.hasOwnProperty(key)) {
                        newConstraints[key] = {
                            ...value,
                            ...zoMoConstraints[key]
                        };
                    }
                });
                break;
            case ConstraintSet.STANDARD:
            default:
                _.forEach(newConstraints, (value: ValidationRuleSet, key) => {
                    // eslint-disable-next-line no-prototype-builtins
                    if (standardConstraints.hasOwnProperty(key)) {
                        newConstraints[key] = {
                            ...value,
                            ...standardConstraints[key]
                        };
                    }
                });
        }

        if (options.state) {
            newConstraints = this.setStateSpecificConstraints(
                newConstraints,
                options
            );
        }

        _.forEach(newConstraints, (v: ValidationRuleSet) => {
            _.forEach(v, (v2: ValidationRule) => {
                v2['message'] = this.validationErrorProvider.getError(
                    v2['error']
                );
            });
        });

        return newConstraints;
    }

    private setStateSpecificConstraints(
        newConstraints: ValidationConstraints,
        options: ValidationOptions
    ): ValidationConstraints {
        if (
            newConstraints['sample_id_avv'] &&
            newConstraints['sample_id_avv']['matchesIdToSpecificYear']
        ) {
            // Necessary because of Ticket #49
            newConstraints['sample_id_avv']['matchesIdToSpecificYear'].regex =
                this.avvFormatProvider.getFormat(options.state);
        }
        return { ...newConstraints };
    }

    private supplementAVV313Data(sample: Sample) {
        const avvEntry: AnnotatedSampleDataEntry = sample.getEntryFor(
            'sampling_location_avv'
        );
        const zipEntry: AnnotatedSampleDataEntry = sample.getEntryFor(
            'sampling_location_zip'
        );
        const cityEntry: AnnotatedSampleDataEntry = sample.getEntryFor(
            'sampling_location_text'
        );

        if (
            avvEntry.value !== '' &&
            zipEntry.value === '' &&
            cityEntry.value === ''
        ) {
            const avv313Cat = this.catalogService.getAVVCatalog('avv313');
            const catEntry = avv313Cat.getAVV313EintragWithAVVKode(
                avvEntry.value
            );
            if (catEntry !== undefined) {
                sample.supplementAVV313Data(catEntry.PLZ, catEntry.Text);
            }
        }
    }
}
