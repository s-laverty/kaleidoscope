import { Point, Tile } from "./Hexagon";

describe('Point tests', () => {
  let p1, p2;
  beforeEach(() => {
    p1 = new Point([2,3]);
    p2 = new Point([-3,0]);
  });
  test('Array tests', () => {
    expect(p1.key).toBe('2,3');
    expect(p1.toString()).toBe('2,3');
    expect(p1[0]).toBe(2);
    expect(p1[1]).toBe(3);
    expect(() => p1.push('potato')).toThrowError();
    expect(() => p1[0] = 42).toThrowError();
    let p3 = new Point(p1);
    expect([...p3]).toEqual([2,3]);
  });
  test('Equality tests', () => {
    let p3 = new Point([2,3]);
    expect(Point.equal(p3,p1));
    expect(p1.equals(p3));
  });
  test('Arithmetic tests', () => {
    expect([...p1.add(p2)]).toEqual([-1,3]);
    expect([...p2.subtract(p1)]).toEqual([-5,-3]);
    expect([...p2.step(0)]).toEqual([-2,0]);
    expect([...p2.step(1)]).toEqual([-3,1]);
    expect([...p2.step(2)]).toEqual([-4,1]);
    expect([...p2.step(3)]).toEqual([-4,0]);
    expect([...p2.step(4)]).toEqual([-3,-1]);
    expect([...p2.step(5)]).toEqual([-2,-1]);
  });
  test('Iterator tests', () => {

  });
});

describe('Tile tests', () => {
});
