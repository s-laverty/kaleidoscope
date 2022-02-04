import CustomMap from '../collections/CustomMap';
/** @typedef {import('./Point').default} Point */

/**
 * A PointMap implements the functionality of the builtin Map using Points as keys.
 * @template V - The value type.
 * @template {Point} [K=Point] - The key type (must be a subclass of Point).
 * @extends {CustomMap<K, V>}
 */
export default class PointMap extends CustomMap {
  /**
   * Creates a PointMap.
   * @param {[K, V][] | Map<K, V> | PointMap<V, K>} [entries] - An optional collection of
   * key-value pairs used to initialize the point map.
   */
  constructor(entries) { super(entries, String); }
}
