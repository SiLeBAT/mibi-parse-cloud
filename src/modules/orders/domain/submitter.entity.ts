import { Entity } from '../../shared/domain/entities';
import { EntityId, Name } from '../../shared/domain/valueObjects';
import { AffiliatedInstitute } from './affiliated-institute.vo';
import { Bundesland } from './enums';

export interface SubmitterProps {
    institute: AffiliatedInstitute;
    firstName?: Name;
    lastName?: Name;
    submitterId: EntityId;
}

export class Submitter extends Entity<SubmitterProps> {
    static create(props: SubmitterProps, id?: EntityId): Submitter {
        const userInformation = new Submitter(props, id);
        return userInformation;
    }

    private constructor(props: SubmitterProps, id?: EntityId) {
        super(props, id);
    }

    get institute(): AffiliatedInstitute {
        return this.props.institute;
    }

    get lastName(): Name | undefined {
        return this.props.lastName;
    }

    get firstName(): Name | undefined {
        return this.props.firstName;
    }

    get submitterId(): EntityId {
        return this.props.submitterId;
    }

    get fullName(): string {
        return this.firstName + ' ' + this.lastName;
    }

    getStateAbbreviation(): Bundesland {
        return this.institute.stateShort;
    }
}
