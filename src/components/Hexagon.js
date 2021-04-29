import React, { memo } from 'react';
import './Hexagon.scss';
import { multiply, transpose, add, subtract, min, max,
  deepEqual, lup, ceil, lusolve, floor, flatten, inv } from 'mathjs';
import CustomMap from '../utils/CustomMap';
import CustomSet from '../utils/CustomSet';
import { HexPoint } from '../utils/HexUtils';
import Point from '../utils/Point';

// Constants
const SHAPE = transpose([
  multiply(Math.cos(Math.PI/6), [1,0,-1,-1,0,1]),
  [1/2,1,1/2,-1/2,-1,-1/2]
]);
const RADIUS = 50;
const MARGIN = 7.5;
const BORDER_STROKE = 1.0;
const BORDER_COLOR = 'gray';

// Derived constants
const APOTHEM = RADIUS * Math.cos(Math.PI/6);
const VERTICES = multiply(RADIUS, SHAPE);
const TRANSFORM = [[1,1/2], [0,Math.cos(Math.PI/6)]];
export const SPACING_TRANSFORM = multiply(APOTHEM*2 + MARGIN, TRANSFORM);
export const X_SPACING = SPACING_TRANSFORM[0][0];
export const Y_SPACING = SPACING_TRANSFORM[1][1];
const SPACING_INV = inv(SPACING_TRANSFORM);
const OUTLINE_VERTICES = multiply(
  RADIUS + BORDER_STROKE/2/Math.cos(Math.PI/6),
  SHAPE
);
const OUTLINE_VERTICES_CONCAVE = add(OUTLINE_VERTICES,
  multiply(
    (MARGIN - BORDER_STROKE)/2/Math.cos(Math.PI/6),
    SHAPE.slice(-1).concat(SHAPE.slice(0,-1))
  )
);
const GRID_VERTICES = multiply(
  RADIUS + MARGIN/2/Math.cos(Math.PI/6),
  SHAPE
);
const bgGridImage = 'data:image/svg+xml,' + encodeURIComponent(
`<svg version="1.1" baseProfile="full" xmlns="http://www.w3.org/2000/svg"
width="${X_SPACING}" height="${2*Y_SPACING}"
viewBox="0 ${-Y_SPACING} ${X_SPACING} ${2*Y_SPACING}">
<defs>
  <filter id="shadow-outline">
    <feDropShadow result="drop-shadow" dx="0" dy="0" stdDeviation="1" flood-color="gray"/>
    <feComposite operator="out" in="drop-shadow" in2="SourceAlpha"/>
  </filter>
</defs>
<g>
  <path d="M ${GRID_VERTICES.map(x => add(x, [X_SPACING/2, -Y_SPACING])).copyWithin(1,0,4)
    .copyWithin(0,5).slice(0,5).map(x => x.join(' ')).join(' L ')}
    M ${GRID_VERTICES.map(x => add(x, [X_SPACING/2, Y_SPACING])).copyWithin(1,2)
    .copyWithin(5,0).slice(1).map(x => x.join(' ')).join(' L ')}
    M ${GRID_VERTICES[5].join(' ')} L ${GRID_VERTICES[0].join(' ')}"
  stroke="white" fill="none" stroke-width="${MARGIN}" stroke-linecap="square"/>
  <polygon points="${VERTICES.join(' ')}" filter="url(#shadow-outline)"/>
  <polygon points="${VERTICES.map(x => add(x, [X_SPACING/2, -Y_SPACING])).join(' ')}"
    filter="url(#shadow-outline)"/>
  <polygon points="${VERTICES.map(x => add(x, [X_SPACING/2, Y_SPACING])).join(' ')}"
    filter="url(#shadow-outline)"/>
    <polygon points="${VERTICES.map(x => add(x, [X_SPACING, 0])).join(' ')}"
    filter="url(#shadow-outline)"/>
</g>
</svg>`.replace(/\s+/g, ' '));
let stylesheet = document.createElement('style');
stylesheet.innerText = `.bg-hexgrid { background-image: url('${bgGridImage}'); }`;
document.head.appendChild(stylesheet);

const Hexagon = ({x, y, color, className, ...other}) => {
  className = (className?.concat(' ') ?? '') + 'Hexagon cursor-pointer position-absolute';
  let point = new HexPoint(x,y);
  let style = {
    backgroundColor: color,
    transform: `translate(-50%,-50%) translate(${multiply(SPACING_TRANSFORM, point).join('px,')}px`
  };
  for (let [key, val] of Object.entries(other)) {
    if (key.startsWith('on') && typeof val === 'function')
      other[key] = e => val(e, point);
  }
  return (
    <div className={className} style={style} {...other}/>
  );
};

