import * as _ from 'lodash';
import { logger } from '../../../../system/logging';
import { AbstractRepository } from '../../../shared/infrastructure';
import { UseCase } from '../../../shared/use-cases';

class CheckCollectionsForContentUseCase implements UseCase<null, null> {
    constructor() {}

    private blackList = [
        '_User',
        '_Role',
        'states',
        'users',
        'resettokens',
        'validationerrors',
        'analysisprocedures',
        'nrls',
        'dbversioninfos',
        '_Session'
    ];

    async execute(): Promise<null> {
        try {
            const schema = await Parse.Schema.all();
            const collectionsToCheck = _.difference(
                schema.map(r => r.className),
                this.blackList
            );

            collectionsToCheck.forEach(async r => {
                const repo = this.createTemporaryRepository(r);
                await this.checkRepository(repo, r);
            });
        } catch (error) {
            logger.error(
                'Serious error: Unable to check Collections for content'
            );
        }

        return null;
    }

    private createTemporaryRepository(className: string) {
        return new TemporaryRepository(className);
    }
    private async checkRepository(
        repository: TemporaryRepository,
        name: string
    ) {
        const isEmpty = await repository.isEmpty();

        if (isEmpty) {
            logger.error(name + ' does not contain any data');
        }
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
class TemporaryRepository extends AbstractRepository<any> {
    public async isEmpty(): Promise<boolean> {
        const query = this.getQuery();
        const count = await query.count({ useMasterKey: true });
        return !count;
    }
}

const checkCollectionsForContent = new CheckCollectionsForContentUseCase();

export { checkCollectionsForContent, CheckCollectionsForContentUseCase };
