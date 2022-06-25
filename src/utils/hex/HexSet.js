import PointSet from '../point/PointSet';
import PointMap from '../point/PointMap';
import HexComponent from './HexComponent';
/** @typedef {import('./HexPoint').default} HexPoint */
/** @typedef {import('./HexPoint').HexPointEdge} HexPointEdge */
/** @typedef {import('./HexPoint').Edges} Edges */

/**
 * HexSet is an extension of PointSet which keeps track of all connected components of hexes within
 * the set.
 * @extends {PointSet<HexPoint>}
 */
export default class HexSet extends PointSet {
  /**
   * An array of hex point & edge tuples.
   * @typedef {HexPointEdge[]} BorderTrace
   */

  /**
   * A mapping of points on the edges of components to edges indicating the exterior of the
   * component.
   * @type {PointMap<Edges, HexPoint>}
   */
  #edges;

  /**
   * A mapping of points adjacent to components to edges indicating the exterior of the component.
   * @type {PointMap<Edges, HexPoint>}
   */
  #adjacent;

  /**
   * A set of all components in this HexSet.
   * @type {Set<HexComponent>}
   */
  #components = new Set();

  /**
   * A mapping of hex points to the components that contain them.
   * @type {PointMap<HexComponent, HexPoint>}
   */
  #componentPoints = new PointMap();

