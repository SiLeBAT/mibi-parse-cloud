import {
    FileContent,
    FileContentType,
    ZomoPlan,
    ZomoPlanInformation
} from '../../../domain';
import { zomoCsvParser } from '../../../infrastructure/csv-parser';
import { createZomoPlan } from '../create-zomo-plan.use-case';

describe('createZomoPlan', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('returns the plan parsed from the file content', async () => {
        const fileContent = await FileContent.create({
            content: 'csv',
            type: FileContentType.CSV
        });
        const parsedPlan = ZomoPlan.create({
            zomoPlanInformation: await ZomoPlanInformation.create({
                year: '2026'
            }),
            data: []
        });
        const parse = jest
            .spyOn(zomoCsvParser, 'parse')
            .mockResolvedValue(parsedPlan);

        const zomoPlan = await createZomoPlan.execute({ fileContent });

        expect(parse).toHaveBeenCalledWith({ fileContent });
        expect(zomoPlan).toBe(parsedPlan);
    });

    it('passes parser errors on', async () => {
        jest.spyOn(zomoCsvParser, 'parse').mockRejectedValue(
            new Error('broken csv')
        );

        await expect(
            createZomoPlan.execute({
                fileContent: await FileContent.create({
                    content: 'not;a;zomo;plan',
                    type: FileContentType.CSV
                })
            })
        ).rejects.toThrow('broken csv');
    });
});
