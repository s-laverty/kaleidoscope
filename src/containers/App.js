import React from 'react'
import './App.css';
import DisplayArea from './DisplayArea';
import MainToolbar from './MainToolbar';

class App extends React.Component {
  constructor() {
    super();
    this.state = {
      selected_tool: null,
      colors: ['#ff0000','#00ff00','#0000ff'],
      selected_color_index: null,
      color_picker_value: '',
      will_pick_color: false,
      hexdata: {}
    };
    this.handleHexClick = this.handleHexClick.bind(this);
    this.handleToolbar = this.handleToolbar.bind(this);
  }
  handleHexClick(x,y) {
    const key = `${x},${y}`;
    switch (this.state.selected_tool) {
      case 'fill':
      case 'change-color':
        this.setState(state => ({
          selected_tool: 'fill',
          hexdata: {...state.hexdata,
            [key]: state.colors[state.selected_color_index]
          }
        }));
        break;
      case 'erase':
        this.setState(state => ({
          hexdata: {...state.hexdata,
            [key]: undefined
          }
        }));
        break;
      default: return;
    }
  }
  handleToolbar(type, ...args) {
    switch (type) {
      case 'load':
        let saved_hexdata = JSON.parse(localStorage.getItem('hexdata'));
        let saved_colors = JSON.parse(localStorage.getItem('colors'));
        if (!saved_hexdata || !saved_colors) {
          alert('It appears there is no save data on this computer!');
          break;
        }
        if (window.confirm('Are you sure you want to overwrite your current project?')) {
          this.setState({
            hexdata: saved_hexdata,
            colors: saved_colors,
            selected_tool: null,
            selected_color_index: null
          });
        }
        break;
      case 'save':
        localStorage.setItem('hexdata', JSON.stringify(this.state.hexdata));
        localStorage.setItem('colors', JSON.stringify(this.state.colors));
        break;
      case 'color':
        this.setState({
          selected_tool: 'fill',
          selected_color_index: args[0]
        });
        break;
      case 'add-color':
        this.setState(state => {
          let new_color = `#${Math.floor(Math.random()*(1<<(8*3))).toString(16).padStart(6,'0')}`;
          let l = state.colors.length;
          let new_colors = state.colors.slice();
          new_colors.push(new_color);
          return {
            selected_tool: 'change-color',
            colors: new_colors,
            selected_color_index: l,
            color_picker_value: new_color,
            will_pick_color: true
          };
        });
        break;
      case 'change-color-click':
        this.setState(state => ({
          selected_tool: 'change-color',
          color_picker_value: state.colors[state.selected_color_index],
          will_pick_color: true
        }));
        break;
      case 'change-color':
        this.setState(state => {
          const new_colors = state.colors.slice();
          new_colors[state.selected_color_index] = args[0];
          return {
            colors: new_colors,
            color_picker_value: args[0]
          };
        });
        break;
      case 'change-color-close':
        this.setState({selected_tool: 'fill'});
        break;
      case 'remove-color':
        this.setState(state => {
          const new_colors = state.colors.slice(0,state.selected_color_index).concat(
            state.colors.slice(state.selected_color_index+1));
          return {
            selected_tool: null,
            colors: new_colors,
            selected_color_index: null
          }
        });
        break;
      case 'erase':
        this.setState({
          selected_tool: 'erase',
          selected_color_index: null
        });
        break;
      default: break;
    }
  }
  render() {
    return (
      <div className="App">
        <DisplayArea
          hexdata={this.state.hexdata}
          handleHexClick={this.handleHexClick}
        />
        <MainToolbar
          selected_tool={this.state.selected_tool}
          colors={this.state.colors}
          selected_color_index={this.state.selected_color_index}
          color_picker_value={this.state.color_picker_value}
          will_pick_color={this.state.will_pick_color}
          handleToolbar={this.handleToolbar}
        />
      </div>
    );
  }
  componentDidUpdate() {
    if (this.state.will_pick_color) {
      this.setState({will_pick_color: false});
    }
  }
}

export default App;
