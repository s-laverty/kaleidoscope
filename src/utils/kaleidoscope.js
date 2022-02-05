import { enableMapSet, immerable } from 'immer';
import { multiply } from 'mathjs';
import { version } from '../../package.json';
import * as config from './config.json';
import HexMap from './hex/HexMap';
import HexPoint from './hex/HexPoint';
import Point from './point/Point';
import PointMap from './point/PointMap';
import PointSet from './point/PointSet';
/** @template T @typedef {import('immer').Draft<T>} Draft */

enableMapSet();

// Utility module aggregation.
HexMap[immerable] = true;
PointMap[immerable] = true;
PointSet[immerable] = true;
export {
  HexMap, HexPoint, Point, PointMap, PointSet,
};

export const {
  hexGrid: HexGrid, modes: Modes, tools: Tools, zoom: Zoom,
} = config;

/**
 * @typedef {object} State - Kaleidoscope's internal state representation.
 * @prop {boolean} shiftKey - True if the shift key is currently depressed.
 * @prop {boolean} grabbing - True if the user is currently grabbing (dragging) the GUI.
 * @prop {boolean} sidebar - True if the left sidebar is currently visible.
 * @prop {string} modal - Indicates which modal is currently visible (null for none).
 * @prop {string} mode - Indicates which mode is currently active.
 * @prop {HexTessellateState} hexTesselate - The state for the hex tessellation mode.
 * @prop {HexFreestyleState} hexFreestyle - The state for the hex freestyle mdoe.
 */

/**
 * @typedef {object} HexTessellateState - The internal state representation for Kaleidoscope's hex
 * tessellation mode.
 * @prop {HexMap<string>} tiledata - Stores the color data for each hex tile.
 * @prop {Symbol} tileShapeSignature - Updated whenever the tile shape changes.
 * @prop {string[]} colors - List of colors available in the color palette.
 * @prop {number} colorIndex - Index of currently selected color in the color palette.
 * @prop {[HexPoint, HexPoint][]} tessellations - List of possible tessellations for the current
 * tile shape.
 * @prop {Symbol} tessellationSignature - Updated whenever the available tessellations change.
 * @prop {number} tessellationIndex - Index of the currently selected tessellation.
 * @prop {string} tool - The currently-selected tool (null for none).
 * @prop {number} zoom - The current zoom-level for the GUI.
 * @prop {boolean} showOutline - True if an outline is visible around the tile.
 * @prop {HistoryState} history - The edit history state for this state.
 */

/**
 * @typedef {object} HexFreestyleState - The internal state representation for Kaleidoscope's hex
 * pixel editor mode.
 * @prop {PointMap<string>} tiledata - Stores the color data for each hex tile.
 * @prop {PointMap<Symbol>} chunkSignatures - Updated for each chunk of hexes whenever one of the
 * hexes within that chunk is updated.
 * @prop {string[]} colors - List of colors available in the color palette.
 * @prop {number} colorIndex - Index of currently selected color in the color palette.
 * @prop {string} tool - The currently-selected tool (null for none).
 * @prop {number} zoom - The current zoom-level for the GUI.
 * @prop {boolean} showEmpty - True if empty hexes are displayed over a checkerboard background.
 * @prop {HistoryState} history - The edit history state for this state.
 */

/**
 * @typedef {object} HistoryState - The internal state representation of edit history for a
 * a particular mode state.
 * @prop {object[]} states - A list of versions of the current state that can be merged into it to
 * restore the application to that state.
 * @prop {number} index - Index of the history entry which matches the current state.
 */

/**
 * Produces an object that is a record of the current state. Merging this record into the state will
 * restore it.
 * @param {string} mode - The current application mode.
 * @param {*} state - The current application mode state.
 * @returns {*} - An object representing a historical record for the current state.
 */
const getHistoryRecord = (mode, state) => {
  const record = {};
  /** @type {string[]} */
  const savedFields = config.history.savedFields[mode];
  savedFields.forEach((field) => { record[field] = state[field]; });
  return record;
};

/**
 * Checks if it is necessary to update the history record for the current state, based on any
 * changes that were made to the draft. If so, updates the history field of the draft.
 * @param {Draft<State>} draft - The draft, post-modification.
 */
