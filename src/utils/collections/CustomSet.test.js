import CustomSet from './CustomSet';

describe('Basic usage tests', () => {
  let set1; let set2; let
    set3;
  beforeEach(() => {
    set1 = new CustomSet([0, 1, 1, 2, 3, 5, 8]);
    set2 = new CustomSet(['apple', 'banana', 'kiwifruit']);
    set3 = new CustomSet([true, false, null, undefined, Math.log(-3)]);
  });
  test('No repeats', () => {
    expect(set1.size).toBe(6);
    expect([...set1]).toEqual([0, 1, 2, 3, 5, 8]);
    expect(set1.add(5).add(3).add(5).size).toBe(6);
    expect(set3.size).toBe(5);
    expect(set3.has(true)).toBe(true);
    expect(set3.delete(undefined)).toBe(true);
    expect(set3.has(undefined)).toBe(false);
    expect(set3.delete(undefined)).toBe(false);
    expect(set3.size).toBe(4);
    expect(set3.has(Math.sqrt(-49))).toBe(true);
  });
  test('copying', () => {
    expect([...set2]).not.toEqual([...set3]);
    set3.clear();
    expect(set3.size).toBe(0);
    set2.forEach((value) => set3.add(value));
    expect([...set2]).toEqual([...set3]);
    const set4 = new CustomSet(set2);
    set2.clear();
    expect(set4.size).toBe(3);
    set2 = new CustomSet(set1);
    set2.delete(5);
    expect(set1.has(5)).toBe(true);
  });
  test('iterators', () => {
    expect([...set1]).toEqual([...set1.keys()]);
    expect([...set1]).toEqual([...set1.values()]);
    const values = [];
    const testObj = { someProperty: 'potato' };
    const counter = jest.fn();
    set1.forEach(function testFunc(value, _value2, set) {
      counter();
      values.push(value);
      expect(this.someProperty).toBe('potato');
      expect(set).toBe(set1);
    }, testObj);
    expect(counter).toHaveBeenCalledTimes(6);
    expect(values).toEqual([...set1]);
    [...set1.entries()].forEach((entry, i) => {
      expect(entry[0]).toBe(values[i]);
      expect(entry[1]).toBe(values[i]);
      expect(entry).toHaveLength(2);
    });
  });
});

describe('Hash function tests', () => {
  let set1;
  beforeEach(() => {
    set1 = new CustomSet(null, String);
  });
  test('Normal functionality', () => {
    set1.add(50);
    expect(set1.has(50)).toBe(true);
    expect(set1.size).toBe(1);
    set1.add(50);
    expect(set1.size).toBe(1);
    set1.add(12).add(54);
    expect(set1.delete(12)).toBe(true);
    expect([...set1]).toEqual(expect.arrayContaining([50, 54]));
    const set2 = new CustomSet(set1);
    expect([...set2]).toEqual([...set1]);
    const set3 = new CustomSet(set1, String);
    expect([...set3]).toEqual([...set1]);
  });
  test('Hash collisions', () => {
    set1.add(50);
    expect(set1.has('50')).toBe(true);
    set1.add(['words', 'on', 'a', 'page']);
    expect(set1.has('words,on,a,page')).toBe(true);
    expect(set1.delete('words,on,a,page')).toBe(true);
    expect(String([...set1][0])).toBe('50');
  });
});

describe('Equal function tests', () => {
  const typeEqual = (obj1, obj2) => typeof obj1 === typeof obj2;
  let set1;
  beforeEach(() => {
    set1 = new CustomSet(null, String, typeEqual);
  });
  test('Normal functionality', () => {
    set1.add(50);
    expect(set1.has(50)).toBe(true);
    expect(set1.size).toBe(1);
    set1.add(50);
    expect(set1.size).toBe(1);
    set1.add(12).add(54);
    expect(set1.delete(12)).toBe(true);
    expect([...set1]).toEqual(expect.arrayContaining([50, 54]));
    const set2 = new CustomSet(set1);
    expect([...set2]).toEqual([...set1]);
    const set3 = new CustomSet(set1, String, typeEqual);
    expect([...set3]).toEqual([...set1]);
  });
  test('Hash collisions', () => {
    set1.add(50);
    expect(set1.has('50')).toBe(false);
    set1.add('50');
    expect(set1.has('50')).toBe(true);
    expect(set1.size).toBe(2);
    const set2 = new CustomSet(set1, String);
    expect(set2.size).toBe(1);
    const set3 = new CustomSet(set1, String, typeEqual);
    expect(set3.delete('50')).toBe(true);
    expect(set1.has('50')).toBe(true);
    expect(set3.delete(50)).toBe(true);
    expect(set3.size).toBe(0);
    set1.add(['words', 'on', 'a', 'page']);
    expect(set1.has('words,on,a,page')).toBe(false);
    expect(set1.delete('words,on,a,page')).toBe(false);
    expect(set1.values()).toContainEqual(['words', 'on', 'a', 'page']);
  });
});
