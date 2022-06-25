import produce from 'immer';
import { flatten, inv, multiply } from 'mathjs';
import Package from '../../package.json';
import {
  Hex, History, Modes, Save, Tools,
} from './config';
import HexMap from './hex/HexMap';
import HexPoint from './hex/HexPoint';
import HexSet from './hex/HexSet';
import Point from './point/Point';
import PointMap from './point/PointMap';
import PointSet from './point/PointSet';
/** @typedef {import('./config').Modals} Modals */

/** Utility module aggregation. */

export {
  HexSet, HexMap, HexPoint, Point, PointMap, PointSet,
};

/** Type definitions */

/** @typedef {PointMap<V, HexPoint>} HexPointMap @template V */
/** @typedef {PointSet<HexPoint>} HexPointSet */

/**
 * The internal state representation of edit history for a particular mode state.
 * @typedef {object} HistoryState
 * @prop {*[]} records - A list of versions of the current state that can be merged into it
 * to restore the application to that state.
 * @prop {number} index - Index of the history entry which matches the current state.
 */

/**
 * The internal state representation for Kaleidoscope's hex pixel editor mode.
 * @typedef {object} HexFreestyleState
 * @prop {HexPointMap<HexColorChunk>} hexColors - Stores the color data for each hex chunk.
 * @prop {string[]} colors - List of colors available in the color palette.
 * @prop {number} colorIndex - Index of currently selected color in the color palette.
 * @prop {Tools} tool - The currently-selected tool (null for none).
 * @prop {Point} pan - The current offset from the center of the GUI.
 * @prop {number} zoom - The current zoom-level for the GUI.
 * @prop {boolean} showEmpty - True if empty hexes are displayed over a checkerboard background.
 * @prop {HistoryState} history - The edit history state for this state.
 */

/**
 * The internal state representation for Kaleidoscope's hex tessellation mode.
 * @typedef {object} HexTessellateState
 * @prop {HexSet} tileShape - Stores the shape of the tile.
 * @prop {HexPointMap<string>} hexColors - Stores the color data for each hex in the tile.
 * @prop {string[]} colors - List of colors available in the color palette.
 * @prop {number} colorIndex - Index of currently selected color in the color palette.
 * @prop {[HexPoint, HexPoint][]} tessellations - List of possible tessellations for the current
 * tile shape.
 * @prop {number} tessellationIndex - Index of the currently selected tessellation.
 * @prop {boolean} tessellationPending - True if the tessellation for the current tile shape has not
 * been loaded.
 * @prop {Tools} tool - The currently-selected tool (null for none).
 * @prop {number} zoom - The current zoom-level for the GUI.
 * @prop {boolean} showOutline - True if an outline is visible around the tile.
 * @prop {HistoryState} history - The edit history state for this state.
 */

/**
 * Kaleidoscope's internal state representation.
 * @typedef {object} GlobalState
 * @prop {boolean} shiftKey - True if the shift key is currently depressed.
 * @prop {boolean} grabbing - True if the user is currently grabbing (dragging) the GUI.
 * @prop {boolean} sidebar - True if the left sidebar is currently visible.
 * @prop {Modals} modal - Indicates which modal is currently visible (null for none).
 * @prop {string} mode - Indicates which mode is currently active.
 * @prop {HexTessellateState} hexTessellate - The state for the hex tessellation mode.
 * @prop {HexFreestyleState} hexFreestyle - The state for the hex freestyle mode.
 */

/**
 * An intersection type of all possible mode states, representing a generic mode state.
 * @typedef {HexTessellateState & HexFreestyleState} ModeState
 */

/**
 * Representation of a chunk of hex colors.
 * @typedef {object} HexColorChunk
 * @prop {string[]} colors - A list of colors where index indicates location (left to right, top to
 * bottom).
 * @prop {number} size - The number of non-empty hexes in this chunk.
 */

/**
 * Specifies the boundaries of a rectangle.
 * @typedef {{ top: number, left: number, bottom: number, right: number }} Rect
 */

/**
 * The initial global state for the Kaleidoscope application.
 * @type {GlobalState}
 */
