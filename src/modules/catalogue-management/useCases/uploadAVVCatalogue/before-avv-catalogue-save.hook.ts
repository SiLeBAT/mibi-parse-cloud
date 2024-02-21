import path from 'path';
import {
    getLogger,
    setLoggingContext
} from '../../../shared/core/logging-context';
import { ParseHookRequest } from '../../../shared/infrastructure';
import { FileContent, FileContentType } from '../../domain';
import { AVVCatalogueObject } from '../../infrastructure/parse-types';
import { AVVCatalogueMapper } from '../../mappers';
import { checkForCatalogueDuplication } from '../checkForCatalogueDuplication';
import {
    CatalogueDuplicationError,
    UnsupportedFileTypeError
} from './create-avv-catalogue.error';
import { createAVVCatalogue } from './create-avv-catalogue.use-case';

type AVVCatalogueSaveContext = Record<string, unknown>;

type BeforeAVVCatalogueSaveHookRequest = ParseHookRequest<
    AVVCatalogueObject,
    AVVCatalogueSaveContext
>;

export const beforeAVVCatalogueSaveHook = async (
    request: BeforeAVVCatalogueSaveHookRequest
) => {
    const avvCatalogueObject: AVVCatalogueObject = request.object;
    const originalFile = avvCatalogueObject.get('catalogueFile');
    const isUpdate = Boolean(avvCatalogueObject.id);
    try {
        setLoggingContext(request.log);

        const fileContent = await getFileContent(avvCatalogueObject);
        const catalogue = await createAVVCatalogue.execute({
            fileContent
        });

        if (!isUpdate) {
            // We are checking for duplication AFTER parsing the XML, because the information required to decide if the entry is a duplicate is found inside the file.  If we switch to an XPath base XML Query mechanism we could possibly check for duplication before parsing, thus speeding up the system by avoiding unnecessary parsing.
            const isDuplicate: boolean =
                await checkForCatalogueDuplication.execute(
                    catalogue.catalogueInformation
                );
            if (isDuplicate) {
                throw new CatalogueDuplicationError(
                    'The uploaded catalogue already appears to exist',
                    new Error()
                );
            }
            destroyFile(originalFile);
        }

        await AVVCatalogueMapper.toPersistence(catalogue, avvCatalogueObject);
    } catch (error) {
        if (error instanceof CatalogueDuplicationError) {
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
    avvCatalogueObject: AVVCatalogueObject
): Promise<FileContent> {
    const file = avvCatalogueObject.get('catalogueFile');

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
