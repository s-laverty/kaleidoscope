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
      scale: 1.0
    };
    this.container = React.createRef();
  }

  handleResize() {
    this.setState(state => Object.assign({}, state,
      {
        width: this.container.current.clientWidth,
        height: this.container.current.clientHeight
      }));
  }

  handleWheel(e) {
    this.setState(state => Object.assign({}, state, {scale: state.scale + 0.001*e.deltaY}));
  }

  componentDidMount() {
    window.addEventListener('resize', this.handleResize.bind(this));
    this.handleResize();
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
  }

  render() {
    const lpx = -this.state.width / 2 / this.state.scale;
    const tpx = -this.state.height / 2 / this.state.scale;
    const rpx = -lpx, bpx = -tpx;
    const hexes = [];
    const hexdims = Hexagon.visibleInBox(tpx,rpx,bpx,lpx);
    let l = hexdims.l, r = hexdims.r;
    for (let y = hexdims.t, i = 0; y <= hexdims.b; ++y,++i) {
      for (let x = l; x <= r; ++x) {
        hexes.push(<Hexagon key={`${x},${y}`} x={x} y={y}></Hexagon>)
      }
      if ((i + hexdims.lskew) % 2) --l;
      if ((i + hexdims.rskew) % 2) --r;
    }
    return (
      <div className='DisplayArea' ref={this.container} onWheel={this.handleWheel.bind(this)}>
        <div className='hexOrigin'
          style={{transform: `scale(${this.state.scale})` +
           `translate(-${this.state.scrollX}px, -${this.state.scrollY}px)`}}>
          {hexes}
        </div>
      </div>
    );
  }
}

export default DisplayArea;
