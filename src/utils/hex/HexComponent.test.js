import HexComponent from './HexComponent';
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

let comp1 = /** @type {HexComponent} */ (null);
let comp2 = /** @type {HexComponent} */ (null);
let comp3 = /** @type {HexComponent} */ (null);

beforeEach(() => {
  comp1 = new HexComponent(points.get('0,0'));
  comp2 = new HexComponent(points.get('2,0'));
  comp3 = new HexComponent(points.get('0,2'));
});

describe('Add tests.', () => {
  test('Adjacent (valid) point.', () => {
    expect(comp3.add(points.get('-1,2'))).toBe(comp3);
    expect(comp3.has(points.get('0,2'))).toBe(true);
    expect(comp3.has(points.get('-1,2'))).toBe(true);
    expect(comp3.has(points.get('-2,1'))).toBe(false);
  });

  test('Non-adjacent (invalid) points.', () => {
    expect(() => comp1.add(points.get('0,0'))).toThrowError();
    expect(() => comp2.add(points.get('-1,0'))).toThrowError();
  });
});

describe('Delete tests.', () => {
  beforeEach(() => {
    comp1.add(points.get('1,0'))
      .add(points.get('-1,0'))
      .add(points.get('-1,1'));
  });

  test('Invalid.', () => {
    expect(() => comp1.delete(points.get('2,0'))).toThrowError();
    expect(() => comp3.delete(points.get('0,2'))).toThrowError();
  });

  test('Valid edge (no split).', () => {
    /** Delete a point that won't cause a split. */
    expect(comp1.delete(points.get('-1,1'))).toEqual([]);
    expect(comp1.has(points.get('-1,1'))).toBe(false);
  });

  test('Valid bridge (causes split).', () => {
    const result = comp1.delete(points.get('0,0'));
    expect(result).toHaveLength(1);
    const [right, left] = [comp1, result[0]].sort((a, b) => a.size - b.size);
    expect(right.size).toBe(1);
    expect(left.size).toBe(2);
    expect(left.has(points.get('-1,0'))).toBe(true);
    expect(left.has(points.get('-1,1'))).toBe(true);
    expect(left.has(points.get('0,0'))).toBe(false);
    expect(right.has(points.get('1,0'))).toBe(true);
    expect(right.has(points.get('0,0'))).toBe(false);
  });

  test('Valid breaking loop (no split).', () => {
    const comp4 = new HexComponent(points.get('0,-2'))
      .add(points.get('1,-2'))
      .add(points.get('1,-1'))
      .add(points.get('0,0'))
      .add(points.get('-1,0'))
      .add(points.get('-1,-1'))
      .add(points.get('0,1'))
      .add(points.get('1,0'));
    expect(comp4.delete(points.get('0,0'))).toHaveLength(0);
  });

  test('Valid breaking double loop (no split).', () => {
    const comp4 = new HexComponent(points.get('0,-2'))
      .add(points.get('1,-2'))
      .add(points.get('1,-1'))
      .add(points.get('0,0'))
      .add(points.get('-1,0'))
      .add(points.get('-1,-1'))
      .add(points.get('0,1'))
      .add(points.get('1,1'))
      .add(points.get('2,0'))
      .add(points.get('2,-1'))
      .add(points.get('-1,1'));
    expect(comp4.delete(points.get('0,0'))).toHaveLength(0);
  });

  test('Valid bridge (3-way split)', () => {
    const comp4 = new HexComponent(points.get('1,-2'))
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
    const result = comp4.delete(points.get('1,-1'));
    expect(result).toHaveLength(2);
    const sorted = [comp4, ...result].sort((a, b) => a.size - b.size);
    expect(sorted.map((comp) => comp.size)).toEqual([1, 2, 7]);
    expect(sorted[1].has(points.get('2,0'))).toBe(true);
  });
});

test('Iteration with forEach.', () => {
  comp1.add(points.get('1,0'));
  comp1.add(points.get('1,1'));
  const comp1Points = [];
  const thisObj = { hello: 'world' };
  const counter = jest.fn();
  comp1.forEach(function testFunc(point, point2, component) {
    counter();
    expect(point).toBe(point2);
    comp1Points.push(point);
    expect(this.hello).toBe('world');
    expect(component).toBe(comp1);
  }, thisObj);
  expect(counter).toHaveBeenCalledTimes(3);
  expect(comp1Points).toHaveLength(comp1.size);
  expect(comp1Points).toEqual(expect.arrayContaining([
    [0, 0], [1, 0], [1, 1],
  ]));
});

