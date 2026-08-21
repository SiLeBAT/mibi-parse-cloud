import {
    PackageInformationProvider,
    packageInformationProvider
} from '../../../shared/infrastructure/providers';
import {
    getServerConfig,
    GetServerConfigUseCase,
    UseCase
} from '../../../shared/use-cases';
import { SystemInformation } from '../../domain';

class GetSystemInformationUseCase implements UseCase<null, SystemInformation> {
    constructor(
        private getServerConfig: GetServerConfigUseCase,
        private packageInformationProvider: PackageInformationProvider
    ) {}

    async execute(): Promise<SystemInformation> {
        const version = await this.packageInformationProvider.getVersion();
        const lastChange =
            await this.packageInformationProvider.getDateOfLastChange();

        const serverConfig = await this.getServerConfig.execute();

        const systemInformation: SystemInformation = SystemInformation.create({
            version,
            lastChange,
            supportContact: serverConfig.supportContact,
            supportPhone: serverConfig.supportPhone
        });
        return systemInformation;
    }
}

const getSystemInformation = new GetSystemInformationUseCase(
    getServerConfig,
    packageInformationProvider
);

export { getSystemInformation };
