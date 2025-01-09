import { uniq } from 'lodash';
import { AVVCatalog } from '../../../shared/domain/valueObjects/avvcatalog.vo';
import { AbstractRepository } from '../../../shared/infrastructure';
import { AVVCatalogObject } from '../../../shared/infrastructure/parse-types';
import { logger } from '../../../../system/logging';

export class AVVCatalogRepository extends AbstractRepository<AVVCatalogObject> {
    private requiredCatalogNames: string[] = [
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

    async retrieve(): Promise<AVVCatalog[]> {
        logger.info(
            `${this.constructor.name}.${this.retrieve.name}, loading AVV Catalog data from Database.`
        );

        const query = this.getQuery();
        const allCatalogs = await query.findAll({ useMasterKey: true });

        const avvCatalogs = Promise.all(
            allCatalogs.map(avvCatalog => this.mapToAVVCatalog(avvCatalog))
        );

        const catalogNamesInDB = uniq(
            (await avvCatalogs).map(catalog => `avv${catalog.name}`)
        );
        const absentCatalogsInDB = this.requiredCatalogNames.filter(
            catalogName => !catalogNamesInDB.includes(catalogName)
        );

        if (absentCatalogsInDB.length > 0) {
            logger.error(
                `Error: Required AVV Catalog(s) ${absentCatalogsInDB.join(
                    ', '
                )} not found in Database.`
            );
        }

        logger.info(
            `${this.constructor.name}.${this.retrieve.name}, finished loading AVV Catalog data from Database.`
        );

        return avvCatalogs;
    }

    private async mapToAVVCatalog(
        avvCatalog: AVVCatalogObject
    ): Promise<AVVCatalog> {
        const validFromDate = avvCatalog.get('validFrom');
        const year = validFromDate.getFullYear();
        const month = `${validFromDate.getMonth() + 1}`.padStart(2, '0');
        const day = `${validFromDate.getDate()}`.padStart(2, '0');

        return await AVVCatalog.create({
            name: avvCatalog.get('catalogCode'),
            validFrom: `${year}-${month}-${day}`,
            version: avvCatalog.get('version'),
            data: avvCatalog.get('catalogData')
        });
    }
}
