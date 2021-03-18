import Hexagon from './hexagon';
import { deepEqual } from 'mathjs';

test('Map', () => {
  const map1 = new Hexagon.Map();
  expect(map1.size).toBe(0);
  expect(map1.has([3,51])).toBeFalsy();
  expect(map1.set([3,51],'potato')).toBe(map1);
  expect(map1.has([3,51])).toBeTruthy();
  expect(map1.get([3,51])).toBe('potato');
  expect(map1.has('potato')).toBeFalsy();
  expect(map1.has('3,51')).toBeTruthy();
  expect(map1.get('3,51')).toBe('potato');
  expect(map1.size).toBe(1);
  map1.set([3,51], 'chips');
  expect(map1.has([3,51])).toBeTruthy();
  expect(map1.get([3,51])).toBe('chips');
  expect(map1.size).toBe(1);
  map1.set([0,0], 42);
  map1.set([5,5], null);
  expect(map1.size).toBe(3);
  const entries = [[[3,51], 'chips'], [[0,0], 42], [[5,5], null]];
  const keys = [[3,51],[0,0],[5,5]];
  const values = ['chips',42,null];
  expect(Array.from(map1)).toEqual(entries);
  expect(Array.from(map1.entries())).toEqual(entries);
  expect(Array.from(map1.keys())).toEqual(keys);
  expect(Array.from(map1.values())).toEqual(values);
  expect(map1.delete([0,0])).toBeTruthy();
  expect(map1.has([0,0])).toBeFalsy();
  expect(map1.size).toBe(2);
  expect(map1.delete([0,0])).toBeFalsy();
  entries.splice(1,1);
  expect(Array.from(map1)).toEqual(entries);
  const map2 = new Hexagon.Map(map1)
  expect(Array.from(map2)).toEqual(entries);
  expect(Array.from(new Hexagon.Map(entries))).toEqual(entries);
  map1.clear();
  expect(map1.has([3,51])).toBeFalsy();
  expect(map1.has([5,5])).toBeFalsy();
  expect(map1.size).toBe(0);
  expect(map2.size).toBe(2);
  const counter = jest.fn();
  map2.forEach((value, key) => {
    expect(entries).toContainEqual([key, value]);
    counter();
  });
  expect(counter).toBeCalledTimes(2);
});

test('Set', () => {
  const set1 = new Hexagon.Set();
  expect(set1.size).toBe(0);
  expect(set1.has([3,51])).toBeFalsy();
  expect(set1.add([3,51])).toBe(set1);
  expect(set1.has([3,51])).toBeTruthy();
  expect(set1.has('3,51')).toBeTruthy();
  expect(set1.size).toBe(1);
  set1.add([3,51]);
  expect(set1.has([3,51])).toBeTruthy();
  expect(set1.size).toBe(1);
  set1.add([0,0]);
  set1.add([5,5]);
  expect(set1.size).toBe(3);
  const values = [[3,51], [0,0], [5,5]];
  const entries = [[[3,51], [3,51]], [[0,0], [0,0]], [[5,5], [5,5]]];
  expect(Array.from(set1)).toEqual(values);
  expect(Array.from(set1.entries())).toEqual(entries);
  expect(Array.from(set1.keys())).toEqual(values);
  expect(Array.from(set1.values())).toEqual(values);
  expect(set1.delete([0,0])).toBeTruthy();
  expect(set1.has([0,0])).toBeFalsy();
  expect(set1.size).toBe(2);
  expect(set1.delete([0,0])).toBeFalsy();
  values.splice(1,1);
  expect(Array.from(set1)).toEqual(values);
  const set2 = new Hexagon.Set(set1)
  expect(Array.from(set2)).toEqual(values);
  expect(Array.from(new Hexagon.Set(values))).toEqual(values);
  set1.clear();
  expect(set1.has([3,51])).toBeFalsy();
  expect(set1.has([5,5])).toBeFalsy();
  expect(set1.size).toBe(0);
  expect(set2.size).toBe(2);
  const counter = jest.fn();
  set2.forEach(value => {
    expect(values).toContainEqual(value);
    counter();
  });
  expect(counter).toBeCalledTimes(2);
});

