import CustomMap from '../collections/CustomMap';
/** @typedef {import('./Point').default} Point */

/**
 * A PointMap implements the functionality of the builtin Map using Points as keys.
 * @template V - The value type.
 * @extends {CustomMap<Point, V>}
 */
export default class PointMap extends CustomMap {
  /**
   * Creates a PointMap.
   * @param {[Point,V][] | Map<Point,V> | PointMap<V>} [entries] - An optional collection of
   * key-value pairs used to initialize the point map.
   */
  constructor(entries) { super(entries, String); }
}
