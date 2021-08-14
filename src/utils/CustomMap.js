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
  CustomEquals: 2
};
const typeErrorMessage = "Unexpected CustomMap type: ";

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
   * The hash function used for this CustomMap, optionally provided during construction.
   * @type {(key: K) => *} @readonly
   */
  #hashFn;

  /**
   * The equality function used for this CustomMap, optionally provided during construction.
   * @type {(key1: K, key2: K) => boolean} @readonly */
  #equalFn;

  /**
   * Generates a custom map.
   * 
   * @param {Iterable<[K, V]>} [entries] - An optional iterable of key-value pairs used to
   * initialize the map.
   * @param {(key: K) => *} [hashFn] - An optional custom hash function that will be used to store
   * and access entries in the map.
   * @param {(key1: K, key2: K) => boolean} [equalFn] - An optional custom comparison function that
   * will be used to compare keys in the map.
   */
  constructor(entries, hashFn, equalFn) {

    // Determine the map type based on whether hashFn and equalFn are defined.
    if (hashFn) {
      this.#hashFn = hashFn;
      if (equalFn) {
        this.#equalFn = equalFn;
        this.#type = Types.CustomEquals;
      } else this.#type = Types.CustomHash;
    } else this.#type = Types.Simple;

    // Check if values is a cloneable instance of CustomMap.
    if (
      entries instanceof CustomMap &&
      this.#hashFn === entries.#hashFn &&
      this.#equalFn === entries.#equalFn
    ) {

      // Clone the provided CustomSet instance.
      switch (entries.#type) {
        case Types.Simple:
        case Types.CustomHash: this.#map = new Map(entries.#map); break;
        case Types.CustomEquals:
          this.#map = new Map();
          /** @type {Map<*, [K, V][]>} */ (entries.#map).forEach(
            (bucket, hash) => /** @type {Map<*, [K, V][]>} */(this.#map).set(hash, [...bucket])
          );
          break;
        default: throw new Error(typeErrorMessage + this.#type);
      }
    } else {

      // Initialize the CustomMap with the initial values, if provided.
      this.#map = new Map();
      if (entries) for (let entry of entries) this.set(...entry);
    }
  }

  /**
   * The number of entries in the map.
   * @type {number}
   */
  get size() {
    switch (this.#type) {
      case Types.Simple:
      case Types.CustomHash: return this.#map.size;
      case Types.CustomEquals: {
        let size = 0;
        /** @type {Map<*, [K, V][]>} */ (this.#map).forEach(bucket => size += bucket.length);
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
      case Types.Simple: return /** @type {Map<K, V>} */ (this.#map).delete(key);
      case Types.CustomHash: {
        return /** @type {Map<*, [K, V]>} */ (this.#map).delete(this.#hashFn(key));
      }
      case Types.CustomEquals: {
        let hash = this.#hashFn(key);
        let bucket = /** @type {Map<*, [K, V][]>} */ (this.#map).get(hash);
        if (bucket) {
          let index = bucket.findIndex(([bucketKey]) => this.#equalFn(key, bucketKey));
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
      case Types.Simple: return /** @type {Map<K, V>} */ (this.#map).get(key);
      case Types.CustomHash: {
        return /** @type {Map<*, [K, V]>} */ (this.#map).get(this.#hashFn(key))?.[1];
      }
      case Types.CustomEquals: {
        return /** @type {Map<*, [K, V][]>} */ (this.#map).get(this.#hashFn(key))?.find(
          ([bucketKey]) => this.#equalFn(key, bucketKey)
        )?.[1];
      }
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
      case Types.CustomHash: {
        return /** @type {Map<*, [K, V]>} */ (this.#map).has(this.#hashFn(key));
      }
      case Types.CustomEquals: {
        return /** @type {Map<*, [K, V][]>} */ (this.#map).get(this.#hashFn(key))?.some(
          ([bucketKey]) => this.#equalFn(key, bucketKey)
        ) ?? false;
      }
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
      case Types.Simple: /** @type {Map<K, V>} */ (this.#map).set(key, value); break;
      case Types.CustomHash:
        /** @type {Map<*, [K, V]>} */ (this.#map).set(this.#hashFn(key), [key, value]);
        break;
      case Types.CustomEquals: {
        let entry = /** @type {[K, V]} */ ([key, value]);
        let hash = this.#hashFn(key);
        let bucket = /** @type {Map<*, [K, V][]>} */ (this.#map).get(hash);
        if (bucket) {
          let index = bucket.findIndex(([bucketKey]) => this.#equalFn(key, bucketKey));
          (index !== -1) ? bucket[index] = entry : bucket.push(entry);
        } else /** @type {Map<*, [K, V][]>} */ (this.#map).set(hash, [entry]);
      } break;
      default: throw new Error(typeErrorMessage + this.#type);
    }
    return this;
  }

  *[Symbol.iterator]() { yield* this.entries(); }

  /**
   * Returns an iterable of keys in the map.
   * @returns {IterableIterator<K>}
   */
  *keys() {
    switch (this.#type) {
      case Types.Simple: yield* /** @type {Map<K, V>} */ (this.#map).keys(); break;
      case Types.CustomHash:
      case Types.CustomEquals: for (let [key] of this.entries()) yield key; break;
      default: throw new Error(typeErrorMessage + this.#type);
    }
  }

  /**
   * Returns an iterable of values in the map.
   * @returns {IterableIterator<V>}
   */
  *values() {
    switch (this.#type) {
      case Types.Simple: yield* /** @type {Map<K, V>} */ (this.#map).values(); break;
      case Types.CustomHash:
      case Types.CustomEquals: for (let [, value] of this.entries()) yield value; break;
      default: throw new Error(typeErrorMessage + this.#type);
    }
  }

  /**
   * Returns an iterable of entries in the map.
   * @returns {IterableIterator<[K, V]>}
   */
  *entries() {
    switch (this.#type) {
      case Types.Simple: yield* /** @type {Map<K, V>} */ (this.#map).entries(); break;
      case Types.CustomHash: yield* /** @type {Map<*, [K, V]>} */ (this.#map).values(); break;
      case Types.CustomEquals:
        for (let bucket of /** @type {Map<*, [K, V][]>} */ (this.#map).values()) yield* bucket;
        break;
      default: throw new Error(typeErrorMessage + this.#type);
    }
  }

  /**
   * Executes a callback on each entry in the map.
   * @param {(value: V, key: K, map: CustomMap<K, V>) => void} callbackFn - The callback to execute
   * on each entry.
   * @param {*} thisArg - Argument to use as "this" when executing the callback. undefined by
   * default.
   */
  forEach(callbackFn, thisArg) {
    for (let [key, value] of this.entries())
      callbackFn.call(thisArg, value, key, this);
  }
}
