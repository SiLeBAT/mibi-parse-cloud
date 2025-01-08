import { XMLValidator } from 'fast-xml-parser';
import { mixed, object, string } from 'yup';
import {
    ValueObject,
    ValueObjectProps
} from '../../shared/domain/valueObjects';
import { FileContentType } from './enums';

interface FileContentProps extends ValueObjectProps {
    content: string;
    type?: FileContentType;
}

export class FileContent extends ValueObject<FileContentProps> {
    public toString(): string {
        return this.content;
    }

    private static fileContentSchema = object({
        content: string().trim().required('File content is required'),
        type: mixed<FileContentType>()
    });

    get content(): string {
        return this.props.content;
    }

    get type(): FileContentType | undefined {
        return this.props.type;
    }
    private constructor(props: FileContentProps) {
        super(props);
    }

    public static async create(props: FileContentProps): Promise<FileContent> {
        const validatedProps = await FileContent.fileContentSchema.validate(
            props
        );
        if (props.type === FileContentType.XML) {
            const validationResult = XMLValidator.validate(props.content);
            if (validationResult !== true) {
                throw Error(JSON.stringify(validationResult, null, 2));
            }
        }
        return new FileContent(validatedProps);
    }
}
