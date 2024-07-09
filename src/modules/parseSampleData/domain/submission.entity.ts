import { Entity } from '../../shared/domain/entities';
import { EntityId } from '../../shared/domain/valueObjects';
import { Contact } from './contact.vo';

export type SubmissionProps<T> = {
    sampleEntryCollection: T;
    contact: Contact;
    fileName?: string;
    customerRefNumber?: string;
    signatureDate?: string;
    version?: string;
};

export class Submission<T> extends Entity<SubmissionProps<T>> {
    static create<T>(props: SubmissionProps<T>, id?: EntityId): Submission<T> {
        const submission = new Submission(props, id);
        return submission;
    }

    private constructor(props: SubmissionProps<T>, id?: EntityId) {
        super(props, id);
    }

    get sampleEntryCollection() {
        return this.props.sampleEntryCollection;
    }

    get contact(): Contact {
        return this.props.contact;
    }

    get fileName(): string {
        return this.props.fileName || '';
    }

    get version(): string {
        return this.props.version || '';
    }

    get signatureDate(): string {
        return this.props.signatureDate || '';
    }

    get customerRefNumber(): string {
        return this.props.customerRefNumber || '';
    }
}
