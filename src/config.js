/**
 * Configuration file for Kaleidoscope app.
 * @author Steven Laverty
 */

import {
  add, inv, multiply, transpose,
} from 'mathjs';
/** @typedef {import('./utils/kaleidoscope').HexFreestyleState} HexFreestyleState */
/** @typedef {import('./utils/kaleidoscope').HexTessellateState} HexTessellateState */

/**
 * Kaleidoscope application modes.
 * @enum {string}
 */
export const Modes = {
  hexTessellate: 'hexTessellate',
  hexFreestyle: 'hexFreestyle',
};

/**
 * Kaleidoscope tools (across all modes).
 * @enum {string}
 */
export const Tools = {
  colorClear: 'colorClear',
  colorEyedropper: 'colorEyedropper',
  colorFill: 'colorFill',
  colorFlood: 'colorFlood',
  pan: 'pan',
  tileShape: 'tileShape',
  tileSwap: 'tileSwap',
};

/**
 * Kaleidoscope modals (mutually exclusive).
 * @enum {string}
 */
export const Modals = {
  clearAllConfirm: 'clearAllConfirm',
  loadFile: 'loadFile',
  saveFile: 'saveFile',
};

/** Display name configuration properties. */
export const Names = {
  /**
   * Name configuration for application modes.
   * @type {{ [mode: Modes]: string }}
   */
  modes: {
    [Modes.hexFreestyle]: 'Hexagon Freestyle',
    [Modes.hexTessellate]: 'Hexagon Tessellation',
  },

  /**
   * Name configuration for tools.
   * @type {{ [tool: Tools]: string }}
   */
  tools: {
    [Tools.colorClear]: 'Clear Color',
    [Tools.colorEyedropper]: 'Eyedropper',
    [Tools.colorFill]: 'Fill Color',
    [Tools.colorFlood]: 'Paint Bucket',
    [Tools.pan]: 'Pan',
    [Tools.tileShape]: 'Change Tile Shape',
    [Tools.tileSwap]: 'Swap Hexes',
  },
};

/** Configuration properties for edit history (undo / redo features). */
export const History = {
  /**
   * If one of these values changes, then a new record should be saved in the edit history.
   * @type {{ [mode: Modes]: string[] }}
   */
  triggerFields: {
    /** @see HexFreestyleState */
    [Modes.hexFreestyle]: [
      'hexColors',
      'colors',
    ],

    /** @see HexTessellateState */
    [Modes.hexTessellate]: [
      'tileShape',
      'hexColors',
      'colors',
    ],
  },

  /**
   * Fields that are saved for an edit history record, mapped by application mode.
   * @type {{ [mode: Modes]: string[] }}
  */
  savedFields: {
    /** @see HexFreestyleState */
    [Modes.hexFreestyle]: [
      'hexColors',
      'colors',
      'colorIndex',
      'tool',
    ],

    /** @see HexTessellateState */
    [Modes.hexTessellate]: [
      'tileShape',
      'hexColors',
      'colors',
      'colorIndex',
      'tessellations',
      'tessellationIndex',
      'tessellationPending',
      'tool',
    ],
  },

  /** The maximum number of edit history records to save. */
  maxLength: 100,
};

/** Configuration properties for save files. */
export const Save = {
  /**
   * Fields that are saved for a save file record, mapped by application mode.
   * @type {{ [mode: Modes]: string[] }}
  */
  savedFields: {
    /** @see HexFreestyleState */
    [Modes.hexFreestyle]: [
      'hexColors',
      'colors',
      'colorIndex',
      'tool',
      'pan',
      'zoom',
      'showEmpty',
    ],

    /** @see HexTessellateState */
    [Modes.hexTessellate]: [
      'tileShape',
      'hexColors',
      'colors',
      'colorIndex',
      'tessellations',
      'tessellationIndex',
      'tessellationPending',
      'tool',
      'zoom',
      'showOutline',
    ],
  },
};

/** Configuration properties for zoom scaling the display. */
export const Zoom = {
  /** Minimum display scale. */
  min: 0.2,

  /** Maximum display scale. */
  max: 3.0,

  /** Sensitivity coefficient for scrolling to zoom. */
  wheelSensitivity: 0.0025,
};

