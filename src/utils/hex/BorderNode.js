import HexPoint from './HexPoint';
/** @typedef {import('./HexPoint').Edges} Edges */

/**
 * Represents one of the bordering hexes around or inside a connected series of
 * hexes forming a tile.
 */
export default class BorderNode {
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
   * @param {Edges} edges - The edges of the border node that are adjacent to
   * the component.
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
   * Gets an array of numbers which indicate the start of each continuous edge sequence in this
   * border node, moving clockwise from the right.
   * @returns {number[]} An array of numbers indicating the starts of continuous edge sequences.
   */
  edgeStarts() { return HexPoint.argSteps.filter((i) => this.#edgeStarts & (1 << i)); }

  /**
   * Gets an array of numbers which indicate the start of each continuous gap sequence (lack of an
   * edge) in this border node, moving clockwise from the right.
   * @returns {number[]} An array of numbers indicating the starts of continuous gap sequences.
   */
  gapStarts() { return HexPoint.argSteps.filter((i) => this.#gapStarts & (1 << i)); }
}
