import { object, string } from 'yup';
import { Email } from './email.vo';
import { ValueObject, ValueObjectProps } from './value-object';

interface ServerConfigProps extends ValueObjectProps {
    appName?: string;
    jobRecipient?: Email;
    supportContact?: Email;
}

export class ServerConfig extends ValueObject<ServerConfigProps> {
    private static serverConfigSchema = object({
        appName: string().trim().max(30, 'Must be 30 characters or less')
    });

    public toString(): string {
        return this.appName + ' configuration';
    }

    get appName(): string | null {
        return this.props.appName || null;
    }
    get jobRecipient(): Email | null {
        return this.props.jobRecipient || null;
    }
    get supportContact(): Email | null {
        return this.props.supportContact || null;
    }

    private constructor(props: ServerConfigProps) {
        super(props);
    }

    public static async create(
        props: ServerConfigProps
    ): Promise<ServerConfig> {
        const validatedProps = await ServerConfig.serverConfigSchema.validate(
            props
        );
        return new ServerConfig(validatedProps);
    }
}
