import moment from 'moment';
import validate from 'validate.js';

import { NRL_ID_VALUE } from '../../../shared/domain/valueObjects';
import { CatalogService } from '../application/catalog.service';
import {
    ValidationConstraints,
    ValidationErrorCollection,
    Validator,
    ValidatorConfig
} from '../model/legacy.model';
import {
    atLeastOneOf,
    dateAllowEmpty,
    dependentFields,
    hasObligatoryFacettenValues,
    inAVVCatalog,
    inAVVFacettenCatalog,
    inPLZCatalog,
    isHierarchyCode,
    matchAVVCodeOrString,
    matchesIdToSpecificYear,
    matchesRegexPattern,
    multipleFacettenAllowed,
    noPlanprobeForNRL_AR,
    nrlExists,
    referenceDate,
    matchesZoMo,
    matchesProgramZoMo,
    presenceZoMo,
    presenceNotZoMo,
    requiredIfOther
} from './custom-validator-functions';
import { Sample } from './sample.entity';

moment.locale('de');

class SampleValidator implements Validator {
    private catalogService: CatalogService;

    constructor(config: ValidatorConfig) {
        // Before using it we must add the parse and format functions
        // Here is a sample implementation using moment.js
        validate.extend(validate.validators.datetime, {
            // The value is guaranteed not to be null or undefined but otherwise it
            // could be anything.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            parse: function (value: any) {
                const result = +moment.utc(value, config.dateFormat);
                return result;
            },
            // Input is a unix timestamp
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            format: function (value: any, options: any) {
                const format = options.dateOnly
                    ? config.dateFormat
                    : config.dateTimeFormat; // "DD-MM-YYYY" : "DD-MM-YYYY hh:mm:ss";
                const result = moment.utc(value).format(format);
                return result;
            }
        });
        this.catalogService = config.catalogService;
        this.registerCustomValidators();
    }

    validateSample(
        sample: Sample,
        constraintSet: ValidationConstraints
    ): ValidationErrorCollection {
        const data = sample.getDataEntries();
        let dataValuesOnly: Record<string, string | NRL_ID_VALUE> = {};
        dataValuesOnly = Object.keys(data).reduce((accumulator, property) => {
            accumulator[property] = data[property].value;
            return accumulator;
        }, dataValuesOnly);
        dataValuesOnly = { ...{ nrl: sample.getNRL() }, ...dataValuesOnly };

        return validate(dataValuesOnly, constraintSet);
    }

    private registerCustomValidators() {
        // Register Custom Validators
        validate.validators.futureDate = referenceDate;
        validate.validators.nrlExists = nrlExists;
        validate.validators.noPlanprobeForNRL_AR = noPlanprobeForNRL_AR;
        validate.validators.oldSample = referenceDate;
        validate.validators.atLeastOneOf = atLeastOneOf;
        validate.validators.dateAllowEmpty = dateAllowEmpty;
        validate.validators.referenceDate = referenceDate;
        validate.validators.timeBetween = referenceDate;
        validate.validators.dependentFields = dependentFields;
        validate.validators.requiredIfOther = requiredIfOther;
        validate.validators.matchesRegexPattern = matchesRegexPattern;
        validate.validators.matchesIdToSpecificYear = matchesIdToSpecificYear;
        validate.validators.inPLZCatalog = inPLZCatalog(this.catalogService);
        validate.validators.inAVVCatalog = inAVVCatalog(this.catalogService);
        validate.validators.inAVVFacettenCatalog = inAVVFacettenCatalog(
            this.catalogService
        );
        validate.validators.hasObligatoryFacettenValues =
            hasObligatoryFacettenValues(this.catalogService);
        validate.validators.isHierarchyCode = isHierarchyCode(
            this.catalogService
        );
        validate.validators.multipleFacettenAllowed = multipleFacettenAllowed(
            this.catalogService
        );
        validate.validators.matchAVVCodeOrString = matchAVVCodeOrString(
            this.catalogService
        );
        validate.validators.matchesZoMo = matchesZoMo(this.catalogService);
        validate.validators.matchesProgramZoMo = matchesProgramZoMo(
            this.catalogService
        );
        validate.validators.presenceZoMo = presenceZoMo;
        validate.validators.presenceNotZoMo = presenceNotZoMo;
    }
}

function createValidator(config: ValidatorConfig): Validator {
    return new SampleValidator(config);
}

export { createValidator };
