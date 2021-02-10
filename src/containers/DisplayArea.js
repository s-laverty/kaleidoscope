import React from 'react';
import './DisplayArea.scss';
import Hexagon from '../Hexagon.js';

class DisplayArea extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      scrollX: 0,
      scrollY: 0,
      scale: 1.0,
      hexdata: {}
    };
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
    this.setState(state => {
      let newscale = Math.max(0.2, state.scale - 0.005*e.deltaY);
      let ratio = newscale / state.scale;
      return {...state, scale: newscale,
        scrollX: state.scrollX * ratio,
        scrollY: state.scrollY * ratio};
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
    if (this.container.current) {
      let width = this.container.current.clientWidth;
      let height = this.container.current.clientHeight;
      let t = (-height / 2 + this.state.scrollY) / this.state.scale;
      let b = (height / 2 + this.state.scrollY) / this.state.scale;
      let l = (-width / 2 + this.state.scrollX) / this.state.scale;
      let r = (width / 2 + this.state.scrollX) / this.state.scale;
      const hexdims = Hexagon.visibleInBox(t,r,b,l);
      l = hexdims.l;
      r = hexdims.r;
      for (let y = hexdims.t, i = 0; y <= hexdims.b; ++y,++i) {
        for (let x = l; x <= r; ++x) {
          const key = `${x},${y}`;
          let color = this.props.hexdata[key];
          if (color === undefined) color = 'lightgray';
          hexes.push(<Hexagon key={key} x={x} y={y} color={color}
            onClick={this.props.handleHexClick}></Hexagon>);
        }
        if ((i + hexdims.lskew) % 2) --l;
        if ((i + hexdims.rskew) % 2) --r;
      }
    }
    return (
      <div className='DisplayArea flex-center' ref={this.container} onWheel={this.handleWheel}
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
