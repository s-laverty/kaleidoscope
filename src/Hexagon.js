import React from 'react';
import './Hexagon.scss';
import { multiply, transpose, add, deepEqual, smaller, larger, min, max } from 'mathjs';

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
  border_color: 'fuchsia',
  border_vertices: undefined,
  border_vertices_between: undefined
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
hexconst.border_vertices_between = add(hexconst.border_vertices,
  multiply(
    (hexconst.margin - hexconst.stroke_width)/2/Math.cos(Math.PI/6),
    hexconst.shape.slice(-1).concat(hexconst.shape.slice(0,-1))
  )
);

class Hexagon extends React.PureComponent {
  static moves = [
    [1,0],
    [0,1],
    [-1,1],
    [-1,0],
    [0,-1],
    [1,-1]
  ];

  static forEachAdjacent(coords, callback) {
    for (let i = 0; i < 6; ++i) {
      const other_coords = add(coords, Hexagon.moves[i]);
      callback(other_coords, i);
    }
  }

  static someAdjacent(coords, test) {
    for (let i = 0; i < 6; ++i) {
      const other_coords = add(coords, Hexagon.moves[i]);
      if (test(other_coords, i)) return true;
    }
    return false;
  }

  static everyAdjacent(coords, test) {
    return !Hexagon.someAdjacent(coords, (...args) => !test(...args));
  }

  static translate(tiledata, translate) {
    return Object.fromEntries(Object.values(tiledata).map(hex => {
      const coords = add(hex.coords, translate);
      return [coords, {...hex, coords: coords}]
    }));
  }

  static hasOverlap(tile1, tile2, translate=null) {
    if (translate) tile2 = Hexagon.translate(tile2, translate);
    return Object.values(tile1).some(({coords: p1}) =>
      Object.values(tile2).some(({coords: p2}) =>
        deepEqual(p1,p2)
      )
    );
  }

  static isAdjacent(tile1, tile2, translate=null) {
    if (translate) tile2 = Hexagon.translate(tile2, translate);
    return Object.values(tile1).some(({coords}) =>
      Hexagon.someAdjacent(coords, other_coords =>
        other_coords in tile2
      )
    );
  }

  static revolve(center, satellite, previous_move) {
    for (let i = (previous_move + 2) % 6; true; i = (i+5) % 6) {
      let new_satellite = Hexagon.translate(satellite, Hexagon.moves[i]);
      if (!Hexagon.hasOverlap(center, new_satellite))
        return [new_satellite, i];
    }
  }

  static merge(...tiles) {
    const merged = {};
    tiles.forEach(tile =>
      Object.values(tile).forEach(hex => {
        const {coords} = hex;
        if (coords in merged)
          throw new Error(`Improper Usage: Overlap between hexes at ${coords}`);
        merged[coords] = hex;
        Hexagon.forEachAdjacent(coords, (other_coords,i) => {
          if (other_coords in merged && hex.edges & (1<<i)) {
            merged[coords] = hex = {...hex,
              edges: hex.edges & ~(1<<i)
            };
            const other_hex = merged[other_coords];
            merged[other_coords] = {...other_hex,
              edges: other_hex.edges & ~(1<<(i+3)%6)
            };
          }
        });
      })
    );
    return merged;
  }

  static getConnectedPart(tiledata, origin) {
    const part = {[origin]: tiledata[origin]};
    const queue = [origin];
    for (const coords of queue) {
      Hexagon.forEachAdjacent(coords, coords => {
        if (coords in tiledata && !(coords in part)) {
          part[coords] = tiledata[coords];
          queue.push(coords);
        }
      });
    }
    return part;
  }

  static getConnectedParts(tiledata) {
    const explored = new Set();
    const parts = [];
    Object.values(tiledata).forEach(({coords}) => {
      if (!explored.has(String(coords))) {
        const part = Hexagon.getConnectedPart(tiledata, coords);
        parts.push(part);
        Object.keys(part).forEach(key => explored.add(key));
      }
    });
    return parts;
  }

