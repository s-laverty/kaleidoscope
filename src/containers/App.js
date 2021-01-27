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
    let new_colors;
    switch (type) {
      case 'color':
        this.setState({...this.state, toolbar:
          {...this.state.toolbar,
            selected_tool: 'fill',
            selected_color_index: args[0]
          }
        });
        break;
      case 'new-color':
        let new_color = `#${Math.floor(Math.random()*(1<<(8*3))).toString(16)}`;
        let l = this.state.toolbar.colors.length;
        new_colors = this.state.toolbar.colors.slice();
        new_colors.push(new_color);
        this.setState({...this.state, toolbar:
          {...this.state.toolbar,
            selected_tool: 'fill',
            colors: new_colors,
            selected_color_index: l,
            color_picker_value: new_color
          }
        });
        break;
      case 'color-picker':
        new_colors = this.state.toolbar.colors.slice();
        new_colors[this.state.toolbar.selected_color_index] = args[0];
        this.setState({...this.state, toolbar:
          {...this.state.toolbar,
            colors: new_colors,
            color_picker_value: args[0]
          }
        });
        break;
      case 'erase':
        this.setState({...this.state, toolbar:
          {...this.state.toolbar,
            selected_tool: 'erase',
            selected_color_index: null
          }
        });
        break;
      default: break;
    }
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
