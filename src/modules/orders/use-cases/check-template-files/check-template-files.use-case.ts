import { logger } from '../../../../system/logging';
import { AbstractRepository } from '../../../shared/infrastructure';
import {
    ObjectKeys,
    TemplateFileObject
} from '../../../shared/infrastructure/parse-types';
import { UseCase } from '../../../shared/use-cases';

class CheckTemplateFilesUseCase implements UseCase<null, null> {
    private templateFileRepository = new TemplateFileRepository(
        ObjectKeys.TEMPLATE_FILE
    );
    constructor() {}

    async execute(): Promise<null> {
        try {
            const files = await this.templateFileRepository.retrieveAll();
            if (!this.hasCorrectEntries(files)) {
                logger.error('Incorrect entries in Template File Collection');
            }
        } catch (error) {
            logger.error(
                'Serious error: Unable to check Template File Collection for content'
            );
        }

        return null;
    }

    private hasCorrectEntries(files: TemplateFileObject[]): boolean {
        const filekeys = files.map(file => {
            return file.get('key');
        });
        return (
            files.length === 4 &&
            filekeys.includes('NRL') &&
            filekeys.includes('USER')
        );
    }
}

class TemplateFileRepository extends AbstractRepository<TemplateFileObject> {
    public retrieveAll(): Promise<TemplateFileObject[]> {
        const query = this.getQuery();
        return query.find();
    }
}

const checkTemplateFilesUseCase = new CheckTemplateFilesUseCase();

export { checkTemplateFilesUseCase, CheckTemplateFilesUseCase };
