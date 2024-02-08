import { UseCase } from '../../../shared/useCases';
import { SystemInformation } from '../../domain';
import {
    ConfigurationProvider,
    PackageInformationProvider,
    configurationProvider,
    packageInformationProvider
} from '../../infrastructure/providers';

export class GetSystemInformationUseCase
    implements UseCase<null, SystemInformation>
{
    constructor(
        private configurationProvider: ConfigurationProvider,
        private packageInformationProvider: PackageInformationProvider
    ) {}

    async execute(): Promise<SystemInformation> {
        const version = await this.packageInformationProvider.getVersion();
        const lastChange =
            await this.packageInformationProvider.getDateOfLastChange();

        const supportContact =
            await this.configurationProvider.getSupportContact();

        const systemInformation: SystemInformation = SystemInformation.create({
            version,
            lastChange,
            supportContact
        });
        return systemInformation;
    }
}

const getSystemInformation = new GetSystemInformationUseCase(
    configurationProvider,
    packageInformationProvider
);

export { getSystemInformation };
