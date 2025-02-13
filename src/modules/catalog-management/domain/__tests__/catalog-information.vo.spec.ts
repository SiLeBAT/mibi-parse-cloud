import { CatalogInformation } from './../catalog-information.vo';

describe('Catalog Information Value Object ', () => {
    it('should be created properly', async () => {
        const firstCatalogInfo = await CatalogInformation.create({
            validFrom: new Date(),
            catalogCode: '300',
            version: '2'
        });
        expect(firstCatalogInfo.version).toEqual('2');
        expect(firstCatalogInfo.catalogCode).toEqual('300');
        expect(firstCatalogInfo.validFrom).toBeInstanceOf(Date);
    });
});
