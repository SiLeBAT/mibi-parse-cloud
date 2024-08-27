import { Customer } from './../../domain/customer.entity';
import { OrderDTOMapper } from './../order-dto.mapper';

import { Email, Name } from '../../../shared/domain/valueObjects';
import { Contact, Order, SampleEntry } from '../../domain';
import { Bundesland } from '../../domain/enums';
import { OrderDTO } from '../../dto';
import { SampleEntryDTOMapper } from '../sample-entry-dto.mapper';

describe('Order DTO Mapper ', () => {
    describe('Map to Order', () => {
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
                            contactPerson: 'test test',
                            telephone: 'test',
                            email: 'test@test.com'
                        }
                    }
                }
            };
        });
        it('Should successfully create Order from OrderDTO', async () => {
            const submission = await OrderDTOMapper.fromDTO(
                orderDto,
                '',
                samples => {
                    return samples.map(s =>
                        SampleEntryDTOMapper.fromDTO(s, t => t.value)
                    );
                }
            );
            expect(submission).toEqual(expect.any(Order));
        });

        it('Should create submission with empty string version', async () => {
            const submission = await OrderDTOMapper.fromDTO(
                orderDto,
                '',
                samples => {
                    return samples.map(s =>
                        SampleEntryDTOMapper.fromDTO(s, t => t.value)
                    );
                }
            );
            expect(submission.submissionFormInfo?.version).toEqual('');
            expect(submission.submissionFormInfo?.fileName).toEqual('');
            expect(submission.customer.customerRefNumber).toEqual('');
            expect(submission.signatureDate).toEqual('');
        });
        it('Should create submission with version test', async () => {
            const dto = { ...orderDto };
            dto.sampleSet.meta.version = 'test';
            dto.sampleSet.meta.fileName = 'test';
            dto.sampleSet.meta.customerRefNumber = 'test';
            dto.sampleSet.meta.signatureDate = 'test';
            const submission = await OrderDTOMapper.fromDTO(
                orderDto,
                '',
                samples => {
                    return samples.map(s =>
                        SampleEntryDTOMapper.fromDTO(s, t => t.value)
                    );
                }
            );
            expect(submission.submissionFormInfo?.version).toEqual('test');
            expect(submission.submissionFormInfo?.fileName).toEqual('test');
            expect(submission.customer.customerRefNumber).toEqual('test');
            expect(submission.signatureDate).toEqual('test');
        });
        xit('Should throw and error upon creation because of missing meta', () => {
            const dto = { ...orderDto };
            // @ts-expect-error
            dto.sampleSet.meta = null;
            expect(() =>
                OrderDTOMapper.fromDTO(dto, '', samples => {
                    return samples.map(s =>
                        SampleEntryDTOMapper.fromDTO(s, t => t.value)
                    );
                })
            ).toThrow('Unable to map OrderDTO to Order');
        });
        xit('Should throw and error upon creation because of missing samples', () => {
            const dto = { ...orderDto };
            // @ts-expect-error
            dto.sampleSet.samples = null;
            expect(() =>
                OrderDTOMapper.fromDTO(dto, '', samples => {
                    return samples.map(s =>
                        SampleEntryDTOMapper.fromDTO(s, t => t.value)
                    );
                })
            ).toThrow('Unable to map OrderDTO to Order');
        });

        it('Should successfully create Order Contact from OrderDTO', async () => {
            const submission = await OrderDTOMapper.fromDTO(
                orderDto,
                '',
                samples => {
                    return samples.map(s =>
                        SampleEntryDTOMapper.fromDTO(s, t => t.value)
                    );
                }
            );
            expect(submission.customer.contact.props.instituteName).toEqual(
                'test'
            );
            expect(submission.customer.contact.props.street).toEqual('test');
            expect(submission.customer.contact.props.zip).toEqual('test');
            expect(submission.customer.contact.props.city).toEqual('test');
            expect(submission.customer.contact.props.contactPerson).toEqual(
                'test test'
            );
            expect(submission.customer.contact.props.telephone).toEqual('test');
            expect(submission.customer.contact.props.email.value).toEqual(
                'test@test.com'
            );
        });

        it('Should create a Order with an empty samples array', async () => {
            const dto = { ...orderDto };
            dto.sampleSet.samples = [];
            const submission = await OrderDTOMapper.fromDTO(
                dto,
                '',
                samples => {
                    return samples.map(s =>
                        SampleEntryDTOMapper.fromDTO(s, t => t.value)
                    );
                }
            );
            expect(submission.sampleEntryCollection).toBeInstanceOf(Array);
            expect(submission.sampleEntryCollection.length).toEqual(0);
        });

        it('Should create a Order with an samples array of count 1', async () => {
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
            const submission = await OrderDTOMapper.fromDTO(
                dto,
                '',
                samples => {
                    return samples.map(s =>
                        SampleEntryDTOMapper.fromDTO(s, t => t.value)
                    );
                }
            );
            expect(submission.sampleEntryCollection).toBeInstanceOf(Array);
            expect(submission.sampleEntryCollection.length).toEqual(1);
        });
    });

    describe('Map to OrderDTO', () => {
        let submission: Order<SampleEntry<string>[]>;
        let contact: Contact;
        let customer: Customer;
        beforeEach(async () => {
            contact = Contact.create({
                instituteName: 'test',
                street: 'test',
                zip: 'test',
                city: 'test',
                contactPerson: 'test test',
                telephone: 'test',
                email: await Email.create({ value: 'test@test.com' }),
                stateShort: Bundesland.UNKNOWN
            });

            customer = Customer.create({
                contact,
                firstName: await Name.create({ value: 'test' }),
                lastName: await Name.create({ value: 'test' }),
                customerRefNumber: ''
            });
            submission = Order.create({
                sampleEntryCollection: [],
                customer,
                submissionFormInfo: null,
                signatureDate: '',
                comment: ''
            });
        });

        it('Should successfully create OrderDTO from Order', () => {
            const orderDto = {
                sampleSet: {
                    samples: [],
                    meta: {
                        sender: {
                            instituteName: 'test',
                            street: 'test',
                            zip: 'test',
                            city: 'test',
                            contactPerson: 'test test',
                            telephone: 'test',
                            email: 'test@test.com'
                        }
                    }
                }
            };
            const orderDTO = OrderDTOMapper.toDTO(submission, samples => {
                return samples.map(s =>
                    SampleEntryDTOMapper.toDTO(s, t => ({ value: t }))
                );
            });
            expect(orderDTO).toMatchObject(orderDto);
        });
    });
});
