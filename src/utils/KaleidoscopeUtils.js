import { multiply } from "mathjs";
import { HexPoint, HexTile } from "./HexUtils";
import Point, { PointMap, PointSet } from "./Point";

const VERSION = '0.1.1';

const HISTORY_FIELDS = {
  'hex-tessellate': ['tiledata', 'colors'],
  'hex-freestyle': ['tiledata', 'colors']
};
const HISTORY_META_FIELDS = {
  'hex-tessellate': ['tile_shape_signature', 'tessellation_signature', 'tessellations',
    'tessellation_index', 'color_index', 'tool'],
  'hex-freestyle': ['chunk_signatures', 'color_index', 'tool']
};
const HISTORY_MAX_LENGTH = 100;
export const coalesceHistory = (mode, next) => {
  if (!(mode in HISTORY_FIELDS)) return;
  let {history=[], history_index=-1} = next;
  let prev = history[history_index] ?? {};
  let record = {};
  let do_update = false;
  HISTORY_FIELDS[mode].forEach(field => {
    record[field] = next[field];
    if (next[field] !== prev[field]) do_update = true;
  });
  if (do_update) {
    HISTORY_META_FIELDS[mode].forEach(field => record[field] = next[field]);
    let start = Math.max(0, history_index - HISTORY_MAX_LENGTH + 2);
    next.history = history.slice(start, history_index + 1);
    next.history.push(record);
    next.history_index = next.history.length - 1;
  }
}

export const MODES = {
  'hex-tessellate': 'Hexagon Tessellation',
  'hex-freestyle': 'Hexagon Freestyle'
}

export const TOOLS = {
  'tile-shape': 'Change Tile Shape',
  'tile-swap': 'Swap Hexes',
  'pan': 'Pan',
  'fill-color': 'Fill Color',
  'flood-color': 'Paint Bucket',
  'clear-color': 'Clear Color',
  'eyedropper-color': 'Eyedropper',
}

export const MIN_ZOOM = 0.2;
export const MAX_ZOOM = 3.0;
export const ZOOM_WHEEL_SENSITIVITY = 0.0025;

export const CHUNK_SIZE = 8;

export const INITIAL_STATE = {
  shiftKey: false,
  grabbing: false,
  sidebar: true,
  modal: null,
  mode: 'hex-freestyle',
  'hex-tessellate': {
    tiledata: new HexTile([[new HexPoint(0,0), '#ffffff']]),
    tile_shape_signature: Symbol(),
    colors: ['#ff0000','#00ff00','#0000ff'],
    color_index: null,
    tessellations: null,
    tessellation_signature: null,
    tessellation_index: null,
    tool: 'tile-shape',
    zoom: 1.0,
    show_outline: true
  },
  'hex-freestyle': {
    tiledata: new PointMap(),
    chunk_signatures: new PointMap(),
    colors: ['#ff0000','#00ff00','#0000ff'],
    color_index: null,
    tool: null,
    pan: new Point(0,0),
    zoom: 1.0,
    show_empty: true
  }
};
['hex-freestyle'].forEach(mode => coalesceHistory(mode, INITIAL_STATE[mode]));

