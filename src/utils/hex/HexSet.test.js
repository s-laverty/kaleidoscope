import HexSet from './HexSet';
import HexPoint from './HexPoint';

const points = new Map(/** @type {[number, number][]} */([
  [0, -2],
  [1, -2],
  [2, -2],
  [-1, -1],
  [0, -1],
  [1, -1],
  [2, -1],
  [-2, 0],
  [-1, 0],
  [0, 0],
  [1, 0],
  [2, 0],
  [-2, 1],
  [-1, 1],
  [0, 1],
  [1, 1],
  [-2, 2],
  [-1, 2],
  [0, 2],
]).map((point) => [String(point), new HexPoint(...point)]));

let set1 = /** @type {HexSet} */ (null);
let set2 = /** @type {HexSet} */ (null);
let set3 = /** @type {HexSet} */ (null);

beforeEach(() => {
  set1 = new HexSet([
    points.get('0,0'), points.get('-1,-1'), points.get('0,-1'),
    points.get('1,-2'),
  ]);
  set2 = new HexSet([
    points.get('2,0'), points.get('2,-1'), points.get('-1,1'),
    points.get('2,-2'), points.get('-2,2'),
  ]);
  set3 = new HexSet([
    points.get('0,2'), points.get('1,0'), points.get('-1,1'),
  ]);
});

describe('Basic usage tests.', () => {
  test('Adding elements.', () => {
    expect(set1.size).toBe(4);
    expect(set1.keys()).toEqual(expect.arrayContaining([
      points.get('-1,-1'), points.get('1,-2'), points.get('0,0'), points.get('0,-1'),
    ]));
    expect(set1.values()).toEqual(expect.arrayContaining([
      points.get('-1,-1'), points.get('1,-2'), points.get('0,0'), points.get('0,-1'),
    ]));
    expect(set1.entries()).toEqual(expect.arrayContaining([
      [points.get('-1,-1'), points.get('-1,-1')], [points.get('1,-2'), points.get('1,-2')],
      [points.get('0,0'), points.get('0,0')], [points.get('0,-1'), points.get('0,-1')],
    ]));
    expect(set1.has(points.get('2,0'))).toBe(false);
    set1.add(points.get('2,0'));
    expect(set1.has(points.get('2,0'))).toBe(true);
    set1.add(points.get('2,-1'));
    expect(set1.size).toBe(6);
    expect(set1.values()).toEqual(expect.arrayContaining([
      points.get('0,0'), points.get('-1,-1'), points.get('0,-1'),
      points.get('1,-2'), points.get('2,0'), points.get('2,-1'),
    ]));
  });

  test('Re-adding elements.', () => {
    expect(set2.size).toBe(5);
    expect(set2.values()).toEqual(expect.arrayContaining([
      points.get('2,0'), points.get('2,-1'), points.get('-1,1'),
      points.get('2,-2'), points.get('-2,2'),
    ]));
    expect(set2.has(points.get('2,-1'))).toBe(true);
    set2.add(points.get('2,-1'));
    expect(set2.size).toBe(5);
    expect(set2.has(points.get('2,-1'))).toBe(true);
    expect(set2.values()).toEqual(expect.arrayContaining([
      points.get('2,0'), points.get('2,-1'), points.get('-1,1'),
      points.get('2,-2'), points.get('-2,2'),
    ]));
  });

  test('Chaing add calls.', () => {
    set1.add(points.get('-1,-1'))
      .add(points.get('0,0'))
      .add(points.get('-1,2'))
      .add(points.get('-1,-1'));
    expect(set1.size).toBe(5);
    expect(set1.values()).toEqual(expect.arrayContaining([
      points.get('0,0'), points.get('-1,-1'), points.get('0,-1'),
      points.get('1,-2'), points.get('-1,2'),
    ]));
  });

  test('Deleting elements.', () => {
    expect(set3.size).toBe(3);
    expect(set3.has(points.get('0,2'))).toBe(true);
    expect(set3.delete(points.get('0,2'))).toBe(true);
    expect(set3.size).toBe(2);
    expect(set3.has(points.get('0,2'))).toBe(false);
    expect(set3.delete(points.get('0,2'))).toBe(false);
    expect(set3.size).toBe(2);
    expect(set3.has(points.get('0,2'))).toBe(false);
  });

  test('Copying sets.', () => {
    set3.clear();
    expect(set3.size).toBe(0);
    set2.forEach((point) => set3.add(point));
    expect(set3.size).toBe(5);
    expect(set3.entries()).toEqual(expect.arrayContaining(set2.entries()));
    const set4 = new HexSet(set2);
    set2.clear();
    expect(set4.size).toBe(5);
    expect(set2.size).toBe(0);
    expect(set4.entries()).toEqual(expect.arrayContaining(set3.entries()));
    const set5 = new HexSet(set1);
    set5.delete(points.get('0,-1'));
    expect(set1.has(points.get('0,-1'))).toBe(true);
  });

  test('Iteration with forEach.', () => {
    const entries = [];
    const testObj = { someProperty: 'potato' };
    const counter = jest.fn();
    set1.forEach(function testFunc(point1, point2, set) {
      counter();
      entries.push([point1, point2]);
      expect(this.someProperty).toBe('potato');
      expect(set).toBe(set1);
    }, testObj);
    expect(counter).toHaveBeenCalledTimes(4);
    expect(entries).toHaveLength(set1.size);
    expect(entries).toEqual(expect.arrayContaining(set1.entries()));
  });
});

