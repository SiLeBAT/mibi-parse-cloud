import { Entity } from '../../shared/domain/entities';
import { EntityId } from '../../shared/domain/valueObjects';
import { ZomoPlanInformation } from './zomo-plan-information.vo';

export interface ZomoPlanProps<T> {
    zomoPlanInformation: ZomoPlanInformation;
    data: T;
}
export class ZomoPlan<T> extends Entity<ZomoPlanProps<T>> {
    static create<T>(props: ZomoPlanProps<T>, id?: EntityId) {
        return new ZomoPlan(props, id);
    }

    constructor(props: ZomoPlanProps<T>, id?: EntityId) {
        super(props, id);
    }

    get zomoPlanInformation(): ZomoPlanInformation {
        return this.props.zomoPlanInformation;
    }

    get JSON(): string {
        return JSON.stringify(
            {
                data: {
                    year: this.zomoPlanInformation.year,
                    zomoData: this.props.data
                }
            },
            null,
            2
        );
    }
}
