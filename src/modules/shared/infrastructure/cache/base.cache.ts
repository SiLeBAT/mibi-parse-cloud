import NodeCache from 'node-cache';

export abstract class BaseCache<T extends NodeCache.Key, V> {
    private _cache = new NodeCache();
    constructor() {}

    protected set(key: T, value: V): boolean {
        return this._cache.set(key, value);
    }

    protected mset(keyValueArray: Array<{ key: T; val: V }>) {
        return this._cache.mset(keyValueArray);
    }

    protected get(key: T): V | undefined {
        return this._cache.get(key);
    }

    protected mget(keyArray: Array<T>): Record<string, V> {
        return this._cache.mget(keyArray);
    }

    protected keys(): string[] {
        return this._cache.keys();
    }
    protected flushAll() {
        return this._cache.flushAll();
    }
}
