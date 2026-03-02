import { UseCase } from '../../../shared/use-cases';
import { ZomoPlanFileInformation } from '../../domain';

export interface ZomoPlanFilesAllowed {
    yearAllowed: boolean;
    allowedYears: number[];
}

class CheckForZomoPlanFileAllowedUseCase
    implements UseCase<ZomoPlanFileInformation, ZomoPlanFilesAllowed>
{
    constructor() {}

    async execute(
        zomoPlanFileInformation: ZomoPlanFileInformation
    ): Promise<ZomoPlanFilesAllowed> {
        const currentYear: number = new Date().getFullYear();
        const allowedYears = [currentYear - 1, currentYear, currentYear + 1];
        const yearAllowed = allowedYears.includes(
            parseInt(zomoPlanFileInformation.year, 10)
        );

        return { yearAllowed, allowedYears };
    }
}

const checkForZomoPlanFileAllowed = new CheckForZomoPlanFileAllowedUseCase();

export { checkForZomoPlanFileAllowed };
