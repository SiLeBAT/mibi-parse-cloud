import {
    getLogger,
    setLoggingContext
} from '../../../shared/core/logging-context';
import { ParseHookRequest } from '../../../shared/infrastructure';
import { AVVCatalogObject } from '../../../shared/infrastructure/parse-types';
import { AVVCatalogMapper } from '../../mappers';
import { checkForCatalogDuplication } from '../checkForCatalogDuplication';
import { checkForCatalogSameValidFrom } from '../checkForCatalogSameValidFrom';
import { CatalogDuplicationError } from './create-avv-catalog.error';
import { readFileContent } from '../readFileContent';
import { createAVVCatalog } from './create-avv-catalog.use-case';

type AVVCatalogSaveContext = Record<string, unknown>;

type BeforeAVVCatalogSaveHookRequest = ParseHookRequest<
    AVVCatalogObject,
    AVVCatalogSaveContext
>;

export const beforeAVVCatalogSaveHook = async (
    request: BeforeAVVCatalogSaveHookRequest
) => {
    const avvCatalogObject: AVVCatalogObject = request.object;
    const originalFile = avvCatalogObject.get('catalogFile');
    const isUpdate = Boolean(avvCatalogObject.id);
    let uploadWarning: string | null = null;
    try {
        setLoggingContext(request.log);

        const fileContent = await readFileContent.execute(originalFile);
        const catalog = await createAVVCatalog.execute({
            fileContent
        });

        if (!isUpdate) {
            // We are checking for duplication AFTER parsing the XML, because the information required to decide if the entry is a duplicate is found inside the file.  If we switch to an XPath base XML Query mechanism we could possibly check for duplication before parsing, thus speeding up the system by avoiding unnecessary parsing.
            const isDuplicate: boolean =
                await checkForCatalogDuplication.execute(
                    catalog.catalogInformation
                );
            if (isDuplicate) {
                throw new CatalogDuplicationError(
                    'The uploaded catalog already appears to exist',
                    new Error()
                );
            }
            uploadWarning = await checkForCatalogSameValidFrom.execute(
                catalog.catalogInformation
            );
            destroyFile(originalFile);
        }

        await AVVCatalogMapper.toPersistence(catalog, avvCatalogObject);
        if (uploadWarning) {
            // The catalog is saved anyway, the warning is shown in its row in the dashboard
            getLogger().warn(uploadWarning);
            avvCatalogObject.set('uploadWarning', uploadWarning);
        }
    } catch (error) {
        if (error instanceof CatalogDuplicationError) {
            destroyFile(originalFile);
        }
        throw error;
    } finally {
        setLoggingContext(null);
    }
};

function destroyFile(file: Parse.File) {
    try {
        file.destroy({ useMasterKey: true });
    } catch (error) {
        getLogger().error(error.message);
    }
}
