import path from 'path';
import {
    getLogger,
    setLoggingContext
} from '../../../shared/core/logging-context';
import { ParseHookRequest } from '../../../shared/infrastructure';
import { AVVCatalogObject } from '../../../shared/infrastructure/parse-types';
import { FileContent, FileContentType } from '../../domain';
import { AVVCatalogMapper } from '../../mappers';
import { checkForCatalogDuplication } from '../checkForCatalogDuplication';
import {
    CatalogDuplicationError,
    UnsupportedFileTypeError
} from './create-avv-catalog.error';
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
    const originalFile = avvCatalogObject.get('catalogueFile');
    const isUpdate = Boolean(avvCatalogObject.id);
    try {
        setLoggingContext(request.log);

        const fileContent = await getFileContent(avvCatalogObject);
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
            destroyFile(originalFile);
        }

        await AVVCatalogMapper.toPersistence(catalog, avvCatalogObject);
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

async function getFileContent(
    avvCatalogObject: AVVCatalogObject
): Promise<FileContent> {
    const file = avvCatalogObject.get('catalogueFile');

    const fileContent = await FileContent.create({
        content: await getContentAsString(file),
        type: determineContentType(file)
    });

    return fileContent;
}

async function getContentAsString(file: Parse.File) {
    const base64 = await file.getData();
    return fromBase64ToUTF8(base64);
}
function fromBase64ToUTF8(base64: string): string {
    const buff = Buffer.from(base64, 'base64');
    return buff.toString('utf-8');
}

function determineContentType(file: Parse.File): FileContentType {
    const ext = path.extname(file.url());
    switch (ext) {
        case '.json':
            return FileContentType.JSON;
        case '.xml':
            return FileContentType.XML;
        default:
            throw new UnsupportedFileTypeError(
                'Unsupported file type',
                new Error()
            );
    }
}
