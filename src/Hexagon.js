import React from 'react';
import './Hexagon.scss';
import { multiply, transpose, add, subtract, smaller, larger, min, max,
  deepEqual, lup, ceil, lusolve, floor, flatten } from 'mathjs';
import CustomMap from './utils/CustomMap';
import CustomSet from './utils/CustomSet';

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

export class Point extends Array {
  static steps = Object.freeze([
    [1,0], [0,1], [-1,1], [-1,0], [0,-1], [1,-1]
  ].map(Object.freeze));
  static equal(p1, p2) { return deepEqual(p1, p2); }
  constructor(point) {
    super(...point);
    this.key = super.toString();
    Object.freeze(this);
  }
  toString() { return this.key; }
  equals(other) { return Point.equal(this, other); }
  add(other) { return new Point(add(this, other)); }
  subtract(other) { return new Point(subtract(this, other)); }
  step(i) { return this.add(Point.steps[i]); }
  forEachAdjacent(callback) {
    for (let i = 0; i < 6; ++i) callback(this.step(i), i);
  }
  someAdjacent(test) {
    for (let i = 0; i < 6; ++i) if (test(this.step(i), i)) return true;
    return false;
  }
  everyAdjacent(test) {
    return this.someAdjacent(...args => !test(...args));
  }
  adjacentTo(other) {
    return this.someAdjacent(adj_point => deepEqual(adj_point, other));
  }
}

export const PointMap = (() => {
  const hashFn = point => point.key;
  return class extends CustomMap {
    static Point = Point;
    constructor(entries) {
      super(entries, hashFn);
    }
  };
})();

export const PointSet = (() => {
  const hashFn = point => point.key;
  return class extends CustomSet {
    static Point = Point;
    constructor(entries) {
      super(entries, hashFn);
    }
  };
})();

