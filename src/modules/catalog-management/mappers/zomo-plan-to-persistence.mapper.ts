import {
    ZomoPlanAttributes,
    ZomoPlanObject,
    ObjectKeys
} from '../../shared/infrastructure/parse-types';
import { Mapper } from '../../shared/mappers';
import { ZomoPlan } from '../domain';

export class ZomoPlanMapper extends Mapper {
    public static async toPersistence<T>(
        zomoPlan: ZomoPlan<T>,
        zomoPlanObject?: ZomoPlanObject
    ): Promise<ZomoPlanObject> {
        let aco = zomoPlanObject;
        const jsonFile = await createFileFromZomoPlan(zomoPlan);
        if (!aco) {
            const zomoPlanAttributes: ZomoPlanAttributes = {
                zomoFile: jsonFile,
                year: zomoPlan.zomoPlanInformation.year,
                zomoData: zomoPlan.JSON
            };
            aco = new Parse.Object<ZomoPlanAttributes>(
                ObjectKeys.ZomoPlan,
                zomoPlanAttributes
            );
        }

        aco.set('zomoFile', jsonFile);
        aco.set('year', zomoPlan.zomoPlanInformation.year);
        aco.set('zomoData', zomoPlan.JSON);
        return aco;
    }
}

function fromUTF8ToBase64(utf8: string): string {
    const buff = Buffer.from(utf8, 'utf-8');
    return buff.toString('base64');
}

function createFileFromZomoPlan<T>(zomoPlan: ZomoPlan<T>) {
    const contentAsJson = zomoPlan.JSON;
    const jsonFile = new Parse.File(
        'zomoPlan' + zomoPlan.zomoPlanInformation.year + '.json',
        {
            base64: fromUTF8ToBase64(contentAsJson)
        }
    );
    return jsonFile.save({ useMasterKey: true });
}
