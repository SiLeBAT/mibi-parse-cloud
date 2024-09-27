import { logger } from '../../../../system/logging';
import { UseCase } from '../../../shared/useCases';

class CheckSystemConfigurationUseCase implements UseCase<null, null> {
    constructor() {}

    async execute(): Promise<null> {
        try {
            const config = await Parse.Config.get({ useMasterKey: true });
            const appName = config.get('appName');
            const jobRecipient = config.get('jobRecipient');
            const supportContact = config.get('supportContact');

            this.checkValue('appName', appName, 'MiBi-Portal');
            this.checkValue('jobRecipient', jobRecipient);
            this.checkValue('supportContact', supportContact);
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

export { checkSystemConfiguration };
