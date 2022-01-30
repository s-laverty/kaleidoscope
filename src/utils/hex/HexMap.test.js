import HexMap from './HexMap';
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

let map1 = /** @type {HexMap<number>} */ (null);
let map2 = /** @type {HexMap<string>} */ (null);
let map3 = /** @type {HexMap<*>} */ (null);

beforeEach(() => {
  map1 = new HexMap([
    [points.get('0,0'), 1], [points.get('-1,-1'), 3], [points.get('0,-1'), 4],
    [points.get('1,-2'), 2],
  ]);
  map2 = new HexMap([
    [points.get('2,0'), 'green'], [points.get('2,-1'), 'green'], [points.get('-1,1'), 'yellow'],
    [points.get('2,-2'), 'green'], [points.get('-2,2'), 'yellow'],
  ]);
  map3 = new HexMap([
    [points.get('0,2'), 'false'], [points.get('1,0'), 1], [points.get('-1,1'), null],
  ]);
});

describe('Basic usage tests.', () => {
  test('Setting elements.', () => {
    expect(map1.size).toBe(4);
    expect(map1.keys()).toEqual(expect.arrayContaining([
      points.get('-1,-1'), points.get('1,-2'), points.get('0,0'), points.get('0,-1'),
    ]));
    expect(map1.values()).toEqual(expect.arrayContaining([3, 1, 4, 2]));
    expect(map1.entries()).toEqual(expect.arrayContaining([
      [points.get('0,0'), 1], [points.get('-1,-1'), 3], [points.get('0,-1'), 4],
      [points.get('1,-2'), 2],
    ]));
    expect(map1.has(points.get('2,0'))).toBe(false);
    expect(map1.get(points.get('2,0'))).toBeUndefined();
    map1.set(points.get('2,0'), -3);
    expect(map1.get(points.get('2,0'))).toBe(-3);
    expect(map1.has(points.get('2,0'))).toBe(true);
    map1.set(points.get('2,-1'), 0);
    expect(map1.size).toBe(6);
    expect(map1.entries()).toEqual(expect.arrayContaining([
      [points.get('0,0'), 1], [points.get('-1,-1'), 3], [points.get('0,-1'), 4],
      [points.get('1,-2'), 2], [points.get('2,0'), -3], [points.get('2,-1'), 0],
    ]));
  });

  test('Re-setting elements.', () => {
    expect(map2.size).toBe(5);
    expect(map2.entries()).toEqual(expect.arrayContaining([
      [points.get('2,0'), 'green'], [points.get('2,-1'), 'green'], [points.get('-1,1'), 'yellow'],
      [points.get('2,-2'), 'green'], [points.get('-2,2'), 'yellow'],
    ]));
    expect(map2.has(points.get('2,-1', 'green'))).toBe(true);
    expect(map2.get(points.get('2,-1', 'green'))).toBe('green');
    map2.set(points.get('2,-1', 'green'), 'orange');
    expect(map2.get(points.get('2,-1', 'green'))).toBe('orange');
    expect(map2.size).toBe(5);
    expect(map2.has(points.get('2,-1'))).toBe(true);
    expect(map2.entries()).toEqual(expect.arrayContaining([
      [points.get('2,0'), 'green'], [points.get('2,-1'), 'orange'], [points.get('-1,1'), 'yellow'],
      [points.get('2,-2'), 'green'], [points.get('-2,2'), 'yellow'],
    ]));
  });

  test('Chaing set calls.', () => {
    map1.set(points.get('-1,-1'), 4)
      .set(points.get('0,0'), -1)
      .set(points.get('-1,2'), 8)
      .set(points.get('-1,-1'), 0);
    expect(map1.size).toBe(5);
    expect(map1.entries()).toEqual(expect.arrayContaining([
      [points.get('0,0'), -1], [points.get('-1,-1'), 0], [points.get('0,-1'), 4],
      [points.get('1,-2'), 2], [points.get('-1,2'), 8],
    ]));
  });

  test('Deleting elements.', () => {
    expect(map3.size).toBe(3);
    expect(map3.has(points.get('0,2'))).toBe(true);
    expect(map3.get(points.get('0,2'))).toBe('false');
    expect(map3.delete(points.get('0,2'))).toBe(true);
    expect(map3.size).toBe(2);
    expect(map3.has(points.get('0,2'))).toBe(false);
    expect(map3.get(points.get('0,2'))).toBeUndefined();
    expect(map3.delete(points.get('0,2'))).toBe(false);
    expect(map3.size).toBe(2);
    expect(map3.has(points.get('0,2'))).toBe(false);
  });

  test('Copying maps.', () => {
    map3.clear();
    expect(map3.size).toBe(0);
    map2.forEach((value, point) => map3.set(point, value));
    expect(map3.size).toBe(5);
    expect(map3.entries()).toEqual(expect.arrayContaining(map2.entries()));
    const map4 = new HexMap(map2);
    map2.clear();
    expect(map4.size).toBe(5);
    expect(map2.size).toBe(0);
    expect(map4.entries()).toEqual(expect.arrayContaining(map3.entries()));
    const map5 = new HexMap(map1);
    map5.delete(points.get('0,-1'));
    expect(map1.has(points.get('0,-1'))).toBe(true);
    expect(map1.get(points.get('0,-1'))).toBe(4);
    map5.set(points.get('1,-2'), 6);
    expect(map1.get(points.get('1,-2'))).toBe(2);
  });

  test('Iteration with forEach.', () => {
    const entries = [];
    const testObj = { someProperty: 'potato' };
    const counter = jest.fn();
    map1.forEach(function testFunc(value, point, map) {
      counter();
      entries.push([point, value]);
      expect(this.someProperty).toBe('potato');
      expect(map).toBe(map1);
    }, testObj);
    expect(counter).toHaveBeenCalledTimes(4);
    expect(entries).toHaveLength(map1.size);
    expect(entries).toEqual(expect.arrayContaining(map1.entries()));
  });
});