export const InitialState = {
  shiftKey: false,
  grabbing: false,
  sidebar: true,
  modal: null,
  mode: Modes.hexFreestyle,
  hexTessellate: {
    tileShape: new HexSet([HexPoint.origin]),
    hexColors: new PointMap([[HexPoint.origin, Hex.defaultColor]]),
    colors: ['#ff0000', '#00ff00', '#0000ff'],
    colorIndex: 0,
    tessellations: null,
    tessellationIndex: null,
    tessellationPending: true,
    tool: Tools.tileShape,
    zoom: 1.0,
    showOutline: true,
    history: null, // Will be initialized later.
  },
  hexFreestyle: {
    hexColors: new PointMap(),
    colors: ['#ff0000', '#00ff00', '#0000ff'],
    colorIndex: 0,
    tool: Tools.colorFill,
    pan: new Point(0, 0),
    zoom: 1.0,
    showEmpty: true,
    history: null, // Will be initialized later.
  },
};

/**
 * Produces an object that is a record of the current state. Merging this record into the state will
 * restore it.
 * @param {string} mode - The current application mode.
 * @param {ModeState} state - The current application mode state.
 * @returns {*} - An object representing a historical record for the current state.
 */
const createHistoryRecord = (mode, state) => {
  const record = {};
  const savedFields = History.savedFields[mode];
  savedFields.forEach((field) => { record[field] = state[field]; });
  return record;
};

/**
 * Initializes (or re-initializes) the history field for a given mode state.
 * @param {string} mode - The current application mode.
 * @param {ModeState} state - A mode state to initialize the history for.
 * @returns {HistoryState} - An initialized history state to insert into to a mode state.
 */
const initHistory = (mode, state) => ({ records: [createHistoryRecord(mode, state)], index: 0 });

/** Initialize history fields in initial state. */
Object.keys(Modes).forEach((mode) => {
  /** @type {ModeState} */
  const state = InitialState[mode];
  if ('history' in state) state.history = initHistory(mode, state);
});

/**
 * Locates a hex within a chunk determined by the config hex grid chunk size.
 * @param {HexPoint} coords - The coordinates of the hex to locate.
 * @returns {{ coords: HexPoint, index: number }} The chunk coordinates and the index of the hex
 * within its chunk.
 */
const getHexChunk = (coords) => {
  const chunk = coords.divide(Hex.grid.chunkSize).floor();
  const rem = coords.subtract(chunk.multiply(Hex.grid.chunkSize));
  return { coords: chunk, index: rem[1] * Hex.grid.chunkSize + rem[0] };
};

/**
 * Gets the color of a particular hex. Normalizes interface for chunked vs non-chunked.
 * @param {string} mode - The current application mode. Determines whether to use chunks.
 * @param {HexPointMap<HexColorChunk> | HexPointMap<string>} hexColors - The hex color map (chunked
 * or non-chunked).
 * @param {HexPoint} coords - The coordinates of the hex.
 * @returns {string} - The color of the hex.
 */
const getHexColor = (mode, hexColors, coords) => {
  if (mode === 'hexFreestyle') {
    const chunk = getHexChunk(coords);
    return /** @type {HexPointMap<HexColorChunk>} */ (hexColors)
      .get(chunk.coords)?.colors[chunk.index];
  }
  return /** @type {HexPointMap<string>} */ (hexColors).get(coords);
};

/**
 * Sets the color of a particular hex. Normalizes interface for chunked vs non-chunked.
 * @param {string} mode - The current application mode. Determines whether to use chunks.
 * @param {HexPointMap<HexColorChunk> | HexPointMap<string>} hexColors - The hex color map (chunked
 * or non-chunked).
 * @param {HexPoint} coords - The coordinates of the hex.
 * @param {string} color - The color of the hex.
 */
const setHexColor = (mode, hexColors, coords, color) => {
  if (mode === 'hexFreestyle') {
    const chunk = getHexChunk(coords);
    let chunkData = /** @type {HexPointMap<HexColorChunk>} */ (hexColors).get(chunk.coords);
    if (chunkData) {
      chunkData = produce(chunkData, (draft) => {
        if (!draft.colors[chunk.index]) draft.size += 1;
        draft.colors[chunk.index] = color;
      });
    } else {
      const colors = Array(Hex.chunkSize);
      colors[chunk.index] = color;
      chunkData = { colors, size: 1 };
    }
    /** @type {HexPointMap<HexColorChunk>} */ (hexColors).set(chunk.coords, chunkData);
  } else /** @type {HexPointMap<string>} */ (hexColors).set(coords, color);
};

