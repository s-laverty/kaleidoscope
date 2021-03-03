import React from 'react';
import './DisplayArea.scss';
import Hexagon from '../Hexagon.js';

class DisplayArea extends React.Component {
  constructor(props) {
    super(props);
    this.container = React.createRef();
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
              const translate = this.props.current.translate;
              if (key in this.props.current.tiledata)
                color = 'blue';
              else if (translate) {
                const tile_key = `${x-translate.x},${y-translate.y}`;
                if (tile_key in this.props.current.tiledata)
                  color = 'orange';
              }
            }
            hexes.push(<Hexagon key={key} color={color} x={x} y={y}
              onClick={() => this.props.handleDisplay('hex-click', key, x, y)}/>);
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
