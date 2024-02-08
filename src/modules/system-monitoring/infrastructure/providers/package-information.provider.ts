import pjson from '../../../../../package.json';
import { SemanticVersion } from './../../domain';
import { ProviderError } from './provider.error';

export class PackageInformationProvider {
    private version: string;
    private dateOfLastChange: string;

    constructor() {
        this.version = pjson.version;
        this.dateOfLastChange = pjson.mibiConfig.lastChange;
    }
    public getVersion(): Promise<SemanticVersion> {
        try {
            return SemanticVersion.create({
                value: this.version
            });
        } catch (error) {
            throw new UnknownPackageConfigurationError(
                "Version number can't be determined.",
                error
            );
        }
    }
    public getDateOfLastChange(): Promise<Date> {
        try {
            return Promise.resolve(new Date(this.dateOfLastChange));
        } catch (error) {
            throw new UnknownPackageConfigurationError(
                "Date of last change can't be determined.",
                error
            );
        }
    }
}

class UnknownPackageConfigurationError extends ProviderError {}
