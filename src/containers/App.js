import React from 'react'
import './App.css';
import DisplayArea from './DisplayArea';
import MainToolbar from './MainToolbar';

class App extends React.Component {
  constructor() {
    super();
    this.state = {
      toolbar: {
        selected_tool: null,
        colors: ['#ff0000','#00ff00','#0000ff'],
        selected_color_index: null,
        color_picker_value: ''
      },
      hexdata: {}
    };
    this.handleHexClick = this.handleHexClick.bind(this);
    this.handleToolbar = this.handleToolbar.bind(this);
  }
  handleHexClick(x,y) {
    const key = `${x},${y}`;
    switch (this.state.toolbar.selected_tool) {
      case 'fill':
        this.setState(state => {
          return {...state, hexdata: {...state.hexdata, [key]:
            this.state.toolbar.colors[this.state.toolbar.selected_color_index]}};
        });
        break;
      case 'erase':
        this.setState(state => {
          return {...state, hexdata: {...state.hexdata, [key]: undefined}};
        });
        break;
      default: return;
    }
  }
  handleToolbar(type, ...args) {
    this.setState(state => {
      switch (type) {
        case 'color':
          return ({...state, toolbar:
            {...state.toolbar,
              selected_tool: 'fill',
              selected_color_index: args[0]
            }
          });
        case 'color-picker':
          const new_colors = state.toolbar.colors.slice();
          new_colors[state.toolbar.selected_color_index] = args[0];
          return ({...state, toolbar:
            {...state.toolbar,
              colors: new_colors,
              color_picker_value: args[0]
            }
          });
        case 'erase':
          return ({...state, toolbar:
            {...state.toolbar,
              selected_tool: 'erase',
              selected_color_index: null
            }
          });
        default:
          return state;
      }
    });
  }
  render() {
    const DisplayArea_props = {
      hexdata: this.state.hexdata,
      handleHexClick: this.handleHexClick
    };
    const MainToolbar_props = {
      ...this.state.toolbar,
      handleToolbar: this.handleToolbar
    };
    return (
      <div className="App">
        <DisplayArea {...DisplayArea_props}></DisplayArea>
        <MainToolbar {...MainToolbar_props}></MainToolbar>
      </div>
    );
  }
}

export default App;