const SAVED_FIELDS = {
  'hex-tessellate': ['tiledata','colors','tessellations','show_outline','zoom'],
  'hex-freestyle': ['tiledata','colors','pan','zoom']
};
export const saveJSON = (mode, current) => {
  let save_state = {mode: mode};
  SAVED_FIELDS[mode].forEach(key => save_state[key] = current[key]);
  return JSON.stringify({version: VERSION, ...save_state}, (_key, value) => {
    if (value instanceof HexPoint) return {
      dataType: 'HexPoint',
      data: [...value]
    }
    if (value instanceof Point) return {
      dataType: 'Point',
      data: [...value]
    }
    if (value instanceof HexTile) return {
      dataType: 'HexTile',
      data: [...value]
    };
    if (value instanceof PointMap) return {
      dataType: 'PointMap',
      data: [...value]
    }
    if (value instanceof PointSet) return {
      dataType: 'PointSet',
      data: [...value]
    }
    return value;
  });
};
export const loadJSON = text => {
  let result;
  try {
    result = JSON.parse(text, (_key, value) => {
      if (value?.dataType === 'HexPoint') return new HexPoint(...value.data);
      if (value?.dataType === 'Point') return new Point(...value.data);
      if (value?.dataType === 'HexTile') return new HexTile(value.data);
      if (value?.dataType === 'PointMap') return new PointMap(value.data);
      if (value?.dataType === 'PointSet') return new PointSet(value.data);
      // Legacy
      if (value?.dataType === 'Hexagon_Tile')
        return new HexTile(value.data.map(([point, value]) => [new HexPoint(...point), value]));
      if (value?.dataType === 'Hexagon_PointMap')
        return new PointMap(value.data.map(([point, value]) => [new Point(...point), value]));
      if (value?.dataType === 'Hexagon_PointSet')
        return new PointSet(value.data.map(point => new Point(...point)));
      return value;
    });
  } catch (e) {
    return;
  }
  while (result.version !== '0.1.1') {
    switch (result.version) {
      case '0.1.0':
        if (result.pan) result.pan = new Point(result.pan.x, result.pan.y);
        if (result.tiledata) {
          result.tiledata.forEach(({color}, point) => result.tiledata.set(point, color));
        }
        result.version = '0.1.1';
      break;
      case undefined:
        result.mode = 'hex-freestyle';
        result.tiledata = new PointMap(Object.entries(result.hexcolors).map(([key, color]) =>
          [new Point(...key.split(',').map(Number)), {color: color}]
        ));
        delete result.hexcolors;
        result.version = '0.1.0';
      break;
      default: return;
    }
  }
  delete result.version;
  let {mode, ...data} = result;
  let fields = new Set(SAVED_FIELDS[mode]);
  for (let field in data) {
    if (!fields.has(field)) return;
    fields.delete(field);
  }
  if (fields.size) return;
  data = {...INITIAL_STATE[mode], ...data};
  if (data.chunk_signatures) {
    data.chunk_signatures  = data.chunk_signatures.clone();
    for (let point of data.tiledata.keys())
      data.chunk_signatures.set(point.divide(CHUNK_SIZE).floor(), Symbol());
  }
  if (mode in HISTORY_FIELDS) {
    delete data.history;
    delete data.history_index;
    coalesceHistory(mode, data);
  }
  return {mode, data};
}

export const tessellate = tiledata => {
  let explored = new PointSet([new HexPoint(0,0)]);
  let path = [];
  const explore = translation => {
    if (explored.has(translation)) return;
    explored.add(translation);
    let tile = tiledata.translate(translation);
    if (!tiledata.adjacentTo(tile)) return;
    if (!tiledata.overlaps(tile))
      path.push([translation, tile]);
    for (let i = 0; i < 4; ++i) explore(translation.step(i));
  }
  explore(new HexPoint(1,0));
  let tessellations = [];
  let exclude1 = new PointSet();
  let exclude2 = new PointSet();
  while (path.length) {
    let [translation1, tile1] = path.shift();
    if (exclude1.has(translation1)) continue;
    exclude2.clear();
    path.forEach(([translation2, tile2]) => {
      if (exclude2.has(translation2)) return;
      if (tile1.adjacentTo(tile2) && !tile1.overlaps(tile2)) {
        let merged = new HexTile(tiledata).merge(tile1).merge(tile2)
          .merge(tile1.translate(translation2));
        if (!merged.holes().length) {
          tessellations.push([translation1, translation2]);
          exclude1.add(translation2);
          exclude2.add(translation1.subtract(translation2));
        }
      }
    });
  };
  return tessellations;
};

const steps = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1]
];

export const getSwaps = (tiledata, tessellation, exclude=[]) => {
  let swappable = new PointSet();
  exclude = new PointSet(exclude);
  let perimeter = tiledata.perimeter().map(([point]) => point);
  perimeter.reduce((prev, next) => {
    if (!next.equals(prev)) {
      if (!exclude.has(next)) {
        if (swappable.has(next)) {
          swappable.delete(next);
          exclude.add(next);
        } else swappable.add(next);
      }
    }
    return next;
  }, perimeter[perimeter.length - 1]);
  let adjacent = new PointSet(tiledata.adjacent());
  let edges = new PointSet(tiledata.edges());
  let swaps = new PointMap();
  swappable.forEach(point =>
    steps.forEach(step => {
      let translated = point.add(multiply(step, tessellation));
      if (adjacent.has(translated) && translated.someAdjacent(adj =>
        !adj.equals(point) && edges.has(adj)
      )) swaps.set(translated, point);
    })
  );
  return swaps;
};
