import {
    SampleEntry,
    SampleEntryProps,
    SampleEntryTuple
} from '../domain/sample-entry.entity';
import { ValidationParameter } from './../domain';
import { AVVFormatProvider } from './application/avv-format-provider.service';
import { CatalogService } from './application/catalog.service';
import { configurationService } from './application/configuratioin.service';
import { FormAutoCorrectionService } from './application/form-auto-correction.service';
import { FormValidatorService } from './application/form-validation.service';
import { NRLService } from './application/nrl.service';
import { ValidationErrorProvider } from './application/validation-error-provider.service';
import { Analysis, Sample, SampleData, Urgency } from './model/legacy.model';
import { DefaultSample } from './model/sample.entity';
import { initialiseRepository as avvCatalogRepositoryInit } from './repositories/avvcatalog.repository';
import { initialiseRepository as catalogRepositoryInit } from './repositories/catalog.repository';
import { nrlRepository } from './repositories/nrl.repository';
import { initialiseRepository as searchAliasRepositoryInit } from './repositories/search-alias.repository';
import { stateRepository } from './repositories/state.repository';
import { validationErrorRepository } from './repositories/validation-error.repository';

class SampleFactory {
    constructor(private nrlService: NRLService) {}
    createSample(data: SampleData): Sample {
        const pathogen = data['pathogen_avv'].value;
        const nrl = this.nrlService.getNRLForPathogen(pathogen);
        const defaultAnalysis: Partial<Analysis> = {
            ...this.nrlService.getStandardAnalysisFor(nrl),
            ...this.nrlService.getOptionalAnalysisFor(nrl)
        };
        return DefaultSample.create(data, {
            nrl,
            analysis: defaultAnalysis,
            urgency: Urgency.NORMAL
        });
    }
}

class ValidationAntiCorruptionLayer {
    constructor(
        private formValidationService: FormValidatorService,
        private formAutoCorrectionService: FormAutoCorrectionService,
        private nrlService: NRLService
    ) {}

