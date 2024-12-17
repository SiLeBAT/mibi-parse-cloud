import { Urgency } from './../model/legacy.model';

export function fromUrgencyStringToEnum(urgency: string): Urgency {
    switch (urgency.trim().toLowerCase()) {
        case 'eilt':
            return Urgency.URGENT;
        case 'normal':
        default:
            return Urgency.NORMAL;
    }
}
