import React from 'react';

const hexconst = {
  radius: 50,
  margin: 8,
}
hexconst.apothem = hexconst.radius * Math.cos(Math.PI/6);
hexconst.xdiameter = hexconst.apothem*2 + hexconst.margin;
hexconst.ydiameter = hexconst.xdiameter * Math.cos(Math.PI/6);

class Hexagon extends React.Component {
  static visibleInBox(t,r,b,l) {
    let leftMost = Math.ceil(2*l / hexconst.xdiameter) - 1; // Measured in half hexes
    let rightMost = Math.floor(2*r / hexconst.xdiameter) + 1; // Measured in half hexes
    let topMost = Math.ceil((t + hexconst.radius/2) / hexconst.ydiameter) - 1; // Measured in rows
    let bottomMost = Math.ceil((b - hexconst.radius/2) / hexconst.ydiameter) + 1; // Measured in rows
    let ldiff = leftMost - topMost;
    let rdiff = rightMost - topMost;
    let xskew = Math.abs(ldiff) % 2;
    return {
      t: topMost,
      b: bottomMost,
      l: Math.ceil(ldiff/2),
      r: Math.floor(rdiff/2),
      lskew: Math.abs(ldiff) % 2,
      rskew: Math.abs(rdiff+1) % 2
    };
  }
  constructor(props) {
    super(props);
    this.transform = 'translate(-50%, -50%)' +
      `translate(${props.x*hexconst.xdiameter + props.y*hexconst.xdiameter/2}px,` +
      `${this.props.y*hexconst.ydiameter}px)`;
  }
  render() {
    return (
      <div className='hexagon' style={{transform: this.transform}}></div>
    );
  }
}

export default Hexagon;
