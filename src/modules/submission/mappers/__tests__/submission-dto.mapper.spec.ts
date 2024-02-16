import { Contact, Submission } from '../../domain';
import { SubmissionDTOMapper } from '../../mappers';
import { OrderDTO } from '../../useCases/createSubmission/create-submission.dto';

describe('Submission DTO Mapper ', () => {
    describe('Map to Submission', () => {
        let orderDto: OrderDTO;
        beforeEach(() => {
            orderDto = {
                sampleSet: {
                    samples: [],
                    meta: {
                        sender: {
                            instituteName: 'test',
                            street: 'test',
                            zip: 'test',
                            city: 'test',
                            contactPerson: 'test',
                            telephone: 'test',
                            email: 'test'
                        }
                    }
                }
            };
        });
        it('Should successfully create Submission from OrderDTO', () => {
            const submission = SubmissionDTOMapper.fromDTO(orderDto);
            expect(submission).toEqual(expect.any(Submission));
        });

        it('Should create submission with empty string version', () => {
            const submission = SubmissionDTOMapper.fromDTO(orderDto);
            expect(submission.version).toEqual('');
            expect(submission.fileName).toEqual('');
            expect(submission.customerRefNumber).toEqual('');
            expect(submission.signatureDate).toEqual('');
        });
        it('Should create submission with version test', () => {
            const dto = { ...orderDto };
            dto.sampleSet.meta.version = 'test';
            dto.sampleSet.meta.fileName = 'test';
            dto.sampleSet.meta.customerRefNumber = 'test';
            dto.sampleSet.meta.signatureDate = 'test';
            const submission = SubmissionDTOMapper.fromDTO(orderDto);
            expect(submission.version).toEqual('test');
            expect(submission.fileName).toEqual('test');
            expect(submission.customerRefNumber).toEqual('test');
            expect(submission.signatureDate).toEqual('test');
        });
        it('Should throw and error upon creation because of missing meta', () => {
            const dto = { ...orderDto };
            // @ts-expect-error
            dto.sampleSet.meta = null;
            expect(() => SubmissionDTOMapper.fromDTO(dto)).toThrow(
                'Unable to map OrderDTO to Submission'
            );
        });
        it('Should throw and error upon creation because of missing samples', () => {
            const dto = { ...orderDto };
            // @ts-expect-error
            dto.sampleSet.samples = null;
            expect(() => SubmissionDTOMapper.fromDTO(dto)).toThrow(
                'Unable to map OrderDTO to Submission'
            );
        });

        it('Should successfully create Submission Contact from OrderDTO', () => {
            const submission = SubmissionDTOMapper.fromDTO(orderDto);
            expect(submission.contact).toEqual(expect.any(Contact));
            expect(submission.contact.props.instituteName).toEqual('test');
            expect(submission.contact.props.street).toEqual('test');
            expect(submission.contact.props.zip).toEqual('test');
            expect(submission.contact.props.city).toEqual('test');
            expect(submission.contact.props.contactPerson).toEqual('test');
            expect(submission.contact.props.telephone).toEqual('test');
            expect(submission.contact.props.email).toEqual('test');
        });

        it('Should create a Submission with an empty samples array', () => {
            const dto = { ...orderDto };
            dto.sampleSet.samples = [];
            const submission = SubmissionDTOMapper.fromDTO(dto);
            expect(submission.sampleEntryCollection).toBeInstanceOf(Array);
            expect(submission.sampleEntryCollection.length).toEqual(0);
        });

        it('Should create a Submission with an samples array of count 1', () => {
            const dto = { ...orderDto };
            dto.sampleSet.samples = [
                {
                    sampleData: {
                        sample_id: {
                            value: 'test'
                        },
                        sample_id_avv: {
                            value: 'test'
                        },
                        partial_sample_id: {
                            value: 'test'
                        },
                        pathogen_avv: {
                            value: 'test'
                        },
                        pathogen_text: {
                            value: 'test'
                        },
                        sampling_date: {
                            value: 'test'
                        },
                        isolation_date: {
                            value: 'test'
                        },
                        sampling_location_avv: {
                            value: 'test'
                        },
                        sampling_location_zip: {
                            value: 'test'
                        },
                        sampling_location_text: {
                            value: 'test'
                        },
                        animal_avv: {
                            value: 'test'
                        },
                        matrix_avv: {
                            value: 'test'
                        },
                        animal_matrix_text: {
                            value: 'test'
                        },
                        primary_production_avv: {
                            value: 'test'
                        },
                        control_program_avv: {
                            value: 'test'
                        },
                        sampling_reason_avv: {
                            value: 'test'
                        },
                        program_reason_text: {
                            value: 'test'
                        },
                        operations_mode_avv: {
                            value: 'test'
                        },
                        operations_mode_text: {
                            value: 'test'
                        },
                        vvvo: {
                            value: 'test'
                        },
                        program_avv: {
                            value: 'test'
                        },
                        comment: {
                            value: 'test'
                        }
                    },
                    sampleMeta: {
                        nrl: 'test',
                        urgency: 'test',
                        analysis: {
                            species: false,
                            serological: false,
                            resistance: false,
                            vaccination: false,
                            molecularTyping: false,
                            toxin: false,
                            esblAmpCCarbapenemasen: false,
                            sample: false,
                            other: '',
                            compareHuman: {
                                value: '',
                                active: false
                            }
                        }
                    }
                }
            ];
            const submission = SubmissionDTOMapper.fromDTO(dto);
            expect(submission.sampleEntryCollection).toBeInstanceOf(Array);
            expect(submission.sampleEntryCollection.length).toEqual(1);
        });
    });

    describe('Map to OrderDTO', () => {
        let submission: Submission;
        beforeEach(() => {
            submission = Submission.create({
                sampleEntryCollection: [],
                contact: Contact.create({
                    instituteName: 'test',
                    street: 'test',
                    zip: 'test',
                    city: 'test',
                    contactPerson: 'test',
                    telephone: 'test',
                    email: 'test'
                })
            });
        });

        it('Should successfully create OrderDTO from Submission', () => {
            const orderDto = {
                sampleSet: {
                    samples: [],
                    meta: {
                        sender: {
                            instituteName: 'test',
                            street: 'test',
                            zip: 'test',
                            city: 'test',
                            contactPerson: 'test',
                            telephone: 'test',
                            email: 'test'
                        }
                    }
                }
            };
            const orderDTO = SubmissionDTOMapper.toDTO(submission);
            expect(orderDTO).toMatchObject(orderDto);
        });
    });
});