/**
 * Clears the color of a particular hex. Normalizes interface for chunked vs non-chunked.
 * @param {string} mode - The current application mode. Determines whether to use chunks.
 * @param {HexPointMap<HexColorChunk> | HexPointMap<string>} hexColors - The hex color map (chunked
 * or non-chunked).
 * @param {HexPoint} coords - The coordinates of the hex.
 * @returns {boolean} Whether the hex color was cleared (or already cleared).
 */
const clearHexColor = (mode, hexColors, coords) => {
  if (mode === 'hexFreestyle') {
    const chunk = getHexChunk(coords);
    const chunkData = /** @type {HexPointMap<HexColorChunk>} */ (hexColors).get(chunk.coords);
    if (chunkData) {
      if (!chunkData.colors[chunk.index]) return false;
      if (chunkData.size === 1) {
        /** @type {HexPointMap<string>} */ (hexColors).delete(chunk.coords);
      } else {
        /** @type {HexPointMap<string>} */ (hexColors)
          .set(chunk.coords, produce(chunkData, (draft) => {
            draft.colors[chunk.index] = null;
            draft.size -= 1;
          }));
      }
      return true;
    }
    return false;
  }
  return /** @type {HexPointMap<string>} */ (hexColors).delete(coords);
};

/**
 * Dispatch action types.
 * @enum {string}
 */
export const DispatchTypes = {
  globalSet: 'globalSet',
  set: 'set',
  toggle: 'toggle',
  setToggle: 'setToggle',
  loadProject: 'loadProject',
  zoom: 'zoom',
  pan: 'pan',
  undo: 'undo',
  redo: 'redo',
  colorSelect: 'colorSelect',
  colorAdd: 'colorAdd',
  colorChange: 'colorChange',
  colorChangeDismiss: 'colorChangeDismiss',
  colorRemove: 'colorRemove',
  colorSwap: 'colorSwap',
  clearAll: 'clearAll',
  hexClick: 'hexClick',
  hexDoubleClick: 'hexDoubleClick',
  tessellationLoad: 'tessellationLoad',
  add: 'add',
  remove: 'remove',
};

/**
 * The action parameter for a Kaleidoscope state dispatch call.
 * @typedef {object} DispatchAction
 * @prop {DispatchTypes} type - Specifies the type of action to be taken.
 * @prop {DispatchTypes} [subtype] - Specifies a more specific action subtype.
 * @prop {string} [name] - Specifies the name of a field to be set.
 * @prop {*} [value] - Specifies a generic value.
 * @prop {ModeState} [state] - Specifies a mode state to update the current mode state to.
 * @prop {number} [index] - Specifies the index for an ordered set of things.
 * @prop {string} [color] - A color specification, as a hexadecimal string.
 * @prop {[number, number]} [colorIndices] - Indices of two colors to swap.
 * @prop {number} [zoom] - A scaling factor for the GUI.
 * @prop {number} [delta] - A mouse wheel delta value.
 * @prop {[number, number]} [ds] - A 2d coordinate change (dx, dy)
 * @prop {Point} [point] - A point indicating the location of a GUI action.
 * @prop {HexPoint} [added] - A HexPoint added during a tessellated hex tile swap.
 * @prop {HexPoint} [removed] - HexPoint removed during a tessellated hex tile swap.
 * @prop {HexSet} [tileShape] - A HexSet representing a hex tile.
 * @prop {[HexPoint, HexPoint][]} [tessellations] - A set of two HexPoints forming the basis of a
 * hex tile tessellation.
 */

/**
 * The global dispatch function for the Kaleidoscope application.
 * @typedef {React.Dispatch<DispatchAction>} Dispatch
 */

