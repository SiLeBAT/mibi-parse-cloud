export abstract class AbstractRepository<
    T extends Parse.Object<Parse.Attributes>
> {
    constructor(private objectKey: string) {}

    protected getQuery() {
        return new Parse.Query<T>(this.objectKey);
    }

    public async isEmpty(): Promise<boolean> {
        const query = this.getQuery();
        const count = await query.count({ useMasterKey: true });
        return !count;
    }
}
