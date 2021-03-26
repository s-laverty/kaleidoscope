export default (() => {
  const set = Symbol('set'),
    hash = Symbol('hash'),
    equal = Symbol('equal'),
    methods = Symbol('methods');

  const type_methods = [
    {
      clone: function(src) { this[set] = new Set(src[set]); },
      size: function() { return this[set].size; },
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
        src[set].forEach((bucket, hash_code) =>
          this[set].set(hash_code, bucket.slice()));
      },
      size: function() {
        let size = 0;
        this[set].forEach(bucket => size += bucket.length);
        return size;
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
  type_methods[1].size = type_methods[0].size; // Identical behavior for types 0 and 1
  type_methods[1].values = type_methods[0].values; // Identical behavior for types 0 and 1

  return class CustomSet {
    constructor(values, hashFn, equalFn) {
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
      if (!(values instanceof CustomSet && this[hash] === values[hash]
      && this[equal] === values[equal])) {
        this[set] = type > 0 ? new Map() : new Set();
        if (values) for (let value of values) this.add(value);
      } else this[methods].clone.call(this, values);
    }
    get size() { return this[methods].size.call(this); }
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
