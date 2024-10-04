import {
    PackageInformationProvider,
    packageInformationProvider
} from '../../../shared/infrastructure/providers';
import { SystemInformation } from '../../domain';
import {
    getServerConfig,
    GetServerConfigUseCase,
    UseCase
} from './../../../shared/useCases';

class GetSystemInformationUseCase implements UseCase<null, SystemInformation> {
    constructor(
        private getServerConfig: GetServerConfigUseCase,
        private packageInformationProvider: PackageInformationProvider
    ) {}

    async execute(): Promise<SystemInformation> {
        const version = await this.packageInformationProvider.getVersion();
        const lastChange =
            await this.packageInformationProvider.getDateOfLastChange();

        const supportContact = (await this.getServerConfig.execute())
            .supportContact;

        const systemInformation: SystemInformation = SystemInformation.create({
            version,
            lastChange,
            supportContact
        });
        return systemInformation;
    }
}

const getSystemInformation = new GetSystemInformationUseCase(
    getServerConfig,
    packageInformationProvider
);

export { getSystemInformation };
