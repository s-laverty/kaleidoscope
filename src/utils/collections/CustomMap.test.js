import CustomMap from './CustomMap';

describe('Basic usage tests', () => {
  let map1; let map2; let map3;
  beforeEach(() => {
    map1 = new CustomMap([[0, 2], [1, 3], [1, 3], [2, -3], [3, 12], [5, 5], [8, 0]]);
    map2 = new CustomMap([
      ['apple', 'granny smith'], ['banana', 'cavendish'], ['kiwifruit', 'golden'],
    ]);
    map3 = new CustomMap([[true, 'up'], [false, 'down'], [null, 'charm'],
      [undefined, 'strange'], [Math.log(-3), 'top']]);
  });
  test('No repeat keys', () => {
    expect(map1.size).toBe(6);
    expect([...map1]).toEqual([[0, 2], [1, 3], [2, -3], [3, 12], [5, 5], [8, 0]]);
    expect(map1.get(5)).toBe(5);
    expect(map1.set(5, 4).set(3, 12).set(5, 0).size).toBe(6);
    expect(map1.get(5)).toBe(0);
    expect(map3.size).toBe(5);
    expect(map3.has(true)).toBe(true);
    expect(map3.get(undefined)).toBe('strange');
    expect(map3.delete(undefined)).toBe(true);
    expect(map3.has(undefined)).toBe(false);
    expect(map3.get(undefined)).toBe(undefined);
    expect(map3.delete(undefined)).toBe(false);
    expect(map3.size).toBe(4);
    expect(map3.get(Math.sqrt(-49))).toBe('top');
  });
  test('copying', () => {
    expect([...map2]).not.toEqual([...map3]);
    map3.clear();
    expect(map3.size).toBe(0);
    map2.forEach((value, key) => map3.set(key, value));
    expect([...map2]).toEqual([...map3]);
    const map4 = new CustomMap(map2);
    map2.clear();
    expect(map4.size).toBe(3);
    map2 = new CustomMap(map1);
    map2.delete(5);
    expect(map1.has(5)).toBe(true);
  });
  test('iterators', () => {
    const entries = [...map1];
    expect([...map1]).toEqual([...map1.entries()]);
    expect(entries.map((entry) => entry[0])).toEqual([...map1.keys()]);
    expect(entries.map((entry) => entry[1])).toEqual([...map1.values()]);
    const values = []; const
      keys = [];
    const testObj = { someProperty: 'potato' };
    const counter = jest.fn();
    map1.forEach(function testFunc(value, key, map) {
      counter();
      values.push(value);
      keys.push(key);
      expect(this.someProperty).toBe('potato');
      expect(map).toBe(map1);
    }, testObj);
    expect(counter).toHaveBeenCalledTimes(6);
    expect(values).toEqual([...map1.values()]);
    expect(keys).toEqual([...map1.keys()]);
    [...map1.entries()].forEach((entry, i) => {
      expect(entry[0]).toBe(keys[i]);
      expect(entry[1]).toBe(values[i]);
      expect(entry).toHaveLength(2);
    });
  });
});

describe('Hash function tests', () => {
  let map1;
  beforeEach(() => {
    map1 = new CustomMap(null, String);
  });
  test('Normal functionality', () => {
    map1.set(50, 2500);
    expect(map1.has(50)).toBe(true);
    expect(map1.get(50)).toBe(2500);
    expect(map1.get(2500)).toBe(undefined);
    expect(map1.size).toBe(1);
    map1.set(50, 234);
    expect(map1.get(50)).toBe(234);
    expect(map1.size).toBe(1);
    map1.set(12, 144).set(54, 2916);
    expect(map1.delete(12)).toBe(true);
    expect([...map1]).toEqual(expect.arrayContaining([[50, 234], [54, 2916]]));
    const map2 = new CustomMap(map1);
    expect([...map2]).toEqual([...map1]);
    const map3 = new CustomMap(map1, String);
    expect([...map3]).toEqual([...map1]);
  });
  test('Hash collisions', () => {
    map1.set(50, -50);
    expect(map1.has('50')).toBe(true);
    expect(map1.get('50')).toBe(-50);
    map1.set(['words', 'on', 'a', 'page'], true);
    expect(map1.has('words,on,a,page')).toBe(true);
    expect(map1.delete('words,on,a,page')).toBe(true);
    expect(String([...map1][0][0])).toBe('50');
  });
});

describe('Equal function tests', () => {
  const typeEqual = (obj1, obj2) => typeof obj1 === typeof obj2;
  let map1;
  beforeEach(() => {
    map1 = new CustomMap(null, String, typeEqual);
  });
  test('Normal functionality', () => {
    map1.set(50, '50 number');
    expect(map1.get(50)).toBe('50 number');
    expect(map1.has(50)).toBe(true);
    expect(map1.size).toBe(1);
    map1.set(50, '50 number NEW');
    expect(map1.size).toBe(1);
    expect(map1.get(50)).toBe('50 number NEW');
    map1.set(12, 'doce').set(54, 'cincuenta y cuatro');
    expect(map1.delete(12)).toBe(true);
    expect([...map1.keys()]).toEqual(expect.arrayContaining([50, 54]));
    expect([...map1.values()]).toEqual(expect.arrayContaining([
      '50 number NEW', 'cincuenta y cuatro',
    ]));
    const map2 = new CustomMap(map1);
    expect([...map2]).toEqual([...map1]);
    const map3 = new CustomMap(map1, String, typeEqual);
    expect([...map3]).toEqual([...map1]);
  });
  test('Hash collisions', () => {
    map1.set(50, '110010');
    expect(map1.get('50')).toBe(undefined);
    expect(map1.has(50)).toBe(true);
    map1.set('50', 'string x 50');
    expect(map1.has('50')).toBe(true);
    expect(map1.get(50)).toBe('110010');
    expect(map1.size).toBe(2);
    const map2 = new CustomMap(map1, String);
    expect(map2.size).toBe(1);
    const map3 = new CustomMap(map1, String, typeEqual);
    expect(map3.delete('50')).toBe(true);
    expect(map1.has('50')).toBe(true);
    expect(map3.delete(50)).toBe(true);
    expect(map3.size).toBe(0);
    map1.set(['words', 'on', 'a', 'page'], 'array');
    expect(map1.has('words,on,a,page')).toBe(false);
    expect(map1.delete('words,on,a,page')).toBe(false);
    expect(map1.keys()).toContainEqual(['words', 'on', 'a', 'page']);
  });
});