/** Configuration properties for hexagon ⬢ display. */
export const Hex = {
  /** Length of hexagon radius (center to vertex) in pixels. */
  radius: 50,

  /** Length of hexagon apothem (center to middle of edge). */
  apothem: /** @type {number} */ (null), // Derived.

  /** Default color for a hexagon. */
  defaultColor: '#ffffff',

  /** List of vertex coordinates clockwise starting from the right; Centered at (0, 0). */
  vertices: /** @type {[number, number][]} */ (null), // Derived.

  /** Configuration properties for hexagon outline ⬡ display. */
  outline: {
    /** Width of border around hexagons in pixels. */
    width: 1,

    /** Color of border around hexagons. */
    color: 'gray',

    /** List of vertex coordinates for an outline around a hexagon; Centered at (0, 0). */
    vertices: /** @type {[number, number][]} */ (null), // Derived.
  },

  /** Configuration properties for hexagon grid display. */
  grid: {
    /** Spacing between parallel hexagon edges in the grid in pixels. */
    gapWidth: 6.5,

    /**
     * List of vertex coordinates in the grid (between hexes), clockwise starting from the right;
     * Centered at (0, 0).
     */
    vertices: /** @type {[number, number][]} */ (null), // Derived.

    /** Matrix specifies the transformation from grid coordinates to x-y coordinates. */
    spacing: /** @type {[[number, number], [number, number]]} */ (null), // Derived.

    /** Matrix specifies the transformation from x-y coordinates to grid coordinates. */
    spacingInv: /** @type {[[number, number], [number, number]]} */ (null), // Derived.

    /** Size of a repeatable rectangular cell that can be tiled to generate a hex grid. */
    backgroundSize: /** @type {[number, number]} */ (null), // Derived.

    /** Repeatable rectangular background image for the grid. Displays shadows around hexes. */
    backgroundImage: /** @type {string} */ (null), // Derived.

    /** Side length of a hexagon chunk (used for efficient caching). */
    chunkSize: 8,

    /** Number of hexes in a chunk. */
    chunkLength: /** @type {number} */ (null), // Derived.
  },
};
/** Compute derived properties. */
(() => {
  Hex.chunkLength = Hex.chunkSize ** 2;

  Hex.apothem = (3 ** 0.5 / 2) * Hex.radius;
  /**
   * Hexagon ⬢ shape in 2d coordinates (+x right, +y down); Vertex coordinates clockwise starting
   * from the right, centered at (0, 0); Normalized to an apothem of 1.
   */
  const hexShape = transpose([
    [1, 0, -1, -1, 0, 1], // x coordinates.
    multiply(3 ** -0.5, [1, 2, 1, -1, -2, -1]), // y coordinates.
  ]);
  Hex.vertices = multiply(Hex.apothem, hexShape);
  Hex.outline.vertices = multiply(Hex.apothem + Hex.outline.width / 2, hexShape);
  Hex.grid.vertices = multiply(Hex.apothem + Hex.grid.gapWidth / 2, hexShape);
  /**
   * Hexagon grid spacing matrix; In the grid, coordinates are represented in the 𝐮 basis.
   * - 𝑢₁ indicates horizontal row position (positive is right).
   * - 𝑢₂ indicates the right-down diagonal position (positive is right-down).
   *
   * This matrix 𝑆 converts the 𝐯 (x-y) basis into the 𝐮 basis: 𝐮 = 𝐯𝑆; Normalized to apothem 1 with
   * no spacing.
   */
  const hexGridSpacing = transpose([
    [2, 0], // Column 1: 𝑢₁ basis in x-y coordinates.
    [1, 3 ** 0.5], // Column 2: 𝑢₂ basis in x-y coordinates.
  ]);
  Hex.grid.spacing = multiply(Hex.apothem + Hex.grid.gapWidth / 2, hexGridSpacing);
  Hex.grid.spacingInv = inv(Hex.grid.spacing);

  /** Generate grid background image */
  const width = Hex.grid.spacing[0][0];
  const height = 2 * Hex.grid.spacing[1][1];
  Hex.grid.backgroundSize = [width, height];
  const path = `M ${Hex.grid.vertices.map((x) => add(x, [0.5 * width, -0.5 * height]))
    .copyWithin(1, 0, 4).copyWithin(0, 5).slice(0, 5)
    .map((x) => x.join(' '))
    .join(' L ')
  } M ${Hex.grid.vertices.map((x) => add(x, [0.5 * width, 0.5 * height]))
    .copyWithin(1, 2).copyWithin(5, 0).slice(1)
    .map((x) => x.join(' '))
    .join(' L ')
  } M ${Hex.grid.vertices[5].join(' ')} L ${Hex.grid.vertices[0].join(' ')}`;
  const svg = `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      version="1.1" 
      viewBox="0 ${-0.5 * height} ${width} ${height}"
      width="${width}"
      height="${height}"
    >
      <defs>
        <filter id="shadow-outline">
          <feDropShadow
            result="drop-shadow"
            dx="0"
            dy="0"
            stdDeviation="1"
            flood-color="gray"
          />
          <feComposite operator="out" in="drop-shadow" in2="SourceAlpha" />
        </filter>
      </defs>
      <path
        d="${path}"
        stroke="white"
        fill="none"
        stroke-width="${Hex.grid.gapWidth}"
        stroke-linecap="square"
      />
      <g filter="url(#shadow-outline)">
        <polygon points="${Hex.vertices.join(' ')}" />
        <polygon points="${Hex.vertices.map((x) => add(x, [0.5 * width, -0.5 * height])).join(' ')}" />
        <polygon points="${Hex.vertices.map((x) => add(x, [0.5 * width, 0.5 * height])).join(' ')}" />
        <polygon points="${Hex.vertices.map((x) => add(x, [width, 0])).join(' ')}" />
      </g>
    </svg>`.replace(/\s+/g, ' ').replace(/ </g, '<');
  Hex.grid.backgroundImage = `data:image/svg+xml,${encodeURIComponent(svg)}`;
})();

export const DragDataTransferType = 'application/x-kaleidoscope-color';
