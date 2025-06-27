import config from 'config';
export interface DataStoreConfiguration {
    dataDir: string;
}

export interface MailConfiguration {
    fromAddress: string;
    replyToAddress: string;
}
class ConfigurationService {
    getDataStoreConfiguration(): DataStoreConfiguration {
        return config.get('dataStore');
    }
    getMailConfiguration(): MailConfiguration {
        return config.get('mail');
    }
}
const configurationService = new ConfigurationService();

export { configurationService };
