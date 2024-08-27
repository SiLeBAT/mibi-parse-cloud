import { Entity } from '../../shared/domain/entities';
import { EntityId } from '../../shared/domain/valueObjects';
import { Customer } from './customer.entity';
import { SubmissionFormInfo } from './submission-form-info.vo';

export type OrderProps<T> = {
    sampleEntryCollection: T;
    customer: Customer;
    submissionFormInfo: SubmissionFormInfo | null;
    signatureDate: string;
    comment: string;
};

export class Order<T> extends Entity<OrderProps<T>> {
    static create<T>(props: OrderProps<T>, id?: EntityId): Order<T> {
        const order = new Order(props, id);
        return order;
    }

    private constructor(props: OrderProps<T>, id?: EntityId) {
        super(props, id);
    }

    get sampleEntryCollection() {
        return this.props.sampleEntryCollection;
    }

    get customer(): Customer {
        return this.props.customer;
    }

    get submissionFormInfo(): SubmissionFormInfo | null {
        return this.props.submissionFormInfo;
    }

    get signatureDate(): string {
        return this.props.signatureDate;
    }

    get comment(): string {
        return this.props.comment;
    }
}