describe('Component tests.', () => {
  test('Breaking apart a component.', () => {
    expect(map1.isConnected()).toBe(true);
    expect(map1.holes()).toHaveLength(0);
    expect(map1.perimeter()).toHaveLength(18);
    const map4 = map1.translate(points.get('0,1'));
    const perimeter = map4.perimeter();
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
    map1.delete(points.get('0,-1'));
    expect(() => map1.perimeter()).toThrowError();
    expect(map1.isConnected()).toBe(false);
    expect(map4.isConnected()).toBe(true);
  });

  test('Connecting multiple components.', () => {
    expect(map3.isConnected()).toBe(false);
    expect(() => map3.perimeter()).toThrowError();
    let edges = map3.edges();
    expect(edges).toHaveLength(3);
    expect(edges).toEqual(expect.arrayContaining([
      points.get('0,2'), points.get('1,0'), points.get('-1,1'),
    ]));
    let adjacent = map3.adjacent();
    expect(adjacent).toHaveLength(13);
    expect(adjacent).toContainEqual(points.get('0,1'));
    expect(adjacent).not.toContainEqual([points.get('0,2')]);
    expect(adjacent).not.toContainEqual(points.get('1,0'));
    expect(adjacent).not.toContainEqual(points.get('-1,1'));
    map3.set(points.get('0,1'), 'connection');
    expect(map3.isConnected()).toBe(true);
    expect(map3.perimeter()).toHaveLength(18);
    edges = map3.edges();
    expect(edges).toHaveLength(4);
    expect(edges).toEqual(expect.arrayContaining([
      points.get('0,2'), points.get('1,0'), points.get('-1,1'), points.get('0,1'),
    ]));
    adjacent = map3.adjacent();
    expect(adjacent).toHaveLength(12);
    expect(adjacent).not.toContainEqual(points.get('0,1'));
  });

  test('Overlapping.', () => {
    expect(map1.overlaps(map2)).toBe(false);
    expect(map2.overlaps(map1)).toBe(false);
    expect(map3.overlaps(map2)).toBe(true);
    expect(map2.overlaps(map3)).toBe(true);
  });

  test('Adjacency', () => {
    expect(map1.adjacentTo(map2)).toBe(true);
    expect(map2.adjacentTo(map1)).toBe(true);
    expect(map3.adjacentTo(map2)).toBe(true);
    expect(map2.adjacentTo(map3)).toBe(true);
    map1.delete(points.get('0,0'));
    expect(map1.adjacentTo(map3)).toBe(false);
    expect(map3.adjacentTo(map1)).toBe(false);
  });

  test('Getting a component (invalid).', () => {
    expect(() => map2.getComponent(points.get('1,-1'))).toThrowError();
    expect(() => map1.getComponent(points.get('-2,0'))).toThrowError();
  });

  test('Getting a component (valid)', () => {
    expect(map2.isConnected()).toBe(false);
    const map4 = map2.getComponent(points.get('-2,2'));
    expect(map4.size).toBe(2);
    expect(map4.isConnected()).toBe(true);
    expect(map4.entries()).toEqual(expect.arrayContaining([
      [points.get('-1,1'), 'yellow'], [points.get('-2,2'), 'yellow'],
    ]));
    expect(map4.perimeter()).toHaveLength(10);
    const map5 = map2.getComponent(points.get('2,-1'));
    expect(map5.size).toBe(3);
    expect(map5.isConnected()).toBe(true);
    expect(map5.entries()).toEqual(expect.arrayContaining([
      [points.get('2,0'), 'green'], [points.get('2,-1'), 'green'], [points.get('2,-2'), 'green'],
    ]));
    expect(map5.perimeter()).toHaveLength(14);
  });

  test('Merging components (invalid).', () => {
    expect(() => map2.merge(map3)).toThrowError();
    expect(() => map3.merge(map2)).toThrowError();
  });

  test('Merging components with holes (valid).', () => {
    const map4 = map3.translate(points.get('0,-1'));

    // Merge map 2 and map 1, add (1,0) to make a hole.
    map2.merge(map1).set(points.get('1,0'), 'Creates a loop.');
    const holes = map2.holes();
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
    expect(map2.isConnected()).toBe(true);
    expect(map2.edges()).toHaveLength(10);
    expect(map2.adjacent()).toHaveLength(20);
    expect(map2.perimeter()).toHaveLength(32);

    // Merge map 4 and the previous merge. Should fill in the hole.
    expect(map4.merge(map2)).toBe(map4);
    expect(map4.isConnected()).toBe(true);
    expect(map4.holes()).toHaveLength(0);
    expect(map4.perimeter()).toHaveLength(30);
    let edges = map4.edges();
    expect(edges).toHaveLength(11);
    expect(edges).not.toContainEqual(points.get('0,0'));
    expect(edges).not.toContainEqual(points.get('1,-1'));

    // Create a hole, should make (0,0) an interior edge.
    map4.delete(points.get('1,-1'));
    edges = map4.edges();
    expect(edges).toHaveLength(12);
    expect(edges).toContainEqual(points.get('0,0'));
    expect(map4.adjacent()).toHaveLength(19);

    // Delete an entry to split the component.
    map4.delete(points.get('-1,1'));
    expect(map4.isConnected()).toBe(false);
    expect(() => map4.holes()).toThrowError();
    expect(map4.getComponent(points.get('0,0')).holes()).toHaveLength(1);
    expect(map4.getComponent(points.get('-2,2')).holes()).toHaveLength(0);
  });
});
