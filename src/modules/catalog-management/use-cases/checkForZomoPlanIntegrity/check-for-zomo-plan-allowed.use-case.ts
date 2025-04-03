import { UseCase } from '../../../shared/use-cases';
import { ZomoPlanInformation } from '../../domain';

export interface ZomoPlanAllowed {
    yearAllowed: boolean;
    allowedYears: number[];
}

class CheckForZomoPlanAllowedUseCase
    implements UseCase<ZomoPlanInformation, ZomoPlanAllowed>
{
    constructor() {}

    async execute(
        zomoPlanInformation: ZomoPlanInformation
    ): Promise<ZomoPlanAllowed> {
        const currentYear: number = new Date().getFullYear();
        const allowedYears = [currentYear - 1, currentYear, currentYear + 1];
        const yearAllowed = allowedYears.includes(
            parseInt(zomoPlanInformation.year, 10)
        );

        return { yearAllowed, allowedYears };
    }
}

const checkForZomoPlanAllowed = new CheckForZomoPlanAllowedUseCase();

export { checkForZomoPlanAllowed };
