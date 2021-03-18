import React from 'react';
import './Hexagon.scss';
import { multiply, transpose, add, subtract, smaller, larger, min, max,
  deepEqual, lup, ceil, lusolve, floor, flatten } from 'mathjs';

const hexconst = {
  shape: transpose([
    multiply(Math.cos(Math.PI/6), [1,0,-1,-1,0,1]),
    [1/2,1,1/2,-1/2,-1,-1/2]
  ]),
  radius: 50,
  apothem: undefined,
  vertices: undefined,
  margin: 7.5,
  spacing: Array(2),
  stroke_width: 5,
  border_color: 'black',
  border_vertices: undefined,
  border_vertices_concave: undefined
}
hexconst.apothem = hexconst.radius * Math.cos(Math.PI/6);
hexconst.vertices = multiply(hexconst.radius, hexconst.shape);
hexconst.spacing = multiply(
  hexconst.apothem*2 + hexconst.margin,
  [[1,1/2],
   [0,Math.cos(Math.PI/6)]]
);
hexconst.border_vertices = multiply(
  hexconst.radius + hexconst.stroke_width/2/Math.cos(Math.PI/6),
  hexconst.shape
);
hexconst.border_vertices_concave = add(hexconst.border_vertices,
  multiply(
    (hexconst.margin - hexconst.stroke_width)/2/Math.cos(Math.PI/6),
    hexconst.shape.slice(-1).concat(hexconst.shape.slice(0,-1))
  )
);

class Hexagon extends React.PureComponent {

  static Map = (map => class {
    constructor(iterable) {
      if (iterable instanceof Hexagon.Map)
        this[map] = new Map(iterable[map]);
      else {
        this[map] = new Map();
        if (iterable) for (let entry of iterable) this.set(...entry);
      }
    }
    get size() { return this[map].size; }
    clear() { this[map].clear(); }
    delete(point) { return this[map].delete(point?.toString()); }
    get(point) { return this[map].get(point?.toString())?.[1]; }
    has(point) { return this[map].has(point?.toString()); }
    set(point, value) {
      this[map].set(point?.toString(), [point, value]);
      return this;
    }
    [Symbol.iterator]() { return this.entries(); }
    *keys() { for (let [point] of this.entries()) yield point; }
    *values() { for (let [,value] of this.entries()) yield value; }
    entries() { return this[map].values(); }
    forEach(callbackFn, thisArg=this) {
      for (let [point, value] of this.entries())
        callbackFn.call(thisArg, value, point);
    }
  })(Symbol('map'));

  static Set = (map => class {
    constructor(iterable) {
      if (iterable instanceof Hexagon.Set)
        this[map] = new Hexagon.Map(iterable[map]);
      else {
        this[map] = new Hexagon.Map();
        if (iterable) for (let point of iterable) this.add(point);
      }
    }
    get size() { return this[map].size; }
    add(point) {
      this[map].set(point, point);
      return this;
    }
    clear() { this[map].clear(); }
    delete(point) { return this[map].delete(point); }
    has(point) { return this[map].has(point); }
    [Symbol.iterator]() { return this.values(); }
    keys() { return this.values(); }
    values() { return this[map].keys(); }
    entries() { return this[map].entries(); }
    forEach(callbackFn, thisArg=this) {
      for (let point of this.values())
        callbackFn.call(thisArg, point);
    }
  })(Symbol('map'));

  static add(p1, p2) {
    return add(p1, p2);
  }

  static subtract(p1, p2) {
    return subtract(p1, p2);
  }

  static steps = [
    [1,0],
    [0,1],
    [-1,1],
    [-1,0],
    [0,-1],
    [1,-1]
  ];

  static step(point, i) {
    return this.add(point, this.steps[i])
  }

  static forEachAdjacent(point, callback) {
    for (let i = 0; i < 6; ++i) {
      const other_point = this.step(point, i);
      callback(other_point, i);
    }
  }

  static someAdjacent(point, test) {
    for (let i = 0; i < 6; ++i) {
      const other_point = this.step(point, i);
      if (test(other_point, i)) return true;
    }
    return false;
  }

  static everyAdjacent(point, test) {
    return !this.someAdjacent(point, (...args) => !test(...args));
  }

  static isAdjacent(p1, p2) {
    return this.someAdjacent(p1, point => deepEqual(point, p2));
  }

