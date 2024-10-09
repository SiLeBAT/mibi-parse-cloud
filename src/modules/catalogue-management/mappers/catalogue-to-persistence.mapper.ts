import {
    AVVCatalogueAttributes,
    AVVCatalogueObject,
    ObjectKeys
} from '../../shared/infrastructure/parse-types';
import { Mapper } from '../../shared/mappers';
import { Catalogue } from '../domain';

export class AVVCatalogueMapper extends Mapper {
    public static async toPersistence<T>(
        catalogue: Catalogue<T>,
        avvCatalogueObject?: AVVCatalogueObject
    ): Promise<AVVCatalogueObject> {
        let aco = avvCatalogueObject;
        const jsonFile = await createFileFromCatalogue(catalogue);
        if (!aco) {
            const avvCatalogueAttributes: AVVCatalogueAttributes = {
                catalogueFile: jsonFile
            };
            aco = new Parse.Object<AVVCatalogueAttributes>(
                ObjectKeys.AVVCatalogue,
                avvCatalogueAttributes
            );
        }

        aco.set('catalogueFile', jsonFile);
        aco.set('catalogueCode', catalogue.catalogueInformation.catalogueCode);
        aco.set('version', catalogue.catalogueInformation.version);
        aco.set('validFrom', catalogue.catalogueInformation.validFrom);
        return aco;
    }
}

function fromUTF8ToBase64(utf8: string): string {
    const buff = Buffer.from(utf8, 'utf-8');
    return buff.toString('base64');
}

function createFileFromCatalogue<T>(catalogue: Catalogue<T>) {
    const contentAsJson = catalogue.JSON;
    const jsonFile = new Parse.File(
        'avv' + catalogue.catalogueInformation.catalogueCode + '.json',
        {
            base64: fromUTF8ToBase64(contentAsJson)
        }
    );
    return jsonFile.save({ useMasterKey: true });
}