export const recordHistory = (draft) => {
  const { mode } = draft;
  const state = draft[mode];
  const { history } = /** @type {{history: HistoryState}} */ (state);
  if (!history) return;

  const prev = history.states[history.index];
  /** @type {string[]} */
  const triggerFields = config.history.triggerFields[mode];
  if (triggerFields.every((field) => state[field] === prev[field])) return;

  const start = Math.max(0, history.index - config.history.maxLength + 2);
  history.states = history.states.slice(start, history.index + 1);
  history.states.push(getHistoryRecord(mode, state));
  history.index = history.states.length - 1;
};

/** @type {State} */
export const InitialState = {
  shiftKey: false,
  grabbing: false,
  sidebar: true,
  modal: null,
  mode: 'hexFreestyle',
  hexTesselate: {
    tiledata: new HexMap([[new HexPoint(0, 0), '#ffffff']]),
    tileShapeSignature: Symbol('tile shape signature'),
    colors: ['#ff0000', '#00ff00', '#0000ff'],
    colorIndex: null,
    tessellations: null,
    tessellationSignature: null,
    tessellationIndex: null,
    tool: 'tile-shape',
    zoom: 1.0,
    showOutline: true,
    history: null,
  },
  hexFreestyle: {
    tiledata: new PointMap(),
    chunkSignatures: new PointMap(),
    colors: ['#ff0000', '#00ff00', '#0000ff'],
    colorIndex: null,
    tool: null,
    pan: new Point(0, 0),
    zoom: 1.0,
    showEmpty: true,
    history: null,
  },
};

/**
 * Initializes (or re-initializes) the history field for a given mode state.
 * @param {*} state - A mode state to initialize the history for.
 * @returns {HistoryState} - An initialized history state to insert into to a mode state.
 */
const initHistory = (mode, state) => ({ states: [getHistoryRecord(mode, state)], index: 0 });

// Initialize history fields in initial state.
Object.keys(config.modes).forEach((mode) => {
  const state = InitialState[mode];
  if ('history' in state) state.history = initHistory(mode, state);
});

/**
 * Creates a JSON string representing the serialized application state.
 * @param {State} state - The current application state.
 * @returns {string} A JSON string representing the serialized application
 * state.
 */
export const saveJSON = (state) => {
  const { mode } = state;
  const modeState = state[mode];
  /** @type {string[]} */
  const savedFields = config.savedFields[mode];
  const saveState = { mode };
  savedFields.forEach((key) => { saveState[key] = modeState[key]; });
  return JSON.stringify(
    { version, state: { ...saveState } },
    (_key, value) => {
      if (value instanceof Point) {
        const object = { dataType: 'Point', data: [...value] };
        if (value instanceof HexPoint) object.dataType = 'HexPoint';
        return object;
      }
      if (value instanceof PointMap) {
        const object = { dataType: 'PointMap', data: value.entries() };
        if (value instanceof HexMap) object.dataType = 'HexMap';
        return object;
      }
      if (value instanceof PointSet) {
        return { dataType: 'PointSet', data: value.values() };
      }
      return value;
    },
  );
};

/**
 * Deserializes a serialized JSON string representing the application state for a particular mode.
 * Throws an error if the file cannot be parsed.
 * @param {string} text - Serialized JSON string representing a particular mode state.
 * @returns {{mode: string, state: object}} An object containing the application mode of the
 * deserialized JSON and the data in the deserialized JSON.
 */
export const loadJSON = (text) => {
  /** @type {{version: string, mode: string, state: object}} */
  const result = JSON.parse(text, (_key, value) => {
    switch (value?.dataType) {
      case 'Point': return new Point(...value.data);
      case 'HexPoint': return new HexPoint(...value.data);
      case 'PointMap': return new PointMap(value.data);
      case 'HexMap': return new HexMap(value.data);
      case 'PointSet': return new PointSet(value.data);
      default: return value;
    }
  });

  // Incrementally update the save state version to the most recent.
  try {
    while (result.version !== version) {
      switch (result.version) {
        case '0.1.1':
          if (result.mode === 'hex-freestyle') {
            result.mode = 'hexFreestyle';
            const state = { ...result, showEmpty: InitialState.hexFreestyle.showEmpty };
            delete state.version;
            delete state.mode;
            result.state = state;
          } else throw new Error('Unrecognized application mode');
          result.version = '0.2.0';
          break;
        default: throw new Error('Unknown file save version');
      }
    }
  } catch (err) {
    throw new Error(`Cannot convert from save file version ${result.version}: ${err.message}`);
  }
  delete result.mode;

  // Verify the mode of the save state.
  const { mode } = result;
  if (!(mode in config.modes)) throw new Error(`Unknown Kaleidoscope application mode: ${mode}`);
  /** @type {string[]} */
  const fields = config.savedFields[mode];
  if (Object.keys(result.state).sort().toString() !== fields.sort().toString()) throw new Error(`The data fields in the save file do not match those expected for Kaleidoscope application mode: ${mode}`);
  const state = { ...InitialState[mode], ...result.state };
  if (mode === 'hexFreestyle') {
    /** @type {HexFreestyleState} */ (state).chunkSignatures = new PointMap();
    /** @type {HexFreestyleState} */ (state).tiledata.keys().forEach(
      (point) => /** @type {HexFreestyleState} */ (state).chunkSignatures
        .set(point.divide(config.hexGrid.chunkSize).floor(), Symbol('hex chunk signature')),
    );
  }
  if ('history' in state) state.history = initHistory(mode, state);
  return { mode, state };
};

