import { getLogger } from 'nodemailer/lib/shared';
import { UseCase } from '..';
import { ServerConfig } from '../../domain/valueObjects';

export class GetServerConfigUseCase implements UseCase<null, ServerConfig> {
    private logger = getLogger();
    constructor() {}

    async execute(): Promise<ServerConfig> {
        let config = Parse.Config.current();
        try {
            config = await Parse.Config.get({ useMasterKey: true });
        } catch (error) {
            this.logger.warn(
                'Unable to retrieve Config: Using cached version.'
            );
        }

        return ServerConfig.createFromStrings({
            appName: config.get('appName') || '',
            jobRecipient: config.get('jobRecipient') || '',
            supportContact: config.get('supportContact') || ''
        });
    }
}

const getServerConfig = new GetServerConfigUseCase();

export { getServerConfig };
