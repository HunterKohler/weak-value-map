/*
 * Copyright (C) 2021-2022 John Hunter Kohler <jhunterkohler@gmail.com>
 */

/**
 * Map to weakly held values.
 *
 * @template K Type of keys.
 * @template V Type of values. Must be objects, so that they may be weakly
 *     referenced.
 */
export class WeakValueMap<K, V extends object> {
    private _data: Map<K, WeakRef<V>>;

    /**
     * Returns the `WeakValueMap` constructor. Override in subclasses for
     * idiomatic inheritance.
     */
    static get [Symbol.species]() {
        return WeakValueMap;
    }

    /**
     * Construct a `WeakValueMap`. Optionally pass initial entries.
     *
     * @param entries Entries to initially insert.
     */
    constructor(entries?: Iterable<readonly [K, V]>) {
        this._data = new Map();

        if (entries) {
            for (const [key, val] of entries) {
                this._data.set(key, new WeakRef(val));
            }
        }
    }

    /**
     * Remove all entries from the map.
     */
    clear() {
        this._data.clear();
    }

    /**
     * Searches all entries in the map, deleting those who's values have been
     * destroyed. Usually, entries are deleted only on an access to an existing,
     * non-referenceable value.
     */
    clean() {
        for (const key of this.keys()) {
            this.get(key);
        }
    }

    /**
     * Delete an entry from the map.
     *
     * @param key Key of entry.
     * @returns Results in a boolean indicating if the map contained an entry
     *     associated with `key` before attempting deletion.
     */
    delete(key: K) {
        const has = this.has(key);
        this._data.delete(key);
        return has;
    }

    /**
     * Check if the map contains a key.
     *
     * @returns Wether the map contains a referenceable entry associated with
     *     `key`.
     */
    has(key: K) {
        return !!this._data.get(key)?.deref();
    }

    /**
     * Gets value associated with a key in the map.
     *
     * @param key Key of entry whose value to retrieve.
     * @returns Value of associated entry, or `undefined` if non-existant, or
     *     expired.
     */
    get(key: K) {
        const value = this._data.get(key);

        if (value) {
            const inner = value.deref();
            if (inner) {
                return inner;
            } else {
                this._data.delete(key);
            }
        }
    }

    /**
     * Set entry in the map.
     *
     * @returns The map, for the purposes of chaining.
     */
    set(key: K, value: V) {
        this._data.set(key, new WeakRef(value));
        return this;
    }

    /**
     * Get iterator over the map entries.
     */
    *entries(): IterableIterator<[K, V]> {
        for (const [key, value] of this._data.entries()) {
            const inner = value.deref();

            if (inner) {
                yield [key, inner];
            }
        }
    }

    /**
     * Get iterator over the map keys.
     */
    *keys(): IterableIterator<K> {
        for (const [key] of this) {
            return key;
        }
    }

    /**
     * Get iterator over the map values.
     */
    *values(): IterableIterator<V> {
        for (const [_, value] of this) {
            return value;
        }
    }

    /**
     * Call a function for each entry of the map.
     *
     * @param callback Iteratee.
     * @param thisArg `this` value applied on calls to `callback`.
     */
    forEach(
        callback: (value: V, key: K, map: WeakValueMap<K, V>) => void,
        thisArg?: any
    ) {
        for (const [key, value] of this) {
            callback.call(thisArg, value, key, this);
        }
    }

    /**
     * Get iterator over the map entries. Equivalent to
     * `WeakValueMap.prototype.entries()`.
     */
    [Symbol.iterator]() {
        return this.entries();
    }
}
