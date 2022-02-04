import produce, { enableMapSet, immerable } from 'immer';
import HexMap from './hex/HexMap';
import HexPoint from './hex/HexPoint';

enableMapSet();

HexMap[immerable] = true;

describe('HexMap tests', () => {
  test('Basic map functionality', () => {
    const map1 = /** @type {HexMap<string>} */ (new HexMap());
    const map2 = produce(map1, (draft) => draft.set(new HexPoint(-2, 3), 'Hello!'));
    expect(map1).not.toBe(map2);
    expect(map1.size).toEqual(0);
    expect(map2.size).toEqual(1);
    expect(map2.values()).toEqual(['Hello!']);
  });

  test('Merging and splitting components', () => {
    const map1 = /** @type {HexMap<string>} */ (new HexMap());
    const map2 = produce(map1, (draft) => {
      draft.set(new HexPoint(-1, 2), 'red');
      draft.set(new HexPoint(0, 0), 'blue');
      draft.set(new HexPoint(0, 1), 'orange');
    });
    const map3 = produce(map1, (draft) => {
      draft.set(new HexPoint(0, 0), 'blue');
      draft.set(new HexPoint(0, -1), 'red');
      draft.delete(new HexPoint(0, 0));
    });
    const map4 = produce(map3, (draft) => draft.merge(map2));
    expect(map4.size).toBe(4);
    expect(map4.isConnected()).toBe(true);
  });
});