test('Overlap tests.', () => {
  comp1.add(points.get('1,0'));
  comp3.add(points.get('1,1'));
  comp3.add(points.get('1,0'));
  expect(comp1.overlaps(comp3)).toBe(true);
  expect(comp3.overlaps(comp1)).toBe(true);
  expect(comp2.overlaps(comp1)).toBe(false);
  expect(comp1.overlaps(comp2)).toBe(false);
});

describe('Merge tests.', () => {
  beforeEach(() => {
    comp1.add(points.get('1,0'));
    comp3.add(points.get('1,1'));
    comp3.add(points.get('1,0'));
  });

  test('Invalid merges.', () => {
    expect(() => comp1.merge(comp2, points.get('0,0'), points.get('2,0'))).toThrowError();
    expect(() => comp1.merge(comp2, points.get('3,0'), points.get('2,0'))).toThrowError();
    expect(() => comp1.merge(comp2, points.get('0,0'), points.get('-1,0'))).toThrowError();
    expect(() => comp1.merge(comp3, points.get('0,0'), points.get('1,0'))).toThrowError();
  });

  test('Valid merge.', () => {
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
});

describe('Border tests.', () => {
  test('Basic perimeter.', () => {
    const borders = comp1.borders();
    expect(borders).toHaveLength(1);
    const perimeter = comp1.perimeter();
    expect(borders[0]).toEqual(perimeter);
    expect(perimeter).toHaveLength(6);
    expect(perimeter).toEqual(expect.arrayContaining([
      [points.get('1,0'), 0b001000],
      [points.get('0,1'), 0b010000],
      [points.get('-1,1'), 0b100000],
      [points.get('-1,0'), 0b000001],
      [points.get('0,-1'), 0b000010],
      [points.get('1,-1'), 0b000100],
    ]));
  });

  test('Perimeter after add and delete operations.', () => {
    comp2.add(points.get('1,0'))
      .add(points.get('0,1'))
      .add(points.get('0,0'))
      .add(points.get('-1,0'));
    comp2.delete(points.get('2,0'));
    const borders = comp2.borders();
    expect(borders).toHaveLength(1);
    const perimeter = comp2.perimeter();
    expect(borders[0]).toEqual(perimeter);
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
  });

  test('Perimeter with hole.', () => {
    comp1.add(points.get('0,-1'))
      .add(points.get('1,-2'))
      .add(points.get('2,-2'))
      .add(points.get('2,-1'))
      .add(points.get('1,0'));
    expect(comp1.borders()).toHaveLength(2);
    expect(comp1.perimeter()).not.toEqual(expect.arrayContaining([
      [points.get('1,-1'), 0b111111],
    ]));
    const holes = comp1.holes();
    expect(holes).toHaveLength(1);
    expect(holes[0]).toEqual(expect.arrayContaining([
      [points.get('1,-1'), 0b111111],
    ]));
  });

  test('Merging two holes.', () => {
    comp1.add(points.get('-1,0'))
      .add(points.get('-1,-1'))
      .add(points.get('0,-2'))
      .add(points.get('1,-2'))
      .add(points.get('2,-2'))
      .add(points.get('2,-1'))
      .add(points.get('1,0'))
      .add(points.get('0,1'))
      .add(points.get('-1,2'))
      .add(points.get('-2,2'))
      .add(points.get('-2,1'));
    let borders = comp1.borders().sort((a, b) => a.length - b.length);
    expect(borders).toHaveLength(3);
    const holes = comp1.holes().sort((a, b) => a.length - b.length);
    const [below, above] = holes;
    expect(below).toHaveLength(1);
    expect(below).toContainEqual([points.get('-1,1'), 0b111111]);
    expect(above).toHaveLength(2);
    expect(above).toEqual(expect.arrayContaining([
      [points.get('0,-1'), 0b111110], [points.get('1,-1'), 0b110111],
    ]));
    expect(borders.slice(0, 2)).toEqual(holes);
    let perimeter = comp1.perimeter();
    expect(borders[2]).toEqual(perimeter);
    expect(perimeter).not.toEqual(expect.arrayContaining([
      [points.get('-1,1'), 0b111111], [points.get('0,-1'), 0b111110],
      [points.get('1,-1'), 0b110111],
    ]));
    comp1.delete(points.get('0,0'));
    borders = comp1.borders().sort((a, b) => a.length - b.length);
    expect(borders).toHaveLength(2);
    expect(borders[0]).toHaveLength(4);
    expect(borders[0]).toContainEqual([points.get('0,0'), 0b001011]);
    perimeter = comp1.perimeter();
    expect(perimeter).not.toContainEqual([points.get('0,0'), 0b001011]);
  });

  test('Merge holes with perimeter.', () => {
    comp1.add(points.get('1,0'))
      .add(points.get('2,-1'))
      .add(points.get('2,-2'))
      .add(points.get('1,-2'))
      .add(points.get('0,1'))
      .add(points.get('-1,2'))
      .add(points.get('-2,2'))
      .add(points.get('-2,1'))
      .add(points.get('-1,0'))
      .add(points.get('-1,-1'))
      .add(points.get('0,-2'));
    expect(comp1.holes()).toHaveLength(2);
    comp1.delete(points.get('-1,0'));
    expect(comp1.holes()).toHaveLength(0);
    expect(comp1.perimeter()).toHaveLength(21);
  });

  test('Splitting a component.', () => {
    const comp4 = new HexComponent(comp1)
      .add(points.get('1,-1'))
      .add(points.get('2,-1'))
      .add(points.get('1,-2'))
      .add(points.get('0,1'))
      .add(points.get('-1,2'))
      .add(points.get('-2,2'))
      .add(points.get('-2,1'))
      .add(points.get('-1,0'))
      .add(points.get('0,-2'));
    const [right, top, bottom] = [comp4, ...comp4.delete(points.get('1,-1'))].sort(
      (a, b) => a.size - b.size,
    );
    expect(right.holes()).toHaveLength(0);
    expect(right.perimeter()).toHaveLength(6);
    expect(top.holes()).toHaveLength(0);
    expect(top.perimeter()).toHaveLength(8);
    expect(bottom.holes()).toHaveLength(1);
    expect(bottom.perimeter()).toHaveLength(12);
  });

  test('Valid merge (merging perimeters).', () => {
    comp1.add(points.get('1,0'))
      .add(points.get('2,-1'))
      .add(points.get('2,-2'))
      .add(points.get('1,-2'))
      .add(points.get('0,1'))
      .add(points.get('-1,2'))
      .add(points.get('-2,2'))
      .add(points.get('-2,1'))
      .add(points.get('0,-2'))
      .add(points.get('-1,-1'))
      .add(points.get('-2,0'));
    comp1.delete(points.get('0,0'));
    comp3.merge(comp1, points.get('0,2'), points.get('0,1'));
    expect(comp3.holes()).toHaveLength(1);
  });

  test('Valid merge (merge perimeter with hole).', () => {
    comp3.add(points.get('-1,2'))
      .add(points.get('-1,1'))
      .add(points.get('-1,0'))
      .add(points.get('0,-1'))
      .add(points.get('1,-1'))
      .add(points.get('1,0'))
      .add(points.get('1,1'));
    comp1.merge(comp3, points.get('0,0'), points.get('1,0'));
    const holes = comp1.holes();
    expect(holes).toHaveLength(1);
    expect(holes[0]).toHaveLength(1);
    expect(holes[0]).toContainEqual([points.get('0,1'), 0b111111]);
  });

  test('Valid merge (create new holes).', () => {
    comp2.add(points.get('1,1'))
      .add(points.get('0,2'))
      .add(points.get('-1,2'))
      .add(points.get('-2,2'))
      .add(points.get('-2,1'))
      .add(points.get('-2,0'))
      .add(points.get('-1,-1'))
      .add(points.get('0,-2'))
      .add(points.get('1,-2'))
      .add(points.get('2,-2'))
      .add(points.get('2,-1'));
    const comp4 = new HexComponent(points.get('0,0'))
      .add(points.get('1,-1'))
      .add(points.get('0,1'))
      .add(points.get('-1,0'));
    comp4.merge(comp2, points.get('1,-1'), points.get('2,-2'));
    const holes = comp4.holes();
    expect(holes).toHaveLength(3);
    expect(holes).toEqual(expect.arrayContaining([
      [[points.get('1,0'), 0b111111]],
      [[points.get('-1,1'), 0b111111]],
      [[points.get('0,-1'), 0b111111]],
    ]));
    const perimeter = comp4.perimeter();
    expect(perimeter).toHaveLength(18);
    expect(perimeter).not.toEqual(expect.arrayContaining([
      [points.get('1,0'), 0b111111],
      [points.get('-1,1'), 0b111111],
      [points.get('0,-1'), 0b111111],
    ]));
  });
});

test('Translation test.', () => {
  comp3.add(points.get('0,1')).add(points.get('0,0'));
  const comp4 = comp3.translate(new HexPoint(1, -2));
  expect(comp4.size).toBe(3);
  expect(comp4.has(points.get('1,0'))).toBe(true);
  expect(comp4.has(points.get('1,-1'))).toBe(true);
  expect(comp4.has(points.get('1,-2'))).toBe(true);
});
