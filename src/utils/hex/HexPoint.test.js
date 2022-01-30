import HexPoint from './HexPoint';

describe('HexPoint tests.', () => {
  test('step tests', () => {
    const p1 = new HexPoint(29, -92);
    const steps = HexPoint.argSteps.map((i) => p1.step(i));
    expect(steps).toEqual([
      [30, -92], [29, -91], [28, -91], [28, -92], [29, -93], [30, -93],
    ]);
  });

  test('adjacent tests', () => {
    const p1 = new HexPoint(29, -92);
    expect(p1.adjacent).toEqual([
      [30, -92], [29, -91], [28, -91], [28, -92], [29, -93], [30, -93],
    ]);
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
