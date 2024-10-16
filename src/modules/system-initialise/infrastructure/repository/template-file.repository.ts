import { AbstractRepository } from '../../../shared/infrastructure';
import {
    ObjectKeys,
    TemplateFileObject
} from '../../../shared/infrastructure/parse-types';

export class TemplateFileRepository extends AbstractRepository<TemplateFileObject> {}

const templateFileRepository = new TemplateFileRepository(
    ObjectKeys.TEMPLATE_FILE
);

export { templateFileRepository };