  static translate(tile, translate) {
    const translated = new this.Map();
    for (const [point, data] of tile)
      translated.set(this.add(point, translate), data);
    return translated;
  }

  static hasOverlap(tile1, tile2, translate=null) {
    let [smaller, larger] = [tile1, tile2].sort(tile => tile.size);
    if (translate) {
      if (smaller === tile1) translate = multiply(translate, -1);
      smaller = this.translate(smaller, translate);
    }
    for (const point of smaller.keys())
      if (larger.has(point)) return true;
    return false;
  }

  static tilesAdjacent(tile1, tile2, translate=null) {
    let [smaller, larger] = [tile1, tile2].sort(tile => tile.size);
    if (translate) {
      if (smaller === tile1) translate = multiply(translate, -1);
      smaller = this.translate(smaller, translate);
    }
    for (const point of smaller.keys())
      if (this.someAdjacent(point, adj_point => larger.has(adj_point))) return true;
    return false;
  }

  static merge(...tiles) {
    const merged = new this.Map();
    for (const tile of tiles) {
      for (let [point, data] of tile) {
        if (merged.has(point))
          throw new Error(`Improper Usage: Overlap between hexes at ${point}`);
        merged.set(point, data);
        this.forEachAdjacent(point, (adj_point, i) => {
          const adj_data = merged.get(adj_point);
          if (adj_data && data.edges & (1<<i)) {
            data = {...data,
              edges: data.edges & ~(1<<i)
            };
            merged.set(point, data);
            merged.set(adj_point, {...adj_data,
              edges: adj_data.edges & ~(1<<(i+3)%6)
            });
          }
        });
      }
    }
    return merged;
  }

  static getConnectedPart(tile, start_point) {
    const part = new this.Map();
    const start_data = tile.get(start_point);
    if (start_data) {
      part.set(start_point, start_data);
      const queue = [start_point];
      while (queue.length) {
        const point = queue.shift();
        this.forEachAdjacent(point, adj_point => {
          const adj_data = tile.get(adj_point);
          if (adj_data && !part.has(adj_point)) {
            part.set(adj_point, adj_data);
            queue.push(adj_point);
          }
        });
      }
    }
    return part;
  }

  static getConnectedParts(tile) {
    const explored = new this.Set();
    const parts = [];
    for (const point of tile.keys()) {
      if (!explored.has(point)) {
        const part = this.getConnectedPart(tile, point);
        parts.push(part);
        for (const point of part.keys()) explored.add(point);
      }
    };
    return parts;
  }

  static isConnected(tile) {
    const start_point = tile.keys().next().value;
    const part = this.getConnectedPart(tile, start_point);
    for (const point of tile.keys()) if (!part.has(point)) return false;
    return true;
  }

  static getBorders(tile) {
    const explored_edges = new this.Map();
    for (const point of tile.keys()) explored_edges.set(point, 0);
    const borders = [];
    for (let [point, data] of tile) {
      for (let i = 0; i < 6; ++i) {
        if (data.edges & (1<<i) && !(explored_edges.get(point) & (1<<i))) {
          const start_point = point;
          const start_edge = i;
          const border = [];
          do {
            border.push([point,i]);
            explored_edges.set(point, explored_edges.get(point) | (1<<i));
            i = (i+1) % 6;
            if (!(data.edges & (1<<i))) {
              point = this.step(point, i);
              data = tile.get(point);
              i = (i+4) % 6;
            }
          } while (!deepEqual(point, start_point) || i !== start_edge);
          borders.push(border);
        }
      }
    };
    return borders;
  }

  static getPerimeter(tile, borders=null) {
    if (!this.isConnected(tile)) throw new Error('Improper Usage: Tile is not connected');
    if (!borders) borders = this.getBorders(tile);
    if (borders.length === 1) return borders[0];
    let min_point = [Infinity,Infinity];
    let max_point = [-Infinity,-Infinity];
    let perimeter;
    for (const border of borders) {
      for (const [point, edge] of border) {
        const edge_point = this.step(point, edge);
        if (smaller(edge_point, min_point).includes(true)) {
          min_point = min([edge_point, min_point], 0);
          perimeter = border;
        }
        if (larger(edge_point, max_point).includes(true)) {
          max_point = max([edge_point, max_point], 0);
          perimeter = border;
        }
      }
    }
    return perimeter;
  }

