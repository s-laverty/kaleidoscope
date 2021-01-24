import React from 'react'
import './App.css';
import DisplayArea from './DisplayArea';
import MainToolbar from './MainToolbar';

class App extends React.Component {
  constructor() {
    super();
    this.state = {
      hexdata: {},
      colorchoices: ['#ff0000','#00ff00','#0000ff'],
      selectedcolorindex: null,
    };
    this.handleHexClick = this.handleHexClick.bind(this);
    this.handleColorChoiceClick = this.handleColorChoiceClick.bind(this);
  }
  handleHexClick(x,y) {
    const key = `${x},${y}`;
    this.setState(state => {
      if (this.selectedcolorindex === null) return;
      return {...state, hexdata: {...state.hexdata, [key]:
        this.state.colorchoices[this.state.selectedcolorindex]}};
    });
  }
  handleColorChoiceClick(i) {
    this.setState({...this.state, selectedcolorindex: i});
  }
  render() {
    const DisplayArea_props = {
      hexdata: this.state.hexdata,
      handleHexClick: this.handleHexClick
    };
    const MainToolbar_props = {
      colorchoices: this.state.colorchoices,
      selectedcolorindex: this.state.selectedcolorindex,
      handleColorChoiceClick: this.handleColorChoiceClick
    };
    console.log(MainToolbar_props);
    return (
      <div className="App">
        <DisplayArea {...DisplayArea_props}></DisplayArea>
        <MainToolbar {...MainToolbar_props}></MainToolbar>
      </div>
    );
  }
}

export default App;
