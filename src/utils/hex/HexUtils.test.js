import { HexComponent, HexMap, HexPoint } from './hex/HexUtils';
import { PointSet } from './Point';

describe('HexPoint tests', () => {
  test('step tests', () => {
    const p1 = new HexPoint(29, -92);
    [...Array(6).keys()].forEach((i) => (
      expect([...p1.step(i)]).toEqual([...p1.add(HexPoint.Steps[i])])
    ));
  });
  test('adjacent tests', () => {
    const p1 = new HexPoint(29, -92);
    expect(p1.adjacent).toEqual([...Array(6).keys()].map(i => p1.step(i)));
  });
  test('isAdjacent tests', () => {
    const p1 = new HexPoint(29, -92);
    const p2 = new HexPoint(28, -91);
    const p3 = new HexPoint(0, 52);
    expect(p1.adjacentTo(p2)).toBe(true);
    expect(p2.adjacentTo(p1)).toBe(true);
    expect(p2.adjacentTo(p2)).toBe(false);
    expect(p3.adjacentTo(p1)).toBe(false);
  });
});

describe('HexComponent tests', () => {
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
  ]).map(point => [String(point), new HexPoint(...point)]));
  let comp1 = /** @type {HexComponent} */ (null);
  let comp2 = /** @type {HexComponent} */ (null);
  let comp3 = /** @type {HexComponent} */ (null);
  beforeEach(() => {
    comp1 = new HexComponent(points.get('0,0'));
    comp2 = new HexComponent(points.get('2,0'));
    comp3 = new HexComponent(points.get('0,2'));
  });
  test('Add tests', () => {
    // Try adding non-adjacent points.
    expect(() => comp1.add(points.get('0,0'))).toThrowError();
    expect(() => comp2.add(points.get('-1,0'))).toThrowError();
    // Add an adjacent point.
    expect(comp3.add(points.get('-1,2'))).toBe(comp3);
    expect(comp3.has(points.get('0,2'))).toBe(true);
    expect(comp3.has(points.get('-1,2'))).toBe(true);
    expect(comp3.has(points.get('-2,1'))).toBe(false);
  });
  test('Delete tests', () => {
    comp1.add(points.get('1,0'))
      .add(points.get('2,0'))
      .add(points.get('-1,0'))
      .add(points.get('-1,1'));
    // Delete a point that won't cause a split.
    expect(comp1.delete(points.get('2,0'))).toEqual([]);
    expect(comp1.has(points.get('2,0'))).toBe(false);
    // Try deleting a non-included point or the only point in a component.
    expect(() => comp1.delete(points.get('2,0'))).toThrowError();
    expect(() => comp3.delete(points.get('0,2'))).toThrowError();
    // Delete a point that will cause a split.
    let result = comp1.delete(points.get('0,0'));
    expect(result).toHaveLength(1);
    expect([comp1.size, result[0].size].sort()).toEqual([1, 2]);
    let [right, left] = [comp1, result[0]].sort((a, b) => a.size - b.size);
    expect(left.has(points.get('-1,0'))).toBe(true);
    expect(left.has(points.get('-1,1'))).toBe(true);
    expect(left.has(points.get('0,0'))).toBe(false);
    expect(right.has(points.get('1,0'))).toBe(true);
    expect(right.has(points.get('0,0'))).toBe(false);
    // Delete points that would cause a split if it weren't for other connections.
    const comp4 = new HexComponent(points.get('0,-2'))
      .add(points.get('1,-2'))
      .add(points.get('1,-1'))
      .add(points.get('0,0'))
      .add(points.get('-1,0'))
      .add(points.get('-1,-1'))
      .add(points.get('0,1'))
      .add(points.get('1,0'));
    expect(comp4.delete(points.get('0,0'))).toHaveLength(0);
    const comp5 = new HexComponent(points.get('0,-2'))
      .add(points.get('1,-2'))
      .add(points.get('1,-1'))
      .add(points.get('0,0'))
      .add(points.get('-1,0'))
      .add(points.get('-1,-1'))
      .add(points.get('0,1'))
      .add(points.get('1,1'))
      .add(points.get('2,0'))
      .add(points.get('2,-1'));
    expect(comp5.delete(points.get('0,0'))).toHaveLength(0);
    // Delete point that will cause a three-way split.
    const comp6 = new HexComponent(points.get('1,-2'))
      .add(points.get('1,-1'))
      .add(points.get('0,0'))
      .add(points.get('-1,0'))
      .add(points.get('-1,-1'))
      .add(points.get('0,1'))
      .add(points.get('-1,2'))
      .add(points.get('-2,2'))
      .add(points.get('-2,1'))
      .add(points.get('2,-1'))
      .add(points.get('2,0'));
    result = comp6.delete(points.get('1,-1'));
    expect(result).toHaveLength(2);
    expect([comp6.size, ...result.map(comp => comp.size)].sort()).toEqual([1, 2, 7]);
  });
  test('iteration tests', () => {
    comp1.add(points.get('1,0'));
    comp1.add(points.get('1,1'));
    // Test spread (Symbol.iterator method).
    let comp1Points = [...comp1];
    expect(comp1Points).toContainEqual([0,0]);
    expect(comp1Points).toContainEqual([1,0]);
    expect(comp1Points).toContainEqual([1,1]);
    // Test forEach.
    let thisObj = {
      hello: 'world'
    };
    const counter = jest.fn();
    comp1.forEach(function (point, point2, theSet) {
      counter();
      expect(point).toBe(point2);
      expect(theSet).toBeInstanceOf(PointSet);
      expect(/** @type {typeof thisObj} */ (this).hello).toBe('world');
      expect(comp1Points).toContainEqual(point);
    }, thisObj);
    expect(counter).toHaveBeenCalledTimes(3);
  });
  test('merge test', () => {
    comp1.add(points.get('1,0'));
    comp3.add(points.get('1,1'));
    comp3.add(points.get('1,0'));
    // Attempt invalid merges.
    expect(() => comp1.merge(comp2, points.get('0,0'), points.get('2,0'))).toThrowError();
    expect(() => comp1.merge(comp2, points.get('3,0'), points.get('2,0'))).toThrowError();
    expect(() => comp1.merge(comp2, points.get('0,0'), points.get('-1,0'))).toThrowError();
    expect(() => comp1.merge(comp3, points.get('0,0'), points.get('1,0'))).toThrowError();
    // Verify merge is working correctly.
    comp2.merge(comp1, points.get('2,0'), points.get('1,0'));
    expect(comp2.size).toBe(3);
    expect(comp2.has(points.get('0,0'))).toBe(true);
    expect(comp2.has(points.get('1,0'))).toBe(true);
    expect(comp1.size).toBe(2);
    expect(comp1.has(points.get('2,0'))).toBe(false);
    comp2.delete(points.get('0,0'));
    comp2.delete(points.get('1,0'));
    comp1.merge(comp2, points.get('1,0'), points.get('2,0'));
    expect(comp1.size).toBe(3);
    expect(comp1.has(points.get('2,0'))).toBe(true);
  });
  test('borders test', () => {
    // Test basic perimeter.
    let borders = [...comp1.borders()].map(border => [...border]);
    expect(borders).toHaveLength(1);
    let perimeter = [...comp1.perimeter()];
    expect(borders[0]).toEqual(perimeter);
    expect(perimeter).toHaveLength(6);
    expect(perimeter).toEqual(expect.arrayContaining([
      [points.get('1,0'), 0b001000],
      [points.get('0,1'), 0b010000],
      [points.get('-1,1'), 0b100000],
      [points.get('-1,0'), 0b000001],
      [points.get('0,-1'), 0b000010],
      [points.get('1,-1'), 0b000100]
    ]));
    // Test perimeter after add and delete operations.
    comp2.add(points.get('1,0'))
      .add(points.get('0,1'))
      .add(points.get('0,0'))
      .add(points.get('-1,0'));
    comp2.delete(points.get('2,0'));
    borders = [...comp2.borders()];
    expect(borders).toHaveLength(1);
    perimeter = [...comp2.perimeter()];
    expect([...borders[0]]).toEqual(perimeter);
    expect(perimeter).toHaveLength(11);
    expect(perimeter).toEqual(expect.arrayContaining([
      [points.get('-1,-1'), 0b000010],
      [points.get('0,-1'), 0b000110],
      [points.get('1,-1'), 0b000110],
      [points.get('2,-1'), 0b000100],
      [points.get('2,0'), 0b001000],
      [points.get('1,1'), 0b011000],
      [points.get('0,2'), 0b010000],
      [points.get('-1,2'), 0b100000],
      [points.get('-1,1'), 0b110001],
      [points.get('-2,1'), 0b100000],
      [points.get('-2,0'), 0b000001],
    ]));
    // Expect that the perimeter will not contain a hole.
    comp1.add(points.get('0,-1'))
      .add(points.get('1,-2'))
      .add(points.get('2,-2'))
      .add(points.get('2,-1'))
      .add(points.get('1,0'));
    expect([...comp1.borders()]).toHaveLength(2);
    expect([...comp1.perimeter()]).not.toEqual(expect.arrayContaining([
      [points.get('1,-1'), 0b111111]
    ]));
    let holes = [...comp1.holes()].map(hole => [...hole]);
    expect(holes).toHaveLength(1);
    expect(holes[0]).toEqual(expect.arrayContaining([
      [points.get('1,-1'), 0b111111]
    ]));
    // Try a split that will merge two holes.
    comp1.add(points.get('0,1'))
      .add(points.get('-1,2'))
      .add(points.get('-2,2'))
      .add(points.get('-2,1'))
      .add(points.get('-1,0'))
      .add(points.get('-1,-1'))
      .add(points.get('0,-2'));
    comp1.delete(points.get('0,-1'));
    borders = [...comp1.borders()].map(border => [...border]).sort((a, b) => a.length - b.length);
    expect(borders).toHaveLength(3);
    holes = [...comp1.holes()].map(hole => [...hole]).sort((a, b) => a.length - b.length);
    expect(holes).toHaveLength(2);
    expect(borders.slice(0, 2)).toEqual(holes);
    perimeter = [...comp1.perimeter()];
    expect(borders[2]).toEqual(perimeter);
    expect(perimeter).not.toContainEqual(points.get('-1,1'));
    expect(perimeter).not.toContainEqual(points.get('1,-1'));
    comp1.delete(points.get('0,0'));
    borders = [...comp1.borders()].map(border => [...border]).sort((a, b) => a.length - b.length);
    expect(borders).toHaveLength(2);
    expect(borders[0]).toHaveLength(4);
    expect(borders[0]).toContainEqual(
      [points.get('0,0'), 0b001011]
    );
    perimeter = [...comp1.perimeter()];
    expect(perimeter).not.toContainEqual(
      [points.get('0,0'), 0b001011]
    );
    // Try a split that will merge a hole and the perimeter.
    comp1.delete(points.get('-1,0'));
    expect([...comp1.holes()]).toHaveLength(0);
    expect([...comp1.perimeter()]).toHaveLength(22);
    // try a split that will break a component apart.
    let comp5 = new HexComponent(comp1)
      .add(points.get('-1,0'))
      .add(points.get('0,0'))
      .add(points.get('1,-1'));
    comp5.delete(points.get('-1,-1'));
    comp5.delete(points.get('1,0'));
    comp5.delete(points.get('2,-2'));
    let [right, top, bottom] = [comp5, ...comp5.delete(points.get('1,-1'))].sort(
      (a, b) => a.size - b.size
    );
    expect([...right.holes()]).toHaveLength(0);
    expect([...right.perimeter()]).toHaveLength(6);
    expect([...top.holes()]).toHaveLength(0);
    expect([...top.perimeter()]).toHaveLength(8);
    expect([...bottom.holes()]).toHaveLength(1);
    expect([...bottom.perimeter()]).toHaveLength(12);
    // Try a merge that is adjacent to the target component.
    comp1.add(points.get('-2,0'));
    comp3.merge(comp1, points.get('0,2'), points.get('0,1'));
    expect([...comp3.holes()]).toHaveLength(1);
    // Try a merge that surrounds the target component.
    let comp6 = new HexComponent(points.get('0,0'));
    comp6.merge(comp1, points.get('0,0'), points.get('1,0'));
    holes = [...comp6.holes()].map(hole => [...hole]);
    expect(holes).toHaveLength(1);
    expect(holes[0]).toHaveLength(4);
    expect(holes[0]).toContainEqual(
      [points.get('-1,0'), 0b011101]
    );
    // Try a merge that creates multiple holes.
    comp1.delete(points.get('1,0'));
    comp1.delete(points.get('0,1'));
    comp1.add(points.get('2,0'))
      .add(points.get('1,1'))
      .add(points.get('0,2'));
    let comp7 = new HexComponent(points.get('0,0'))
      .add(points.get('1,-1'))
      .add(points.get('0,1'))
      .add(points.get('-1,0'));
    comp7.merge(comp1, points.get('1,-1'), points.get('2,-2'));
    holes = [...comp7.holes()].map(hole => [...hole]);
    expect(holes).toHaveLength(3);
    expect(holes).toEqual(expect.arrayContaining([
      [[points.get('1,0'), 0b111111]],
      [[points.get('-1,1'), 0b111111]],
      [[points.get('0,-1'), 0b111111]]
    ]));
    perimeter = [...comp7.perimeter()];
    expect(perimeter).toHaveLength(18);
    expect().not.toEqual(expect.arrayContaining([
      [points.get('1,0'), 0b111111],
      [points.get('-1,1'), 0b111111],
      [points.get('0,-1'), 0b111111]
    ]))
  });
});

describe('HexMap tests', () => {
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
  ]).map(point => [String(point), new HexPoint(...point)]));
  let map1 = /** @type {HexMap<*>} */ (null);
  let map2 = /** @type {HexMap<*>} */ (null);
  let map3 = /** @type {HexMap<*>} */ (null);
  beforeEach(() => {
    map1 = new HexMap();
    map2 = new HexMap();
    map3 = new HexMap();
  });
  test('component tests', () => {
    map1.set(points.get('2,0', 'a value')).set(points.get('0,0'), null);
    expect(map1.isConnected()).toBe(false);
  });
});
