import CustomMap from './CustomMap';

describe('Basic usage tests.', () => {
  let map1 = /** @type {CustomMap<number, number>} */ (null);
  let map2 = /** @type {CustomMap<string, string>} */ (null);
  let map3 = /** @type {CustomMap<*, *>} */ (null);

  beforeEach(() => {
    map1 = new CustomMap([[0, 2], [1, 3], [1, 3], [2, -3], [3, 12], [5, 5], [8, 0]]);
    map2 = new CustomMap([
      ['apple', 'granny smith'], ['banana', 'cavendish'], ['kiwifruit', 'golden'],
    ]);
    map3 = new CustomMap([
      [true, 'up'], [false, 'down'], [null, 'charm'], [undefined, 'strange'], [Math.log(-3), 'top'],
    ]);
  });

  test('Setting elements.', () => {
    expect(map1.size).toBe(6);
    expect(map1.keys()).toEqual(expect.arrayContaining([0, 1, 2, 3, 5, 8]));
    expect(map1.values()).toEqual(expect.arrayContaining([2, 3, -3, 12, 5, 0]));
    expect(map1.entries()).toEqual(expect.arrayContaining([
      [0, 2], [1, 3], [2, -3], [3, 12], [5, 5], [8, 0],
    ]));
    expect(map1.has(16)).toBe(false);
    expect(map1.get(16)).toBeUndefined();
    map1.set(16, -3);
    expect(map1.get(16)).toBe(-3);
    expect(map1.has(16)).toBe(true);
    map1.set(32, 0);
    expect(map1.size).toBe(8);
    expect(map1.entries()).toEqual(expect.arrayContaining([
      [16, -3], [32, 0], [0, 2], [1, 3], [2, -3], [3, 12], [5, 5], [8, 0],
    ]));
  });

  test('Re-setting elements.', () => {
    expect(map2.size).toBe(3);
    expect(map2.entries()).toEqual(expect.arrayContaining([
      ['apple', 'granny smith'], ['banana', 'cavendish'], ['kiwifruit', 'golden'],
    ]));
    expect(map2.has('apple')).toBe(true);
    expect(map2.get('apple')).toBe('granny smith');
    map2.set('apple', 'red delicious');
    expect(map2.get('apple')).toBe('red delicious');
    expect(map2.size).toBe(3);
    expect(map2.has('apple')).toBe(true);
    expect(map2.entries()).toEqual(expect.arrayContaining([
      ['apple', 'red delicious'], ['banana', 'cavendish'], ['kiwifruit', 'golden'],
    ]));
  });

  test('Chaing set calls.', () => {
    expect(map1.set(5, 4).set(3, 9).set(16, 8).set(5, 0).size).toBe(7);
    expect(map1.entries()).toEqual(expect.arrayContaining([
      [0, 2], [1, 3], [2, -3], [3, 9], [5, 0], [8, 0], [16, 8],
    ]));
  });

  test('Deleting elements.', () => {
    expect(map3.size).toBe(5);
    expect(map3.has(true)).toBe(true);
    expect(map3.get(true)).toBe('up');
    expect(map3.delete(true)).toBe(true);
    expect(map3.size).toBe(4);
    expect(map3.has(true)).toBe(false);
    expect(map3.get(true)).toBeUndefined();
    expect(map3.delete(true)).toBe(false);
    expect(map3.size).toBe(4);
    expect(map3.has(true)).toBe(false);
  });

  test('Copying maps.', () => {
    map3.clear();
    expect(map3.size).toBe(0);
    map2.forEach((value, key) => map3.set(key, value));
    expect(map3.size).toBe(3);
    expect(map3.entries()).toEqual(expect.arrayContaining(map2.entries()));
    const map4 = new CustomMap(map2);
    map2.clear();
    expect(map4.size).toBe(3);
    expect(map2.size).toBe(0);
    expect(map4.entries()).toEqual(expect.arrayContaining(map3.entries()));
    const map5 = new CustomMap(map1);
    map5.delete(5);
    expect(map1.has(5)).toBe(true);
    expect(map1.get(5)).toBe(5);
    map5.set(8, 6);
    expect(map1.get(8)).toBe(0);
  });

  test('Iteration with forEach.', () => {
    const entries = [];
    const testObj = { someProperty: 'potato' };
    const counter = jest.fn();
    map1.forEach(function testFunc(value, key, map) {
      counter();
      entries.push([key, value]);
      expect(this.someProperty).toBe('potato');
      expect(map).toBe(map1);
    }, testObj);
    expect(counter).toHaveBeenCalledTimes(6);
    expect(entries.length).toBe(map1.size);
    expect(entries).toEqual(expect.arrayContaining(map1.entries()));
  });
});