/** @type {(draft: GlobalState, action: DispatchAction) => GlobalState} */
export const reducer = (globalState, { type, ...action }) => {
  let skipRecordHistory = false;

  /** Update the application state. */
  let updated = produce(globalState, (draft) => {
    const { mode } = draft;
    /** @type {ModeState} */
    const state = draft[mode];
    switch (type) {
      /** Getters and setters */
      case DispatchTypes.globalSet: {
        const { name, value } = action;
        draft[name] = value;
      } break;
      case DispatchTypes.set: {
        const { name, value } = action;
        state[name] = value;
      } break;
      case DispatchTypes.toggle: {
        const { name } = action;
        state[name] = !state[name];
      } break;
      case DispatchTypes.setToggle: {
        const { name, value } = action;
        state[name] = (state[name] === value) ? null : value;
      } break;

      /** Global actions */
      case DispatchTypes.loadProject: draft[mode] = action.state; break;

      /** Viewport actions */
      case DispatchTypes.zoom: {
        const { zoom } = action;
        const { zoom: oldZoom, pan } = state;
        state.zoom = zoom;
        if (pan) state.pan = pan.multiply(zoom / oldZoom);
      } break;
      case DispatchTypes.pan: {
        const { ds } = action;
        const { pan } = state;
        state.pan = pan.add(ds);
      } break;

      /** History actions */
      case DispatchTypes.undo: {
        const { history } = state;
        if (history && history.index > 0) {
          history.index -= 1;
          draft[mode] = { ...state, ...history.records[history.index] };
        }
      } break;
      case DispatchTypes.redo: {
        const { history } = state;
        if (history && history.index + 1 < history.records.length) {
          history.index += 1;
          draft[mode] = { ...state, ...history.records[history.index] };
        }
      } break;

      /** Color palette actions */
      case DispatchTypes.colorSelect: {
        const { index } = action;
        const { tool } = state;
        const colorToolSelected = [Tools.colorFill, Tools.colorFlood].includes(tool);
        if (index === state.colorIndex) {
          state.colorIndex = null;
          if (colorToolSelected) state.tool = null;
        } else {
          state.colorIndex = index;
          if (!colorToolSelected) state.tool = Tools.colorFill;
        }
      } break;
      case DispatchTypes.colorAdd: {
        const { colors, tool } = state;
        const newColor = `#${Math.floor(Math.random() * 2 ** (8 * 3)).toString(16).padStart(6, '0')}`;
        colors.push(newColor);
        state.colorIndex = colors.length - 1;
        if (![Tools.colorFill, Tools.colorFlood].includes(tool)) state.tool = Tools.colorFill;
      } break;
      case DispatchTypes.colorChange: {
        const { color, index } = action;
        const { colors } = state;
        console.log(index);
        colors[index] = color;
        skipRecordHistory = true;
      } break;
      case DispatchTypes.colorChangeDismiss: {
        /**
         * If the new color is identical (i.e. if the user cancels the prompt), then there should be
         * no edit history difference between this state and the previous color state before the
         * edit was initiated.
         */
        const { colors, history } = state;
        if (history) {
          const prev = history.records[history.index].colors;
          if (
            prev.length === colors.length
            && prev.every((color, index) => colors[index] === color)
          ) state.colors = prev;
        }
      } break;
      case DispatchTypes.colorRemove: {
        const { index = state.colorIndex } = action;
        const { colors, colorIndex, tool } = state;
        colors.splice(index, 1);
        if (index === colorIndex) {
          state.colorIndex = null;
          if ([Tools.colorFill, Tools.colorFlood].includes(tool)) state.tool = null;
        } else if (index < colorIndex) state.colorIndex -= 1;
      } break;
      case DispatchTypes.colorSwap: {
        const { colorIndices: [i, j] } = action;
        const { colors, colorIndex } = state;
        const swapTemp = colors[i];
        colors[i] = colors[j];
        colors[j] = swapTemp;
        if (colorIndex === i) state.colorIndex = j;
        else if (colorIndex === j) state.colorIndex = i;
      } break;

      /** Hex editing actions. */
      case DispatchTypes.hexClick: {
        if (draft.grabbing) break; // Shouldn't happen, but would cause unexpected behavior.
        if (state.pan && draft.shiftKey) break; // Pseudo-pan, shouldn't interact with hexes.
        const { point } = /** @type {{ point: HexPoint }} */ (action);
        const { tool } = state;
        switch (tool) {
          case Tools.tileShape: {
            const { subtype } = action;
            switch (subtype) {
              case DispatchTypes.add: {
                state.tileShape = state.tileShape.clone();
                state.hexColors = state.hexColors.clone();
                const { tileShape, hexColors } = state;
                tileShape.add(point);
                hexColors.set(point, Hex.defaultColor);
                /**
                 * Recursively fills a hole specified by a HexMap instance.
                 * @param {HexPoint} start - The start point to fill the hole from.
                 */
                const fillHole = (start) => {
                  if (!(tileShape.has(start))) {
                    tileShape.add(start);
                    hexColors.set(start, Hex.defaultColor);
                    start.adjacent.forEach((adj) => fillHole(adj));
                  }
                };
                tileShape.holes().forEach(([[start, i]]) => fillHole(start.step(i)));
              } break;
              case DispatchTypes.remove: {
                state.tileShape = state.tileShape.clone();
                state.hexColors = state.hexColors.clone();
                const { tileShape, hexColors } = state;
                tileShape.delete(point);
                hexColors.delete(point);
                if (!tileShape.isConnected()) {
                  state.tileShape = tileShape.getComponent(HexPoint.origin);
                  hexColors.forEach((_color, coords) => {
                    if (!state.tileShape.has(coords)) hexColors.delete(coords);
                  });
                }
              } break;
              default: {
                console.warn(`Unrecognized tile shape action: ${subtype}`);
                break;
              }
            }
          } break;
          case Tools.tileSwap: {
            const { added, removed } = action;
            state.tileShape = state.tileShape.clone();
            state.hexColors = state.hexColors.clone();
            const {
              tileShape, hexColors, tessellations, tessellationIndex,
            } = state;
            const tessellation = tessellations[tessellationIndex];

            /** Swap the two tiles */
            tileShape.add(added).delete(removed);
            hexColors.set(added, hexColors.get(removed)).delete(removed);

            /**
             * Modify the principal translations if necessary such that each one is adjacent to the
             * main hex. If one translation is not adjacent, adding or subtracting the other
             * translation should achieve this.
             */
            tessellation.forEach((translation, i) => {
              /** Skip if already adjacent. */
              if (tileShape.adjacentTo(tileShape.translate(translation))) return;

              const other = tessellation[Number(!i)];
              const sum = translation.add(other);
              if (tileShape.adjacentTo(tileShape.translate(sum))) {
                tessellation[i] = sum;
              } else {
                tessellation[i] = translation.subtract(other);
              }
            });
          } break;
          case Tools.colorFill: {
            const { colors, colorIndex } = state;
            const color = colors[colorIndex];
            const prevColor = getHexColor(mode, state.hexColors, point);
            if (color === prevColor) break;

            state.hexColors = state.hexColors.clone();
            const { hexColors } = state;
            setHexColor(mode, hexColors, point, color);
          } break;
          case Tools.colorFlood: {
            const { colors, colorIndex } = state;
            const color = colors[colorIndex];
            const prevColor = getHexColor(mode, state.hexColors, point);
            if (!prevColor || color === prevColor) break;

            state.hexColors = state.hexColors.clone();
            const { hexColors } = state;
            /**
             * Recursively explores the area around a hex to flood-replace a given color.
             * @param {HexPoint} start - The point to explore all adjacent points from.
             */
            const explore = (start) => {
              setHexColor(mode, hexColors, start, color);
              start.adjacent.forEach((adj) => {
                if (getHexColor(mode, hexColors, adj) === prevColor) explore(adj);
              });
            };
            explore(point);
          } break;
          case Tools.colorClear: {
            if (!getHexColor(mode, state.hexColors, point)) break;
            state.hexColors = state.hexColors.clone();
            const { hexColors } = state;
            clearHexColor(mode, hexColors, point);
          } break;
          case Tools.colorEyedropper: {
            const { hexColors, colors } = state;
            const color = getHexColor(mode, hexColors, point);
            if (!color) break;
            colors.push(color);
            state.colorIndex = colors.length - 1;
          } break;
          default: break;
        }
      } break;
      case DispatchTypes.hexDoubleClick: {
        if (draft.grabbing) break; // Shouldn't happen, but would cause unexpected behavior.
        if (state.pan && draft.shiftKey) break; // Pseudo-pan, shouldn't interact with hexes.
        /** Same as hexClick for removing a color. */
        const { point } = /** @type {{ point: HexPoint }} */ (action);
        const { hexColors } = state;
        if (!getHexColor(mode, hexColors, point)) break;
        state.hexColors = hexColors.clone();
        clearHexColor(mode, state.hexColors, point);
      } break;

      /** Hex freestyle actions. */
      case DispatchTypes.clearAll: {
        const { hexColors } = /** @type {ModeState} */ (InitialState[mode]);
        state.hexColors = hexColors;
      } break;

      /** Hex tessellation actions. */
      case DispatchTypes.tessellationLoad: {
        const { tileShape: signature, tessellations: newTessellations } = action;
        const { tileShape, tessellations, tessellationIndex } = state;

        /** Do not update tessellations if this is the result for an old tile shape. */
        if (signature !== tileShape) break;

        /** Load in the new tessellation. */
        state.tessellationPending = false;
        const prev = tessellations?.[tessellationIndex];
        state.tessellations = newTessellations;

        /** If this is the result of tile swapping, then keep the old tessellation. */
        if (prev) {
          const prevInv = inv(prev.map((point) => [...point]));
          const index = state.tessellations.findIndex(
            (tessellation) => flatten(multiply(tessellation, prevInv))
              .every((x) => Math.abs(x - Math.round(x)) < 1e-14),
          );
          state.tessellationIndex = (index === -1) ? null : index;
        } else state.tessellationIndex = null;
      } break;

      /** Default fallthrough: warning */
      default: {
        console.warn(`Unrecognized action type: ${type}`);
      }
    }
  });

  /** Record history changes, unless overridden */
  const { mode } = updated;
  /** @type {ModeState} */
  const state = updated[mode];
  if (!skipRecordHistory && 'history' in state) {
    const { history } = state;
    const prev = history.records[history.index];
    const triggerFields = History.triggerFields[mode];
    if (triggerFields.some((field) => state[field] !== prev[field])) {
      const start = Math.max(0, history.index - History.maxLength + 2);
      updated = produce(updated, (draft) => {
        /** @type {HistoryState} */
        const historyDraft = draft[mode].history;
        historyDraft.records = history.records.slice(start, history.index + 1);
        historyDraft.records.push(createHistoryRecord(mode, state));
        historyDraft.index = historyDraft.records.length - 1;
      });
    }
  }

  return updated;
};

