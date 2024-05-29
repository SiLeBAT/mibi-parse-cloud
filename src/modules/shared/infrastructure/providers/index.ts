import { ConfigurationProvider } from './configuration.provider';
import { PackageInformationProvider } from './package-information.provider';

const configurationProvider = new ConfigurationProvider();
const packageInformationProvider = new PackageInformationProvider();

export {
    ConfigurationProvider,
    PackageInformationProvider,
    configurationProvider,
    packageInformationProvider
};
