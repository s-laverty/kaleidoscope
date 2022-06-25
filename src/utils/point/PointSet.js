import CustomSet from '../collections/CustomSet';
/** @typedef {import('./Point').default} Point */

/**
 * A PointSet implements the functionality of the builtin Set using Points as entries.
 * @template {Point} [T=Point] - The entry type (must be a subclass of Point).
 * @extends {CustomSet<T>}
 */
export default class PointSet extends CustomSet {
  /**
   * Creates a PointSet.
   * @param {T[] | Set<T> | PointSet<T>} [values] - An optional collection of points used to
   * initialize the point set.
   */
  constructor(values) { super(values, String); }
}
