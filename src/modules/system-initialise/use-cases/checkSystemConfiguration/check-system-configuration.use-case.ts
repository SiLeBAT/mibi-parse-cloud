import { logger } from '../../../../system/logging';
import { UseCase } from '../../../shared/use-cases';

class CheckSystemConfigurationUseCase implements UseCase<null, null> {
    constructor() {}

    async execute(): Promise<null> {
        try {
            const config = await Parse.Config.get({ useMasterKey: true });
            const appName = config.get('appName');
            const jobRecipient = config.get('jobRecipient');
            const supportContact = config.get('supportContact');
            const excelVersion = config.get('excelVersion');

            this.checkValue('appName', appName, 'MiBi-Portal');
            this.checkValue('jobRecipient', jobRecipient);
            this.checkValue('supportContact', supportContact);
            this.checkValue('excelVersion', excelVersion);
        } catch (error) {
            logger.error(
                'Serious error: Unable to retrieve Parse Configuration'
            );
        }

        return null;
    }

    private checkValue<T>(
        name: string,
        value: T,
        defaultValue: T | null = null
    ) {
        if (!value) {
            logger.warn('Configuration value for ' + name + ' not set.');
        } else {
            logger.info('Configuration value for ' + name + ': ' + value);
        }
        if (defaultValue) {
            logger.info('Setting default: ' + defaultValue);
            Parse.Config.save({ [name]: defaultValue });
        }
    }
}

const checkSystemConfiguration = new CheckSystemConfigurationUseCase();

export { checkSystemConfiguration, CheckSystemConfigurationUseCase };