test('add', () => {
  const p1 = [5,2];
  const p2 = [-3,5];
  expect(Hexagon.add(p1,p2)).toEqual([2,7]);
});

test('subtract', () => {
  const p1 = [5,2];
  const p2 = [-3,5];
  expect(Hexagon.subtract(p1,p2)).toEqual([8,-3]);
});

test('step', () => {
  const p1 = [2,5];
  expect(Hexagon.step(p1,0)).toEqual([3,5]);
  expect(Hexagon.step(p1,1)).toEqual([2,6]);
  expect(Hexagon.step(p1,2)).toEqual([1,6]);
  expect(Hexagon.step(p1,3)).toEqual([1,5]);
  expect(Hexagon.step(p1,4)).toEqual([2,4]);
  expect(Hexagon.step(p1,5)).toEqual([3,4]);
});

test('forEachAdjacent', () => {
  const p1 = [-3,9];
  let directions = 0;
  const counter = jest.fn();
  Hexagon.forEachAdjacent(p1, (point, i) => {
    expect(directions & (1<<i)).toBeFalsy();
    expect(point).toEqual(Hexagon.step(p1, i));
    counter();
    directions |= (1<<i);
  });
  expect(directions).toBe(0b111111);
  expect(counter).toBeCalledTimes(6);
});

test('someAdjacent', () => {
  const p1 = [3,59];
  expect(Hexagon.someAdjacent(p1, (_point, i) => i === 6)).toBeFalsy();
  expect(Hexagon.someAdjacent(p1, (_point, i) => i === 3)).toBeTruthy();
  expect(Hexagon.someAdjacent(p1, point =>
    deepEqual(point, p1)
  )).toBeFalsy();
  expect(Hexagon.someAdjacent(p1, point =>
    deepEqual(point, [4,58])
  )).toBeTruthy();
  expect(Hexagon.someAdjacent(p1, () =>
    true
  )).toBeTruthy();
});

test('everyAdjacent', () => {
  const p1 = [9,-27];
  expect(Hexagon.everyAdjacent(p1, (_point, i) => i < 6)).toBeTruthy();
  expect(Hexagon.everyAdjacent(p1, (_point, i) => i === 3)).toBeFalsy();
  expect(Hexagon.someAdjacent(p1, point =>
    !deepEqual(point, p1)
  )).toBeTruthy();
  expect(Hexagon.someAdjacent(p1, point =>
    deepEqual(point, [4,58])
  )).toBeFalsy();
  expect(Hexagon.everyAdjacent(p1, () =>
    true
  )).toBeTruthy();
});

test('isAdjacent', () => {
  const p1 = [9,-27];
  const testpoints = [
    [10,-27],
    [9,-26],
    [8,-26],
    [8,-27],
    [9,-28],
    [10,-28]
  ];
  testpoints.forEach(point => {
    expect(Hexagon.isAdjacent(point, p1)).toBeTruthy();
    expect(Hexagon.isAdjacent(p1, point)).toBeTruthy();
  });
  const p2 = [11,-27];
  expect(Hexagon.isAdjacent(p1,p2)).toBeFalsy();
  expect(Hexagon.isAdjacent(p2,p1)).toBeFalsy();
});

test('translate', () => {
  const tile1 = new Hexagon.Map([
    [[0,0], 'apple'],
    [[0,1], 'banana'],
    [[3,2], 'orange']
  ]);
  const tile1_translated = new Hexagon.Map([
    [[3,-2], 'apple'],
    [[3,-1], 'banana'],
    [[6,4], 'orange']
  ]);
  expect(Hexagon.translate(tile1, [0,0])).toEqual(tile1);
  expect(Hexagon.translate(tile1, [0,0])).not.toBe(tile1);
  expect(Hexagon.translate(tile1, [3,2])).toEqual(tile1_translated);
});
