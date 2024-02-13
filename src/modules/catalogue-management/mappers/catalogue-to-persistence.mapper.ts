import { Catalogue } from 'modules/catalogue-management/domain';
import { Mapper } from '../../shared/mappers';
import {
    AVVCatalogueAttributes,
    AVVCatalogueObject,
    ObjectKeys
} from '../infrastructure/parse-types';

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
        aco.set('catalogueCode', catalogue.catalogueNumber);
        aco.set('version', catalogue.version);
        aco.set('validFrom', catalogue.validFrom || undefined);
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
        'avv' + catalogue.catalogueNumber + '.json',
        {
            base64: fromUTF8ToBase64(contentAsJson)
        }
    );
    return jsonFile.save({ useMasterKey: true });
}
