import React from 'react';
import './Hexagon.css';

const hexconst = {
  radius: 50,
  margin: 7.5,
}
hexconst.apothem = hexconst.radius * Math.cos(Math.PI/6);
hexconst.xdiameter = hexconst.apothem*2 + hexconst.margin;
hexconst.ydiameter = hexconst.xdiameter * Math.cos(Math.PI/6);

class Hexagon extends React.Component {
  static visibleInBox(t,r,b,l) {
    let leftMost = Math.ceil(2*l / hexconst.xdiameter) - 1; // Measured in half hexes
    let rightMost = Math.floor(2*r / hexconst.xdiameter) + 1; // Measured in half hexes
    let topMost = Math.ceil((t + hexconst.radius/2) / hexconst.ydiameter) - 1; // Measured in rows
    let bottomMost = Math.floor((b - hexconst.radius/2) / hexconst.ydiameter) + 1; // Measured in rows
    let ldiff = leftMost - topMost;
    let rdiff = rightMost - topMost;
    return {
      t: topMost,
      b: bottomMost,
      l: Math.ceil(ldiff/2),
      r: Math.floor(rdiff/2),
      lskew: Math.abs(ldiff) % 2,
      rskew: Math.abs(rdiff+1) % 2
    };
  }
  
  shouldComponentUpdate(newProps) {
    return this.props.color !== newProps.color;
  }

  render() {
    const transform = 'translate(-50%, -50%)' +
      `translate(${this.props.x*hexconst.xdiameter +
      this.props.y*hexconst.xdiameter/2}px,` +
      `${this.props.y*hexconst.ydiameter}px)`;
    return (
      <div className='Hexagon' draggable={false}
      style={{transform: transform, backgroundColor: this.props.color}}
      onClick={this.props.onClick}
      onMouseOver={e => {
        if (e.buttons === 1 && !e.shiftKey) this.props.onClick();
      }}
      onMouseDown={e => {
        if (!e.shiftKey) this.props.onClick();
      }}/>
    );
  }
}

export default Hexagon;
