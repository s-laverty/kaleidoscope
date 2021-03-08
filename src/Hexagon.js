import React from 'react';
import './Hexagon.scss';
import { multiply, transpose, add } from 'mathjs';

const hexconst = {
  radius: 50,
  margin: 7.5,
  stroke_width: 5,
  border_color: 'fuchsia'
}
hexconst.apothem = hexconst.radius * Math.cos(Math.PI/6);
hexconst.x_spacing = hexconst.apothem*2 + hexconst.margin;
hexconst.y_spacing = hexconst.x_spacing * Math.cos(Math.PI/6);
hexconst.x_modifier = hexconst.apothem + hexconst.stroke_width/2;
hexconst.y_modifier = hexconst.x_modifier / Math.cos(Math.PI/6);
hexconst.modifiers = transpose([
  multiply([1,1,0,-1,-1,0], hexconst.x_modifier),
  multiply([-1/2,1/2,1,1/2,-1/2,-1], hexconst.y_modifier)
]);

class Hexagon extends React.Component {
  static moves = [
    [1,0],
    [0,1],
    [-1,1],
    [-1,0],
    [0,-1],
    [1,-1]
  ];

  static key(coords) {
    return `${coords[0]},${coords[1]}`;
  }

  static forEachAdjacent(coords, callback) {
    for (let i = 0; i < 6; ++i) {
      const other_coords = add(coords, Hexagon.moves[i]);
      const key = Hexagon.key(other_coords);
      callback(key, other_coords, i);
    }
  }

  static someAdjacent(coords, test) {
    for (let i = 0; i < 6; ++i) {
      const other_coords = add(coords, Hexagon.moves[i]);
      const key = Hexagon.key(other_coords);
      if (test(key, other_coords, i)) return true;
    }
    return false;
  }

  static everyAdjacent(coords, test) {
    return !Hexagon.someAdjacent(coords, (...args) => !test(...args));
  }

  static visibleInBox(t,r,b,l) {
    let leftMost = Math.ceil(2*l / hexconst.x_spacing) - 1; // Measured in half hexes
    let rightMost = Math.floor(2*r / hexconst.x_spacing) + 1; // Measured in half hexes
    let topMost = Math.ceil((t + hexconst.radius/2) / hexconst.y_spacing) - 1; // Measured in rows
    let bottomMost = Math.floor((b - hexconst.radius/2) / hexconst.y_spacing) + 1; // Measured in rows
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

  static getBorder(tiledata) {
    const getPoint = (coords,vertex) => {
      const x = (coords[0] + coords[1]/2)*hexconst.x_spacing + hexconst.modifiers[vertex][0];
      const y = coords[1]*hexconst.y_spacing + hexconst.modifiers[vertex][1];
      return `${x},${y}`;
    }
    let points;
    for (let start_hex of Object.values(tiledata)) {
      if (start_hex.edges) {
        let hex = start_hex;
        let start_edge = 0;
        while (!(hex.edges & (1<<start_edge))) ++start_edge;
        points = getPoint(hex.coords,start_edge);
        for (let i = (start_edge+1) % 6; hex !== start_hex || i !== start_edge; i = (i+1) % 6) {
          points += ' ' + getPoint(hex.coords,i);
          if (!(hex.edges & (1<<i))) {
            hex = tiledata[`${hex.coords[0] + Hexagon.moves[i][0]},` +
              `${hex.coords[1] + Hexagon.moves[i][1]}`];
            i = (i+3) % 6;
          }
        }
        break;
      }
    }
    return <svg className='hex-outline'>
      <polygon points={points} fill='none'
      strokeWidth={hexconst.stroke_width} stroke={hexconst.border_color}/>
    </svg>;
  }
  
  render() {
    const {
      className: alias=null,
      color='lightgray',
      x, y,
      add=false,
      remove=false,
      ...other
    } = this.props;
    let className = 'Hexagon';
    if (add) className += ' add';
    if (remove) className += ' remove';
    if (alias) className += ' ' + alias;
    const transform = 'translate(-50%, -50%)' +
      `translate(${x * hexconst.x_spacing + y * hexconst.x_spacing/2}px,` +
      `${y * hexconst.y_spacing}px)`;
    return (
      <div className={className} draggable={false}
      style={{transform: transform, backgroundColor: color}}
      {...other}/>
    );
  }
}

export default Hexagon;