  static getHoles(tile) {
    const borders = this.getBorders(tile);
    const perimeter = this.getPerimeter(tile, borders);
    return borders.filter(border => border !== perimeter);
  }

  static hasHoles(tile) {
    return this.isConnected(tile) && this.getBorders(tile).length > 1;
  }

  static visibleInBox(t,r,b,l) {
    const x_spacing = hexconst.spacing[0][0];
    const y_spacing = hexconst.spacing[1][1];
    let leftMost = Math.ceil(2*l / x_spacing) - 1; // Measured in half hexes
    let rightMost = Math.floor(2*r / x_spacing) + 1; // Measured in half hexes
    let topMost = Math.ceil((t + hexconst.radius/2) / y_spacing) - 1; // Measured in rows
    let bottomMost = Math.floor((b - hexconst.radius/2) / y_spacing) + 1; // Measured in rows
    let ldiff = leftMost - topMost;
    let rdiff = rightMost - topMost;
    return {
      t: topMost,
      b: bottomMost,
      l: Math.ceil(ldiff/2),
      r: Math.floor(rdiff/2),
      lskew: Math.abs(ldiff) % 2,
      rskew: Math.abs(rdiff+1) % 2
    };
  }

  static *getTilesInWindow(window, tessellation) {
    tessellation = transpose(tessellation);
    const tr_lup = lup(multiply(hexconst.spacing, tessellation));
    let min_point = [Infinity,Infinity];
    let max_point = [-Infinity,-Infinity];
    [window[0], window[1], [window[0][0],window[1][1]], [window[1][0],window[0][1]]]
    .forEach(vertex => {
      const sol = flatten(lusolve(tr_lup, vertex)).toArray();
      min_point = min([floor(sol), min_point], 0);
      max_point = max([ceil(sol), max_point], 0);
    });
    for (let i = min_point[0]; i <= max_point[0]; ++i)
      for (let j = min_point[1]; j <= max_point[1]; ++j)
        yield multiply(tessellation, [i,j]);
  }

  static Outline = React.memo(props => {
    const {tile} = props;
    const points = [];
    const perimeter = this.getPerimeter(tile);
    perimeter.reduce((prev_point, [point, i]) => {
      const center = multiply(hexconst.spacing, point);
      if (!deepEqual(point, prev_point))
        points.push(add(center, hexconst.border_vertices_concave[(i+5)%6]));
      points.push(add(center, hexconst.border_vertices[i]));
      return point;
    }, perimeter[perimeter.length-1][0]);
    return (
      <svg className='Hexagon_Outline'>
        <polygon points={points.join(' ')} fill='none'
        strokeWidth={hexconst.stroke_width} stroke={hexconst.border_color}/>
      </svg>
    );
  });

  static Tile = React.memo(props => {
    const {
      tile,
      outline=false,
      color_override,
      x, y,
      style
    } = props;
    const hexes = [];
    for (let [point, {color='lightgray'}] of tile) {
      if (color_override) color = color_override;
      const center = multiply(hexconst.spacing, point);
      hexes.push(
        <polygon key={point}
        points={hexconst.vertices.map(vertex => add(center, vertex)).join(' ')}
        fill={color} stroke='none'/>
      );
    }
    const derived_style = {...style};
    if (x || y) {
      derived_style.transform = `translate(${multiply(hexconst.spacing, [x,y]).join('px,')}px`;
      if (style?.transform) derived_style.transform += style.transform;
    }
    return (
      <svg className='Hexagon_Tile' style={derived_style}>
        {outline && <Hexagon.Outline tile={tile}/>}
        {hexes}
      </svg>
    );
  });

  render() {
    const {
      className,
      color,
      x, y,
      style,
      draggable=false,
      ...other
    } = this.props;
    const point = [x,y];
    for (const [key, val] of Object.entries(other)) {
      if (key.startsWith('on') && typeof val === 'function')
        other[key] = e => val(e, point);
    }
    const derived_className = ['Hexagon'];
    if (className) derived_className.push(className);
    const derived_style = {...style,
      transform: 'translate(-50%,-50%)' +
        `translate(${multiply(hexconst.spacing, point).join('px,')}px`
    };
    if (style?.transform) derived_style.transform += style.transform;
    if (color) derived_style.backgroundColor = color;
    return (
      <div className={derived_className.join(' ')} draggable={draggable}
      style={derived_style}
      {...other}/>
    );
  }
}

export default Hexagon;
