import { Contact } from '../contact.vo';

describe('Contact Value Object ', () => {
    const firstContact = Contact.create({
        instituteName: 'test',
        street: 'test',
        zip: 'test',
        city: 'test',
        contactPerson: 'test',
        telephone: 'test',
        email: 'test'
    });
    const secondContact = Contact.create({
        instituteName: 'test',
        street: 'test',
        zip: 'test',
        city: 'test',
        contactPerson: 'test',
        telephone: 'test',
        email: 'test'
    });
    const thirdContact = Contact.create({
        instituteName: 'fail',
        street: 'test',
        zip: 'test',
        city: 'test',
        contactPerson: 'test',
        telephone: 'test',
        email: 'test'
    });

    it('First contact should be equal to second Contact', () => {
        expect(firstContact.equals(secondContact)).toEqual(true);
    });

    it('First contact should be equal to third Contact', () => {
        expect(firstContact.equals(thirdContact)).toEqual(false);
    });
});
