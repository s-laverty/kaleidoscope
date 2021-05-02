import './HexTessellateDisplay.scss';
import Hexagon, { SPACING_TRANSFORM, getHexRange, HexOutlineSVG, HexTileSVG, getOutlinePoints, getHexPoints } from '../components/Hexagon';
import { Button, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { PointSet } from '../utils/Point';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ceil, divide, floor, inv, max, min, multiply } from 'mathjs';
import { HexPoint } from '../utils/HexUtils';
import { getSwaps } from '../utils/KaleidoscopeUtils';

const HexTessellateDisplay = ({dims, zoom, tiledata, tile_shape_signature, tessellations,
  tessellation_index, tool, show_outline, dispatch}) => {
  const tessellation = tessellations?.[tessellation_index];
  const tessellation_inv = useMemo(() =>
    tessellation && inv(tessellation),
  [tessellation]);
  const swaps = useMemo(() => tessellation &&
    getSwaps(tiledata, tessellation, [new HexPoint(0, 0)]), [tiledata, tessellation]);
  const [swapHover, setSwapHover] = useState();
  const onAdd = useCallback((_e, point) =>
    dispatch({type: 'hex-click', point, shape_action: 'add'}), [dispatch]);
  const onRemove = useCallback((_e, point) =>
    dispatch({type: 'hex-click', point, shape_action: 'remove'}), [dispatch]);
  const onConfirm = useCallback(() => dispatch({type: 'select-tool', tool: null}),
    [dispatch]);
  const onSwap = useCallback((_e, point) =>
    dispatch({type: 'hex-click', add: point, remove: swaps.get(point)}),
    [dispatch, swaps]);
  const onSwapOver = useCallback((_e, point) =>
    setSwapHover(point), []);
  const onSwapLeave = useCallback((_e, point) =>
    setSwapHover(prev => prev.equals(point) ? null : prev), []);
  useEffect(() => {
    if (tool !== 'tile-swap') setSwapHover(null);
  }, [tool]);
  const outline_points = useMemo(() => getOutlinePoints(tiledata), [tiledata]);
  const hex_points = useMemo(() => getHexPoints(tiledata), [tiledata]);
  const hex_points_white = useMemo(() => hex_points.map(([points]) =>
    [points, '#ffffff']), [hex_points]);
  let outline = show_outline && <HexOutlineSVG points={outline_points}
    signature={tile_shape_signature}/>;
  let tile = tool === 'tile-swap' ? <HexTileSVG hexes={hex_points_white}/>
    : <HexTileSVG hexes={hex_points}/>;
  let origin = new HexPoint(0, 0);
  let children = [];
  if (tool !== 'tile-shape' && tessellations && tessellation_index !== null) {
    let x_range = divide(multiply([-1, 1], dims[0]/2), zoom);
    let y_range = divide(multiply([-1, 1], dims[1]/2), zoom);
    [x_range, y_range] = getHexRange(x_range, y_range);
    let height = y_range[1] - y_range[0];
    let tessellation_min = [Infinity, Infinity];
    let tessellation_max = [-Infinity, -Infinity];
    [
      [floor(x_range[0] + height / 2), y_range[0]],
      [x_range[1], y_range[0]],
      [x_range[0], y_range[1]],
      [ceil(x_range[1] - height / 2), y_range[1]]
    ].forEach(point => {
      let result = multiply(point, tessellation_inv);
      tessellation_min = min([tessellation_min, floor(result)], 0);
      tessellation_max = max([tessellation_max, ceil(result)], 0);
    });
    for (let i = tessellation_min[0]; i <= tessellation_max[0]; ++i) {
      for (let j = tessellation_min[1]; j <= tessellation_max[1]; ++j) {
        let point = new HexPoint(i, j);
        if (point.equals(origin)) continue;
        children.push(<div key={`tile ${point}`}
        style={{transform: `translate(${multiply(SPACING_TRANSFORM,
          multiply(point, tessellation)).join('px,')}px`
        }}>
          {outline}
          {tile}
        </div>);
      }
    }
    /*let primary_hexes = [];
    tiledata.forEach((color, point) => {
      let [x, y] = point;
      primary_hexes.push(<Hexagon key={point} x={x} y={y} color={color}/>);
    })*/
  }
  if (['tile-shape', 'tile-swap'].includes(tool))
    children.push(<OverlayTrigger key={origin}
      delay={100}
      overlay={<Tooltip id='confirm-tile-shape-hex-tooltip'>
        Confirm Shape
      </Tooltip>}
    >
      <Hexagon className='confirm btn-success shadow-none cursor-pointer'
      x={0} y={0} onClick={onConfirm}/>
    </OverlayTrigger>);
  switch(tool) {
    case 'tile-shape': {
      let edges = new PointSet(tiledata.edges());
      for (let point of tiledata.keys()) {
        if (point.equals(origin)) continue;
        let [x, y] = point;
        let props = edges.has(point) ? {
          className: 'remove btn-primary shadow-none cursor-pointer',
          onClick: onRemove
        } : {className: 'bg-primary'};
        children.push(<Hexagon key={point} x={x} y={y} {...props}/>);
      }
      for (let point of tiledata.adjacent()) {
        let [x, y] = point;
        children.push(<Hexagon key={point} x={x} y={y}
          className='add btn-secondary shadow-none cursor-pointer' onClick={onAdd}/>);
      }
    } break;
    case 'tile-swap': {
      let remove = swapHover && swaps.get(swapHover);
      for (let point of tiledata.keys()) {
        if (point.equals(origin)) continue;
        let [x, y] = point;
        let className = point.equals(remove) ? 'remove btn-primary active shadow-none'
          : 'bg-primary';
        children.push(<Hexagon key={point} x={x} y={y} className={className}/>);
      }
      for (let point of swaps.keys()) {
        let [x, y] = point;
        children.push(<Hexagon key={point} x={x} y={y}
          className='add btn-secondary shadow-none cursor-pointer' onClick={onSwap}
          onMouseOver={onSwapOver} onMouseLeave={onSwapLeave}/>);
      }
    } break;
    default: children.push(<div key='tile primary'>
      {outline}
      {tile}
    </div>); break;
  }
  return (<>
    <div className='HexTessellateDisplay d-flex w-100 h-100 justify-content-center align-items-center'>
      <div className='drop-shadow' style={{transform: `scale(${zoom})`}}>
        {children}
      </div>
    </div>
    {['tile-shape', 'tile-swap'].includes(tool) &&
      <Button variant='success' className='d-block position-absolute bottom-right shadow border mr-2 mb-2'
      onClick={onConfirm}>
        <i className='bi-check2-square'/> Confirm Shape
      </Button>
    }
  </>);
};

export default HexTessellateDisplay;
