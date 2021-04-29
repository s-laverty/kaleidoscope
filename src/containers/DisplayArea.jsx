import { useEffect, useRef, useState } from 'react';
import HexFreestyleDisplay from './HexFreestyleDisplay';
import HexTessellateDisplay from './HexTessellateDisplay';
import ColorIcon from '../components/ColorIcon';
import { Button, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { MAX_ZOOM, MIN_ZOOM, TOOLS } from '../utils/KaleidoscopeUtils';
import Slider from '../components/Slider';

const getDimensions = (container, setDims) =>
  setDims([container.current.clientWidth, container.current.clientHeight]);

const DisplayArea = ({sidebar, mode, current, dispatch}) => {
  const [dims, setDims] = useState([0,0]);
  const container = useRef();

  useEffect(() => {
    let handler = () => getDimensions(container, setDims);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  useEffect(() => getDimensions(container, setDims), [sidebar]);

  let className = 'h-100';
  if (current.tool === 'pan') className += ' cursor-grab';

  let onWheel;
  if (current.zoom) onWheel =
    e => dispatch({type: 'zoom', delta: e.deltaY});

  return (<>
    <div className='h-100 overflow-hidden user-select-none' ref={container}
    onWheel={onWheel}>
      <div className={className} onMouseDown={() => {
        if (current.tool === 'pan') {
          const onMouseMove = e => {
            let ds = [e.movementX, e.movementY]
            dispatch({type: 'pan', ds});
          };
          const onCancel = () => {
            window.removeEventListener('mousemove', onMouseMove);
            dispatch({type: 'set', name: 'grabbing', value: false});
          }
          window.addEventListener('mousemove', onMouseMove);
          window.addEventListener('mouseup', onCancel, {once: true});
          window.addEventListener('mouseleave', onCancel, {once: true});
          dispatch({type: 'set', name: 'grabbing', value: true});
        }
      }}>
        {mode === 'hex-freestyle' &&
          <HexFreestyleDisplay dims={dims} {...current} dispatch={dispatch}/>
        }
        {mode === 'hex-tessellate' &&
          <HexTessellateDisplay dims={dims} {...current} dispatch={dispatch}/>
        }
      </div>
      {!sidebar &&
        <Button variant='outline-dark' 
        className='position-absolute top-left mt-2 ml-1 shadow bg-white-transparent'
        onClick={() => dispatch({type: 'set', name: 'sidebar', value: true})}>
          <i className='bi-chevron-double-right h4'/>
        </Button>
      }
      <span className={'position-absolute bottom-left bg-white-transparent mb-1 ml-1 '
      + 'border border-secondary shadow px-1 user-select-none'}>
        {'Tool: '}
        {TOOLS[current.tool] ?? 'None'}
        {current.tool === 'fill-color' && <>
          {' '}
          <ColorIcon color={current.colors[current.color_index]} className='d-inline-block'/>
        </>}
      </span>
      {current.history &&
        <div className='position-absolute top-right mt-2 mr-2 d-flex justify-content-end w-0'>
          <OverlayTrigger
          placement='bottom'
          delay={100}
          overlay={<Tooltip id='undo-button-tooltip'>
            <b>Undo</b> <kbd><kbd>Ctrl</kbd> + <kbd>z</kbd></kbd>
            {current.history_index === 0 && <>
              <br/><i>Unavailable</i>
            </>}
          </Tooltip>}>
            <div className='d-inline-block rounded mr-2' tabIndex={0}>
              <Button variant='outline-dark'
              disabled={current.history_index === 0}
              onClick={() => dispatch({type: 'undo'})}
              className='shadow bg-white-transparent'>
                <i className='bi-arrow-90deg-left h4'/>
              </Button>
            </div>
          </OverlayTrigger>
          <OverlayTrigger
          placement='bottom'
          delay={100}
          overlay={<Tooltip id='redo-button-tooltip'>
            <b>Redo</b> <kbd><kbd>Ctrl</kbd> + <kbd>y</kbd></kbd>
            {current.history_index + 1 === current.history.length && <>
              <br/><i>Unavailable</i>
            </>}
          </Tooltip>}>
            <div className='d-inline-block rounded' tabIndex={0}>
              <Button variant='outline-dark'
              disabled={current.history_index + 1 === current.history.length}
              onClick={() => dispatch({type: 'redo'})}
              className='shadow bg-white-transparent'>
                <i className='bi-arrow-90deg-right h4'/>
              </Button>
            </div>
          </OverlayTrigger>
        </div>
      }
      {current.zoom &&
        <OverlayTrigger
        placement='left'
        delay={100}
        overlay={<Tooltip id='zoom-slider-tooltip'>Zoom</Tooltip>}>
          <div className='h-50 position-absolute right-middle mr-3 rounded-pill' tabIndex={0}>
            <Slider className='h-100' type='zoom'
            offset={(MAX_ZOOM - current.zoom) / (MAX_ZOOM - MIN_ZOOM)}
            onScroll={offset =>
              dispatch({type: 'zoom', zoom: MAX_ZOOM - (MAX_ZOOM - MIN_ZOOM) * offset})
            }
            onDragStart={() => dispatch({type: 'set', name: 'grabbing', value: true})}
            onDragEnd={() => dispatch({type: 'set', name: 'grabbing', value: false})}
            />
          </div>
        </OverlayTrigger>
      }
    </div>
  </>);
};

/*
  render() {
    const current = this.props.current;
    let hexOrigin = null;
    if (this.container.current) {
      if (['hex-freestyle','hex-tessellate'].includes(this.props.mode)) {
        const hexes = [];
        const tiles = [];
        const width = this.container.current.clientWidth;
        const height = this.container.current.clientHeight;
        let pan = {x: 0, y: 0};
        if (this.props.mode === 'hex-freestyle') pan = current.pan;
        const zoom = current.zoom;
        const t_px = (-height / 2 - pan.y) / zoom;
        const b_px = (height / 2 - pan.y) / zoom;
        const l_px = (-width / 2 - pan.x) / zoom;
        const r_px = (width / 2 - pan.x) / zoom;
        let x_range = divide(subtract(multiply([-1, 1], width/2), pan.x), zoom);
        let y_range = divide(subtract(multiply([-1, 1], height/2), pan.y), zoom);
        if (this.props.mode === 'hex-freestyle') {
          for (let chunk of getChunksInWindow(x_range, y_range)) {
            let [x,y] = chunk;
            hexes.push(<Chunk key={chunk} tiledata={current.tiledata} x={x} y={y}
            signature={current.chunk_signatures.get(chunk)}
            onClick = {this.handleHexEvent} onMouseDown={this.handleHexEvent}
            onMouseEnter = {this.handleHexEvent}
            />);
          }
          /*
          const hexgrid = Hexagon.visibleInBox(t_px,r_px,b_px,l_px);
          const {t,b,lskew,rskew} = hexgrid;
          let {l,r} = hexgrid;
          for (let y = t, i = 0; y <= b; ++y,++i) {
            for (let x = l; x <= r; ++x) {
              const point = new PointMap.Point(x,y);
              let color = current.tiledata.get(point) ?? 'lightgray';
              hexes.push(<Hexagon key={point} color={color} x={x} y={y}
                onClick = {this.handleHexEvent} onMouseDown={this.handleHexEvent}
                onMouseEnter = {this.handleHexEvent}/>
              );
            }
            if ((i + lskew) % 2) --l;
            if ((i + rskew) % 2) --r;
          }
          *//*
        }
        else {
          if (this.props.mode === 'hex-tessellate') {
            if (current.tool === 'reset-tile-colors') this.hex_tile_colors.clear();
            if (current.tessellation_index !== null) {
              for (let point of Hexagon.getTilesInWindow([[l_px,t_px],[r_px,b_px]],
              current.tessellations[current.tessellation_index])) {
                const [x,y] = point;
                if (!x && !y) continue;
                tiles.push(<Hexagon.TileRender key={point} x={x} y={y}
                  outline={current.show_outline} tile={current.tiledata}/>
                );
              }
            }
          }
          const edges = new PointSet(current.tiledata.edges());
          for (let [point, data] of current.tiledata) {
            const [x,y] = point;
            let color;
            let action;
            let className;
            if (current.tool === 'tile-shape') {
              if (!x && !y) {
                className = 'confirm';
                action='tile-confirm';
              } else if (edges.has(point)) {
                className = 'remove';
                action='tile-remove';
              } else color = 'blue';
            } else color = data.color ?? 'lightgray';
            this.hex_actions.set(point, action);
            hexes.push(<Hexagon key={point} color={color} x={x} y={y}
              className={className} onClick={this.handleHexEvent}
              onMouseDown={this.handleHexEvent} onMouseEnter={this.handleHexEvent}/>
            );
          }
          if (current.tool === 'tile-shape') {
            for (let point of current.tiledata.adjacent()) {
              const [x,y] = point;
              this.hex_actions.set(point, 'tile-add');
              hexes.push(<Hexagon key={point} x={x} y={y}
                className={'add'} onClick={this.handleHexEvent}/>
              );
            }
          }
        }
        const style = {transform: ''};
        if (this.props.mode === 'hex-freestyle')
          style.transform += `translate(${current.pan.x}px,` +
          `${current.pan.y}px)`;
        style.transform += `scale(${current.zoom})`;
        hexOrigin = <div className='hexOrigin' draggable={false} style={style}>
          {this.props.mode === 'hex-tessellate' && current.tool !== 'tile-shape'
          && current.show_outline && <Hexagon.Outline tile = {current.tiledata}/>}
          {tiles}
          {hexes}
        </div>;
      }
    }
    let className = 'DisplayArea h-100 d-flex justify-content-center align-items-center';
    if (this.props.mode === 'hex-freestyle' && this.state.shiftKey)
      className += ' move-cursor';
    return (
      <div className={className} ref={this.container}
        draggable={false}
        onWheel={this.handleWheel}
        onMouseMove={this.handleMouseMove}
        onMouseDown={this.handleMouseDown}
        onClickCapture={this.handleClickCapture}
      >
        {hexOrigin}
      </div>
    );
  }
}
*/
export default DisplayArea;
