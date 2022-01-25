import { multiply } from 'mathjs';
import HexMap from './hex/HexMap';
import HexPoint from './hex/HexPoint';
import Point from './point/Point';
import PointMap from './point/PointMap';
import PointSet from './point/PointSet';

/**
 * Version number of Kaliedoscope application.
 * @type {string}
 */
const VERSION = '0.1.1';

/**
 * State fields to be recorded in history for each application mode.
 * @type {{[mode: string]: string[]}}
 */
const HISTORY_FIELDS = {
  'hex-tessellate': ['tiledata', 'colors'],
  'hex-freestyle': ['tiledata', 'colors'],
};

/**
 * State fields that store the context for a particular state -- a change solely
 * in any of these fields does NOT indicate that a new history state must be
 * saved.
 * @type {{[mode: string]: string[]}}
 */
const HISTORY_META_FIELDS = {
  'hex-tessellate': [
    'tile_shape_signature', 'tessellation_signature', 'tessellations',
    'tessellation_index', 'color_index', 'tool',
  ],
  'hex-freestyle': ['chunk_signatures', 'color_index', 'tool'],
};

/**
 * The maximum number of history entries to save.
 * @type {number}
 */
const HISTORY_MAX_LENGTH = 100;

/**
 * Checks if the next state has any changed fields to be saved, and if so,
 * updates the next state's history.
 * @param {string} mode - The current application mode.
 * @param {*} next - The next state object.
 * @returns {*} The next state object with updated history.
 */
export const coalesceHistory = (mode, next) => {
  if (!(mode in HISTORY_FIELDS)) return next;

  let { history = [], historyIndex = -1 } = next;
  const prev = history[historyIndex] ?? {};
  const record = {};
  let doUpdate = false;

  HISTORY_FIELDS[mode].forEach((field) => {
    record[field] = next[field];
    if (next[field] !== prev[field]) doUpdate = true;
  });

  if (doUpdate) {
    HISTORY_META_FIELDS[mode].forEach((field) => { record[field] = next[field]; });
    const start = Math.max(0, historyIndex - HISTORY_MAX_LENGTH + 2);
    history = history.slice(start, historyIndex + 1);
    history.push(record);
    historyIndex = history.length - 1;
    return { ...next, history, historyIndex };
  }
  return next;
};

/**
 * The application mode keywords mapped to descriptions.
 * @type {{[mode: string]: string}}
 */
export const MODES = {
  'hex-tessellate': 'Hexagon Tessellation',
  'hex-freestyle': 'Hexagon Freestyle',
};

/**
 * The tool keywords mapped to descriptions.
 * @type {{[tool: string]: string}}
 */
export const TOOLS = {
  'tile-shape': 'Change Tile Shape',
  'tile-swap': 'Swap Hexes',
  pan: 'Pan',
  'fill-color': 'Fill Color',
  'flood-color': 'Paint Bucket',
  'clear-color': 'Clear Color',
  'eyedropper-color': 'Eyedropper',
};

/**
 * The minimum zoom factor.
 * @type {number}
 */
export const MIN_ZOOM = 0.2;

/**
 * The maximum zoom factor.
 * @type {number}
 */
export const MAX_ZOOM = 3.0;

/**
 * The scaling factor for zooming with the mouse wheel.
 * @type {number}
 */
export const ZOOM_WHEEL_SENSITIVITY = 0.0025;

/**
 * The number of hexes along an edge of a 2d rendering chunk.
 * @type {number}
 */
export const CHUNK_SIZE = 8;

/** The initial state for the Kaleidoscope application. */
export const INITIAL_STATE = {
  shiftKey: false,
  grabbing: false,
  sidebar: true,
  modal: null,
  mode: 'hex-freestyle',
  'hex-tessellate': {
    tiledata: new HexMap([[new HexPoint(0, 0), '#ffffff']]),
    tileShapeSignature: Symbol('tile shape signature'),
    colors: ['#ff0000', '#00ff00', '#0000ff'],
    colorIndex: null,
    tessellations: null,
    tessellationSignature: null,
    tessellationIndex: null,
    tool: 'tile-shape',
    zoom: 1.0,
    show_outline: true,
  },
  'hex-freestyle': {
    tiledata: new PointMap(),
    chunkSignatures: new PointMap(),
    colors: ['#ff0000', '#00ff00', '#0000ff'],
    colorIndex: null,
    tool: null,
    pan: new Point(0, 0),
    zoom: 1.0,
    showEmpty: true,
  },
};

