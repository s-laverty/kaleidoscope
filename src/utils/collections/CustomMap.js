/**
 * Custom Map type.
 * @enum {number}
 */
const Types = {
  /** No custom hash function, use a builtin Map. */
  Simple: 0,
  /** Uses a custom hash function. */
  CustomHash: 1,
  /** Uses a custom hash function and a custom equality function. */
  CustomEquals: 2,
};
const typeErrorMessage = 'Unexpected CustomMap type: ';

/**
 * CustomMap implements the functionality of the builtin Map type with optional additional
 * functionality.
 * @template K - The key type.
 * @template V - The value type.
 */
export default class CustomMap {
  /**
   * The type of this CustomMap, as determined during construction.
   * @type {Types} @readonly
   */
  #type;

  /**
   * A builtin Map instance providing internal storage for this CustomMap.
   * @type {(Map<K, V> | Map<*, [K, V]> | Map<*, [K, V][]>)} @readonly
   */
  #map;

  /**
   * The hash function used for this CustomMap, optionally provided
   * during construction.
   * @type {(key: K) => *} @readonly
   */
  #hashFn;

  /**
   * The equality function used for this CustomMap, optionally provided during
   * construction.
   * @type {(key1: K, key2: K) => boolean} @readonly
   */
  #equalFn;

