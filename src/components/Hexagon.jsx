import React, { memo } from 'react';
import './Hexagon.scss';
import { multiply, transpose, add, floor, inv } from 'mathjs';
import { HexPoint } from '../utils/HexUtils';

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
/*
const OUTLINE_VERTICES = multiply(
  RADIUS + BORDER_STROKE/2/Math.cos(Math.PI/6),
  SHAPE
);
const OUTLINE_VERTICES_CONCAVE = add(OUTLINE_VERTICES,
  multiply(
    (MARGIN - BORDER_STROKE)/2/Math.cos(Math.PI/6),
    SHAPE.slice(-1).concat(SHAPE.slice(0,-1))
  )
);*/
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
  className = (className?.concat(' ') ?? '') + 'Hexagon position-absolute';
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

export default memo(Hexagon);