describe('Component tests.', () => {
  test('Breaking apart a component.', () => {
    expect(set1.isConnected()).toBe(true);
    expect(set1.holes()).toHaveLength(0);
    expect(set1.perimeter()).toHaveLength(18);
    const set4 = set1.translate(points.get('0,1'));
    const perimeter = set4.perimeter();
    expect(perimeter).toHaveLength(18);
    const startIndex = perimeter.findIndex(
      ([point, edge]) => point.equals(points.get('0,0')) && edge === 0,
    );
    expect(startIndex).not.toBe(-1);
    expect(perimeter.slice(startIndex).concat(perimeter.slice(0, startIndex))).toEqual([
      [points.get('0,0'), 0], [points.get('0,1'), 5], [points.get('0,1'), 0],
      [points.get('0,1'), 1], [points.get('0,1'), 2], [points.get('0,1'), 3],
      [points.get('0,0'), 2], [points.get('-1,0'), 1], [points.get('-1,0'), 2],
      [points.get('-1,0'), 3], [points.get('-1,0'), 4], [points.get('-1,0'), 5],
      [points.get('0,0'), 4], [points.get('1,-1'), 3], [points.get('1,-1'), 4],
      [points.get('1,-1'), 5], [points.get('1,-1'), 0], [points.get('1,-1'), 1],
    ]);
    set1.delete(points.get('0,-1'));
    expect(() => set1.perimeter()).toThrowError();
    expect(set1.isConnected()).toBe(false);
    expect(set4.isConnected()).toBe(true);
  });

  test('Connecting multiple components.', () => {
    expect(set3.isConnected()).toBe(false);
    expect(() => set3.perimeter()).toThrowError();
    let edges = set3.edges();
    expect(edges).toHaveLength(3);
    expect(edges).toEqual(expect.arrayContaining([
      points.get('0,2'), points.get('1,0'), points.get('-1,1'),
    ]));
    let adjacent = set3.adjacent();
    expect(adjacent).toHaveLength(13);
    expect(adjacent).toContainEqual(points.get('0,1'));
    expect(adjacent).not.toContainEqual([points.get('0,2')]);
    expect(adjacent).not.toContainEqual(points.get('1,0'));
    expect(adjacent).not.toContainEqual(points.get('-1,1'));
    set3.add(points.get('0,1'));
    expect(set3.isConnected()).toBe(true);
    expect(set3.perimeter()).toHaveLength(18);
    edges = set3.edges();
    expect(edges).toHaveLength(4);
    expect(edges).toEqual(expect.arrayContaining([
      points.get('0,2'), points.get('1,0'), points.get('-1,1'), points.get('0,1'),
    ]));
    adjacent = set3.adjacent();
    expect(adjacent).toHaveLength(12);
    expect(adjacent).not.toContainEqual(points.get('0,1'));
  });

  test('Overlapping.', () => {
    expect(set1.overlaps(set2)).toBe(false);
    expect(set2.overlaps(set1)).toBe(false);
    expect(set3.overlaps(set2)).toBe(true);
    expect(set2.overlaps(set3)).toBe(true);
  });

  test('Adjacency', () => {
    expect(set1.adjacentTo(set2)).toBe(true);
    expect(set2.adjacentTo(set1)).toBe(true);
    expect(set3.adjacentTo(set2)).toBe(true);
    expect(set2.adjacentTo(set3)).toBe(true);
    set1.delete(points.get('0,0'));
    expect(set1.adjacentTo(set3)).toBe(false);
    expect(set3.adjacentTo(set1)).toBe(false);
  });

  test('Getting a component (invalid).', () => {
    expect(() => set2.getComponent(points.get('1,-1'))).toThrowError();
    expect(() => set1.getComponent(points.get('-2,0'))).toThrowError();
  });

  test('Getting a component (valid)', () => {
    expect(set2.isConnected()).toBe(false);
    const set4 = set2.getComponent(points.get('-2,2'));
    expect(set4.size).toBe(2);
    expect(set4.isConnected()).toBe(true);
    expect(set4.values()).toEqual(expect.arrayContaining([
      points.get('-1,1'), points.get('-2,2'),
    ]));
    expect(set4.perimeter()).toHaveLength(10);
    const set5 = set2.getComponent(points.get('2,-1'));
    expect(set5.size).toBe(3);
    expect(set5.isConnected()).toBe(true);
    expect(set5.values()).toEqual(expect.arrayContaining([
      points.get('2,0'), points.get('2,-1'), points.get('2,-2'),
    ]));
    expect(set5.perimeter()).toHaveLength(14);
  });

  test('Merging components (invalid).', () => {
    expect(() => set2.merge(set3)).toThrowError();
    expect(() => set3.merge(set2)).toThrowError();
  });

  test('Merging components with holes (valid).', () => {
    const set4 = set3.translate(points.get('0,-1'));

    /** Merge set 2 and set 1, add (1,0) to make a hole. */
    set2.merge(set1).add(points.get('1,0'));
    const holes = set2.holes();
    expect(holes).toHaveLength(1);
    const [hole] = holes;
    expect(hole).toHaveLength(6);
    const startIndex = hole.findIndex(
      ([point, edge]) => point.equals(points.get('0,-1')) && edge === 0,
    );
    expect(startIndex).not.toBe(-1);
    expect(hole.slice(startIndex).concat(hole.slice(0, startIndex))).toEqual([
      [points.get('0,-1'), 0], [points.get('0,0'), 5], [points.get('1,0'), 4],
      [points.get('2,-1'), 3], [points.get('2,-2'), 2], [points.get('1,-2'), 1],
    ]);
    expect(set2.isConnected()).toBe(true);
    expect(set2.edges()).toHaveLength(10);
    expect(set2.adjacent()).toHaveLength(20);
    expect(set2.perimeter()).toHaveLength(32);

    /** Merge set 4 and the previous merge. Should fill in the hole. */
    expect(set4.merge(set2)).toBe(set4);
    expect(set4.isConnected()).toBe(true);
    expect(set4.holes()).toHaveLength(0);
    expect(set4.perimeter()).toHaveLength(30);
    let edges = set4.edges();
    expect(edges).toHaveLength(11);
    expect(edges).not.toContainEqual(points.get('0,0'));
    expect(edges).not.toContainEqual(points.get('1,-1'));

    /** Create a hole, should make (0,0) an interior edge. */
    set4.delete(points.get('1,-1'));
    edges = set4.edges();
    expect(edges).toHaveLength(12);
    expect(edges).toContainEqual(points.get('0,0'));
    expect(set4.adjacent()).toHaveLength(19);

    /** Delete an entry to split the component. */
    set4.delete(points.get('-1,1'));
    expect(set4.isConnected()).toBe(false);
    expect(() => set4.holes()).toThrowError();
    expect(set4.getComponent(points.get('0,0')).holes()).toHaveLength(1);
    expect(set4.getComponent(points.get('-2,2')).holes()).toHaveLength(0);
  });
});