const TOP_RIGHT_MODIFIER = [2/3*APOTHEM, -RADIUS];
const BOTTOM_LEFT_MODIFIER = multiply(TOP_RIGHT_MODIFIER, -1);
export const getHexRange = function(x_range, y_range) {
  let top_right = [x_range[1], y_range[0]];
  let bottom_left = [x_range[0], y_range[1]];
  let [max_x, min_y] = add(floor(multiply(SPACING_INV, add(top_right, TOP_RIGHT_MODIFIER))), [0, 1]);
  let [min_x, max_y] = add(floor(multiply(SPACING_INV, add(bottom_left, BOTTOM_LEFT_MODIFIER))), [1, 0]);
  return [[min_x, max_x], [min_y, max_y]];
}

export const getOutlinePoints = tiledata => {
  let points = [];
  let perimeter = tiledata.perimeter();
  perimeter.reduce((prev_point, [point, direction]) => {
    let center = multiply(SPACING_TRANSFORM, point);
    //if (!point.equals(prev_point))
      //points.push(add(center, OUTLINE_VERTICES_CONCAVE[(direction + 5) % 6]));
    points.push(add(center, GRID_VERTICES[direction]));
    //points.push(add(center, OUTLINE_VERTICES[direction]));
    return point;
  }, perimeter[perimeter.length - 1][0]);
  return points;
}

export const HexOutlineSVG = memo(({points, signature, className, ...other}) => {
  className = (className?.concat(' ') ?? '') + 'overflow-visible position-absolute';
  return (
    <svg {...other} className={className}>
      <polygon points={points.join(' ')} fill='none' strokeWidth={BORDER_STROKE}
      stroke={BORDER_COLOR}/>
    </svg>
  );
}, ({signature: prev}, {signature: next}) => next === prev);

export const getHexPoints = tiledata => {
  let hexes = [];
  tiledata.forEach((color, point) => {
    let translate = multiply(SPACING_TRANSFORM, point);
    hexes.push([VERTICES.map(x => add(x, translate)).join(' '), color]);
  });
  return hexes;
};

export const HexTileSVG = memo(({hexes, className, ...other}) => {
  className = (className?.concat(' ') ?? '') + 'overflow-visible position-absolute';
  return (
    <svg {...other} className={className}>
      {hexes.map(([points, color]) => <polygon points={points} fill={color} stroke='none'/>)}
    </svg>
  );
});

/*
class Hexagon_old extends React.PureComponent {
  static visibleInBox(t,r,b,l) {
    const x_spacing = SPACING[0][0];
    const y_spacing = SPACING[1][1];
    let leftMost = Math.ceil(2*l / x_spacing) - 1; // Measured in half hexes
    let rightMost = Math.floor(2*r / x_spacing) + 1; // Measured in half hexes
    let topMost = Math.ceil((t + RADIUS/2) / y_spacing) - 1; // Measured in rows
    let bottomMost = Math.floor((b - RADIUS/2) / y_spacing) + 1; // Measured in rows
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
    const tr_lup = lup(multiply(SPACING, tessellation));
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
        yield new Point(...multiply(tessellation, [i,j]));
  }

  static Outline = React.memo(props => {
    const {tile} = props;
    const points = [];
    const perimeter = tile.perimeter();
    perimeter.reduce((prev_point, [point, i]) => {
      const center = multiply(SPACING, point);
      if (!deepEqual(point, prev_point))
        points.push(add(center, OUTLINE_VERTICES_CONCAVE[(i+5)%6]));
      points.push(add(center, OUTLINE_VERTICES[i]));
      return point;
    }, perimeter[perimeter.length-1][0]);
    return (
      <svg className='Hexagon_Outline'>
        <polygon points={points.join(' ')} fill='none'
        strokeWidth={BORDER_STROKE} stroke={BORDER_COLOR}/>
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
      const center = multiply(SPACING, point);
      hexes.push(
        <polygon key={point}
        points={VERTICES.map(vertex => add(center, vertex)).join(' ')}
        fill={color} stroke='none'/>
      );
    }
    const derived_style = {...style};
    if (x || y) {
      derived_style.transform = `translate(${multiply(SPACING, [x,y]).join('px,')}px`;
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
    const point = new Point(x,y);
    for (const [key, val] of Object.entries(other)) {
      if (key.startsWith('on') && typeof val === 'function')
        other[key] = e => val(e, point);
    }
    const derived_className = ['Hexagon'];
    if (className) derived_className.push(className);
    const derived_style = {...style,
      transform: 'translate(-50%,-50%)' +
        `translate(${multiply(SPACING, point).join('px,')}px`
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
*/
export default memo(Hexagon);
