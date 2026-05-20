import { afterSaveUserHook, beforeSaveUserHook } from '../register-user.hook';

class FakeParseObject {
    private fields = new Map<string, unknown>();
    public saveCalls: Array<{ master: boolean }> = [];
    constructor(public readonly className: string = '_User') {}
    get(key: string) {
        return this.fields.get(key);
    }
    set(key: string, value: unknown) {
        this.fields.set(key, value);
    }
    async save(
        _: unknown,
        opts?: { useMasterKey?: boolean }
    ): Promise<FakeParseObject> {
        this.saveCalls.push({ master: !!opts?.useMasterKey });
        return this;
    }
    has(key: string) {
        return this.fields.has(key);
    }
}

const ParseObjectMock = jest.fn(
    (className: string) => new FakeParseObject(className)
);

class FakeParseUser extends FakeParseObject {
    constructor() {
        super('_User');
    }
}

beforeAll(() => {
    (globalThis as unknown as { Parse: unknown }).Parse = {
        User: FakeParseUser,
        Object: ParseObjectMock
    };
});

beforeEach(() => {
    ParseObjectMock.mockClear();
});

jest.mock('../../../infrastructure', () => ({
    instituteRepository: {
        getInstituteById: jest.fn(
            async (id: string) => new FakeParseObject('institutions')
        )
    },
    userInformationRepository: {}
}));

const noopLog = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };

function makeLegacyRegistrationDetails() {
    const obj = new FakeParseUser();
    obj.set('username', 'legacy@example.com');
    obj.set('password', 'super-secret');
    obj.set('email', 'legacy@example.com');
    obj.set('firstName', 'Legacy');
    obj.set('lastName', 'User');
    obj.set('institution', 'inst-123');
    return obj;
}

function makeKeycloakMaterializedUser() {
    const obj = new FakeParseUser();
    obj.set('username', 'kc@example.com');
    obj.set('email', 'kc@example.com');
    obj.set('password', 'random-hex');
    obj.set('firstName', 'KC');
    obj.set('lastName', '');
    obj.set('keycloakSub', 'kc-sub-1');
    obj.set('instituteId', 'inst-abc');
    return obj;
}

describe('beforeSaveUserHook — legacy registration path (no keycloakSub)', () => {
    it('replaces request.object with a stripped copy and records userInfo in request.context', async () => {
        const original = makeLegacyRegistrationDetails();
        const request = {
            object: original as unknown as Parse.User,
            log: noopLog
        } as Parameters<typeof beforeSaveUserHook>[0];

        await beforeSaveUserHook(request);

        // Original is swapped out for a stripped Parse.User.
        expect(request.object).not.toBe(original as unknown as Parse.User);
        const swapped = request.object as unknown as FakeParseObject;
        expect(swapped.get('username')).toBe('legacy@example.com');
        expect(swapped.get('email')).toBe('legacy@example.com');
        expect(swapped.get('password')).toBe('super-secret');
        // firstName / lastName / institution are stripped to be re-applied via context.
        expect(swapped.has('firstName')).toBe(false);
        expect(swapped.has('lastName')).toBe(false);
        // userInfo is staged in request.context for the afterSave hook to pick up.
        expect(request.context).toEqual({
            firstName: 'Legacy',
            lastName: 'User',
            instituteId: 'inst-123'
        });
    });
});

describe('beforeSaveUserHook — keycloakSub sentinel', () => {
    it('does not replace request.object or set context when keycloakSub is present', async () => {
        const original = makeKeycloakMaterializedUser();
        const request = {
            object: original as unknown as Parse.User,
            log: noopLog
        } as Parameters<typeof beforeSaveUserHook>[0];

        await beforeSaveUserHook(request);

        // Fields the materialize() path set must still be on the saved object.
        expect(
            (request.object as unknown as FakeParseObject).get('keycloakSub')
        ).toBe('kc-sub-1');
        expect(
            (request.object as unknown as FakeParseObject).get('instituteId')
        ).toBe('inst-abc');
        expect(
            (request.object as unknown as FakeParseObject).get('firstName')
        ).toBe('KC');
        expect(
            (request.object as unknown as FakeParseObject).get('lastName')
        ).toBe('');
        // Sentinel must short-circuit before request.context is populated.
        expect(request.context).toBeUndefined();
        // request.object must not have been swapped for a stripped copy.
        expect(request.object).toBe(original as unknown as Parse.User);
    });
});

describe('afterSaveUserHook — legacy path with full userInfo', () => {
    it('constructs a User_Info pointing at the saved _User and the institute', async () => {
        const savedUser = makeLegacyRegistrationDetails();
        const request = {
            object: savedUser as unknown as Parse.User,
            log: noopLog,
            context: {
                firstName: 'Legacy',
                lastName: 'User',
                instituteId: 'inst-123'
            }
        } as Parameters<typeof afterSaveUserHook>[0];

        await afterSaveUserHook(request);
        await Promise.resolve();

        const userInfoCalls = ParseObjectMock.mock.calls.filter(
            ([cls]) => cls === 'User_Info'
        );
        expect(userInfoCalls).toHaveLength(1);
        const userInfoObj = ParseObjectMock.mock.results.find(
            r =>
                r.value &&
                (r.value as FakeParseObject).className === 'User_Info'
        )?.value as FakeParseObject;
        expect(userInfoObj.get('user')).toBe(savedUser);
        expect(userInfoObj.get('firstName')).toBe('Legacy');
        expect(userInfoObj.get('lastName')).toBe('User');
        // institute pointer was fetched via instituteRepository (mocked to return a FakeParseObject)
        expect(
            (userInfoObj.get('institute') as FakeParseObject).className
        ).toBe('institutions');
    });
});

describe('afterSaveUserHook — undefined userInfo (Keycloak path)', () => {
    it('returns early without logging "Missing required fields" and without creating User_Info', async () => {
        const warn = jest.fn();
        const log = { info: jest.fn(), warn, error: jest.fn() };
        const savedUser = makeKeycloakMaterializedUser();
        const request = {
            object: savedUser as unknown as Parse.User,
            log,
            context: undefined
        } as Parameters<typeof afterSaveUserHook>[0];

        await afterSaveUserHook(request);

        // No User_Info instantiation when the sentinel path skipped beforeSave.
        expect(ParseObjectMock).not.toHaveBeenCalled();
        // No noisy warning — the Keycloak path is intentional, not a missing-fields error.
        expect(warn).not.toHaveBeenCalled();
    });
});
