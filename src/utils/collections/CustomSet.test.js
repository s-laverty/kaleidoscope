import CustomSet from './CustomSet';

describe('Basic usage tests.', () => {
  let set1 = /** @type {CustomSet<number>} */ (null);
  let set2 = /** @type {CustomSet<string>} */ (null);
  let set3 = /** @type {CustomSet<*>} */ (null);

  beforeEach(() => {
    set1 = new CustomSet([0, 1, 1, 2, 3, 5, 8]);
    set2 = new CustomSet(['apple', 'banana', 'kiwifruit']);
    set3 = new CustomSet([true, false, null, undefined, Math.log(-3)]);
  });

  test('Adding new elements.', () => {
    expect(set2.size).toBe(3);
    expect(set2.keys()).toEqual(expect.arrayContaining(['apple', 'banana', 'kiwifruit']));
    expect(set2.has('papaya')).toBe(false);
    set2.add('papaya');
    expect(set2.has('papaya')).toBe(true);
    expect(set2.size).toBe(4);
    set2.add('lime');
    expect(set2.size).toBe(5);
    expect(set2.entries()).toEqual(expect.arrayContaining([
      ['apple', 'apple'], ['banana', 'banana'], ['kiwifruit', 'kiwifruit'], ['papaya', 'papaya'],
      ['lime', 'lime'],
    ]));
  });

  test('Adding repeat elements.', () => {
    expect(set1.size).toBe(6);
    expect(set1.values()).toEqual(expect.arrayContaining([0, 1, 2, 3, 5, 8]));
    expect(set1.has(5)).toBe(true);
    set1.add(5);
    expect(set1.has(5)).toBe(true);
    expect(set1.size).toBe(6);
    expect(set1.values()).toEqual(expect.arrayContaining([0, 1, 2, 3, 5, 8]));
  });

  test('Chaing add calls.', () => {
    expect(set1.add(5).add(-8).add(5).size).toBe(7);
    expect(set1.values()).toEqual(expect.arrayContaining([-8, 0, 1, 2, 3, 5, 8]));
  });

  test('Deleting elements.', () => {
    expect(set3.size).toBe(5);
    expect(set3.has(undefined)).toBe(true);
    expect(set3.delete(undefined)).toBe(true);
    expect(set3.size).toBe(4);
    expect(set3.has(undefined)).toBe(false);
    expect(set3.delete(undefined)).toBe(false);
    expect(set3.size).toBe(4);
    expect(set3.has(undefined)).toBe(false);
  });

  test('Copying sets.', () => {
    set3.clear();
    expect(set3.size).toBe(0);
    set2.forEach((value) => set3.add(value));
    expect(set3.size).toBe(3);
    expect(set3.values()).toEqual(expect.arrayContaining(set2.values()));
    const set4 = new CustomSet(set2);
    set2.clear();
    expect(set4.size).toBe(3);
    expect(set2.size).toBe(0);
    expect(set4.values()).toEqual(expect.arrayContaining(set3.values()));
    const set5 = new CustomSet(set1);
    set5.delete(5);
    expect(set1.has(5)).toBe(true);
  });

  test('Iteration with forEach.', () => {
    const values = [];
    const testObj = { someProperty: 'potato' };
    const counter = jest.fn();
    set1.forEach(function testFunc(value, value2, set) {
      counter();
      expect(value).toBe(value2);
      values.push(value);
      expect(this.someProperty).toBe('potato');
      expect(set).toBe(set1);
    }, testObj);
    expect(counter).toHaveBeenCalledTimes(6);
    expect(values).toHaveLength(set1.size);
    expect(values).toEqual(expect.arrayContaining(set1.values()));
  });
});

describe('Hash function tests.', () => {
  let set1 = /** @type {CustomSet<*>} */ (null);

  beforeEach(() => {
    set1 = new CustomSet(null, String);
  });

  test('Basic functionality.', () => {
    set1.add(50);
    expect(set1.has(50)).toBe(true);
    expect(set1.size).toBe(1);
    set1.add(50);
    expect(set1.size).toBe(1);
    set1.add(12).add(54);
    expect(set1.delete(12)).toBe(true);
    expect(set1.size).toBe(2);
    expect(set1.values()).toEqual(expect.arrayContaining([50, 54]));
    const set2 = new CustomSet(set1, String);
    expect(set2.size).toBe(2);
    expect(set1.values()).toEqual(expect.arrayContaining([50, 54]));
  });

  test('Hash collisions.', () => {
    set1.add(50);
    expect(set1.has('50')).toBe(true);
    set1.add(['words', 'on', 'a', 'page']);
    expect(set1.has('words,on,a,page')).toBe(true);
    expect(set1.delete('words,on,a,page')).toBe(true);
    expect(set1.size).toBe(1);
    expect(set1.values().map(String)).toEqual(expect.arrayContaining(['50']));
  });

  test('Hash collisions in new instance.', () => {
    const set2 = new CustomSet([50, '50']);
    expect(set2.size).toBe(2);
    const set3 = new CustomSet(set2, String);
    expect(set3.size).toBe(1);
    expect(set3.has(50)).toBe(true);
    expect(set3.has('50')).toBe(true);
  });
});

describe('Equal function tests', () => {
  const typeEqual = (obj1, obj2) => typeof obj1 === typeof obj2;

  let set1 = /** @type {CustomSet<*>} */ (null);

  beforeEach(() => {
    set1 = new CustomSet(null, String, typeEqual);
  });

  test('Basic functionality.', () => {
    set1.add(50);
    expect(set1.has(50)).toBe(true);
    expect(set1.size).toBe(1);
    set1.add(50);
    expect(set1.size).toBe(1);
    set1.add(12).add(54);
    expect(set1.delete(12)).toBe(true);
    expect(set1.size).toBe(2);
    expect(set1.values()).toEqual(expect.arrayContaining([50, 54]));
    const set2 = new CustomSet(set1, String, typeEqual);
    expect(set2.size).toBe(2);
    expect(set1.values()).toEqual(expect.arrayContaining([50, 54]));
  });

  test('Hash collisions.', () => {
    set1.add(50);
    expect(set1.has('50')).toBe(false);
    set1.add('50');
    expect(set1.size).toBe(2);
    set1.add(['words', 'on', 'a', 'page']);
    expect(set1.has('words,on,a,page')).toBe(false);
    expect(set1.delete('words,on,a,page')).toBe(false);
    expect(set1.size).toBe(3);
    expect(set1.values()).toEqual(expect.arrayContaining([
      50, '50', ['words', 'on', 'a', 'page'],
    ]));
    expect(set1.has(['words', 'on', 'a', 'page'])).toBe(true);
    expect(set1.has(['words,on,a,page'])).toBe(true);
  });

  test('Hash collisions in new instance.', () => {
    const set2 = new CustomSet([50, '50']);
    expect(set2.size).toBe(2);
    const set3 = new CustomSet(set2, String, typeEqual);
    expect(set3.size).toBe(2);
    expect(set3.has(50)).toBe(true);
    expect(set3.has('50')).toBe(true);
  });
});
