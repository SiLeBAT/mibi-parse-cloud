import { object, string } from 'yup';
import {
    ValueObject,
    ValueObjectProps
} from '../../shared/domain/valueObjects';

interface FileInformationProps extends ValueObjectProps {
    data: string;
    type: string;
    fileName: string;
}

export class FileInformation extends ValueObject<FileInformationProps> {
    public toString(): string {
        return this.fileName;
    }

    private static fileContentSchema = object({
        data: string().trim().required('File content is required'),
        type: string().trim().required('File content is required'),
        fileName: string().trim().required('File content is required')
    });

    get fileName(): string {
        return this.props.fileName;
    }
    get data(): string {
        return this.props.data;
    }

    get type(): string {
        return this.props.type;
    }
    private constructor(props: FileInformationProps) {
        super(props);
    }

    public static async create(
        props: FileInformationProps
    ): Promise<FileInformation> {
        const validatedProps = await FileInformation.fileContentSchema.validate(
            props
        );
        return new FileInformation(validatedProps);
    }
}
