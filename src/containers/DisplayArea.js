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
    const hexes = [];
    if (this.container.current) {
      if (this.props.mode === 'hex-freestyle') {
        let width = this.container.current.clientWidth;
        let height = this.container.current.clientHeight;
        const pan = this.props.current.pan;
        const zoom = this.props.current.zoom;
        let t = (-height / 2 - pan.y) / zoom;
        let b = (height / 2 - pan.y) / zoom;
        let l = (-width / 2 - pan.x) / zoom;
        let r = (width / 2 - pan.x) / zoom;
        const hexdims = Hexagon.visibleInBox(t,r,b,l);
        l = hexdims.l;
        r = hexdims.r;
        for (let y = hexdims.t, i = 0; y <= hexdims.b; ++y,++i) {
          for (let x = l; x <= r; ++x) {
            const key = `${x},${y}`;
            let color = this.props.current.hexcolors[key];
            if (color === undefined) color = 'lightgray';
            hexes.push(<Hexagon key={key} color={color} x={x} y={y}
              onClick={() => this.props.handleDisplay('hex-click',key)}></Hexagon>);
          }
          if ((i + hexdims.lskew) % 2) --l;
          if ((i + hexdims.rskew) % 2) --r;
        }
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
        {this.props.mode === 'hex-freestyle' && <div className='hexOrigin' draggable={false}
          style={{transform: `translate(${this.props.current.pan.x}px,` +
            `${this.props.current.pan.y}px)` +
            `scale(${this.props.current.zoom})`}}>
          {hexes}
        </div>}
      </div>
    );
  }
}

export default DisplayArea;
