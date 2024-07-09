import {
    ValueObject,
    ValueObjectProps
} from '../../shared/domain/valueObjects/value-object';
import { Base64EncodedString } from './types';

interface SubmissionFormInputProps extends ValueObjectProps {
    fileName: string;
    data: Base64EncodedString;
}

export class SubmissionFormInput extends ValueObject<SubmissionFormInputProps> {
    toString(): string {
        return `${this.props.fileName}`;
    }

    private constructor(props: SubmissionFormInputProps) {
        super(props);
    }

    static create(props: SubmissionFormInputProps) {
        const submissionFormInput = new SubmissionFormInput(props);
        return submissionFormInput;
    }

    get fileName() {
        return this.props.fileName;
    }
    get data() {
        return this.props.data;
    }
}
