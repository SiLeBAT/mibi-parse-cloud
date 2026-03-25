import Parse from 'parse/node';
import {
    AVVCatalogAttributes,
    AVVCatalogObject,
    ObjectKeys
} from '../../shared/infrastructure/parse-types';
import { Mapper } from '../../shared/mappers';
import { Catalog } from '../domain';

export class AVVCatalogMapper extends Mapper {
    public static async toPersistence<T>(
        catalog: Catalog<T>,
        avvCatalogObject?: AVVCatalogObject
    ): Promise<AVVCatalogObject> {
        let aco = avvCatalogObject;
        const jsonFile = await createFileFromCatalog(catalog);
        if (!aco) {
            const avvCatalogAttributes: AVVCatalogAttributes = {
                catalogFile: jsonFile,
                version: catalog.catalogInformation.version,
                validFrom: catalog.catalogInformation.validFrom,
                catalogCode: catalog.catalogInformation.catalogCode,
                catalogData: catalog.JSON
            };
            aco = new Parse.Object<AVVCatalogAttributes>(
                ObjectKeys.AVVCatalog,
                avvCatalogAttributes
            );
        }

        aco.set('catalogFile', jsonFile);
        aco.set('catalogCode', catalog.catalogInformation.catalogCode);
        aco.set('version', catalog.catalogInformation.version);
        aco.set('validFrom', catalog.catalogInformation.validFrom);
        aco.set('catalogData', catalog.JSON);
        return aco;
    }
}

function fromUTF8ToBase64(utf8: string): string {
    const buff = Buffer.from(utf8, 'utf-8');
    return buff.toString('base64');
}

async function createFileFromCatalog<T>(
    catalog: Catalog<T>
): Promise<Parse.File> {
    const contentAsJson = catalog.JSON;
    const jsonFile = new Parse.File(
        'avv' + catalog.catalogInformation.catalogCode + '.json',
        {
            base64: fromUTF8ToBase64(contentAsJson)
        }
    );
    const savedFile = await jsonFile.save({ useMasterKey: true });

    if (!savedFile) {
        throw new Error('Failed to create catalog file.');
    }

    return savedFile;
}