/**
 * Creates a JSON string representing the serialized application state.
 * @param {GlobalState} globalState - The current application state.
 * @returns {string} A JSON string representing the serialized application
 * state.
 */
export const saveJSON = (globalState) => {
  const { mode } = globalState;
  /** @type {ModeState} */
  const state = globalState[mode];
  const savedFields = Save.savedFields[mode];
  const record = Object.fromEntries(savedFields.map((key) => [key, state[key]]));
  return JSON.stringify(
    { version: Package.version, mode, record },
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
        const object = { dataType: 'PointSet', data: value.values() };
        if (value instanceof HexSet) object.dataType = 'HexSet';
        return object;
      }
      return value;
    },
  );
};

/** @typedef {{ mode: string, state: ModeState }} LoadResult */

/**
 * Deserializes a serialized JSON string representing the application state for a particular mode.
 * Throws an error if the file cannot be parsed.
 * @param {string} text - Serialized JSON string representing a particular mode state.
 * @returns {LoadResult} An object containing the application mode of the deserialized JSON and the
 * data in the deserialized JSON.
 */
export const loadJSON = (text) => {
  /** @type {{ version: string, mode: Modes, record: * }} */
  const result = JSON.parse(text, (_key, value) => {
    switch (value?.dataType) {
      case 'HexMap': return new HexMap(value.data);
      case 'HexPoint': return new HexPoint(...value.data);
      case 'HexSet': return new HexSet(value.data);
      case 'Point': return new Point(...value.data);
      case 'PointMap': return new PointMap(value.data);
      case 'PointSet': return new PointSet(value.data);
      default: return value;
    }
  });

  /** Incrementally update the save state version to the most recent. */
  try {
    while (result.version !== Package.version) {
      switch (result.version) {
        case '0.1.1': {
          if (result.mode !== 'hex-freestyle') throw new Error('Unrecognized application mode');
          result.mode = 'hexFreestyle';
          /** @see HexFreestyleState */
          const record = {
            hexColors: new PointMap(), // Incorrect format; still need to fix.
            colors: result.colors,
            colorIndex: InitialState.hexFreestyle.colorIndex,
            tool: null,
            pan: result.pan,
            zoom: result.zoom,
            showEmpty: InitialState.hexFreestyle.showEmpty,
          };
          /** @type {PointMap<string>} */ (result.tiledata).forEach((color, point) => {
            const hexPoint = new HexPoint(...point);
            setHexColor('hexFreestyle', record.hexColors, hexPoint, color);
          });
          delete result.tiledata;
          delete result.colors;
          delete result.pan;
          delete result.zoom;
          result.record = record;
          result.version = '0.2.0';
        } break;
        default: throw new Error('Unknown file save version');
      }
    }
  } catch (err) {
    throw new Error(`Cannot convert from save file version ${result.version}: ${err.message}`);
  }

  /** Verify the mode of the save state. */
  const { mode } = result;
  if (!(mode in Modes)) throw new Error(`Unknown Kaleidoscope application mode: ${mode}`);
  const reqFields = Save.savedFields[mode].sort();
  const fields = Object.keys(result.record).sort();
  if (
    fields.length !== reqFields.length
    || fields.some((field, index) => field !== reqFields[index])
  ) throw new Error(`The data fields in the save file do not match those expected for Kaleidoscope application mode: ${mode}`);
  /** @type {ModeState} */
  const state = { ...InitialState[mode], ...result.record };
  if ('history' in state) state.history = initHistory(mode, state);
  return { mode, state };
};

