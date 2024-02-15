import {
    ValueObject,
    ValueObjectProps
} from '../../shared/domain/valueObjects/value-object';
import { RESOURCE_VIEW_TYPE } from './enums';
import { Base64EncodedString } from './types';

interface SubmissionFormInputProps extends ValueObjectProps {
    fileName: string;
    data: Base64EncodedString;
    type: string | RESOURCE_VIEW_TYPE;
}

export class SubmissionFormInput extends ValueObject<SubmissionFormInputProps> {
    toString(): string {
        return `${this.props.fileName}`;
    }

    private constructor(props: SubmissionFormInputProps) {
        super(props);
    }

    static create(props: SubmissionFormInputProps) {
        function isResourceViewType(
            type: string | RESOURCE_VIEW_TYPE
        ): type is RESOURCE_VIEW_TYPE {
            return (type as string).includes !== undefined;
        }

        const newProps = {
            ...props
        };

        if (!isResourceViewType(props.type)) {
            newProps.type = this.getResourceViewType(props.type);
        }

        const submissionFormInput = new SubmissionFormInput(newProps);
        return submissionFormInput;
    }

    private static getResourceViewType = (
        typeString: string = 'json'
    ): RESOURCE_VIEW_TYPE => {
        let returnType = RESOURCE_VIEW_TYPE.JSON;
        if (typeString.toLowerCase().includes('xml')) {
            returnType = RESOURCE_VIEW_TYPE.XLSX;
        }
        return returnType;
    };

    get fileName() {
        return this.props.fileName;
    }
    get data() {
        return this.props.data;
    }
    get type() {
        return this.props.type;
    }
}
