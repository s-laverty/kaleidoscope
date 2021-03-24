export default (() => {
  const set = Symbol('set'),
    hash = Symbol('hash'),
    equal = Symbol('equal'),
    methods = Symbol('methods');

  const type_methods = [
    {
      clone: function(src) { this[set] = new Set(src[set]); },
      add: function(value) { this[set].add(value); },
      delete: function(value) { return this[set].delete(value); },
      has: function(value) { return this[set].has(value); },
      values: function*() { yield* this[set].values(); }
    },
    {
      clone: function(src) { this[set] = new Map(src[set]); },
      add: function(value) { this[set].set(this[hash](value), value); },
      delete: function(value) { return this[set].delete(this[hash](value)); },
      has: function(value) { return this[set].has(this[hash](value)); }
    },
    {
      clone: function(src) {
        this[set] = new Map();
        for (let [hash_code, bucket] of src[set])
          this[set].set(hash_code, bucket.slice());
      },
      add: function(value) {
        let hash_code = this[hash](value);
        let bucket = this[set].get(hash_code);
        if (bucket) {
          if (!bucket.find(bucket_value => this[equal](value, bucket_value)))
            bucket.push(value);
        } else this[set].set(hash_code, [value]);
      },
      delete: function(value) {
        let hash_code = this[hash](value);
        let bucket = this[set].get(hash_code);
        if (bucket) {
          let index = bucket.findIndex(bucket_value => this[equal](value, bucket_value));
          if (index !== -1) {
            if (bucket.length > 1) bucket.splice(index, 1);
            else this[set].delete(hash_code);
            return true;
          }
        }
        return false;
      },
      has: function(value) {
        return this[set].get(this[hash](value))?.some(bucket_value =>
          this[equal](value, bucket_value)) ?? false;
      },
      values: function*() { for (let bucket of this[set].values()) yield* bucket; }
    }
  ];
  type_methods[1].values = type_methods[0].values; // Identical behavior for types 0 and 1

  return class CustomSet {
    constructor(values, hashFn, equalFn) {
      let type = 0;
      let is_clone = values instanceof CustomSet;
      if (hashFn) {
        this[hash] = hashFn;
        type = 1;
        if (is_clone) is_clone = this[hash] === values[hash];
        if (equalFn) {
          this[equal] = equalFn;
          type = 2;
          if (is_clone) is_clone = this[equal] === values[equal];
        }
      }
      this[methods] = type_methods[type];
      if (!is_clone) {
        this[set] = type > 0 ? new Map() : new Set();
        if (values) for (let value of values) this.add(value);
      } else this[methods].clone.call(this, values);
    }
    get size() { return this[set].size; }
    add(value) { this[methods].add.call(this, value); return this; }
    clear() { this[set].clear(); }
    delete(value) { return this[methods].delete.call(this, value); }
    has(value) { return this[methods].has.call(this, value); }
    *[Symbol.iterator]() { yield* this.values(); }
    *keys() { yield* this.values(); }
    *values() { yield* this[methods].values.call(this); }
    *entries() { for (let value of this.values()) yield [value, value]; }
    forEach(callbackFn, thisArg=this) {
      for (let value of this.values())
        callbackFn.call(thisArg, value, this);
    }
  }
})();
