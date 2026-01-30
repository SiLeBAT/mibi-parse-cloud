import { logger } from '../../../system/logging';
import {
    avvCatalogCache,
    nrlCache,
    plzCache,
    searchAliasCache,
    zomoPlanCache
} from '../../shared/infrastructure';
import { ObjectKeys } from '../../shared/infrastructure/parse-types';
import {
    setAVVCatalogCache,
    setSearchAliasCache,
    setZomoPlanCache
} from '../use-cases';
import {
    ExcelMarshallAntiCorruptionLayer,
    ExcelUnmarshalAntiCorruptionLayer,
    SubmissionAntiCorruptionLayer,
    ValidationAntiCorruptionLayer
} from './anti-corruption';
import { AVVFormatProvider } from './application/avv-format-provider.service';
import { CatalogService } from './application/catalog.service';
import { configurationService } from './application/configuration.service';
import { excelUnmarshalService } from './application/excel-unmarshal.service';
import { FormAutoCorrectionService } from './application/form-auto-correction.service';
import { FormValidatorService } from './application/form-validation.service';
import { JSONMarshalService } from './application/json-marshal.service';
import { MailService } from './application/mail';
import { NotificationService } from './application/notification.service';
import { NRLService } from './application/nrl.service';
import { PDFConfigProviderService } from './application/pdf-config-provider.service';
import { PDFConfigProviderV18Service } from './application/pdf-config-provider-v18.service';
import { PDFCreatorService } from './application/pdf-creator.service';
import { PDFCreatorV18Service } from './application/pdf-creator-v18.service';
import { PDFService } from './application/pdf.service';
import { SampleSheetService } from './application/sample-sheet.service';
import { SampleService } from './application/sample.service';
import { ValidationErrorProvider } from './application/validation-error-provider.service';
import {
    pdfConstants,
    pdfConstantsV18,
    sampleSheetConstants,
    sampleSheetV18Constants
} from './model/legacy.model';
import { initialiseRepository as catalogRepositoryInit } from './repositories/catalog.repository';
import { stateRepository } from './repositories/state.repository';
import { validationErrorRepository } from './repositories/validation-error.repository';

const fileRepository = {
    getFileBuffer: async (key: string, version: string) => {
        const query = new Parse.Query(ObjectKeys.TEMPLATE_FILE);
        query.equalTo('key', key.toUpperCase());
        query.equalTo('version', version);
        const templateFileObject = await query.first({ useMasterKey: true });
        if (!templateFileObject) {
            throw Error("Can't find template file with key: " + key);
        }
        const file = await templateFileObject.get('templateFile');
        const buff = await Buffer.from(await file.getData(), 'base64');
        return buff;
    }
};

const validationErrorProvider = new ValidationErrorProvider(
    validationErrorRepository
);

const antiCorruptionLayers = (async function init() {
    await catalogRepositoryInit(
        configurationService.getDataStoreConfiguration().dataDir
    ).catch((error: Error) => {
        console.error(
            `Failed to initialize Catalog Repository. error=${String(error)}`
        );
        throw error;
    });

    logger.info('Parse Cloud: Creating Search-Alias cache.');
    await setSearchAliasCache.execute();
    logger.info('Parse Cloud: Creating AVVCatalog cache.');
    await setAVVCatalogCache.execute();
    logger.info('Parse Cloud: Creating Zomo Plan cache.');
    await setZomoPlanCache.execute();

    const catalogService = new CatalogService(
        plzCache,
        searchAliasCache,
        avvCatalogCache,
        zomoPlanCache
    );

    const avvFormatProvider = new AVVFormatProvider(stateRepository);
    const nrlService = new NRLService(nrlCache);

    const sampleSheetService = new SampleSheetService(nrlService);
    const jSONMarshalService = new JSONMarshalService(
        fileRepository,
        sampleSheetConstants
    );
    const sampleService = new SampleService(
        jSONMarshalService,
        sampleSheetService
    );
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

    const notificationService = new NotificationService();
    const mailService = new MailService(
        configurationService.getMailConfiguration()
    );

    const mailHandler = mailService.getMailHandler().bind(mailService);

    notificationService.addHandler(mailHandler);
    const pdfService = new PDFService();

    const configProvider = new PDFConfigProviderService(
        sampleSheetConstants,
        pdfConstants
    );
    const configProviderV18 = new PDFConfigProviderV18Service(
        sampleSheetV18Constants,
        pdfConstantsV18
    );
    const pdfCreatorService = new PDFCreatorService(
        pdfService,
        configProvider,
        catalogService
    );
    const pdfCreatorV18Service = new PDFCreatorV18Service(
        pdfService,
        configProviderV18,
        catalogService
    );

    const submissionAntiCorruptionLayer = new SubmissionAntiCorruptionLayer(
        notificationService,
        jSONMarshalService,
        pdfCreatorService,
        pdfCreatorV18Service,
        nrlService,
        sampleSheetService,
        catalogService
    );
    const excelMarshallAntiCorruptionLayer =
        new ExcelMarshallAntiCorruptionLayer(sampleService);

    const excelUnmarshalAntiCorruptionLayer =
        new ExcelUnmarshalAntiCorruptionLayer(
            excelUnmarshalService,
            sampleSheetService
        );

    return {
        excelUnmarshalAntiCorruptionLayer,
        validationAntiCorruptionLayer,
        submissionAntiCorruptionLayer,
        excelMarshallAntiCorruptionLayer
    };
})();

export { antiCorruptionLayers };
