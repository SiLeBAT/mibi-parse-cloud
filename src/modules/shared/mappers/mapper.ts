export abstract class Mapper {
    protected static convertArray<T, V>(
        array: T[],
        converterFunction: (item: T) => V
    ): V[] {
        return array.map(item => converterFunction(item));
    }

    protected static convertArrayAsync<T, V>(
        array: T[],
        converterFunction: (item: T) => Promise<V>
    ): Promise<V>[] {
        return array.map(async item => converterFunction(item));
    }
}