    async validateSamples(
        validationParameter: ValidationParameter
    ): Promise<SampleEntry<SampleEntryTuple>[]> {
        // 0) Convert to legacy abstractions
        // 1) Auto-correction needs to happen before validation.
        // 2) Assign NRL
        // 3) Validate Samples

        const sampleFactory = new SampleFactory(this.nrlService);

        const samples: Sample[] = validationParameter.props.data.map(
            (entry: SampleEntry<SampleEntryTuple>) => {
                return sampleFactory.createSample({
                    sample_id: {
                        errors: [],
                        correctionOffer: [],
                        value: entry.data.sample_id.value,
                        oldValue: entry.data.sample_id.oldValue
                    },
                    sample_id_avv: {
                        errors: [],
                        correctionOffer: [],
                        value: entry.data.sample_id_avv.value,
                        oldValue: entry.data.sample_id_avv.oldValue
                    },
                    partial_sample_id: {
                        errors: [],
                        correctionOffer: [],
                        value: entry.data.partial_sample_id.value,
                        oldValue: entry.data.partial_sample_id.oldValue
                    },
                    pathogen_avv: {
                        errors: [],
                        correctionOffer: [],
                        value: entry.data.pathogen_avv.value,
                        oldValue: entry.data.pathogen_avv.oldValue
                    },
                    pathogen_text: {
                        errors: [],
                        correctionOffer: [],
                        value: entry.data.pathogen_text.value,
                        oldValue: entry.data.pathogen_text.oldValue
                    },
                    sampling_date: {
                        errors: [],
                        correctionOffer: [],
                        value: entry.data.sampling_date.value,
                        oldValue: entry.data.sampling_date.oldValue
                    },
                    isolation_date: {
                        errors: [],
                        correctionOffer: [],
                        value: entry.data.isolation_date.value,
                        oldValue: entry.data.isolation_date.oldValue
                    },
                    sampling_location_avv: {
                        errors: [],
                        correctionOffer: [],
                        value: entry.data.sampling_location_avv.value,
                        oldValue: entry.data.sampling_location_avv.oldValue
                    },
                    sampling_location_zip: {
                        errors: [],
                        correctionOffer: [],
                        value: entry.data.sampling_location_zip.value,
                        oldValue: entry.data.sampling_location_zip.oldValue
                    },
                    sampling_location_text: {
                        errors: [],
                        correctionOffer: [],
                        value: entry.data.sampling_location_text.value,
                        oldValue: entry.data.sampling_location_text.oldValue
                    },
                    animal_avv: {
                        errors: [],
                        correctionOffer: [],
                        value: entry.data.animal_avv.value,
                        oldValue: entry.data.animal_avv.oldValue
                    },
                    matrix_avv: {
                        errors: [],
                        correctionOffer: [],
                        value: entry.data.matrix_avv.value,
                        oldValue: entry.data.matrix_avv.oldValue
                    },
                    animal_matrix_text: {
                        errors: [],
                        correctionOffer: [],
                        value: entry.data.animal_matrix_text.value,
                        oldValue: entry.data.animal_matrix_text.oldValue
                    },
                    primary_production_avv: {
                        errors: [],
                        correctionOffer: [],
                        value: entry.data.primary_production_avv.value,
                        oldValue: entry.data.primary_production_avv.oldValue
                    },
                    control_program_avv: {
                        errors: [],
                        correctionOffer: [],
                        value: entry.data.control_program_avv.value,
                        oldValue: entry.data.control_program_avv.oldValue
                    },
                    sampling_reason_avv: {
                        errors: [],
                        correctionOffer: [],
                        value: entry.data.sampling_reason_avv.value,
                        oldValue: entry.data.sampling_reason_avv.oldValue
                    },
                    program_reason_text: {
                        errors: [],
                        correctionOffer: [],
                        value: entry.data.program_reason_text.value,
                        oldValue: entry.data.program_reason_text.oldValue
                    },
                    operations_mode_avv: {
                        errors: [],
                        correctionOffer: [],
                        value: entry.data.operations_mode_avv.value,
                        oldValue: entry.data.operations_mode_avv.oldValue
                    },
                    operations_mode_text: {
                        errors: [],
                        correctionOffer: [],
                        value: entry.data.operations_mode_text.value,
                        oldValue: entry.data.operations_mode_text.oldValue
                    },
                    vvvo: {
                        errors: [],
                        correctionOffer: [],
                        value: entry.data.vvvo.value,
                        oldValue: entry.data.vvvo.oldValue
                    },
                    program_avv: {
                        errors: [],
                        correctionOffer: [],
                        value: entry.data.program_avv.value,
                        oldValue: entry.data.program_avv.oldValue
                    },
                    comment: {
                        errors: [],
                        correctionOffer: [],
                        value: entry.data.comment.value,
                        oldValue: entry.data.comment.oldValue
                    }
                });
            }
        );
        const autocorrectedSamples =
            await this.formAutoCorrectionService.applyAutoCorrection(samples);

        const assignedSamples =
            this.nrlService.assignNRLsToSamples(autocorrectedSamples);

        const validationResult =
            await this.formValidationService.validateSamples(
                assignedSamples,
                validationParameter.props.options
            );

        return validationResult.map((s: Sample) => {
            const props: SampleEntryProps<SampleEntryTuple> = {
                sample_id: s.getEntryFor('sample_id'),
                sample_id_avv: s.getEntryFor('sample_id_avv'),
                partial_sample_id: s.getEntryFor('partial_sample_id'),
                pathogen_avv: s.getEntryFor('pathogen_avv'),
                pathogen_text: s.getEntryFor('pathogen_text'),
                sampling_date: s.getEntryFor('sampling_date'),
                isolation_date: s.getEntryFor('isolation_date'),
                sampling_location_avv: s.getEntryFor('sampling_location_avv'),
                sampling_location_zip: s.getEntryFor('sampling_location_zip'),
                sampling_location_text: s.getEntryFor('sampling_location_text'),
                animal_avv: s.getEntryFor('animal_avv'),
                matrix_avv: s.getEntryFor('matrix_avv'),
                animal_matrix_text: s.getEntryFor('animal_matrix_text'),
                primary_production_avv: s.getEntryFor('primary_production_avv'),
                control_program_avv: s.getEntryFor('control_program_avv'),
                sampling_reason_avv: s.getEntryFor('sampling_reason_avv'),
                program_reason_text: s.getEntryFor('program_reason_text'),
                operations_mode_avv: s.getEntryFor('operations_mode_avv'),
                operations_mode_text: s.getEntryFor('operations_mode_text'),
                vvvo: s.getEntryFor('vvvo'),
                program_avv: s.getEntryFor('program_avv'),
                comment: s.getEntryFor('comment'),
                nrl: s.getNRL(),
                urgency: s.getUrgency(),
                analysis: s.getAnalysis()
            };
            return SampleEntry.create(props);
        });
    }
}

const validationErrorProvider = new ValidationErrorProvider(
    validationErrorRepository
);

const validationAntiCorruptionLayer = (async function init() {
    const catalogRepository = await catalogRepositoryInit(
        configurationService.getDataStoreConfiguration().dataDir
    ).catch((error: Error) => {
        console.error(
            `Failed to initialize Catalog Repository. error=${String(error)}`
        );
        throw error;
    });
    const searchAliasRepository = await searchAliasRepositoryInit(
        configurationService.getDataStoreConfiguration().dataDir
    ).catch((error: Error) => {
        console.error(
            `Failed to initialize Search Alias Repository. error=${String(
                error
            )}`
        );
        throw error;
    });
    const avvCatalogRepository = await avvCatalogRepositoryInit(
        configurationService.getDataStoreConfiguration().dataDir
    ).catch((error: Error) => {
        console.error(
            `Failed to initialize AVVCatalog Repository. error=${String(error)}`
        );
        throw error;
    });

    const catalogService = new CatalogService(
        catalogRepository,
        searchAliasRepository,
        avvCatalogRepository
    );

    const avvFormatProvider = new AVVFormatProvider(stateRepository);
    const nrlService = new NRLService(nrlRepository);

    const formValidationService = new FormValidatorService(
        catalogService,
        avvFormatProvider,
        validationErrorProvider
    );

    const formAutoCorrectionService = new FormAutoCorrectionService(
        catalogService,
        validationErrorProvider
    );

    const validationAntiCorruptionLayer = new ValidationAntiCorruptionLayer(
        formValidationService,
        formAutoCorrectionService,
        nrlService
    );

    return validationAntiCorruptionLayer;
})();

export { validationAntiCorruptionLayer };
