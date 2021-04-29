import { divide, floor, multiply, subtract } from 'mathjs';
import { memo, useCallback } from 'react';
import Hexagon, { getHexRange, X_SPACING, Y_SPACING } from '../components/Hexagon';
import { HexPoint } from '../utils/HexUtils';
import { CHUNK_SIZE } from '../utils/KaleidoscopeUtils';

const Chunk = memo(({tiledata, x, y, ...other}) => {
  let hexes = [];
  [x, y] = multiply([x, y], CHUNK_SIZE);
  for (let i = 0; i < CHUNK_SIZE; ++i, ++x) {
    for (let j = 0; j < CHUNK_SIZE; ++j, ++y) {
      let point = new HexPoint(x, y);
      hexes.push(<Hexagon key={point} x={x} y={y}
        color={tiledata.get(point)}
        {...other}/>);
    }
    y -= CHUNK_SIZE;
  }
  return hexes;
}, ({signature: prev}, {signature: next}) => next === prev);

const HexFreestyleDisplay = ({dims, tiledata, chunk_signatures, tool,
  pan, zoom, show_empty, dispatch }) => {
  const handlePrimary = useCallback((e, point) =>
    e.buttons & 1 && dispatch({type: 'hex-click', point}), [dispatch]);
  const handleDoubleClick = useCallback((_e, point) =>
    dispatch({type: 'hex-doubleclick', point}), [dispatch]);
  let chunks = [];
  let x_range = divide(subtract(multiply([-1, 1], dims[0]/2), pan[0]), zoom);
  let y_range = divide(subtract(multiply([-1, 1], dims[1]/2), pan[1]), zoom);
  [x_range, y_range] = floor(divide(getHexRange(x_range, y_range), CHUNK_SIZE));
  for (let x = x_range[0]; x <= x_range[1]; ++x) {
    for (let y = y_range[0]; y <= y_range[1]; ++y) {
      let chunk = new HexPoint(x, y);
      chunks.push(<Chunk key={chunk} tiledata={tiledata} x={x} y={y}
      signature={chunk_signatures.get(chunk)}
      onMouseDown={handlePrimary} onMouseEnter={handlePrimary}
      onMouseMove={handlePrimary} onDoubleClick={handleDoubleClick}/>);
    }
  }
  let backdrop_className = 'w-100 h-100';
  let className = 'd-flex w-100 h-100 justify-content-center align-items-center';
  if (!tool) className += ' cursor-default';
  let style;
  let container_className;
  if (show_empty) {
    backdrop_className += ' bg-missing';
    className += ' bg-hexgrid';
    let grid_spacing = multiply([X_SPACING, 2 * Y_SPACING], zoom);
    style = {
      backgroundSize: `${grid_spacing[0]}px`,
      backgroundPosition: `calc(50% + ${pan[0] % grid_spacing[0] - grid_spacing[0] / 2}px) `
        + `calc(50% + ${pan[1] % grid_spacing[1]}px`
    };
  } else container_className = 'drop-shadow';
  return (
    <div className={backdrop_className}>
      <div className={className} style={style}>
        <div className={container_className}
        style={{transform: `translate(${pan.join('px,')}px) scale(${zoom})`}}>
          {chunks}
        </div>
      </div>
    </div>
  );
};

export default HexFreestyleDisplay;
