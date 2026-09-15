import moment from 'moment';
import pjson from '../../../../../package.json';
import { SemanticVersion } from '../../../system-monitoring/domain';
import { ProviderError } from './provider.error';

interface PackageInformation {
    version: string;
    mibiConfig: {
        lastChange: string;
    };
}

// package.json keeps the date of last change as "2019-04-16 11:25:17 +0200".
// ISO 8601 is accepted as well.
const LAST_CHANGE_FORMATS = [moment.ISO_8601, 'YYYY-MM-DD HH:mm:ss ZZ'];

export class PackageInformationProvider {
    private version: string;
    private dateOfLastChange: string;

    constructor(packageInformation: PackageInformation = pjson) {
        this.version = packageInformation.version;
        this.dateOfLastChange = packageInformation.mibiConfig.lastChange;
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
            const lastChange = moment(
                this.dateOfLastChange,
                LAST_CHANGE_FORMATS,
                true
            );
            if (!lastChange.isValid()) {
                throw new Error(
                    `Unreadable date of last change: ${this.dateOfLastChange}`
                );
            }
            return Promise.resolve(lastChange.toDate());
        } catch (error) {
            throw new UnknownPackageConfigurationError(
                "Date of last change can't be determined.",
                error
            );
        }
    }
}

class UnknownPackageConfigurationError extends ProviderError {}
