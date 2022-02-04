import PointMap from '../point/PointMap';
import PointSet from '../point/PointSet';
import BorderNode from './BorderNode';
import HexPoint from './HexPoint';
/** @typedef {import('./HexPoint').Edges} Edges */
/** @typedef {import('./HexPoint').HexPointEdges} HexPointEdges */

/**
 * Represents a connected component of HexPoints. (It is possible to traverse every included hex
 * point through adjacent traversal).
 */
export default class HexComponent {
  /**
   * A set of border node points forms a complete border around or inside the component.
   * @typedef {PointSet<HexPoint>} Border
   */

  /**
   * An array of point-edges tuples.
   * @typedef {HexPointEdges[]} BorderList
   */

  /**
   * A set of connected hexes making up this Component.
   * @type {PointSet<HexPoint>}
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
   * @type {PointMap<[Edges, Border], HexPoint>}
   */
  #borderPoints = new PointMap();

  /**
   * A reference to the border around the exterior of the component.
   * @type {PointSet<HexPoint>}
   */
  #perimeter;

  /**
   * Creates a new component from a starting point or copies an existing component.
   * @param {(HexPoint | HexComponent)} [start] - An optional starting HexPoint for a new Component
   * or an existing component to copy. If not provided, defaults to the origin hex point.
   */
  constructor(start = HexPoint.origin) {
    if (start instanceof HexComponent) {
      // Clone the provided Component instance.
      this.#points = new PointSet(start.#points);

      start.#borders.forEach((border) => {
        const newBorder = new PointSet(border);
        this.#borders.add(newBorder);

        border.forEach((point) => (
          this.#borderPoints.set(point, [start.#borderPoints.get(point)[0], newBorder])
        ));

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
    if (!src.has(start)) {
      throw new Error('Must provide a starting border node within the source border.');
    }

    // Initialize the new border.
    const dest = new PointSet();
    this.#borders.add(dest);
    let concavity = 0;

    /**
     * Recursively transfers a border point and all connected border points from src to dest.
     * @param {HexPoint} point - The point to move from src to dest.
     */
    const transfer = (point) => {
      if (src.has(point)) {
        src.delete(point);
        dest.add(point);
        const data = this.#borderPoints.get(point);
        data[1] = dest;
        const node = new BorderNode(data[0]);
        concavity += node.concavity;
        node.gapStarts().forEach((i) => transfer(point.step(i)));
      }
    };
    transfer(start);

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
    if (!this.has(start)) throw new Error('Must provide a hex point that is in this component.');

    // Initialize the new component.
    const component = new HexComponent(start);
    component.#perimeter.clear();
    component.#borderPoints.clear();

    /**
     * Recursively transfers a point and all connected points from this to the new component.
     * Transfers any encountered non-shared borders from this to the new component.
     * @param {HexPoint} point - The point to move from this to the new component.
     */
    const transfer = (point) => {
      // Transfer this point
      this.#points.delete(point);
      component.#points.add(point);
      // Check all adjacent non-border points.
      point.adjacent.forEach((adjPoint, i) => {
        if (this.has(adjPoint)) transfer(adjPoint);
        else if (this.#borderPoints.has(adjPoint)) {
          // Update the adjacent border node.
          const adjData = this.#borderPoints.get(adjPoint);

          // Check if the adjacent border node is part of the shared border.
          if (adjData[1] === border) {
            // Split the shared border node between this component and the new component.
            const edge = 1 << (i + 3) % 6;
            adjData[0] &= ~edge;
            if (!adjData[0]) {
              border.delete(adjPoint);
              this.#borderPoints.delete(adjPoint);
            }

            // Add the border edge to the new component.
            if (component.#perimeter.has(adjPoint)) {
              component.#borderPoints.get(adjPoint)[0] |= edge;
            } else {
              component.#perimeter.add(adjPoint);
              component.#borderPoints.set(adjPoint, [edge, border]);
            }
          } else {
            // Transfer ownership of the separate border to the new comopnent.
            this.#borders.delete(adjData[1]);
            component.#borders.add(adjData[1]);
            adjData[1].forEach((borderPoint) => {
              const borderData = this.#borderPoints.get(borderPoint);
              this.#borderPoints.delete(borderPoint);
              component.#borderPoints.set(borderPoint, borderData);
            });
          }
        }
      });
    };
    transfer(start);

    // If the new component took this component's perimeter, then it must surround this component.
    if (component.#borders.has(this.#perimeter)) {
      component.#perimeter = this.#perimeter;
      this.#perimeter = border;
    }

    return component;
  }

  /**
   * Returns an array listing all the border node edges in a border.
   * @param {Border} border - The border to export.
   * @returns {BorderList} An array of point-edges tuples.
   */
  #exportBorder(border) {
    return border.values().map((point) => [point, this.#borderPoints.get(point)[0]]);
  }

  /**
   * Adds a new adjacent hex to this component.
   * @param {HexPoint} point An adjacent hex to add to this component.
   * @returns {HexComponent} The component.
   */
  add(point) {
    // Validate arguments.
    if (!this.#borderPoints.has(point)) {
      throw new Error('Must provide a hex that is adjacent to this component.');
    }
    const { adjacent } = point;

    // Replace the border node with a component hex.
    const [edges, border] = this.#borderPoints.get(point);
    border.delete(point);
    this.#borderPoints.delete(point);
    this.#points.add(point);

    if (!border.size) this.#borders.delete(border);
    else {
      // Update the adjacent border nodes around the new hex.
      adjacent.forEach((adjPoint, i) => {
        if (edges & (1 << i)) return;

        // Create new adjacent border nodes and update the edges of each existing one.
        const edge = 1 << (i + 3) % 6;
        if (border.has(adjPoint)) this.#borderPoints.get(adjPoint)[0] |= edge;
        else {
          border.add(adjPoint);
          this.#borderPoints.set(adjPoint, [edge, border]);
        }
      });
    }

    /**
     * Filling in a hex may split the altered border into multiple borders. Keep the first section
     * of adjacent border nodes, then split off the others into new border(s).
     */
    const gapStarts = new BorderNode(edges).gapStarts();
    gapStarts.pop();
    gapStarts.forEach((i) => this.#splitBorder(border, adjacent[i]));

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
    if (!this.has(point)) throw new Error('Must provide a hex point that is in this component.');
    if (this.size === 1) throw new Error("Can't delete the only hex in this component.");

    // Remove the hex.
    this.#points.delete(point);

    // Determine the edges of the new border node and update adjacent border nodes.
    let edges = 0;
    let border = /** @type {Border} */ (null);
    let diffBorders = 1;
    const { adjacent } = point;
    adjacent.forEach((adjPoint, i) => {
      if (this.has(adjPoint)) edges |= 1 << i;
      else {
        const adjData = this.#borderPoints.get(adjPoint);
        const [, adjBorder] = adjData;

        // Merge all adjacent borders into one.
        if (!border) border = adjBorder;
        else if (adjBorder !== border) {
          // Merge this border into the first one.
          ++diffBorders;
          this.#borders.delete(adjBorder);

          if (this.#perimeter === adjBorder) this.#perimeter = border;
          adjBorder.forEach((borderPoint) => {
            border.add(borderPoint);
            this.#borderPoints.get(borderPoint)[1] = border;
          });
        }

        // Update adjacent border nodes, possibly deleting some.
        adjData[0] &= ~(1 << (i + 3) % 6);

        if (!adjData[0]) {
          border.delete(adjPoint);
          this.#borderPoints.delete(adjPoint);
        }
      }
    });

    // If there was no border around the removed point, then it creates a new hole.
    if (!border) border = new PointSet();

    // Add the removed point as a border node.
    border.add(point);
    this.#borderPoints.set(point, [edges, border]);

    /**
     * Removing a hex may split the component into multiple components. Split off separated sections
     * of adjacent component hexes into into new component(s).
     */
    return new BorderNode(edges).edgeStarts().slice(diffBorders)
      .map((i) => this.#split(border, adjacent[i]));
  }

  /**
   * Checks whether a hex is present in the component.
   * @param {HexPoint} point - The hex to check.
   * @returns {boolean} Whether the hex is in the component.
   */
  has(point) { return this.#points.has(point); }

  /**
   * Executes a callback on each hex in the component.
   * @param {(point: HexPoint, point2: HexPoint, component: HexComponent) => void} callbackfn - The
   * callback to execute on each hex.
   * @param {*} thisArg - Argument to use as "this" when executing the callback. Undefined by
   * default.
   */
  forEach(callbackfn, thisArg) {
    const callback = (value, value2) => callbackfn.call(thisArg, value, value2, this);
    this.#points.forEach(callback);
  }

  /**
   * Checks whether another component overlaps this one.
   * @param {HexComponent} other - The component to compare.
   * @returns {boolean} Whether the other component overlaps this one.
   */
  overlaps(other) { return this.#points.values().some(other.has, other); }

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
    if (this.overlaps(src)) throw new Error('Source component must not overlap this component.');

    if (!this.has(start1)) throw new Error('Must provide a starting point in this component.');

    if (!src.has(start2)) throw new Error('Must provide a starting point in the source component.');

    if (!start1.adjacentTo(start2)) {
      throw new Error('Must provide starting points that are adjacent to each other.');
    }

    // Merge the hexes from the source component into this one.
    src.forEach((point) => this.#points.add(point));

    // Merge the shared border.
    const [, border] = this.#borderPoints.get(start2);
    border.forEach((point) => {
      if (this.has(point)) {
        border.delete(point);
        this.#borderPoints.delete(point);
      }
    });

    const [, srcBorder] = src.#borderPoints.get(start1);

    srcBorder.forEach((point) => {
      if (this.has(point)) return;

      const edges = src.#borderPoints.get(point)[0];

      if (border.has(point)) this.#borderPoints.get(point)[0] |= edges;
      else {
        border.add(point);
        this.#borderPoints.set(point, [edges, border]);
      }
    });

    // Merge non-shared borders.
    src.#borders.forEach((otherBorder) => {
      if (otherBorder === srcBorder) return;

      const newBorder = new PointSet(otherBorder);
      this.#borders.add(newBorder);

      otherBorder.forEach((point) => (
        this.#borderPoints.set(point, [src.#borderPoints.get(point)[0], newBorder])
      ));

      if (border === this.#perimeter && otherBorder === src.#perimeter) this.#perimeter = newBorder;
    });

    // Split the merged border into connected sequences of border nodes.
    while (border.size) this.#splitBorder(border, border.values()[0]);

    this.#borders.delete(border);

    return this;
  }

  /**
   * Returns an array of arrays of all the border nodes in each border.
   * @returns {BorderList[]} An array of arrays of point-edges tuples.
   */
  borders() { return [...this.#borders.values()].map(this.#exportBorder, this); }

  /**
   * Returns an array of all the border nodes in the perimeter.
   * @returns {BorderList} An array of point-edges tuples.
   */
  perimeter() { return this.#exportBorder(this.#perimeter); }

  /**
   * Returns an array of arrays of all the border nodes in each hole.
   * @returns {BorderList[]} An array of arrays of point-edges tuples.
   */
  holes() {
    return [...this.#borders.values()].filter((border) => border !== this.#perimeter)
      .map(this.#exportBorder, this);
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
    this.forEach((point) => component.#points.add(point.add(translation)));

    this.#borders.forEach((border) => {
      const newBorder = (border === this.#perimeter)
        ? component.#perimeter
        : new PointSet();

      component.#borders.add(newBorder);

      border.forEach((point) => {
        const translated = point.add(translation);
        newBorder.add(translated);
        component.#borderPoints.set(translated, [this.#borderPoints.get(point)[0], newBorder]);
      });
    });

    return component;
  }
}
