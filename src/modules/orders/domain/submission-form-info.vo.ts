import {
    ValueObject,
    ValueObjectProps
} from '../../shared/domain/valueObjects';

interface SubmissionFormInfoProps extends ValueObjectProps {
    fileName: string;
    version: string;
}

export class SubmissionFormInfo extends ValueObject<SubmissionFormInfoProps> {
    toString(): string {
        return `${this.props.fileName}`;
    }

    private constructor(props: SubmissionFormInfoProps) {
        super(props);
    }

    static create(props: SubmissionFormInfoProps) {
        const submissionFormInfo = new SubmissionFormInfo(props);
        return submissionFormInfo;
    }

    get fileName() {
        return this.props.fileName;
    }

    get version() {
        return this.props.version;
    }
}