  /**
   * Creates a HexSet.
   * @param {HexPoint[] | Set<HexPoint> | HexSet} [entries] - An optional collection of HexPoints
   * used to initialize the set.
   */
  constructor(entries) {
    if (entries instanceof HexSet) {
      /** Clone the provided instance of HexSet. */
      super(entries);
      this.#edges = new PointMap(entries.#edges);
      this.#adjacent = new PointMap(entries.#adjacent);

      entries.#components.forEach((component) => {
        const newComponent = new HexComponent(component);
        this.#components.add(newComponent);
        newComponent.forEach((point) => this.#componentPoints.set(point, newComponent));
      });
    } else {
      /** Initialize a new HexSet. */
      super();

      this.#edges = new PointMap();
      this.#adjacent = new PointMap();

      if (entries instanceof Array) entries.forEach((point) => this.add(point));
      else entries?.forEach((point) => this.add(point));
    }
  }

  /**
   * Traces an edge of a component in a complete cycle (left to right from inside the component) and
   * returns an array of tuples indicating each step.
   * @param {HexPointEdge} start - A HexPoint & edge number tuple indicating the start of the trace
   * (will be yielded first).
   * @returns {BorderTrace} An array of HexPoint & edge number tuples forming a complete traversal
   * of a component border.
   */
  #traceBorder(start) {
    let [point, i] = start;
    let edges = this.#edges.get(point);
    const trace = /** @type {BorderTrace} */ ([]);

    /** Follow along the border edge. */
    do {
      trace.push([point, i]);
      i = (i + 1) % 6;

      if (~edges & (1 << i)) {
        point = point.step(i);
        edges = this.#edges.get(point);
        i = (i + 4) % 6;
      }
    }
    while (!point.equals(start[0]) || i !== start[1]);

    return trace;
  }

  /**
   * Adds a point to the HexSet.
   * @param {HexPoint} point - The point to associate with the value.
   * @returns {HexSet} The HexSet.
   */
  add(point) {
    if (!this.has(point)) {
      /** Update the surrounding edge and adjacent hexes. */
      this.#adjacent.delete(point);
      let edges = 0;
      let component = /** @type {HexComponent} */ (null);

      point.adjacent.forEach((adjPoint, i) => {
        const edge = 1 << (i + 3) % 6;
        if (this.has(adjPoint)) {
          const adjEdges = this.#edges.get(adjPoint) & ~edge;

          if (!adjEdges) this.#edges.delete(adjPoint);
          else this.#edges.set(adjPoint, adjEdges);

          /** Merge all adjacent components into one. */
          const adjComponent = this.#componentPoints.get(adjPoint);
          if (!component) {
            component = adjComponent;
            component.add(point);
          } else if (adjComponent !== component) {
            component.merge(adjComponent, point, adjPoint);
            this.#components.delete(adjComponent);
            adjComponent.forEach((otherPoint) => this.#componentPoints.set(otherPoint, component));
          }
        } else {
          edges |= 1 << i;
          this.#adjacent.set(adjPoint, (this.#adjacent.get(adjPoint) ?? 0) | edge);
        }
      });

      /** Add the hex's component reference. */
      if (edges) {
        this.#edges.set(point, edges);
        if (!component) {
          component = new HexComponent(point);
          this.#components.add(component);
        }
      }
      this.#componentPoints.set(point, component);
    }

    super.add(point);

    return this;
  }

  /** Clears all points in the set. */
  clear() {
    super.clear();

    /** Clear all components. */
    this.#edges.clear();
    this.#adjacent.clear();
    this.#components.clear();
    this.#componentPoints.clear();
  }

  /**
   * Attempts to delete a given point.
   * @param {HexPoint} point - The point to delete.
   * @returns {boolean} Whether the point was deleted.
   */
  delete(point) {
    if (super.delete(point)) {
      /** Update the surrounding edge and adjacent hexes. */
      this.#edges.delete(point);
      let edges = 0;

      point.adjacent.forEach((adjPoint, i) => {
        const edge = 1 << (i + 3) % 6;

        if (!this.has(adjPoint)) {
          const adjEdges = this.#adjacent.get(adjPoint) & ~edge;

          if (!adjEdges) this.#adjacent.delete(adjPoint);
          else this.#adjacent.set(adjPoint, adjEdges);
        } else {
          edges |= 1 << i;
          this.#edges.set(adjPoint, (this.#edges.get(adjPoint) ?? 0) | edge);
        }
      });

      /** Update the component that contained this hex. */
      const component = this.#componentPoints.get(point);
      this.#componentPoints.delete(point);

      if (!edges) this.#components.delete(component);
      else {
        this.#adjacent.set(point, edges);

        /** If deleting this hex splits its component, add the split off components to this set. */
        component.delete(point).forEach((newComponent) => {
          this.#components.add(newComponent);
          newComponent.forEach((otherPoint) => this.#componentPoints.set(otherPoint, newComponent));
        });
      }

      return true;
    }

    return false;
  }

  /**
   * Returns an array of all HexPoints making up the edges of components.
   * @returns {HexPoint[]} An array of edge HexPoints.
   */
  edges() { return this.#edges.keys(); }

  /**
   * Returns an array of adjacent HexPoints to those in the HexSet.
   * @returns {HexPoint[]} An array of adjacent HexPoints.
   */
  adjacent() { return this.#adjacent.keys(); }

  /**
   * Checks whether another HexSet overlaps this one.
   * @param {HexSet} other - The HexSet to compare.
   * @returns {boolean} Whether the other HexSet overlaps this one.
   */
  overlaps(other) { return this.keys().some(other.has, other); }

  /**
   * Checks whether another HexSet is adjacent to this one.
   * @param {HexSet} other - The HexSet to compare.
   * @returns {boolean} Whether the other HexSet is adjacent to this one.
   */
  adjacentTo(other) { return this.#adjacent.keys().some(other.has, other); }

  /**
   * Merges another HexSet into this HexSet.
   * @param {HexSet} src - The HexSet to merge into this one.
   * @returns {HexSet} This Hexmap.
   */
  merge(src) {
    /** Validate arguments. */
    if (this.overlaps(src)) throw new Error('Provided source HexSet must not overlap this HexSet.');

    /** Merge source component one hex at a time. */
    src.forEach((point) => this.add(point));
    return this;
  }

  /**
   * Returns whether this HexSet has just one connected component.
   * @returns {boolean} Whether this HexSet has just one connected component.
   */
  isConnected() { return this.#components.size === 1; }

  /**
   * Returns an array of point-edge tuples tracing the perimeter, clockwise.
   * @returns {BorderTrace} An array of point-edge tuples.
   */
  perimeter() {
    /** Validate internal state. */
    if (!this.isConnected()) throw new Error('HexSet is not connected.');

    /** Get perimeter trace. */
    const component = /** @type {HexComponent} */ (this.#components.values().next().value);
    const [point, edges] = component.perimeter()[0];
    let i = 0;
    while (~edges & (1 << i)) ++i;
    return this.#traceBorder([point.step(i), (i + 3) % 6]);
  }

  /**
   * Returns an array of arrays of point-edge tuples tracing the perimeter of a hole for each hole,
   * counter-clockwise.
   * @returns {BorderTrace[]} An array of arrays of point-edge tuples.
   */
  holes() {
    /** Validate internal state. */
    if (!this.isConnected()) throw new Error('HexSet is not connected.');

    /** Get hole traces. */
    const component = /** @type {HexComponent} */ (this.#components.values().next().value);
    return component.holes().map((hole) => {
      const [point, edges] = hole[0];
      let i = 0;

      while (~edges & (1 << i)) ++i;

      return this.#traceBorder([point.step(i), (i + 3) % 6]);
    });
  }

  /**
   * Creates and returns a translated version of this HexSet.
   * @param {HexPoint} translation - The translation to apply to this HexSet.
   * @returns {HexSet} The translated HexSet.
   */
  translate(translation) {
    /** Initialize a new HexSet and translate and copy this one. */
    const newSet = /** @type {HexSet} */ (new this.constructor());
    this.forEach((point) => super.add.call(newSet, point.add(translation)));
    this.#edges.forEach((value, point) => newSet.#edges.set(point.add(translation), value));
    this.#adjacent.forEach((value, point) => newSet.#adjacent.set(point.add(translation), value));

    this.#components.forEach((component) => {
      const newComponent = component.translate(translation);
      newSet.#components.add(newComponent);
      newComponent.forEach((point) => newSet.#componentPoints.set(point, newComponent));
    });

    return newSet;
  }

  /**
   * Creates and returns a new HexSet containing only a single component
   * specified by a chosen starting point within the extracted component.
   * @param {HexPoint} start - The point specifying which component to extract.
   * @returns {HexSet} A new HexSet containing only the chosen component.
   */
  getComponent(start) {
    /** Validate arguments. */
    if (!this.has(start)) throw new Error('Must provide a starting point in this HexSet.');

    /** Initialize new HexSet and copy the chosen component. */
    const newSet = /** @type {HexSet} */ (new this.constructor());
    const component = this.#componentPoints.get(start);
    const newComponent = new HexComponent(component);
    newSet.#components.add(newComponent);

    component.forEach((point) => {
      super.add.call(newSet, point);
      newSet.#componentPoints.set(point, newComponent);

      if (this.#edges.has(point)) newSet.#edges.set(point, this.#edges.get(point));
    });

    component.borders().forEach((border) => (
      border.forEach(([point, edges]) => newSet.#adjacent.set(point, edges))
    ));

    return newSet;
  }
}