// Initialize the history for each mode.
['hex-freestyle'].forEach((mode) => {
  INITIAL_STATE[mode] = coalesceHistory(mode, INITIAL_STATE[mode]);
});

/**
 * State fields to be saved for each application mode.
 * @type {{[mode: string]: string}}
 */
const SAVED_FIELDS = {
  'hex-tessellate': ['tiledata', 'colors', 'tessellations', 'show_outline', 'zoom'],
  'hex-freestyle': ['tiledata', 'colors', 'pan', 'zoom'],
};

/**
 * Creates a JSON string representing the serialized application state.
 * @param {string} mode - The current application mode.
 * @param {*} current - The current application mode state.
 * @returns {string} A JSON string representing the serialized application
 * state.
 */
export const saveJSON = (mode, current) => {
  const saveState = { mode };
  SAVED_FIELDS[mode].forEach((key) => saveState[key] = current[key]);
  return JSON.stringify(
    { version: VERSION, ...saveState },
    (_key, value) => {
      if (value instanceof HexPoint) {
        return {
          dataType: 'HexPoint',
          data: [...value],
        };
      }
      if (value instanceof Point) {
        return {
          dataType: 'Point',
          data: [...value],
        };
      }
      if (value instanceof HexMap) {
        return {
          dataType: 'HexTile',
          data: [...value],
        };
      }
      if (value instanceof PointMap) {
        return {
          dataType: 'PointMap',
          data: [...value],
        };
      }
      if (value instanceof PointSet) {
        return {
          dataType: 'PointSet',
          data: [...value],
        };
      }
      return value;
    },
  );
};

/**
 * Deserializes a serialized JSON string representing the application state for
 * a particular mode.
 * @param {string} text - Serialized JSON string representing application state.
 * @returns {*} An object representing the state for a particular application
 * mode.
 */
export const loadJSON = (text) => {
  let result = /** @type {string} */ (null);
  try {
    result = JSON.parse(text, (_key, value) => {
      if (value?.dataType === 'HexPoint') return new HexPoint(...value.data);
      if (value?.dataType === 'Point') return new Point(...value.data);
      if (value?.dataType === 'HexTile') return new HexMap(value.data);
      if (value?.dataType === 'PointMap') return new PointMap(value.data);
      if (value?.dataType === 'PointSet') return new PointSet(value.data);
      // Legacy
      if (value?.dataType === 'Hexagon_Tile') {
        return new HexMap(
          value.data.map(([point, value]) => [new HexPoint(...point), value]),
        );
      }
      if (value?.dataType === 'Hexagon_PointMap') {
        return new PointMap(
          value.data.map(([point, value]) => [new Point(...point), value]),
        );
      }
      if (value?.dataType === 'Hexagon_PointSet') {
        return new PointSet(
          value.data.map((point) => new Point(...point)),
        );
      }
      return value;
    });
  } catch (e) {
    return;
  }
  // Incrementally update the save state version to the most recent.
  while (result.version !== '0.1.1') {
    switch (result.version) {
      case '0.1.0':
        if (result.pan) result.pan = new Point(result.pan.x, result.pan.y);
        if (result.tiledata) {
          result.tiledata.forEach(
            ({ color }, point) => result.tiledata.set(point, color),
          );
        }
        result.version = '0.1.1';
        break;
      case undefined:
        result.mode = 'hex-freestyle';
        result.tiledata = new PointMap(
          Object.entries(result.hexcolors).map(
            ([key, color]) => (
              [new Point(...key.split(',').map(Number)), { color }]
            ),
          ),
        );
        delete result.hexcolors;
        result.version = '0.1.0';
        break;
      default: return;
    }
  }
  delete result.version;
  let { mode, ...data } = result;
  const fields = new Set(SAVED_FIELDS[mode]);
  for (const field in data) {
    if (!fields.has(field)) return;
    fields.delete(field);
  }
  if (fields.size) return;
  data = { ...INITIAL_STATE[mode], ...data };
  if (data.chunk_signatures) {
    data.chunk_signatures = new data.chunk_signatures.constructor(
      data.chunk_signatures,
    );
    for (const point of data.tiledata.keys()) {
      data.chunk_signatures.set(point.divide(CHUNK_SIZE).floor(), Symbol());
    }
  }
  if (mode in HISTORY_FIELDS) {
    delete data.history;
    delete data.history_index;
    coalesceHistory(mode, data);
  }
  return { mode, data };
};

