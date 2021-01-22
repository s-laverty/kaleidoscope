import React from 'react';
import './DisplayArea.css';
import Hexagon from './Hexagon.js';

class DisplayArea extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      width: 0,
      height: 0,
      scrollX: 0,
      scrollY: 0,
      scale: 1.0,
      hexdata: {}
    };
    this.container = React.createRef();
    /* Bind event handlers */
    this.handleResize = this.handleResize.bind(this);
    this.handleWheel = this.handleWheel.bind(this);
    this.handleClick = this.handleClick.bind(this);
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
    this.setState(state => ({...state,
        width: this.container.current.clientWidth,
        height: this.container.current.clientHeight
    }));
  }

  handleWheel(e) {
    this.setState(state => {
      let newscale = Math.max(0.2, state.scale + 0.001*e.deltaY);
      let ratio = newscale / state.scale;
      return {...state, scale: newscale,
        scrollX: state.scrollX * ratio,
        scrollY: state.scrollY * ratio};
    });
  }

  handleClick(x,y) {
    const key = `${x},${y}`;
    this.setState(state => {
      /* cycle through colors */
      let color = state.hexdata[key];
      if (color === 'red') color = 'blue';
      else if (color === 'blue') color = 'green';
      else if (color === 'green') color = 'yellow';
      else if (color === 'yellow') color = 'aqua';
      else if (color === 'aqua') color = 'fuchsia';
      else color = 'red';
      return {...state, hexdata: {...state.hexdata, [key]: color}}
    });
  }

  handleMouseMove(e) {
    if (this.mousedown) {
      this.dragging = true;
      const dx = e.pageX - this.dragFrom.x;
      const dy = e.pageY - this.dragFrom.y;
      this.dragFrom = {x: e.pageX, y: e.pageY};
      this.setState(state => ({...state,
        scrollX: state.scrollX - dx,
        scrollY: state.scrollY - dy
      }));
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
    let t = (-this.state.height / 2 + this.state.scrollY) / this.state.scale;
    let b = (this.state.height / 2 + this.state.scrollY) / this.state.scale;
    let l = (-this.state.width / 2 + this.state.scrollX) / this.state.scale;
    let r = (this.state.width / 2 + this.state.scrollX) / this.state.scale;
    const hexdims = Hexagon.visibleInBox(t,r,b,l);
    l = hexdims.l;
    r = hexdims.r;
    for (let y = hexdims.t, i = 0; y <= hexdims.b; ++y,++i) {
      for (let x = l; x <= r; ++x) {
        const key = `${x},${y}`;
        let color = this.state.hexdata[key];
        if (color === undefined) color = 'lightgray';
        hexes.push(<Hexagon key={key} x={x} y={y} color={color}
          onClick={this.handleClick}></Hexagon>);
      }
      if ((i + hexdims.lskew) % 2) --l;
      if ((i + hexdims.rskew) % 2) --r;
    }
    return (
      <div className='DisplayArea' ref={this.container} onWheel={this.handleWheel}
        onDragStart={e => e.preventDefault()} onMouseMove={this.handleMouseMove}
        onMouseDown={this.handleMouseDown} onMouseUp={this.handleMouseUp}
        onMouseLeave={this.handleMouseLeave} onClickCapture={this.handleClickCapture}>
        <div className='hexOrigin'
          style={{transform: `translate(${-this.state.scrollX}px,${-this.state.scrollY}px)`
            + `scale(${this.state.scale})`}}>
          {hexes}
        </div>
      </div>
    );
  }
}

export default DisplayArea;