  static isConnected(tiledata) {
    const part = Hexagon.getConnectedPart(tiledata, Object.values(tiledata)[0].coords);
    return Object.keys(tiledata).every(key => key in part);
  }

  static getBorders(tiledata) {
    const explored_edges = Object.fromEntries(Object.keys(tiledata).map(key => [key,0]));
    const borders = [];
    Object.values(tiledata).forEach(hex => {
      for (let edge = 0; edge < 6; ++edge) {
        if (hex.edges & (1<<edge) && !(explored_edges[hex.coords] & (1<<edge))) {
          const start_hex = hex;
          const start_edge = edge;
          const border = [];
          do {
            border.push([hex,edge]);
            explored_edges[hex.coords] |= 1<<edge;
            edge = (edge+1) % 6;
            if (!(hex.edges & (1<<edge))) {
              hex = tiledata[add(hex.coords, Hexagon.moves[edge])];
              edge = (edge+4) % 6;
            }
          } while (hex !== start_hex || edge !== start_edge);
          borders.push(border);
        }
      }
    });
    return borders;
  }

  static getPerimeter(tiledata, borders=null) {
    if (!Hexagon.isConnected(tiledata)) throw new Error('Improper Usage: Tile is not connected');
    if (!borders) borders = Hexagon.getBorders(tiledata);
    if (borders.length === 1) return borders[0];
    let min_coords = [Infinity,Infinity];
    let max_coords = [-Infinity,-Infinity];
    let perimeter;
    borders.forEach(border => border.forEach(([{coords},edge]) => {
      const edge_coords = add(coords, Hexagon.moves[edge]);
      if (smaller(edge_coords, min_coords).includes(true)) {
        min_coords = min([edge_coords, min_coords], 0);
        perimeter = border;
      }
      if (larger(edge_coords, max_coords).includes(true)) {
        max_coords = max([edge_coords, max_coords], 0);
        perimeter = border;
      }
    }));
    return perimeter;
  }

  static getHoles(tiledata) {
    const borders = Hexagon.getBorders(tiledata);
    const perimeter = Hexagon.getPerimeter(tiledata, borders);
    return borders.filter(border => border !== perimeter);
  }

  static hasHoles(tiledata) {
    return Hexagon.getBorders(tiledata).length > 1;
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

  static getOutline(tiledata) {
    const points = [];
    const perimeter = Hexagon.getPerimeter(tiledata);
    perimeter.reduce((prev_hex, [hex,edge]) => {
      const {coords} = hex;
      const center = multiply(hexconst.spacing, coords);
      if (hex !== prev_hex)
        points.push(add(center, hexconst.border_vertices_between[(edge+5)%6]));
      points.push(add(center, hexconst.border_vertices[edge]));
      return hex;
    }, perimeter[perimeter.length-1][0]);
    return (
      <svg className='hex-outline'>
        <polygon points={points.join(' ')} fill='none'
        strokeWidth={hexconst.stroke_width} stroke={hexconst.border_color}/>
      </svg>
    );
  }

  static renderTile(tiledata) {

    return (
      <svg>
      </svg>
    )
  }
  
  render() {
    const {
      className,
      color,
      x, y,
      style,
      ...other
    } = this.props;
    Object.entries(other).forEach(([key,val]) => {
      if (key.startsWith('on') && typeof val === 'function')
        other[key] = e => val(e, [x,y])
    });
    const derived_className = ['Hexagon'];
    if (className) derived_className.push(className);
    const derived_style = {...style,
      transform: 'translate(-50%,-50%)' +
        `translate(${multiply(hexconst.spacing, [x,y]).join('px,')}px`
    };
    if (color) derived_style.backgroundColor = color;
    return (
      <div className={derived_className.join(' ')} draggable={false}
      style={derived_style}
      {...other}/>
    );
  }
}

export default Hexagon;
