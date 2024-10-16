import { logger } from '../../../../system/logging';
import { AbstractRepository } from '../../../shared/infrastructure';
import { UseCase } from '../../../shared/useCases';
import {
    additionalPathogensRepository,
    AdditionalPathogensRepository,
    analysisProceduresRepository,
    AnalysisProceduresRepository,
    AVVCatalogRepository,
    avvCatalogRepository,
    nrlRepository,
    NRLRepository,
    plzRepository,
    PLZRepository,
    templateFileRepository,
    TemplateFileRepository,
    userInformationRepository,
    UserInformationRepository
} from '../../infrastructure';

class CheckCollectionsForContentUseCase implements UseCase<null, null> {
    constructor(
        private nrlRepository: NRLRepository,
        private plzRepository: PLZRepository,
        private avvCatalogRepository: AVVCatalogRepository,
        private additionalPathogensRepository: AdditionalPathogensRepository,
        private analysisProceduresRepository: AnalysisProceduresRepository,
        private templateFileRepository: TemplateFileRepository,
        private userInfoRepository: UserInformationRepository
    ) {}

    async execute(): Promise<null> {
        try {
            await this.checkRepository(this.nrlRepository, 'NRL Collection');
            await this.checkRepository(
                this.plzRepository,
                'Allowed_PLZ Collection'
            );
            await this.checkRepository(
                this.avvCatalogRepository,
                'AVV_Catalog Collection'
            );
            await this.checkRepository(
                this.additionalPathogensRepository,
                'Additional_Pathogens Collection'
            );
            await this.checkRepository(
                this.analysisProceduresRepository,
                'Analysis_Procedures Collection'
            );
            await this.checkRepository(
                this.templateFileRepository,
                'Template_File Collection'
            );
            await this.checkRepository(
                this.userInfoRepository,
                'User_Info Collection'
            );
        } catch (error) {
            logger.error(
                'Serious error: Unable to check Collections for content'
            );
        }

        return null;
    }

    private async checkRepository<T extends Parse.Object<Parse.Attributes>>(
        repository: AbstractRepository<T>,
        name: string
    ) {
        const isEmpty = await repository.isEmpty();

        if (isEmpty) {
            logger.error(name + ' does not contain any data');
        }
    }
}

const checkCollectionsForContent = new CheckCollectionsForContentUseCase(
    nrlRepository,
    plzRepository,
    avvCatalogRepository,
    additionalPathogensRepository,
    analysisProceduresRepository,
    templateFileRepository,
    userInformationRepository
);

export { checkCollectionsForContent, CheckCollectionsForContentUseCase };
