import React from 'react';
import './HexTools.css';

class HexTools extends React.Component {
  render() {
    const choices = [];
      for (let i = 0; i < this.props.colorchoices.length; ++i) {
        let className = 'ColorChoice';
        if (this.props.selectedcolorindex === i) className += ' selected';
        choices.push(<button key={i} className={className}
          onClick={() => this.props.handleColorChoiceClick(i)}>
          <span style={{backgroundColor: this.props.colorchoices[i]}}></span><br/>
          Color #{i+1}
        </button>)
      }
    const erase_className = 'erase';
    if (this.props.selectederase) erase_className += ' selected';
    return (
      <div className='HexTools'>
        {choices}
        {/*<button className={erase_className}><span></span><br/>Erase</button>/*}
      </div>
    );
  }
}

export default HexTools;
