import Point, { PointMap, PointSet } from './Point';

/** HexPoint represents a point on a hexagonal grid with two principal axes. */
export class HexPoint extends Point {

  /**
   * The origin hex point.
   * @readonly
   */
  static Origin = new HexPoint(0, 0);

  /**
   * The six possible directions for adjacent hex traversal.
   * @readonly
   */
  static Steps = [
    new HexPoint(1, 0),
    new HexPoint(0, 1),
    new HexPoint(-1, 1),
    new HexPoint(-1, 0),
    new HexPoint(0, -1),
    new HexPoint(1, -1)
  ];

  /**
   * Steps from this hex to an adjacent one in a direction specified by a number from 0-5 starting
   * from the right moving clockwise.
   * @param {number} i - The number indicating the direction to step in.
   * @returns {HexPoint} A new HexPoint: the result.
   */
  step(i) { return this.add(HexPoint.Steps[i]); }

  /**
   * An array of all adjacent HexPoints.
   * @type {HexPoint[]}
   */
  get adjacent() {
    return [...Array(6).keys()].map(this.step, this);
  }

  /**
   * Returns whether a point is adjacent to this point.
   * @param {HexPoint} point - A point to check for adjacency.
   * @returns Whether the point is adjacent to this point.
   */
  adjacentTo(point) {
    return this.adjacent.some(adj => adj.equals(point));
  }
};

/**
 * A tuple of a hex point and a number 0-5 indicating a specific edge (clockwise starting from
 * the right).
 * @typedef {[HexPoint, number]} HexPointEdge
 */

/**
 * A number where each bit 0-5 is a flag representing the corresponding edge of a hex
 * (clockwise starting from the right).
 * @typedef {number} Edges
 */

/**
 * A tuple of a hex point and a number where each bit 0-5 is a flag representing the corresponding
 * edge (clockwise starting from the right).
 * @typedef {[HexPoint, Edges]} HexPointEdges
 */

/**
 * Represents one of the bordering hexes around or inside a connected series of hexes forming a
 * tile.
 */
class BorderNode {

  /**
   * A private storage field for this.edges.
   * @type {Edges} 
   */
  #edges;

  /**
   * A private storage field for this.edges.
   * @type {number} 
   */
  #concavity;

  /**
   * A private storage field for this.edgeStarts()
   * @type {Edges}
   */
  #edgeStarts;

  /**
   * A private storage field for this.gapStarts()
   * @type {Edges}
   */
  #gapStarts;

  /**
   * Creates a border node.
   * @param {Edges} edges - The edges of the border node that are adjacent to the component.
   */
  constructor(edges) {
    this.#edges = edges;
    this.#concavity = 0;
    this.#edgeStarts = 0;
    this.#gapStarts = 0;
    for (let i = 0, j = 5; i < 6; j = i++) {
      if (edges & (1 << i)) {
        if (~edges & (1 << j)) {
          --this.#concavity;
          this.#edgeStarts |= 1 << i;
        } else ++this.#concavity;
      } else if (edges & (1 << j)) this.#gapStarts |= 1 << i;
    }
  }

