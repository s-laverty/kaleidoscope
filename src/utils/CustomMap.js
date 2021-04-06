export default (() => {
  const map = Symbol('map'),
    hash = Symbol('hash'),
    equal = Symbol('equal'),
    methods = Symbol('methods');

  const type_methods = [
    {
      clone: function(src) { this[map] = new Map(src[map]); },
      size: function() { return this[map].size; },
      delete: function(key) { return this[map].delete(key); },
      get: function(key) { return this[map].get(key); },
      has: function(key) { return this[map].has(key); },
      set: function(key, value) { this[map].set(key, value); },
      keys: function*() { yield* this[map].keys(); },
      values: function*() { yield* this[map].values(); },
      entries: function*() { yield* this[map].entries(); }
    },
    {
      delete: function(key) { return this[map].delete(this[hash](key)); },
      get: function(key) { return this[map].get(this[hash](key))?.[1]; },
      has: function(key) { return this[map].has(this[hash](key)); },
      set: function(key, value) { this[map].set(this[hash](key), [key, value]); },
      keys: function*() { for (let [key] of this.entries()) yield key; },
      values: function*() { for (let [,value] of this.entries()) yield value; },
      entries: function*() { yield* this[map].values(); }
    },
    {
      clone: function(src) {
        this[map] = new Map();
        for (let [hash_code, bucket] of src[map])
          this[map].set(hash_code, bucket.slice());
      },
      size: function() {
        let size = 0;
        this[map].forEach(bucket => size += bucket.length);
        return size;
      },
      delete: function(key) {
        let hash_code = this[hash](key);
        let bucket = this[map].get(hash_code);
        if (bucket) {
          let index = bucket.findIndex(([bucket_key]) => this[equal](key, bucket_key));
          if (index !== -1) {
            if (bucket.length > 1) bucket.splice(index, 1);
            else this[map].delete(hash_code);
            return true;
          }
        }
        return false;
      },
      get: function(key) {
        return this[map].get(this[hash](key))?.find(([bucket_key]) =>
          this[equal](key, bucket_key))?.[1];
      },
      has: function(key) {
        return this[map].get(this[hash](key))?.some(([bucket_key]) =>
          this[equal](key, bucket_key)) ?? false;
      },
      set: function(key, value) {
        let entry = [key, value];
        let hash_code = this[hash](key);
        let bucket = this[map].get(hash_code);
        if (bucket) {
          let index = bucket.findIndex(([bucket_key]) => this[equal](key, bucket_key));
          if (index !== -1) bucket[index] = entry;
          else bucket.push(entry);
        } else this[map].set(hash_code, [entry]);
      },
      entries: function*() { for (let bucket of this[map].values()) yield* bucket; }
    }
  ];
  type_methods[1].clone = type_methods[0].clone; // Identical behavior for types 0 and 1
  type_methods[1].size = type_methods[0].size; // Identical behavior for types 0 and 1
  type_methods[2].keys = type_methods[1].keys; // Identical behavior for types 1 and 2
  type_methods[2].values = type_methods[1].values; // Identical behavior for types 1 and 2 

  return class CustomMap {
    constructor(entries, hashFn, equalFn) {
      let type = 0;
      if (hashFn) {
        this[hash] = hashFn;
        type = 1;
        if (equalFn) {
          this[equal] = equalFn;
          type = 2;
        }
      }
      this[methods] = type_methods[type];
      if (!(entries instanceof CustomMap && this[hash] === entries[hash]
      && this[equal] === entries[equal])) {
        this[map] = new Map();
        if (entries) for (let entry of entries) this.set(...entry);
      } else this[methods].clone.call(this, entries);
    }
    get size() { return this[methods].size.call(this); }
    clear() { this[map].clear(); }
    delete(key) { return this[methods].delete.call(this, key); }
    get(key) { return this[methods].get.call(this, key); }
    has(key) { return this[methods].has.call(this, key); }
    set(key, value) { this[methods].set.call(this, key, value); return this; }
    *[Symbol.iterator]() { yield* this.entries(); }
    *keys() { yield* this[methods].keys.call(this); }
    *values() { yield* this[methods].values.call(this); }
    *entries() { yield* this[methods].entries.call(this); }
    forEach(callbackFn, thisArg=this) {
      for (let [key, value] of this.entries())
        callbackFn.call(thisArg, value, key, this);
    }
  }
})();