/**
 * Finds all possible tessellation arrangements for a continuous tile made of
 * hexagons.
 * @param {PointMap<*>} tiledata - A tile to determine tessellations for.
 * @returns {[HexPoint, HexPoint][]} A list of translations generating a valid
 * tessellation.
 */
export const tessellate = (tiledata) => {
  // Determine all possible adjacent translations
  const explored = new PointSet().add(new HexPoint(0, 0));
  const path = /** @type {HexPoint[]} */ ([]);
  const explore = (translation) => {
    if (explored.has(translation)) return;
    explored.add(translation);
    const tile = tiledata.translate(translation);
    if (!tiledata.adjacentTo(tile)) return;
    if (!tiledata.overlaps(tile)) path.push([translation, tile]);
    for (let i = 0; i < 4; ++i) explore(translation.step(i));
  };
  explore(new HexPoint(1, 0));

  // Determine which translation combinations yield valid tessellations
  const tessellations = /** @type {[HexPoint, HexPoint]} */ ([]);
  const exclude1 = new PointSet();
  const exclude2 = new PointSet();
  while (path.length) {
    const [translation1, tile1] = path.shift();
    if (exclude1.has(translation1)) continue;
    exclude2.clear();
    path.forEach(
      ([translation2, tile2]) => {
        if (exclude2.has(translation2)) return;
        if (tile1.adjacentTo(tile2) && !tile1.overlaps(tile2)) {
          const merged = new HexMap(tiledata).merge(tile1).merge(tile2).merge(
            tile1.translate(translation2),
          );
          if (merged.holes().next().done) {
            tessellations.push([translation1, translation2]);
            exclude1.add(translation2);
            exclude2.add(translation1.subtract(translation2));
          }
        }
      },
    );
  }
  return tessellations;
};

/**
 * A list of all possible steps (including diagonal) on a square grid.
 * @type {[number, number][]}
 */
const steps = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
];

/**
 * For a given hex tile and tessellation pattern, finds all pairs of adjacent
 * hexes and corresponding internal hexes (via tessellation) that can be swapped
 * without breaking the tile apart.
 * @param {HexMap<*>} tiledata - A tile to determine swaps for.
 * @param {[HexPoint, HexPoint]} tessellation - The two translations determining
 * the tile's tessellation pattern.
 * @param {Iterable<HexPoint>} exclude - An optional list of hexes to exclude
 * from the swap search.
 * @returns {PointMap<HexPoint>} A mapping of swappable perimeter hexes to
 * corresponding points within the tile.
 */
export const getSwaps = (tiledata, tessellation, exclude = []) => {
  const swappable = new PointSet();
  const excludeSet = new PointSet(exclude);
  const perimeter = [...tiledata.perimeter()].map(([point]) => point);
  perimeter.reduce((prev, next) => {
    if (!next.equals(prev)) {
      if (!excludeSet.has(next)) {
        if (swappable.has(next)) {
          swappable.delete(next);
          excludeSet.add(next);
        } else swappable.add(next);
      }
    }
    return next;
  }, perimeter[perimeter.length - 1]);
  const adjacent = new PointSet(tiledata.adjacent());
  const edges = new PointSet(tiledata.edges());
  const swaps = /** @type {PointMap<HexPoint>} */ (new PointMap());
  swappable.forEach(
    (point) => steps.forEach(
      (step) => {
        const translated = point.add(multiply(step, tessellation));
        if (
          adjacent.has(translated)
          && translated.adjacent.some(
            (adj) => !adj.equals(point) && edges.has(adj),
          )
        ) {
          swaps.set(translated, point);
        }
      },
    ),
  );
  return swaps;
};
