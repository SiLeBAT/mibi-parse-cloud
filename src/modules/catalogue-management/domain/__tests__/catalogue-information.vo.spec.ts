import { CatalogueInformation } from './../catalogue-information.vo';

describe('Catalogue Information Value Object ', () => {
    it('should be created properly', async () => {
        const firstCatalogueInfo = await CatalogueInformation.create({
            validFrom: new Date(),
            catalogueCode: '300',
            version: '2'
        });
        expect(firstCatalogueInfo.version).toEqual('2');
        expect(firstCatalogueInfo.catalogueCode).toEqual('300');
        expect(firstCatalogueInfo.validFrom).toBeInstanceOf(Date);
    });
});
