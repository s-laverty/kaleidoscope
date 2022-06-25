/**
 * Custom Set type.
 * @enum {number}
 */
const Types = {
  /** No custom hash function, use a builtin Set. */
  Simple: 0,
  /** Uses a custom hash function. */
  CustomHash: 1,
  /** Uses a custom hash function and a custom equality function. */
  CustomEquals: 2,
};
const typeErrorMessage = 'Unexpected CustomSet type: ';

/**
 * CustomSet implements the functionality of the builtin Set type with optional additional
 * functionality.
 * @template T - The entry type.
 */
export default class CustomSet {
  /**
   * The type of this CustomSet, as determined during construction.
   * @type {Types} @readonly
   */
  #type;

  /**
   * A builtin Set or Map instance providing internal storage for this
   * CustomSet.
   * @type {(Set<T> | Map<*, T> | Map<*, T[]>)} @readonly
   */
  #set;

  /**
   * The hash function used for this CustomSet, optionally provided during
   * construction.
   * @type {(val: T) => *} @readonly
   */
  #hashFn;

  /**
   * The equality function used for this CustomSet, optionally provided during
   * construction.
   * @type {(val1: T, val2: T) => boolean} @readonly
   */
  #equalFn;

  /**
   * Generates a custom set.
   * @param {T[] | Set<T> | CustomSet<T>} [values] - An optional collection of values used to
   * initialize the set.
   * @param {(val: T) => *} [hashFn] - An optional custom hash function that will be used to store
   * and access entries in the set.
   * @param {(val1: T, val2: T) => boolean} [equalFn] - An optional custom comparison function that
   * will be used to compare entries in the set.
   */
  constructor(values, hashFn, equalFn) {
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

    /** Check if values is a cloneable instance of CustomSet. */
    if (
      values instanceof CustomSet
      && this.#hashFn === values.#hashFn
      && this.#equalFn === values.#equalFn
    ) {
      /** Clone the provided CustomSet instance. */
      switch (values.#type) {
        case Types.Simple: this.#set = new Set(values.#set); break;
        case Types.CustomHash: this.#set = new Map(values.#set); break;
        case Types.CustomEquals:
          this.#set = new Map();
          /** @type {Map<*, T[]>} */ (values.#set).forEach((bucket, hash) => (
            /** @type {Map<*, T[]>} */(this.#set).set(hash, [...bucket])
          ));
          break;
        default: throw new Error(typeErrorMessage + this.#type);
      }
    } else {
      /** Initialize the CustomSet with the initial values, if provided. */
      this.#set = (this.#type === Types.Simple) ? new Set() : new Map();
      values?.forEach((value) => this.add(value));
    }
  }

  /**
   * Creates a cloned instance of the entries in this CustomSet.
   * @returns {CustomSet<T>} A cloned instance of this CustomSet.
   */
  clone() { return new this.constructor(this, this.#hashFn, this.#equalFn); }

  /**
   * The number of entries in the set.
   * @type {number}
   */
  get size() {
    switch (this.#type) {
      case Types.Simple:
      case Types.CustomHash: return this.#set.size;
      case Types.CustomEquals: {
        let size = 0;
        /** @type {Map<*, T[]>} */ (this.#set).forEach((bucket) => { size += bucket.length; });
        return size;
      }
      default: throw new Error(typeErrorMessage + this.#type);
    }
  }

  /**
   * Adds an entry to the CustomSet.
   * @param {T} value - The entry to add.
   * @returns {CustomSet<T>} The CustomSet.
   */
  add(value) {
    switch (this.#type) {
      case Types.Simple: /** @type {Set<T>} */ (this.#set).add(value); break;
      case Types.CustomHash:
        /** @type {Map<*, T>} */ (this.#set).set(this.#hashFn(value), value);
        break;
      case Types.CustomEquals: {
        const hash = this.#hashFn(value);
        const bucket = /** @type {Map<*, T[]>} */ (this.#set).get(hash);
        if (!bucket) /** @type {Map<*, T[]>} */ (this.#set).set(hash, [value]);
        else if (!bucket.find((bucketValue) => this.#equalFn(value, bucketValue))) {
          bucket.push(value);
        }
        break;
      }
      default: throw new Error(typeErrorMessage + this.#type);
    }

    return this;
  }

  /** Clears all entries in the set. */
  clear() { this.#set.clear(); }

  /**
   * Attempts to delete a given entry.
   * @param {T} value - The entry to delete.
   * @returns {boolean} Whether the entry was deleted.
   */
  delete(value) {
    switch (this.#type) {
      case Types.Simple: return /** @type {Set<T>} */ (this.#set).delete(value);
      case Types.CustomHash:
        return /** @type {Map<*, T>} */ (this.#set).delete(this.#hashFn(value));
      case Types.CustomEquals: {
        const hash = this.#hashFn(value);
        const bucket = /** @type {Map<*, T[]>} */ (this.#set).get(hash);
        if (bucket) {
          const index = bucket.findIndex((bucketValue) => this.#equalFn(value, bucketValue));
          if (index !== -1) {
            if (bucket.length > 1) bucket.splice(index, 1);
            else /** @type {Map<*, T[]>} */ (this.#set).delete(hash);

            return true;
          }
        }

        return false;
      }
      default: throw new Error(typeErrorMessage + this.#type);
    }
  }

  /**
   * Checks whether an entry is present in the set.
   * @param {T} value - The entry to check.
   * @returns {boolean} Whether the entry is in the set.
   */
  has(value) {
    switch (this.#type) {
      case Types.Simple: return /** @type {Set<T>} */ (this.#set).has(value);
      case Types.CustomHash: return /** @type {Map<*, T>} */ (this.#set).has(this.#hashFn(value));
      case Types.CustomEquals:
        return (
          /** @type {Map<*, T[]>} */ (this.#set).get(this.#hashFn(value))
            ?.some((bucketValue) => this.#equalFn(value, bucketValue))
          ?? false
        );
      default: throw new Error(typeErrorMessage + this.#type);
    }
  }

  /**
   * Returns an array of entries in the set.
   * @returns {T[]}
   */
  values() {
    switch (this.#type) {
      case Types.Simple:
      case Types.CustomHash:
        return [...(/** @type {Set<T> | Map<*, T>} */ (this.#set).values())];
      case Types.CustomEquals:
        return [...(/** @type {Map<*, T[]>} */ (this.#set).values())].flat();
      default: throw new Error(typeErrorMessage + this.#type);
    }
  }

  /**
   * Returns an array of entries in the set.
   * @returns {T[]}
   */
  keys() { return this.values(); }

  /**
   * Returns an array of entries in the set in the form of [entry, entry].
   * @returns {[T, T][]}
   */
  entries() { return this.values().map((value) => [value, value]); }

  /**
   * Executes a callback on each entry in the set.
   * @param {(value: T, value2: T, set: CustomSet<T>) => void} callbackfn - The callback to execute
   * on each entry.
   * @param {*} thisArg - Argument to use as "this" when executing the callback. undefined by
   * default.
   */
  forEach(callbackfn, thisArg) {
    /** @type {(value: T) => void} */
    const callback = (value) => callbackfn.call(thisArg, value, value, this);

    switch (this.#type) {
      case Types.Simple:
      case Types.CustomHash:
        /** @type {Set<T> | Map<*, T>} */ (this.#set).forEach(callback);
        break;
      case Types.CustomEquals:
        /** @type {Map<*, T[]>} */ (this.#set).forEach((bucket) => bucket.forEach(callback));
        break;
      default: throw new Error(typeErrorMessage + this.#type);
    }
  }
}