/**
 * Finds all possible tessellation arrangements for a continuous tile made of hexagons.
 * @param {HexSet} tileShape - A tile to determine tessellations for.
 * @returns {[HexPoint, HexPoint][]} A list of translations generating a valid tessellation.
 */
export const tessellate = (tileShape) => {
  /** Determine all possible adjacent translations */
  /** @type {HexPointSet} */
  const explored = new PointSet().add(HexPoint.origin);
  /** @type {[HexPoint, HexSet][]} */
  const path = [];
  /** @type {(translation: HexPoint) => void} */
  const explore = (translation) => {
    if (explored.has(translation)) return;
    explored.add(translation);
    const tile = tileShape.translate(translation);
    if (!tileShape.adjacentTo(tile)) return;
    if (!tileShape.overlaps(tile)) path.push([translation, tile]);
    for (let i = 0; i < 4; i += 1) explore(translation.step(i));
  };
  explore(new HexPoint(1, 0));

  /** Determine which translation combinations yield valid tessellations */
  /** @type {[HexPoint, HexPoint][]} */
  const tessellations = [];
  /** @type {HexPointSet} */
  const exclude1 = new PointSet();
  /** @type {HexPointSet} */
  const exclude2 = new PointSet();
  while (path.length > 0) {
    const [translation1, tile1] = /** @type {[HexPoint, HexSet]} */ (path.shift());
    if (!exclude1.has(translation1)) {
      exclude2.clear();
      path.forEach(([translation2, tile2]) => {
        if (exclude2.has(translation2)) return;
        if (tile1.adjacentTo(tile2) && !tile1.overlaps(tile2)) {
          const merged = /** @type {HexSet} */ (tileShape.clone()).merge(tile1).merge(tile2)
            .merge(tile1.translate(translation2));
          if (merged.holes().length === 0) {
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
 * @param {HexSet} tileShape - A tile to determine swaps for.
 * @param {[HexPoint, HexPoint]} tessellation - The two translations determining the tile's
 * tessellation pattern.
 * @param {HexPoint[]} exclude - An optional list of hexes to exclude from the swap search.
 * @returns {HexPointMap<HexPoint>} A mapping of swappable adjacent hexes to corresponding points
 * within the tile.
 */
export const getSwaps = (tileShape, tessellation, exclude = []) => {
  /** Determine which points can be swapped (without breaking the component) */
  /** @type {HexPointSet} */
  const swappable = new PointSet();
  /** @type {HexPointSet} */
  const excludeSet = new PointSet(exclude);
  const perimeter = tileShape.perimeter().map(([point]) => point);
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

  /** Determine which adjacent hexes correspond to swappable hexes. */
  const adjacent = new PointSet(tileShape.adjacent());
  const edges = new PointSet(tileShape.edges());
  const swaps = /** @type {HexPointMap<HexPoint>} */ (new PointMap());
  swappable.forEach((point) => HexPoint.steps.forEach((step) => {
    const translated = point.add(multiply(step, tessellation.slice()));
    if (
      adjacent.has(translated)
      && translated.adjacent.some((adj) => !adj.equals(point) && edges.has(adj))
    ) swaps.set(translated, point);
  }));
  return swaps;
};
