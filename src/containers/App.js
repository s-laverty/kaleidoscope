import React from 'react'
import './App.css';
import DisplayArea from './DisplayArea';
import MainToolbar from './MainToolbar';

class App extends React.Component {
  constructor() {
    super();
    this.state = {
      hexdata: {}
    }
    this.handleHexClick = this.handleHexClick.bind(this);
  }
  handleHexClick(x,y) {
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
  render() {
    const DisplayArea_props = {
      hexdata: this.state.hexdata, handleHexClick: this.handleHexClick
    };
    return (
      <div className="App">
        <DisplayArea {...DisplayArea_props}></DisplayArea>
        <MainToolbar></MainToolbar>
      </div>
    );
  }
}

export default App;
