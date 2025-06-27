import { isEmpty, isUndefined } from 'lodash';
import { object, string } from 'yup';
import { Email } from './email.vo';
import { ValueObject, ValueObjectProps } from './value-object';

interface ServerConfigBaseProps extends ValueObjectProps {
    appName?: string;
    excelVersion?: string;
}

interface ServerConfigProps extends ServerConfigBaseProps {
    jobRecipient?: Email;
    supportContact?: Email;
}

interface ServerConfigStringProps extends ServerConfigBaseProps {
    jobRecipient?: string;
    supportContact?: string;
}

export class ServerConfig extends ValueObject<ServerConfigProps> {
    private static serverConfigSchema = object({
        appName: string().trim().max(30, 'Must be 30 characters or less'),
        excelVersion: string().trim().required()
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

    get excelVersion(): string | null {
        return this.props.excelVersion || null;
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

    public static async createFromStrings(
        props: ServerConfigStringProps
    ): Promise<ServerConfig> {
        const validatedProps = await ServerConfig.serverConfigSchema.validate(
            props
        );

        const serverConfigProps: ServerConfigProps = {
            appName: validatedProps.appName,
            excelVersion: validatedProps.excelVersion
        };
        if (!isEmpty(props.jobRecipient) && !isUndefined(props.jobRecipient)) {
            serverConfigProps.jobRecipient = await Email.create({
                value: props.jobRecipient
            });
        }
        if (
            !isEmpty(props.supportContact) &&
            !isUndefined(props.supportContact)
        ) {
            serverConfigProps.supportContact = await Email.create({
                value: props.supportContact
            });
        }
        return new ServerConfig(serverConfigProps);
    }
}
