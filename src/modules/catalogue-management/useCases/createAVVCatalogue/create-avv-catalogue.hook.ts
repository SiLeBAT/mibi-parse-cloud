import path from 'path';
import { FileContent, FileContentType } from '../../domain';
import { AVVCatalogueObject } from '../../infrastructure/parse-types';
import { AVVCatalogueMapper } from '../../mappers';
import { ParseHookRequest } from './../../../shared/infrastructure';
import { UnsupportedFileTypeError } from './create-avv-catalogue.error';
import { createAVVCatalogue } from './create-avv-catalogue.use-case';

type CreateAVVCatalogueRequest = ParseHookRequest<AVVCatalogueObject>;

export const createAVVCatalogueHook = async (
    request: CreateAVVCatalogueRequest
) => {
    const avvCatalogueObject: AVVCatalogueObject = request.object;
    try {
        const isUpdate = Boolean(avvCatalogueObject.id);
        const file = avvCatalogueObject.get('catalogueFile');
        const originalValidFrom = avvCatalogueObject.get('validFrom');

        const fileContent = await FileContent.create({
            content: await getContentAsString(file),
            type: determineContentType(file)
        });

        const catalogue = await createAVVCatalogue.execute({
            fileContent
        });

        catalogue.validFrom = catalogue.validFrom || originalValidFrom || null;

        await AVVCatalogueMapper.toPersistence(catalogue, avvCatalogueObject);

        if (!isUpdate) {
            file.destroy({ useMasterKey: true });
        }
    } catch (error) {
        request.log.error('Unable to create Catalogue from file.');
    }
};

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
