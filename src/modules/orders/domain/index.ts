import {
    SampleEntryV18,
    SampleEntryTuple as SampleEntryV18Tuple
} from './sample-entry-v18.entity';
import { SampleEntry, SampleEntryTuple } from './sample-entry.entity';
export type AnySampleEntry =
    | SampleEntry<SampleEntryTuple>
    | SampleEntryV18<SampleEntryV18Tuple>;

export { Contact } from './contact.vo';
export { AffiliatedInstitute } from './affiliated-institute.vo';
export { Customer, CustomerProps } from './customer.entity';
export { FileInformation } from './file-information.vo';
export { Order, OrderProps } from './order.entity';
export {
    AnnotatedSampleDataEntry,
    SampleEntry,
    SampleEntryProps,
    SampleEntryTuple
} from './sample-entry.entity';
export {
    AnnotatedSampleDataEntry as AnnotatedSampleDataEntryV18,
    SampleEntryV18,
    SampleEntryV18Props,
    SampleEntryTuple as SampleEntryV18Tuple
} from './sample-entry-v18.entity';
export { SampleSet, SampleSetProps } from './sample-set.entity';
export { SampleSetV18, SampleSetV18Props } from './sample-set-v18.entity';
export { SubmissionFormInfo } from './submission-form-info.vo';
export { SubmissionFormInput } from './submission-form-input.vo';
export { Submitter, SubmitterProps } from './submitter.entity';
export { Base64EncodedString } from './types';
export { ValidationParameter } from './validation-parameter.vo';