describe('Hash function tests.', () => {
  let map1 = /** @type {CustomMap<*, *>} */ (null);

  beforeEach(() => {
    map1 = new CustomMap(null, String);
  });

  test('Basic functionality.', () => {
    map1.set(50, 2500);
    expect(map1.has(50)).toBe(true);
    expect(map1.get(50)).toBe(2500);
    expect(map1.get(2500)).toBeUndefined();
    expect(map1.size).toBe(1);
    map1.set(50, 234);
    expect(map1.get(50)).toBe(234);
    expect(map1.size).toBe(1);
    map1.set(12, 144).set(54, 2916);
    expect(map1.delete(12)).toBe(true);
    expect(map1.size).toBe(2);
    expect(map1.entries()).toEqual(expect.arrayContaining([[50, 234], [54, 2916]]));
    const map2 = new CustomMap(map1, String);
    expect(map2.size).toBe(2);
    expect(map2.entries()).toEqual(expect.arrayContaining([[50, 234], [54, 2916]]));
  });

  test('Hash collisions', () => {
    map1.set(50, -50);
    expect(map1.has('50')).toBe(true);
    expect(map1.get('50')).toBe(-50);
    map1.set('50', 200);
    expect(map1.size).toBe(1);
    expect(map1.get(50)).toBe(200);
    map1.set(['words', 'on', 'a', 'page'], true);
    expect(map1.has('words,on,a,page')).toBe(true);
    expect(map1.delete('words,on,a,page')).toBe(true);
    expect(map1.size).toBe(1);
    expect(map1.entries().map(([key, value]) => [String(key), value])).toEqual(
      expect.arrayContaining([['50', 200]]),
    );
  });

  test('Hash collisions in new instance.', () => {
    const set2 = new CustomMap([[50, 'Hello!'], ['50', 'Hello!']]);
    expect(set2.size).toBe(2);
    const set3 = new CustomMap(set2, String);
    expect(set3.size).toBe(1);
    expect(set3.has(50)).toBe(true);
    expect(set3.has('50')).toBe(true);
    expect(set3.get(50)).toBe('Hello!');
  });
});

describe('Equal function tests', () => {
  const typeEqual = (obj1, obj2) => typeof obj1 === typeof obj2;

  let map1 = /** @type {CustomMap<*, *>} */ (null);

  beforeEach(() => {
    map1 = new CustomMap(null, String, typeEqual);
  });

  test('Basic functionality.', () => {
    map1.set(50, 2500);
    expect(map1.has(50)).toBe(true);
    expect(map1.get(50)).toBe(2500);
    expect(map1.get(2500)).toBeUndefined();
    expect(map1.size).toBe(1);
    map1.set(50, 234);
    expect(map1.get(50)).toBe(234);
    expect(map1.size).toBe(1);
    map1.set(12, 144).set(54, 2916);
    expect(map1.delete(12)).toBe(true);
    expect(map1.size).toBe(2);
    expect(map1.entries()).toEqual(expect.arrayContaining([[50, 234], [54, 2916]]));
    const map2 = new CustomMap(map1, String, typeEqual);
    expect(map2.size).toBe(2);
    expect(map2.entries()).toEqual(expect.arrayContaining([[50, 234], [54, 2916]]));
  });

  test('Hash collisions', () => {
    map1.set(50, '110010');
    expect(map1.has('50')).toBe(false);
    expect(map1.get('50')).toBeUndefined();
    expect(map1.has(50)).toBe(true);
    map1.set('50', 'string x 50');
    expect(map1.has('50')).toBe(true);
    expect(map1.get(50)).toBe('110010');
    expect(map1.size).toBe(2);
    map1.set(['words', 'on', 'a', 'page'], 'array');
    expect(map1.has('words,on,a,page')).toBe(false);
    expect(map1.delete('words,on,a,page')).toBe(false);
    expect(map1.size).toBe(3);
    expect(map1.entries()).toEqual(expect.arrayContaining([
      [50, '110010'], ['50', 'string x 50'], [['words', 'on', 'a', 'page'], 'array'],
    ]));
    expect(map1.has(['words', 'on', 'a', 'page'])).toBe(true);
    expect(map1.get(['words,on,a,page'])).toBe('array');
  });

  test('Hash collisions in new instance.', () => {
    const set2 = new CustomMap([[50, 'Hello!'], ['50', 'Goodbye!']]);
    expect(set2.size).toBe(2);
    const set3 = new CustomMap(set2, String, typeEqual);
    expect(set3.size).toBe(2);
    expect(set3.has(50)).toBe(true);
    expect(set3.has('50')).toBe(true);
    expect(set3.get(50)).toBe('Hello!');
    expect(set3.get('50')).toBe('Goodbye!');
  });
});
