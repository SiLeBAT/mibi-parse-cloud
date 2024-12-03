export abstract class AbstractRepository<
    T extends Parse.Object<Parse.Attributes>
> {
    constructor(private objectKey: string) {}

    protected getQuery() {
        return new Parse.Query<T>(this.objectKey);
    }
}
