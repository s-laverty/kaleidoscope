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
  }

  handleResize() {
    this.setState(state => ({...state,
        width: this.container.current.clientWidth,
        height: this.container.current.clientHeight
    }));
  }

  handleWheel(e) {
    this.setState(state => ({...state,
      scale: Math.max(0.2, state.scale + 0.001*e.deltaY)
    }));
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

  componentDidMount() {
    window.addEventListener('resize', this.handleResize);
    this.handleResize();
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
  }

  render() {
    const hexes = [];
    const lpx = -this.state.width / 2 / this.state.scale;
    const tpx = -this.state.height / 2 / this.state.scale;
    const rpx = -lpx, bpx = -tpx;
    const hexdims = Hexagon.visibleInBox(tpx,rpx,bpx,lpx);
    let l = hexdims.l, r = hexdims.r;
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
      <div className='DisplayArea' ref={this.container} onWheel={this.handleWheel}>
        <div className='hexOrigin'
          style={{transform: `translate(-${this.state.scrollX}px,-${this.state.scrollY}px)`
            + `scale(${this.state.scale})`}}>
          {hexes}
        </div>
      </div>
    );
  }
}

export default DisplayArea;
