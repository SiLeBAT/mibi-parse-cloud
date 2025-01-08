import { getLogger } from '../../../shared/core/logging-context';
import { AbstractRepository } from '../../../shared/infrastructure';
import {
    AdditionalPathogensObject,
    ObjectKeys
} from '../../../shared/infrastructure/parse-types';
import { Pathogen } from '../../domain';

export class PathogenRepository extends AbstractRepository<AdditionalPathogensObject> {
    constructor() {
        super(ObjectKeys.AdditionalPathogens);
    }

    async getAllEntries(): Promise<Pathogen[]> {
        try {
            const query = this.getQuery();
            const allPathogens = await query.findAll({ useMasterKey: true });

            // const pathogens = Promise.all(
            //     allPathogens.map(pathogen =>
            //         this.mapToSearchAlias(pathogen)
            //     )
            // );

            // // const query = this.getQuery();
            // query.equalTo(key, value);
            // const results = await query.find({
            //     useMasterKey: true
            // });
            const pathogens = allPathogens.map(
                async (pathogen: AdditionalPathogensObject) =>
                    await this.mapToPathogen(pathogen)
            );
            return Promise.all(pathogens);
        } catch (error) {
            getLogger().error(error.message);
        }
        return [];
    }

    private async mapToPathogen(
        pathogen: AdditionalPathogensObject
    ): Promise<Pathogen> {
        return await Pathogen.create({
            pathogen: pathogen.get('pathogen')
        });
    }
}
