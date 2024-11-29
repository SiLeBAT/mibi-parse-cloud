import { uniq } from 'lodash';
import { AVVCatalogue } from '../../../shared/domain/valueObjects/avvcatalogue.vo';
import { AbstractRepository } from '../../../shared/infrastructure';
import { AVVCatalogueObject } from '../../../shared/infrastructure/parse-types';
import { logger } from '../../../../system/logging';

export class AVVCatalogueRepository extends AbstractRepository<AVVCatalogueObject> {
    private requiredCatalogueNames: string[] = [
        'avv303',
        'avv313',
        'avv316',
        'avv319',
        'avv322',
        'avv324',
        'avv326',
        'avv328',
        'avv339'
    ];

    async retrieve(): Promise<AVVCatalogue[]> {
        logger.info(
            `${this.constructor.name}.${this.retrieve.name}, loading AVV Catalogue data from Database.`
        );

        const query = this.getQuery();
        const allCatalogues = await query.findAll({ useMasterKey: true });

        const avvCatalogues = Promise.all(
            allCatalogues.map(avvCatalogue =>
                this.mapToAVVCatalog(avvCatalogue)
            )
        );

        const catalogueNamesInDB = uniq(
            (await avvCatalogues).map(catalogue => `avv${catalogue.name}`)
        );
        const absentCataloguesInDB = this.requiredCatalogueNames.filter(
            catalogueName => !catalogueNamesInDB.includes(catalogueName)
        );

        if (absentCataloguesInDB.length > 0) {
            logger.error(
                `Error: Required AVV Catalogue(s) ${absentCataloguesInDB.join(
                    ', '
                )} not found in Database.`
            );
        }

        logger.info(
            `${this.constructor.name}.${this.retrieve.name}, finished loading AVV Catalogue data from Database.`
        );

        return avvCatalogues;
    }

    private async mapToAVVCatalog(
        avvCatalogue: AVVCatalogueObject
    ): Promise<AVVCatalogue> {
        const validFromDate = avvCatalogue.get('validFrom');
        const year = validFromDate.getFullYear();
        const month = `${validFromDate.getMonth() + 1}`.padStart(2, '0');
        const day = `${validFromDate.getDate()}`.padStart(2, '0');

        return await AVVCatalogue.create({
            name: avvCatalogue.get('catalogueCode'),
            validFrom: `${year}-${month}-${day}`,
            version: avvCatalogue.get('version'),
            data: avvCatalogue.get('catalogueData')
        });
    }
}
