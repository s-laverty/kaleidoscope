import React from 'react';
import './DisplayArea.scss';
import Hexagon from '../Hexagon.js';
import { subtract } from 'mathjs';

class DisplayArea extends React.Component {
  constructor(props) {
    super(props);
    this.container = React.createRef();
    this.hex_actions = {};
    this.state = {
      dragFrom: null,
      shiftKey: false,
      panning: false
    }
    /* Bind event handlers */
    this.handleResize = this.handleResize.bind(this);
    this.handleKeyEvent = this.handleKeyEvent.bind(this);
    this.handleWheel = this.handleWheel.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleClickCapture = this.handleClickCapture.bind(this);
    this.handleHexEvent = this.handleHexEvent.bind(this);
  }

  handleResize() {
    this.forceUpdate();
  }

  handleKeyEvent(e) {
    this.setState({shiftKey: e.shiftKey});
  }

  handleWheel(e) {
    let zoom = Math.max(0.2, this.props.current.zoom - 0.005*e.deltaY);
    this.props.handleDisplay('zoom', zoom);
  }

  handleMouseMove(e) {
    if (this.props.mode === 'hex-freestyle') {
      let panning = false;
      if (e.buttons === 1) {
        if (e.shiftKey) {
          panning = true;
          const dx = e.pageX - this.state.dragFrom.x;
          const dy = e.pageY - this.state.dragFrom.y;
          this.props.handleDisplay('pan', dx, dy);
        }
      }
      this.setState({
        panning: panning,
        dragFrom: {x: e.pageX, y: e.pageY}
      });
    }
  }

  handleMouseDown(e) {
    this.setState({dragFrom: {x: e.pageX, y: e.pageY}});
  }

  handleClickCapture(e) {
    if (this.state.panning) {
      e.stopPropagation();
      this.setState({panning: false});
    }
  }

  handleHexEvent(e, coords) {
    switch (e.type) {
      case 'click': this.props.handleDisplay('hex-click', coords, this.hex_actions[coords])
        break;
      case 'mouseenter':
      case 'mousedown':
        if (!e.shiftKey && e.buttons === 1)
          this.props.handleDisplay('hex-click', coords);
        break;
      default: break;
    }
  }

  componentDidMount() {
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('keydown', this.handleKeyEvent);
    window.addEventListener('keyup', this.handleKeyEvent);
    this.handleResize();
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('keydown', this.handleKeyEvent);
    window.removeEventListener('keyup', this.handleKeyEvent);
  }

  render() {
    const current = this.props.current;
    let hexOrigin = null;
    if (this.container.current) {
      if (['hex-freestyle','hex-tessellate'].includes(this.props.mode)) {
        const hexes = [];
        const width = this.container.current.clientWidth;
        const height = this.container.current.clientHeight;
        let pan = {x: 0, y: 0};
        if (this.props.mode === 'hex-freestyle') pan = current.pan;
        const zoom = current.zoom;
        const t_px = (-height / 2 - pan.y) / zoom;
        const b_px = (height / 2 - pan.y) / zoom;
        const l_px = (-width / 2 - pan.x) / zoom;
        const r_px = (width / 2 - pan.x) / zoom;
        const hexgrid = Hexagon.visibleInBox(t_px,r_px,b_px,l_px);
        const {t,b,lskew,rskew} = hexgrid;
        let {l,r} = hexgrid;
        for (let y = t, i = 0; y <= b; ++y,++i) {
          for (let x = l; x <= r; ++x) {
            const coords = [x,y];
            let color;
            const other = {};
            let action;
            if (this.props.mode === 'hex-freestyle') {
              other.onMouseDown = other.onMouseEnter = this.handleHexEvent;
              if (coords in current.hexcolors) color = current.hexcolors[coords];
              else color = 'lightgray';
            } else if (this.props.mode === 'hex-tessellate') {
              if (coords in current.tiledata) {
                if (!x && !y) {
                  other.className = 'confirm';
                  action='tile-confirm';
                } else if (current.active_tool === 'tile-shape' &&
                current.tiledata[coords].edges) {
                  other.className = 'remove';
                  action='tile-remove';
                } else color = 'blue';
              } else if (current.active_tool === 'tile-shape' &&
              current.adjacent.has(String(coords))) {
                other.className = 'add';
                action='tile-add';
              } else if (current.active_tessellation_index !== null) {
                const [t1,t2] = current.tessellations[current.active_tessellation_index];
                if (subtract(coords, t1) in current.tiledata)
                  color = 'orange';
                else if (subtract(coords, t2) in current.tiledata)
                  color = 'red';
                else continue;
              } else continue;
            }
            this.hex_actions[coords] = action;
            hexes.push(<Hexagon key={coords} color={color} x={x} y={y}
              onClick = {this.handleHexEvent}
              {...other}/>
            );
          }
          if ((i + lskew) % 2) --l;
          if ((i + rskew) % 2) --r;
        }
        const style = {transform: ''};
        if (this.props.mode === 'hex-freestyle')
          style.transform += `translate(${current.pan.x}px,` +
          `${current.pan.y}px)`;
        style.transform += `scale(${current.zoom})`;
        hexOrigin = <div className='hexOrigin' draggable={false} style={style}>
          {this.props.mode === 'hex-tessellate' && Hexagon.getOutline(current.tiledata)}
          {hexes}
        </div>;
      }
    }
    let className = 'DisplayArea flex-center';
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

export default DisplayArea;