  /**
   * Generates a custom map.
   * @param {[K, V][] | Map<K, V> | CustomMap<K, V>} [entries] - An optional collection of key-value
   * pairs used to initialize the map.
   * @param {(key: K) => *} [hashFn] - An optional custom hash function that will be used to store
   * and access entries in the map.
   * @param {(key1: K, key2: K) => boolean} [equalFn] - An optional custom comparison function that
   * will be used to compare keys in the map.
   */
  constructor(entries, hashFn, equalFn) {
    /** Determine the map type based on whether hashFn and equalFn are defined. */
    if (!hashFn) this.#type = Types.Simple;
    else {
      this.#hashFn = hashFn;
      if (!equalFn) this.#type = Types.CustomHash;
      else {
        this.#equalFn = equalFn;
        this.#type = Types.CustomEquals;
      }
    }

    /** Check if entries is a cloneable instance of CustomMap. */
    if (
      entries instanceof CustomMap
      && this.#hashFn === entries.#hashFn
      && this.#equalFn === entries.#equalFn
    ) {
      /** Clone the provided CustomSet instance. */
      switch (entries.#type) {
        case Types.Simple:
        case Types.CustomHash:
          this.#map = new Map(entries.#map);
          break;
        case Types.CustomEquals:
          this.#map = new Map();
          /** @type {Map<*, [K, V][]>} */ (entries.#map).forEach((bucket, hash) => (
            /** @type {Map<*, [K, V][]>} */(this.#map).set(hash, [...bucket])
          ));
          break;
        default: throw new Error(typeErrorMessage + this.#type);
      }
    } else {
      /** Initialize the CustomMap with the initial values, if provided. */
      this.#map = new Map();
      if (entries instanceof Array) entries.forEach(([key, value]) => this.set(key, value));
      else entries?.forEach((value, key) => this.set(key, value));
    }
  }

  /**
   * Creates a cloned instance of the mappings in this CustomMap.
   * @returns {CustomMap<K, V>} A cloned instance of this CustomMap.
   */
  clone() { return new this.constructor(this, this.#hashFn, this.#equalFn); }

  /**
   * The number of entries in the map.
   * @type {number}
   */
  get size() {
    switch (this.#type) {
      case Types.Simple:
      case Types.CustomHash:
        return this.#map.size;
      case Types.CustomEquals: {
        let size = 0;
        /** @type {Map<*, [K, V][]>} */ (this.#map).forEach((bucket) => { size += bucket.length; });
        return size;
      }
      default: throw new Error(typeErrorMessage + this.#type);
    }
  }

  /** Clears all entries in the map. */
  clear() { this.#map.clear(); }

  /**
   * Attempts to delete an entry with a given key.
   * @param {K} key - The key of the entry to delete.
   * @returns {boolean} Whether the entry was deleted.
   */
  delete(key) {
    switch (this.#type) {
      case Types.Simple:
        return /** @type {Map<K, V>} */ (this.#map).delete(key);
      case Types.CustomHash:
        return /** @type {Map<*, [K, V]>} */ (this.#map).delete(this.#hashFn(key));
      case Types.CustomEquals: {
        const hash = this.#hashFn(key);
        const bucket = /** @type {Map<*, [K, V][]>} */ (this.#map).get(hash);
        if (bucket) {
          const index = bucket.findIndex(([bucketKey]) => this.#equalFn(key, bucketKey));

          if (index !== -1) {
            if (bucket.length > 1) bucket.splice(index, 1);
            else /** @type {Map<*, [K, V][]>} */ (this.#map).delete(hash);

            return true;
          }
        }

        return false;
      }
      default: throw new Error(typeErrorMessage + this.#type);
    }
  }

  /**
   * Returns the value associated to the key, or undefined if there is none.
   * @param {K} key - The key of the element to return.
   * @returns {V} the value associated to the key, or undefined if there is none.
   */
  get(key) {
    switch (this.#type) {
      case Types.Simple:
        return /** @type {Map<K, V>} */ (this.#map).get(key);
      case Types.CustomHash:
        return /** @type {Map<*, [K, V]>} */ (this.#map).get(this.#hashFn(key))?.[1];
      case Types.CustomEquals:
        return /** @type {Map<*, [K, V][]>} */ (this.#map).get(this.#hashFn(key))
          ?.find(([bucketKey]) => this.#equalFn(key, bucketKey))?.[1];
      default: throw new Error(typeErrorMessage + this.#type);
    }
  }

  /**
   * Checks whether a key is present in the map.
   * @param {K} key - The key to check.
   * @returns {boolean} Whether the key is in the map.
   */
  has(key) {
    switch (this.#type) {
      case Types.Simple: return /** @type {Map<K, V>} */ (this.#map).has(key);
      case Types.CustomHash:
        return /** @type {Map<*, [K, V]>} */ (this.#map).has(this.#hashFn(key));
      case Types.CustomEquals:
        return (
          /** @type {Map<*, [K, V][]>} */ (this.#map).get(this.#hashFn(key))
            ?.some(([bucketKey]) => this.#equalFn(key, bucketKey))
          ?? false
        );
      default: throw new Error(typeErrorMessage + this.#type);
    }
  }

  /**
   * Associates the given key with the given value in the map.
   * @param {K} key - The key to associate with the value.
   * @param {V} value - The value to associate with the key.
   * @returns {CustomMap<K, V>} The CustomMap object.
   */
  set(key, value) {
    switch (this.#type) {
      case Types.Simple:
        /** @type {Map<K, V>} */ (this.#map).set(key, value);
        break;
      case Types.CustomHash:
        /** @type {Map<*, [K, V]>} */ (this.#map).set(this.#hashFn(key), [key, value]);
        break;
      case Types.CustomEquals: {
        const entry = /** @type {[K, V]} */ ([key, value]);
        const hash = this.#hashFn(key);
        const bucket = /** @type {Map<*, [K, V][]>} */ (this.#map).get(hash);

        if (!bucket) /** @type {Map<*, [K, V][]>} */ (this.#map).set(hash, [entry]);
        else {
          const index = bucket.findIndex(([bucketKey]) => this.#equalFn(key, bucketKey));
          if (index !== -1) bucket[index] = entry;
          else bucket.push(entry);
        }
        break;
      }
      default: throw new Error(typeErrorMessage + this.#type);
    }

    return this;
  }

  /**
   * Returns an array of keys in the map.
   * @returns {K[]}
   */
  keys() {
    switch (this.#type) {
      case Types.Simple:
        return [...(/** @type {Map<K, V>} */ (this.#map).keys())];
      case Types.CustomHash:
        return [...(/** @type {Map<*, [K, V]>} */ (this.#map).values())].map(([key]) => key);
      case Types.CustomEquals:
        return [...(/** @type {Map<*, [K, V][]>} */ (this.#map).values())].flat()
          .map(([key]) => key);
      default: throw new Error(typeErrorMessage + this.#type);
    }
  }

  /**
   * Returns an array of values in the map.
   * @returns {V[]}
   */
  values() {
    switch (this.#type) {
      case Types.Simple:
        return [...(/** @type {Map<K, V>} */ (this.#map)).values()];
      case Types.CustomHash:
        return [...(/** @type {Map<*, [K, V]>} */ (this.#map).values())].map(([, value]) => value);
      case Types.CustomEquals:
        return [...(/** @type {Map<*, [K, V][]>} */ (this.#map).values())].flat()
          .map(([, value]) => value);
      default: throw new Error(typeErrorMessage + this.#type);
    }
  }

  /**
   * Returns an array of entries in the map.
   * @returns {[K, V][]}
   */
  entries() {
    switch (this.#type) {
      case Types.Simple: return [...(/** @type {Map<K, V>} */ (this.#map).entries())];
      case Types.CustomHash: return [...(/** @type {Map<*, [K, V]>} */ (this.#map).values())];
      case Types.CustomEquals:
        return [...(/** @type {Map<*, [K, V][]>} */ (this.#map).values())].flat();
      default: throw new Error(typeErrorMessage + this.#type);
    }
  }

  /**
   * Executes a callback on each entry in the map.
   * @param {(value: V, key: K, map: CustomMap<K, V>) => void} callbackfn - The callback to execute
   * on each entry.
   * @param {*} thisArg - Argument to use as "this" when executing the callback. undefined by
   * default.
   */
  forEach(callbackfn, thisArg) {
    /** @type {(value: V, key: K) => void} */
    const callback = (value, key) => callbackfn.call(thisArg, value, key, this);

    /** @type {([key, value]: [K, V]) => void} */
    const entryCallback = ([key, value]) => callback(value, key);

    switch (this.#type) {
      case Types.Simple: /** @type {Map<K, V>} */ (this.#map).forEach(callback); break;
      case Types.CustomHash:
        /** @type {Map<*, [K, V]>} */ (this.#map).forEach(entryCallback);
        break;
      case Types.CustomEquals:
        /** @type {Map<*, [K, V][]>} */ (this.#map).forEach((bucket) => (
          bucket.forEach(entryCallback)
        ));
        break;
      default: throw new Error(typeErrorMessage + this.#type);
    }
  }
}
