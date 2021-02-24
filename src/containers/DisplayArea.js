import React from 'react';
import './DisplayArea.scss';
import Hexagon from '../Hexagon.js';

class DisplayArea extends React.Component {
  constructor(props) {
    super(props);
    this.container = React.createRef();
    /* Bind event handlers */
    this.handleResize = this.handleResize.bind(this);
    this.handleWheel = this.handleWheel.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleMouseLeave = this.handleMouseLeave.bind(this);
    this.handleClickCapture = this.handleClickCapture.bind(this);
    /* Add dragging variables */
    this.mousedown = false;
    this.dragging = false;
    this.dragFrom = null;
  }

  handleResize() {
    this.forceUpdate();
  }

  handleWheel(e) {
    if (this.props.mode === 'hex-freestyle') {
      
    }
    let zoom = Math.max(0.2, this.props.current.zoom - 0.005*e.deltaY);
    this.props.handleDisplay('zoom', zoom);
  }

  handleMouseMove(e) {
    if (this.mousedown) {
      this.dragging = true;
      const dx = e.pageX - this.dragFrom.x;
      const dy = e.pageY - this.dragFrom.y;
      this.dragFrom = {x: e.pageX, y: e.pageY};
      this.props.handleDisplay('pan', dx, dy);
    }
  }

  handleMouseDown(e) {
    this.mousedown = true;
    this.dragFrom = {x: e.pageX, y: e.pageY};
  }

  handleMouseUp(e) {
    this.mousedown = false;
  }

  handleMouseLeave() {
    this.mousedown = false;
  }

  handleClickCapture(e) {
    if (this.dragging) {
      e.stopPropagation();
      this.dragging = false;
    }
  }

  componentDidMount() {
    window.addEventListener('resize', this.handleResize);
    this.handleResize();
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
  }

  render() {
    let hexOrigin = null;
    if (this.container.current) {
      if (['hex-freestyle','hex-tessellate'].includes(this.props.mode)) {
        const hexes = [];
        const width = this.container.current.clientWidth;
        const height = this.container.current.clientHeight;
        let pan = {x: 0, y: 0};
        if (this.props.mode === 'hex-freestyle') pan = this.props.current.pan;
        const zoom = this.props.current.zoom;
        const t_px = (-height / 2 - pan.y) / zoom;
        const b_px = (height / 2 - pan.y) / zoom;
        const l_px = (-width / 2 - pan.x) / zoom;
        const r_px = (width / 2 - pan.x) / zoom;
        const hexgrid = Hexagon.visibleInBox(t_px,r_px,b_px,l_px);
        const {t,b,lskew,rskew} = hexgrid;
        let {l,r} = hexgrid;
        for (let y = t, i = 0; y <= b; ++y,++i) {
          for (let x = l; x <= r; ++x) {
            const key = `${x},${y}`;
            let color = 'lightgray';
            if (this.props.mode === 'hex-freestyle') {
              if (key in this.props.current.hexcolors)
                color = this.props.current.hexcolors[key];
            } else if (this.props.mode === 'hex-tessellate') {
              if (key in this.props.current.tiledata)
                color = 'blue';
            }
            hexes.push(<Hexagon key={key} color={color} x={x} y={y}
              onClick={() => this.props.handleDisplay('hex-click',key)}></Hexagon>);
          }
          if ((i + lskew) % 2) --l;
          if ((i + rskew) % 2) --r;
        }
        const style = {transform: ''};
        if (this.props.mode === 'hex-freestyle')
          style.transform += `translate(${this.props.current.pan.x}px,` +
          `${this.props.current.pan.y}px)`;
        style.transform += `scale(${this.props.current.zoom})`;
        hexOrigin = <div className='hexOrigin' draggable={false} style={style}>{hexes}</div>;
      }
    }
    return (
      <div className='DisplayArea flex-center' ref={this.container}
        onWheel={this.handleWheel}
        onMouseMove={this.handleMouseMove}
        onMouseDown={this.handleMouseDown}
        onMouseUp={this.handleMouseUp}
        onMouseLeave={this.handleMouseLeave}
        onClickCapture={this.handleClickCapture}
      >
        {hexOrigin}
      </div>
    );
  }
}

export default DisplayArea;