export const Tile = (() => {
  class Component {
    static borderNode(point, edges) {
      let concavity = 0;
      let next = [];
      for (let i = 0, j = 5; i < 6; j = i++) {
        if (edges & (1<<i)) {
          if (edges & (1<<j)) ++concavity;
          else --concavity;
        } else if (edges & (1<<j)) next.push(point.step(i));
      }
      return {edges: edges, concavity: concavity, next: next};
    }
    constructor(start) {
      if (start instanceof Component) {
        this.points = new PointSet(start.points);
        this.borders = new Set();
        this.borders_by_point = new PointMap();
        for (let border of start.borders) {
          let is_perimeter = border === start.perimeter;
          border = new PointMap(border);
          if (is_perimeter) this.perimeter = border;
          this.borders.add(border);
          for (let point of border.keys())
            this.borders_by_point.set(point, border);
        }
      } else {
        this.points = new PointSet([start]);
        this.perimeter = new PointMap();
        this.borders = new Set([this.perimeter]);
        this.borders_by_point = new PointMap();
        start.forEachAdjacent((point, i) => {
          this.perimeter.set(point, Component.borderNode(point, 1<<(i+3)%6));
          this.borders_by_point.set(point, this.perimeter);
        });
      }
    }
    get size() { return this.points.size; }
    add(point) {
      let border = this.borders_by_point.get(point);
      if (!border) throw new Error("Can't add a non-adjacent point to this component");
      this.borders_by_point.delete(point);
      let node = border.get(point);
      border.delete(point);
      if (border.size) {
        for (let i = 0; i < 6; ++i) {
          if (node.edges & (1<<i)) continue;
          let adj_point = point.step(i);
          let edges = border.get(adj_point)?.edges ?? 0;
          if (!edges) this.borders_by_point.set(adj_point, border);
          border.set(adj_point, Component.borderNode(adj_point, edges | (1<<(i+3)%6)));
        }
      } else this.borders.delete(border);
      for (let start_point of node.next.slice(1)) this.splitBorder(border, start_point);
      this.points.add(point);
      return this;
    }
    delete(point) {
      if (!this.points.delete(point))
        throw new Error("Can't delete a point that's not in this component");
      let border = this.borders_by_point.get(point.step(5));
      let edges = border ? 0 : 1<<5;
      let to_split = [];
      let split_next = Boolean(border);
      let first_split = true;
      for (let i = 0, j = 5; i < 6; j = i++) {
        let adj_point = point.step(i);
        if (!this.has(adj_point)) {
          if (edges & (1<<j)) {
            let adj_border = this.borders_by_point.get(adj_point);
            if (!border) border = adj_border;
            if (adj_border !== border) {
              this.mergeBorder(adj_border, border);
              this.borders.delete(adj_border);
              if (this.perimeter === adj_border) this.perimeter = border;
            } else split_next = true;
          }
          let adj_edges = border.get(adj_point).edges & ~(1<<(i+3)%6);
          if (!adj_edges) {
            border.delete(adj_point);
            this.borders_by_point.delete(adj_point);
          } else border.set(adj_point, Component.borderNode(adj_point, adj_edges));
        } else {
          edges |= 1<<i;
          if (split_next) {
            if (first_split) first_split = false;
            else to_split.push(adj_point);
            split_next = false;
          }
        }
      }
      if (!edges) throw new Error("Can't delete the only point in this component");
      if (!border) {
        border = new PointMap();
        this.borders.add(border);
      }
      border.set(point, Component.borderNode(point, edges));
      this.borders_by_point.set(point, border);
      return to_split.map(start_point => this.split(border, start_point));
    }
    has(point) { return this.points.has(point); }
    [Symbol.iterator]() { return this.points[Symbol.iterator](); }
    splitBorder(src, start_point) {
      let dest = new PointMap();
      this.borders.add(dest);
      let concavity = 0;
      const explore = point => {
        let node = src.get(point);
        if (node) {
          src.delete(point);
          dest.set(point, node);
          this.borders_by_point.set(point, dest);
          concavity += node.concavity;
          node.next.forEach(explore);
        }
      }
      explore(start_point);
      if (concavity < 0) this.perimeter = dest;
      return dest;
    }
    mergeBorder(src, dest) {
      for (let [point, node] of src) {
        let old_edges = dest.get(point)?.edges;
        if (old_edges) node = Component.borderNode(point, old_edges | node.edges);
        dest.set(point, node);
        this.borders_by_point.set(point, dest);
      }
    }
    split(border, start_point) {
      let dest = Object.create(Component.prototype);
      let new_border = new PointMap();
      dest.points = new PointSet();
      dest.borders = new Set([new_border]);
      dest.borders_by_point = new PointMap();
      const explore = point => {
        if (this.points.delete(point)) {
          dest.points.add(point);
          point.forEachAdjacent((adj_point, i) => {
            let adj_border = this.borders_by_point.get(adj_point);
            if (adj_border) {
              if (adj_border !== border) {
                this.borders.delete(adj_border);
                dest.borders.add(adj_border);
                for (let point of adj_border.keys()) {
                  this.borders_by_point.delete(point);
                  dest.borders_by_point.set(point, adj_border);
                }
              } else new_border.set(adj_point,
                (new_border.get(adj_point) ?? 0) | (1<<(i+3)%6));
            } else explore(adj_point);
          });
        }
      }
      explore(start_point);
      let concavity = 0;
      for (let [point, edges] of new_border) {
        let old_edges = border.get(point).edges & ~edges;
        if (!old_edges) {
          border.delete(point);
          this.borders_by_point.delete(point);
        } else border.set(point, Component.borderNode(point, old_edges));
        let node = Component.borderNode(point, edges);
        concavity += node.concavity;
        new_border.set(point, node);
        dest.borders_by_point.set(point, new_border);
      }
      if (concavity > 0) {
        dest.perimeter = this.perimeter;
        this.perimeter = border;
      } else dest.perimeter = new_border;
      return dest;
    }
    merge(src, start_point) {
      let src_border = src.borders_by_point.get(start_point);
      let merged_border;
      let to_split = [];
      let split_next = src.has(start_point.step(5));
      let first_split = true;
      for (let i = 0; i < 6; ++i) {
        let adj_point = start_point.step(i);
        if (src.has(adj_point)) {
          if (!merged_border) {
            merged_border = this.borders_by_point.get(adj_point);
            this.mergeBorder(src_border, merged_border);
            merged_border.delete(start_point);
            this.borders_by_point.delete(start_point);
          }
          merged_border.delete(adj_point);
          this.borders_by_point.delete(adj_point);
          split_next = true;
        } else if (split_next) {
          if (first_split) first_split = false;
          else to_split.push(adj_point);
          split_next = false;
        }
      }
      for (let point of src) this.points.add(point);
      for (let border of src.borders) {
        if (border !== src_border) {
          let is_perimeter = border === src.perimeter;
          border = new PointMap(border);
          if (is_perimeter) this.perimeter = border;
          this.borders.add(border);
          for (let point of border.keys())
            this.borders_by_point.set(point, border);
        }
      }
      for (let start_point of to_split) this.splitBorder(merged_border, start_point);
    }
  }
  const edges = Symbol('edges'),
    adjacent = Symbol('adjacent'),
    components = Symbol('components'),
    components_by_point = Symbol('components_by_point'),
    trace_border = Symbol('trace-border');
  return class extends PointMap {
    constructor(entries) {
      if (entries instanceof Tile) {
        super(entries);
        this[edges] = new PointMap(entries[edges]);
        this[adjacent] = new PointMap(entries[adjacent]);
        this[components] = new Set();
        this[components_by_point] = new PointMap();
        for (let component of entries[components]) {
          component = new Component(component);
          this[components].add(component);
          for (let point of component)
            this[components_by_point].set(point, component);
        }
      } else {
        super();
        this[edges] = new PointMap();
        this[adjacent] = new PointMap();
        this[components] = new Set();
        this[components_by_point] = new PointMap();
        if (entries) for (let [point, data] of entries) this.set(point, data);
      }
    }
    clear() {
      super.clear();
      this[edges].clear();
      this[adjacent].clear();
      this[components].clear();
      this[components_by_point].clear();
    }
    delete(point) {
      if (super.delete(point)) {
        this[edges].delete(point);
        let new_edges = 0;
        point.forEachAdjacent((adj_point, i) => {
          if (!this.has(adj_point)) {
            let adj_edges = this[adjacent].get(adj_point) & ~(1<<(i+3)%6);
            if (!adj_edges) this[adjacent].delete(adj_point);
            else this[adjacent].set(adj_point, adj_edges);
          } else {
            new_edges |= 1<<i;
            this[edges].set(adj_point,
              (this[edges].get(adj_point) ?? 0) | (1<<(i+3)%6));
          }
        });
        let component = this[components_by_point].get(point);
        this[components_by_point].delete(point);
        if (new_edges) {
          this[adjacent].set(point, new_edges);
          for (let new_component of component.delete(point)) {
            this[components].add(new_component);
            for (let point of new_component)
              this[components_by_point].set(point, new_component);
          }
        } else this[components].delete(component);
        return true;
      } else return false;
    }
    set(point, data) {
      if (!this.has(point)) {
        this[adjacent].delete(point);
        let new_edges = 0;
        let component;
        point.forEachAdjacent((adj_point, i) => {
          let adj_edges = this[edges].get(adj_point) & ~(1<<(i+3)%6);
          if (!adj_edges) this[edges].delete(adj_point);
          else this[edges].set(adj_point, adj_edges);
          let adj_component = this[components_by_point].get(adj_point);
          if (adj_component) {
            if (!component) {
              component = adj_component;
              component.add(point);
            } else if (adj_component !== component) {
              component.merge(adj_component, point);
              this[components].delete(adj_component);
              for (let point of adj_component)
                this[components_by_point].set(point, component);
            }
          } else {
            new_edges |= 1<<i;
            this[adjacent].set(adj_point,
              (this[adjacent].get(adj_point) ?? 0) | (1<<(i+3)%6));
          }
        });
        if (new_edges) this[edges].set(point, new_edges);
        if (!component) {
          component = new Component(point);
          this[components].add(component);
        }
        this[components_by_point].set(point, component);
      }
      super.set(point, data);
    }
    [trace_border](start_point, start_edge) {
      let border = [];
      let point = start_point,
        current_edges = this[edges].get(start_point),
        i = start_edge;
      do {
        border.push([point, i]);
        i = (i+1)%6;
        if (!(current_edges & (1<<i))) {
          point = point.step(i);
          current_edges = this[edges].get(point);
          i = (i+4)%6;
        }
      } while (!point.equals(start_point) || i !== start_edge);
      return border;
    }
    edges() {
      return this[edges].keys();
    }
    adjacent() {
      return this[adjacent].keys();
    }
    isConnected() {
      return this[components].size === 1;
    }
    perimeter() {
      if (!this.isConnected())
        throw new Error('Improper usage: perimeter() must operate on a connected tile');
      let component = this[components].values().next().value;
      let [adj_point, {edges: adj_edges}] = component.perimeter.entries().next().value;
      let start_point, start_edge;
      for (let i = 0; i < 6; ++i) {
        if (adj_edges & (1<<i)) {
          start_point = adj_point.step(i);
          start_edge = (i+3)%6;
          break;
        }
      }
      return this[trace_border](start_point, start_edge);
    }
    holes() {
      if (!this.isConnected()) {
        for (let component of this[components]) {

        }
      }
    }
  };
})();

class Hexagon extends React.PureComponent {
  static translate(tile, translate) {
    const translated = new this.Tile();
    for (const [point, data] of tile)
      translated.set(this.add(point, translate), data);
    return translated;
  }

  static getBounds(tile) {
    let min_dims = [-Infinity, -Infinity];
    let max_dims = [Infinity, Infinity];
    for (const point of tile.keys()) {
      min_dims = min([point, min_dims], 0);
      max_dims = max([point, max_dims], 0);
    }
    return [min_dims, max_dims];
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
    const merged = new this.Tile();
    for (const tile of tiles) {
      for (let [point, data] of tile) {
        if (merged.has(point))
          throw new Error(`Improper Usage: Overlap between hexes at ${point}`);
        merged.set(point, data);
      }
    }
    return merged;
  }

  static getPerimeter(tile) {
    if (!tile.isConnected()) throw new Error('Improper Usage: Tile is not connected');
    const borders = tile.borders();
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
    const borders = tile.borders();
    const perimeter = this.getPerimeter(tile);
    return borders.filter(border => border !== perimeter);
  }

  static hasHoles(tile) {
    return tile.isConnected() && tile.borders().length > 1;
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

  static TileRender = React.memo(props => {
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
    const point = new Point([x,y]);
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