/**
 * Finds all possible tessellation arrangements for a continuous tile made of hexagons.
 * @param {PointMap<*>} tiledata - A tile to determine tessellations for.
 * @returns {[HexPoint, HexPoint][]} A list of translations generating a valid tessellation.
 */
export const tessellate = (tiledata) => {
  // Determine all possible adjacent translations
  /** @type {PointSet<HexPoint>} */
  const explored = new PointSet().add(new HexPoint(0, 0));
  /** @type {HexPoint[]} */
  const path = [];
  const explore = (translation) => {
    if (explored.has(translation)) return;
    explored.add(translation);
    const tile = tiledata.translate(translation);
    if (!tiledata.adjacentTo(tile)) return;
    if (!tiledata.overlaps(tile)) path.push([translation, tile]);
    for (let i = 0; i < 4; i += 1) explore(translation.step(i));
  };
  explore(new HexPoint(1, 0));

  // Determine which translation combinations yield valid tessellations
  /** @type {[HexPoint, HexPoint][]} */
  const tessellations = [];
  /** @type {PointSet<HexPoint>} */
  const exclude1 = new PointSet();
  /** @type {PointSet<HexPoint>} */
  const exclude2 = new PointSet();
  while (path.length) {
    const [translation1, tile1] = path.shift();
    if (!exclude1.has(translation1)) {
      exclude2.clear();
      path.forEach(([translation2, tile2]) => {
        if (exclude2.has(translation2)) return;
        if (tile1.adjacentTo(tile2) && !tile1.overlaps(tile2)) {
          const merged = new HexMap(tiledata).merge(tile1).merge(tile2)
            .merge(tile1.translate(translation2));
          if (merged.holes().next().done) {
            tessellations.push([translation1, translation2]);
            exclude1.add(translation2);
            exclude2.add(translation1.subtract(translation2));
          }
        }
      });
    }
  }
  return tessellations;
};

/**
 * For a given hex tile and tessellation pattern, finds all pairs of adjacent hexes and
 * corresponding internal hexes (via tessellation) that can be swapped without breaking the tile
 * apart.
 * @param {HexMap<*>} tiledata - A tile to determine swaps for.
 * @param {[HexPoint, HexPoint]} tessellation - The two translations determining the tile's
 * tessellation pattern.
 * @param {HexPoint[]} exclude - An optional list of hexes to exclude from the swap search.
 * @returns {PointMap<HexPoint, HexPoint>} A mapping of swappable perimeter hexes to corresponding
 * points within the tile.
 */
export const getSwaps = (tiledata, tessellation, exclude = []) => {
  // Determine which points can be swapped (without breaking the component)
  /** @type {PointSet<HexPoint>} */
  const swappable = new PointSet();
  /** @type {PointSet<HexPoint>} */
  const excludeSet = new PointSet(exclude);
  const perimeter = tiledata.perimeter().map(([point]) => point);
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

  // Determine which adjacent hexes correspond to swappable hexes.
  const adjacent = new PointSet(tiledata.adjacent());
  const edges = new PointSet(tiledata.edges());
  const swaps = /** @type {PointMap<HexPoint>} */ (new PointMap());
  swappable.forEach((point) => HexPoint.steps.forEach((step) => {
    const translated = point.add(multiply(step, tessellation));
    if (
      adjacent.has(translated)
      && translated.adjacent.some((adj) => !adj.equals(point) && edges.has(adj))
    ) swaps.set(translated, point);
  }));
  return swaps;
};
