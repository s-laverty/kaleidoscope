import Point from './Point';

let p1 = /** @type {Point} */ (null);
let p2 = /** @type {Point} */ (null);

beforeEach(() => {
  p1 = new Point(2, 3);
  p2 = new Point(-3, 0);
});

test('Array tests.', () => {
  expect(p1).toEqual([2, 3]);
  expect(p1[0]).toBe(2);
  expect(p1[1]).toBe(3);
  expect(() => p1.push('potato')).toThrowError();
  expect(() => { p1[0] = 42; }).toThrowError();
  const p3 = new Point(...p1);
  expect(p3).toEqual([2, 3]);
});

test('Equality tests.', () => {
  const p3 = new Point(2, 3);
  expect(Point.equal(p3, p1)).toBe(true);
  expect(p1.equals(p3)).toBe(true);
  expect(p1.equals(p2)).toBe(false);
});

test('Arithmetic tests.', () => {
  expect(p1.add(p2)).toEqual([-1, 3]);
  expect(p2.subtract(p1)).toEqual([-5, -3]);
  expect(p1.multiply(-20)).toEqual([-40, -60]);
  expect(p2.divide(3)).toEqual([-1, 0]);
  const p3 = new Point(1.23, -5.8);
  expect(p3.ceil()).toEqual([2, -5]);
  expect(p3.floor()).toEqual([1, -6]);
});
