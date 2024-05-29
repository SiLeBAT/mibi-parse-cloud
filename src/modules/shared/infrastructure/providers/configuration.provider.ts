import { Email } from '../../../system-monitoring/domain';

export class ConfigurationProvider {
    public async getSupportContact(): Promise<Email | null> {
        const config = await Parse.Config.get({ useMasterKey: true });
        const emailAsString = config.get('supportContact');
        try {
            const email = await Email.create({
                value: emailAsString
            });
            return email;
        } catch (error) {
            console.error('Unable to retrieve support contact email.');
            return null;
        }
    }
}