  /**
   * Each bit reprsents whether that edge is part of the border.
   * @type {Edges}
   */
  get edges() { return this.#edges; }

  /**
   * A number representing the concavity of this border node. Single border edges will decrease
   * concavity and but contiguous edges will increase concavity.
   * @type {number}
   */
  get concavity() { return this.#concavity; }

  /**
   * Gets an iterator of numbers which indicate the start of each contiguous edge in this border
   * node, moving clockwise from the right.
   * @returns {IterableIterator<number>} An iterator of numbers indicating contiguous edge starts.
   */
  *edgeStarts() { for (let i = 0; i < 6; ++i) if (this.#edgeStarts & (1 << i)) yield i; }

  /**
   * Gets an iterator of numbers which indicate the start of each contiguous gap (section between
   * edges) in this border node, moving clockwise from the right.
   * @returns {IterableIterator<number>} An iterator of numbers indicating contiguous gap starts.
   */
  *gapStarts() { for (let i = 0; i < 6; ++i) if (this.#gapStarts & (1 << i)) yield i; }
}

/**
 * Represents a connected component of HexPoints. (It is possible to traverse every included
 * hex point through adjacent traversal).
 */
export class HexComponent {

  /**
   * A set of border node points forms a complete border around or inside the component.
   * @typedef {PointSet} Border
   */

  /**
   * An iterator of point-edges tuples.
   * @typedef {IterableIterator<HexPointEdges>} BorderIterator
   */

  /**
   * A set of connected hexes making up this Component.
   * @type {PointSet}
   */
  #points;

  /**
   * A set of all borders around or inside this component.
   * @type {Set<Border>}
   */
  #borders = new Set();

  /**
   * A mapping of border node points to tuples of border component edges and a reference to the
   * border that contains the border node.
   * @type {PointMap<[Edges, Border]>}
   */
  #borderPoints = new PointMap();

  /**
   * A reference to the border around the exterior of the component.
   * @type {PointSet}
   */
  #perimeter;

  /**
   * Creates a new component from a starting point or copies an existing component.
   * @param {(HexPoint | HexComponent)} [start] - An optional starting HexPoint for a
   * new Component or an existing component to copy. If not provided, defaults to the origin hex
   * point.
   */
  constructor(start = HexPoint.Origin) {
    if (start instanceof HexComponent) {

      // Clone the provided Component instance.
      this.#points = new PointSet(start.#points);
      start.#borders.forEach(border => {
        const newBorder = new PointSet(border);
        this.#borders.add(newBorder);
        border.forEach(point =>
          this.#borderPoints.set(point, [start.#borderPoints.get(point)[0], newBorder])
        );
        if (border === start.#perimeter) this.#perimeter = newBorder;
      });
    } else {

      // Initialize a new component with a starting point.
      this.#points = new PointSet().add(start);
      this.#perimeter = new PointSet();
      this.#borders.add(this.#perimeter);
      start.adjacent.forEach((point, i) => {
        this.#perimeter.add(point);
        this.#borderPoints.set(point, [1 << (i + 3) % 6, this.#perimeter]);
      });
    }
  }

  /**
   * The number of hexes in this component.
   * @type {number}
   */
  get size() { return this.#points.size; }

  /**
   * Splits off a disconnected part of a border into a new border and returns it.
   * @param {Border} src - The border to extract points from.
   * @param {HexPoint} start - The starting point to split off.
   * @returns {Border} The new border formed by splitting off from the starting point.
   */
  #splitBorder(src, start) {
    // Validate arguments.
    if (!src.has(start)) throw new Error(
      "Must provide a starting border node within the source border."
    );

    // Initialize the new border.
    const dest = new PointSet();
    this.#borders.add(dest);
    let concavity = 0;

    /**
     * Recursively transfers a border point and all connected border points from src to dest.
     * @param {HexPoint} point - The point to move from src to dest.
     */
    const explore = point => {
      if (src.has(point)) {
        src.delete(point);
        dest.add(point);
        const data = this.#borderPoints.get(point);
        data[1] = dest;
        const node = new BorderNode(data[0]);
        concavity += node.concavity;
        for (let i of node.gapStarts()) explore(point.step(i));
      }
    }
    explore(start);

    // If the concavity of dest is less than 0, then it is the new perimeter of the component.
    if (concavity < 0) this.#perimeter = dest;
    return dest;
  }

  /**
   * Splits off a diconnected part of this component into a new component and returns it.
   * @param {Border} border - The shared border between this component and the new one.
   * @param {HexPoint} start - The starting point to split off.
   * @returns {HexComponent} The new component formed by splitting off from the starting point.
   */
  #split(border, start) {

    // Validate arguments.
    if (!this.has(start)) throw new Error(
      "Must provide a hex point that is in this component."
    );

    // Initialize the new component.
    const component = new HexComponent(start);
    component.#perimeter.clear();
    component.#borderPoints.clear();

    /**
     * Recursively transfers a point and all connected points from this to the new component.
     * Transfers any encountered non-shared borders from this to the new component.
     * @param {HexPoint} point - The point to move from this to the new component.
     */
    const explore = point => {
      if (this.#points.delete(point)) {
        component.#points.add(point);
        point.adjacent.forEach((point, i) => {
          if (this.#borderPoints.has(point)) {
            const data = this.#borderPoints.get(point);
            if (data[1] === border) {
              const edge = 1 << (i + 3) % 6;
              data[0] &= ~edge;
              if (!data[0]) {
                border.delete(point);
                this.#borderPoints.delete(point);
              }
              if (!component.#perimeter.has(point)) {
                component.#perimeter.add(point);
                component.#borderPoints.set(point, [edge, border]);
              } else component.#borderPoints.get(point)[0] |= edge;
            } else {
              this.#borders.delete(data[1]);
              component.#borders.add(data[1]);
              data[1].forEach(point => {
                const data = this.#borderPoints.get(point);
                this.#borderPoints.delete(point);
                component.#borderPoints.set(point, data);
              });
            }
          } else explore(point);
        });
      }
    }
    explore(start);

    // If the new component took this component's perimeter, then it must srround this component.
    if (component.#borders.has(this.#perimeter)) {
      component.#perimeter = this.#perimeter;
      this.#perimeter = border;
    }
    return component;
  }

  /**
   * Returns an iterator listing all the border node edges in a border.
   * @param {Border} border - The border to export.
   * @returns {BorderIterator} An iterator of point-edges tuples.
   */
  *#exportBorder(border) {
    for (let point of border) yield [point, this.#borderPoints.get(point)[0]];
  }

  /**
   * Adds a new adjacent hex to this component.
   * @param {HexPoint} point An adjacent hex to add to this component.
   * @returns {HexComponent} The component.
   */
  add(point) {

    // Validate arguments.
    if (!this.#borderPoints.has(point)) throw new Error(
      "Must provide a hex that is adjacent to this component."
    );

    // Replace the border node with a component hex.
    const [edges, border] = this.#borderPoints.get(point);
    border.delete(point);
    this.#borderPoints.delete(point);
    this.#points.add(point);

    // Update the adjacent border nodes around the new hex.
    const adjacent = point.adjacent;
    if (border.size) adjacent.forEach((point, i) => {
      if (edges & (1 << i)) return;

      // Create new adjacent border nodes and update the edges of each existing one.
      const edge = 1 << (i + 3) % 6;
      if (!border.has(point)) {
        border.add(point);
        this.#borderPoints.set(point, [edge, border]);
      } else this.#borderPoints.get(point)[0] |= edge;
    });
    else this.#borders.delete(border);

    // Filling in a hex may split the altered border into multiple borders. Keep the first section
    // of adjacent border nodes, then split off the others into new border(s).
    const gapStarts = new BorderNode(edges).gapStarts();
    gapStarts.next();
    for (let i of gapStarts) this.#splitBorder(border, adjacent[i]);
    return this;
  }

  /**
   * Removes a hex from this component, possibly splitting off disconnected parts of this component
   * into new component(s).
   * @param {HexPoint} point - A hex to remove from this component.
   * @returns {HexComponent[]} An array of any components that were split off from this component as
   * a result of removing the hex.
   */
  delete(point) {

    // Validate arguments.
    if (!this.has(point)) throw new Error(
      "Must provide a hex point that is in this component."
    );
    if (this.size === 1) throw new Error("Can't delete the only hex in this component.");

    // Remove the hex.
    this.#points.delete(point);

    // Determine the edges of the new border node and update adjacent border nodes.
    let edges = 0;
    let border = /** @type {Border} */ (null);
    let diffBorders = 1;
    const adjacent = point.adjacent;
    adjacent.forEach((point, i) => {
      if (this.#borderPoints.has(point)) {
        const data = this.#borderPoints.get(point);

        // Merge all adjacent borders into one.
        if (!border) border = data[1];
        else if (data[1] !== border) {
          ++diffBorders;
          this.#borders.delete(data[1]);
          if (this.#perimeter === data[1]) this.#perimeter = border;
          data[1].forEach(point => {
            border.add(point);
            this.#borderPoints.get(point)[1] = border;
          });
        }

        // Update adjacent border nodes, possibly deleting some.
        data[0] &= ~(1 << (i + 3) % 6);
        if (!data[0]) {
          border.delete(point);
          this.#borderPoints.delete(point);
        }
      } else edges |= 1 << i;
    });
    if (!border) border = new PointSet();
    border.add(point);
    this.#borderPoints.set(point, [edges, border]);

    // Removing a hex may split the component into multiple components. Split off separated
    // sections of adjacent component hexes into into new component(s).
    const components = /** @type {HexComponent[]} */ ([]);
    for (let i of new BorderNode(edges).edgeStarts()) {

      // Different borders around the removed hex indicate that there is another hex connection
      // somewhere else.
      if (diffBorders) --diffBorders;
      else components.push(this.#split(border, adjacent[i]));
    }
    return components;
  }

  /**
   * Checks whether a hex is present in the component.
   * @param {HexPoint} point - The hex to check.
   * @returns {boolean} Whether the hex is in the component.
   */
  has(point) { return this.#points.has(point); }

  /** @returns {IterableIterator<HexPoint>} */
  [Symbol.iterator]() { return this.#points[Symbol.iterator](); }

  /**
   * Executes a callback on each hex in the component.
   * @param {(value: HexPoint, value2: HexPoint, set: PointSet) => void} callbackFn - The callback
   * to execute on each hex.
   * @param {*} thisArg - Argument to use as "this" when executing the callback. Undefined by
   * default.
   */
  forEach(callbackFn, thisArg) { this.#points.forEach(callbackFn, thisArg); }

  /**
   * Checks whether another component overlaps this one.
   * @param {HexComponent} other - The component to compare.
   * @returns {boolean} Whether the other component overlaps this one.
   */
  overlaps(other) {
    for (let point of this) {
      if (other.has(point)) return true;
    }
    return false;
  }

  /**
   * Merges another component into this one.
   * @param {HexComponent} src - The component to merge into this one.
   * @param {HexPoint} start1 - A hex in this component adjacent to the source component starting
   * point.
   * @param {HexPoint} start2 - A hex in the source component adjacent to this component's starting
   * point.
   * @returns {HexComponent} The component.
   */
  merge(src, start1, start2) {

    // Validate arguments.
    if (this.overlaps(src)) throw new Error("Source component must not overlap this component.");
    if (!this.has(start1)) throw new Error("Must provide a starting point in this component.");
    if (!src.has(start2)) throw new Error(
      "Must provide a starting point in the source component."
    );
    if (!start1.adjacentTo(start2)) throw new Error(
      "Must provide starting points that are adjacent to each other."
    );

    // Merge the hexes from the source component into this one.
    src.forEach(point => this.#points.add(point));

    // Merge the shared border.
    const [, border] = this.#borderPoints.get(start2);
    border.forEach(point => {
      if (this.has(point)) {
        border.delete(point);
        this.#borderPoints.delete(point);
      }
    });
    const [, srcBorder] = src.#borderPoints.get(start1);
    srcBorder.forEach(point => {
      if (this.has(point)) return;
      const edges = src.#borderPoints.get(point)[0];
      if (!border.has(point)) {
        border.add(point);
        this.#borderPoints.set(point, [edges, border]);
      } else this.#borderPoints.get(point)[0] |= edges;
    });

    // Merge non-shared borders.
    src.#borders.forEach(otherBorder => {
      if (otherBorder === srcBorder) return;
      const newBorder = new PointSet(otherBorder);
      this.#borders.add(newBorder);
      otherBorder.forEach(
        point => this.#borderPoints.set(point, [src.#borderPoints.get(point)[0], newBorder])
      );
      if (
        border === this.#perimeter &&
        otherBorder === src.#perimeter
      ) this.#perimeter = newBorder;
    });

    // Split the merged border into connected sequences of border nodes.
    while (border.size) this.#splitBorder(border, border.values().next().value);
    this.#borders.delete(border);
    return this;
  }

  /**
   * Returns an iterator listing an iterator of all the border node edges for each border.
   * @returns {IterableIterator<BorderIterator>} An iterator of iterators of
   * point-edges tuples.
   */
  *borders() { for (let border of this.#borders) yield this.#exportBorder(border); }

  /**
   * Returns an iterator listing all the border node edges in the perimeter.
   * @returns {BorderIterator} An iterator of point-edges tuples.
   */
  perimeter() { return this.#exportBorder(this.#perimeter) }

  /**
   * Returns an iterator listing an iterator of all the border node edges for each hole.
   * @returns {IterableIterator<BorderIterator>} An iterator of iterators of
   * point-edges tuples.
   */
  *holes() {
    for (let border of this.#borders) {
      if (border !== this.#perimeter) yield this.#exportBorder(border);
    }
  }

  /**
   * Creates and returns a translated version of this component.
   * @param {HexPoint} translation - The translation to apply to the component.
   * @returns {HexComponent} The translated component.
   */
  translate(translation) {

    // Initialize the new component.
    const component = /** @type {HexComponent} */ (new this.constructor());
    component.#points.clear();
    component.#perimeter.clear();
    component.#borderPoints.clear();

    // Copy a translated version of this into the new component.
    this.forEach(point => component.#points.add(point.add(translation)));
    this.#borders.forEach(border => {
      const newBorder = (border === this.#perimeter) ? component.#perimeter : new PointSet();
      component.#borders.add(newBorder);
      border.forEach(point => {
        const translated = point.add(translation);
        newBorder.add(translated);
        component.#borderPoints.set(translated, [this.#borderPoints.get(point)[0], newBorder]);
      });
    });
    return component;
  }
}

/**
 * HexMap is an extension of PointMap which keeps track of all connected components of hexes within
 * the map.
 * @template V - The value type.
 * @extends {PointMap<V>}
 */
export class HexMap extends PointMap {

  /**
   * An iterator of hex point & edge tuples.
   * @typedef {IterableIterator<HexPointEdge>} BorderTrace
   */

  /** The HexPoint Component class. */
  static Component = HexComponent;

  /**
   * A mapping of points on the edges of components to edges indicating the exterior of the
   * component.
   * @type {PointMap<Edges>}
   */
  #edges;

  /**
   * A mapping of points adjacent to components to edges indicating the exterior of the component.
   * @type {PointMap<Edges>}
   */
  #adjacent;

  /**
   * A set of all components in this HexMap.
   * @type {Set<HexComponent>}
   */
  #components = new Set();

  /**
   * A mapping of hex points to the components that contain them.
   * @type {PointMap<HexComponent>}
   */
  #componentPoints = new PointMap();

  /**
   * Creates a HexMap.
   * @param {Iterable<[Point, V]>} [entries] - An optional iterable of key-value pairs used to
   * initialize the map.
   */
  constructor(entries) {
    if (entries instanceof HexMap) {

      // Clone the provided instance of HexMap.
      super(entries);
      this.#edges = new PointMap(entries.#edges);
      this.#adjacent = new PointMap(entries.#adjacent);
      entries.#components.forEach(component => {
        const newComponent = new HexComponent(component);
        this.#components.add(newComponent);
        newComponent.forEach(point => this.#componentPoints.set(point, newComponent));
      });
    } else {

      // Initialize a new HexMap.
      super();
      this.#edges = new PointMap();
      this.#adjacent = new PointMap();
      if (entries) for (let entry of entries) this.set(...entry);
    }
  }

  /**
   * Traces an edge of a component in a complete cycle and returns an iterator of tuples indicating
   * each step.
   * @param {HexPointEdge} start - A HexPoint & edge number tuple indicating the start of the trace
   * (will be yielded first).
   * @returns {BorderTrace} An iterator of HexPoint & edge number tuples forming a complete
   * traversal of a component border.
   */
  *#traceBorder(start) {
    let [point, i] = start;
    let edges = this.#edges.get(point);

    // Follow along the border edge.
    do {
      yield [point, i];
      i = (i + 1) % 6;
      if (~edges & (1 << i)) {
        point = point.step(i);
        edges = this.#edges.get(point);
        i = (i + 4) % 6;
      }
    } while (!point.equals(start[0]) || i !== start[1]);
  }

  clear() {
    super.clear();

    // Clear all components.
    this.#edges.clear();
    this.#adjacent.clear();
    this.#components.clear();
    this.#componentPoints.clear();
  }

  delete(point) {
    if (super.delete(point)) {

      // Update the surrounding edge and adjacent hexes.
      this.#edges.delete(point);
      let edges = 0;
      point.adjacent.forEach((point, i) => {
        const edge = 1 << (i + 3) % 6;
        if (!this.has(point)) {
          let adjEdges = this.#adjacent.get(point) & ~edge;
          if (!adjEdges) this.#adjacent.delete(point);
          else this.#adjacent.set(point, adjEdges);
        } else {
          edges |= 1 << i;
          this.#edges.set(point, (this.#edges.get(point) ?? 0) | edge);
        }
      });

      // Update the component that contained this hex.
      const component = this.#componentPoints.get(point);
      this.#componentPoints.delete(point);
      if (edges) {
        this.#adjacent.set(point, edges);

        // If deleting this hex splits its component, add the split off components to this map.
        component.delete(point).forEach(newComponent => {
          this.#components.add(newComponent);
          newComponent.forEach(point => this.#componentPoints.set(point, newComponent));
        });
      } else this.#components.delete(component);
      return true;
    } else return false;
  }

  set(point, value) {
    if (!this.has(point)) {

      // Update the surrounding edge and adjacent hexes.
      this.#adjacent.delete(point);
      let edges = 0;
      let component = /** @type {HexComponent} */ (null);
      point.adjacent.forEach((adjPoint, i) => {
        const edge = 1 << (i + 3) % 6;
        if (this.has(adjPoint)) {
          let adjEdges = this.#edges.get(adjPoint) & ~edge;
          if (!adjEdges) this.#edges.delete(adjPoint);
          else this.#edges.set(adjPoint, adjEdges);

          // Merge all adjacent components into one.
          const adjComponent = this.#componentPoints.get(adjPoint);
          if (!component) {
            component = adjComponent;
            component.add(point);
          } else if (adjComponent !== component) {
            component.merge(adjComponent, point, adjPoint);
            this.#components.delete(adjComponent);
            adjComponent.forEach(point => this.#componentPoints.set(point, component));
          }
        } else {
          edges |= 1 << i;
          this.#adjacent.set(adjPoint, (this.#adjacent.get(adjPoint) ?? 0) | edge);
        }
      });

      // Add the hex's component reference.
      if (edges) {
        this.#edges.set(point, edges);
        if (!component) {
          component = new HexComponent(point);
          this.#components.add(component);
        }
      }
      this.#componentPoints.set(point, component);
    }
    super.set(point, value);
    return this;
  }

  /**
   * Returns an iterator of all HexPoints making up the edges of components.
   * @returns {IterableIterator<HexPoint>} An iterator of edge HexPoints.
   */
  edges() { return this.#edges.keys(); }

  /**
   * Returns an iterator of adjacent HexPoints to those in the HexMap.
   * @returns {IterableIterator<HexPoint>} An iterator of adjacent HexPoints.
   */
  adjacent() { return this.#adjacent.keys(); }

  /**
   * Checks whether another HexMap overlaps this one.
   * @param {HexMap<V>} other - The HexMap to compare.
   * @returns {boolean} Whether the other HexMap overlaps this one.
   */
  overlaps(other) {
    for (let point of this.keys()) {
      if (other.has(point)) return true;
    }
    return false;
  }

  /**
   * Checks whether another HexMap is adjacent to this one.
   * @param {HexMap<V>} other - The HexMap to compare.
   * @returns {boolean} Whether the other HexMap is adjacent to this one.
   */
  adjacentTo(other) {
    for (let point of this.#adjacent.keys()) {
      if (other.has(point)) return true;
    }
    return false;
  }

  /**
   * Merges another HexMap into this HexMap.
   * @param {HexMap<V>} src - The HexMap to merge into this one.
   * @returns {HexMap<V>} This Hexmap.
   */
  merge(src) {

    // Validate arguments.
    if (this.overlaps(src)) throw new Error(
      "Provided source HexMap must not overlap this HexMap."
    );

    // Merge source component one hex at a time.
    src.forEach((value, point) => this.set(point, value));
    return this;
  }

  /**
   * Returns whether this HexMap has just one connected component.
   * @returns {boolean} Whether this HexMap has just one connected component.
   */
  isConnected() { return this.#components.size === 1; }

  /**
   * Returns an iterator of point-edge tuples tracing the perimeter.
   * @returns {BorderTrace} An iterator of point-edge tuples.
   */
  perimeter() {

    // Validate internal state.
    if (!this.isConnected()) throw new Error("HexMap is not connected.");

    // Get perimeter trace.
    const component = /** @type {HexComponent} */ (this.#components.values().next().value);
    const [point, edges] = /** @type {HexPointEdges} */ (component.perimeter().next().value);
    let i = 0;
    while (~edges & (1 << i)) ++i;
    return this.#traceBorder([point.step(i), (i + 3) % 6]);
  }

  /**
   * Returns an iterator of iterators of point-edge tuples tracing a hole for each hole.
   * @returns {IterableIterator<BorderTrace>} An iterator of iterators of point-edge tuples.
   */
  *holes() {

    // Validate internal state.
    if (!this.isConnected()) throw new Error("HexMap is not connected.");

    // Get hole traces.
    const component = /** @type {HexComponent} */ (this.#components.values().next().value);
    for (let hole of component.holes()) {
      const [point, edges] = /** @type {HexPointEdges} */ (hole.next().value);
      let i = 0;
      while (~edges & (1 << i)) ++i;
      yield this.#traceBorder([point.step(i), (i + 3) % 6]);
    }
  }

  /**
   * Creates and returns a translated version of this HexMap.
   * @param {HexPoint} translation - The translation to apply to this HexMap.
   * @param {boolean} [shallow] - Whether to return a basic PointSet instead of a HexMap. False by
   * default.
   * @returns {HexMap<V>} The translated HexMap.
   */
  translate(translation, shallow = false) {

    // For a shallow translation, simply map the hexes to a new set.
    if (shallow) {
      const set = new PointSet();
      for (let point of this.keys()) set.add(point.add(translation));
      return set;
    }

    // Initialize a new HexMap and translate and copy this one.
    const newMap = /** @type {HexMap<V>} */ (new this.constructor());
    this.forEach((value, point) => super.set.call(newMap, point.add(translation), value));
    this.#edges.forEach((value, point) => newMap.#edges.set(point.add(translation), value));
    this.#adjacent.forEach((value, point) =>
      newMap.#adjacent.set(point.add(translation), value));
    this.#components.forEach(component => {
      component = component.translate(translation);
      newMap.#components.add(component);
      component.forEach(point => newMap.#componentPoints.set(point, component));
    })
    return newMap;
  }

  /**
   * Creates and returns a new HexMap containing only a single component specified by a chosen
   * starting point within the extracted component.
   * @param {HexPoint} start - The point specifying which component to extract.
   * @returns {HexMap<V>} A new HexMap containing only the chosen component.
   */
  getComponent(start) {

    // Validate arguments.
    if (!this.has(start)) throw new Error("Must provide a starting point in this HexMap.");

    // Initialize new HexMap and copy the chosen component.
    const newMap = /** @type {HexMap<V>} */ (new this.constructor());
    const component = this.#componentPoints.get(start);
    const newComponent = new HexComponent(component);
    newMap.#components.add(newComponent);
    component.forEach(point => {
      super.set.call(newMap, point, this.get(point));
      newMap.#componentPoints.set(point, newComponent);
      if (this.#edges.has(point)) newMap.#edges.set(point, this.#edges.get(point));
    });
    for (let border of component.borders()) {
      for (let [point, edges] of border) newMap.#adjacent.set(point, edges);
    }
    return newMap;
  }
};
