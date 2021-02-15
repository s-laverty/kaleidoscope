import React from 'react'
import './App.scss';
import DisplayArea from './DisplayArea';
import MainToolbar from './MainToolbar';

class App extends React.Component {
  constructor() {
    super();
    this.state = {
      hexdata: {},
      selected_tool: null,
      colors: ['#ff0000','#00ff00','#0000ff'],
      selected_color_index: null,
      color_picker_value: '',
      will_pick_color: false,
      file_operation: null
    };
    this.handleHexClick = this.handleHexClick.bind(this);
    this.handleToolbar = this.handleToolbar.bind(this);
    this.loadFileText = this.loadFileText.bind(this);
    this.getDownloadURI = this.getDownloadURI.bind(this);
  }
  handleHexClick(x,y) {
    const key = `${x},${y}`;
    const type = this.state.selected_tool;
    if (['fill','change-color'].includes(type)) {
      this.setState(state => ({
        selected_tool: 'fill',
        hexdata: {...state.hexdata,
          [key]: state.colors[state.selected_color_index]
        }
      }));
    } else if (type === 'erase') {
      this.setState(state => ({
        hexdata: {...state.hexdata,
          [key]: undefined
        }
      }));
    }
  }
  handleToolbar(type, ...args) {
    if (type === 'load') {
      this.setState({file_operation: 'load'});
    } else if (type === 'save') {
      this.setState({file_operation: 'save'});
    } else if (type === 'file-operation-close') {
      this.setState({file_operation: null});
    } else if (type ==='color') {
      this.setState({
        selected_tool: 'fill',
        selected_color_index: args[0]
      });
    } else if (type === 'add-color') {
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
    } else if (type === 'change-color-click') {
      this.setState(state => ({
        selected_tool: 'change-color',
        color_picker_value: state.colors[state.selected_color_index],
        will_pick_color: true
      }));
    } else if (type === 'change-color') {
      this.setState(state => {
        const new_colors = state.colors.slice();
        new_colors[state.selected_color_index] = args[0];
        return {
          colors: new_colors,
          color_picker_value: args[0]
        };
      });
    } else if (type === 'change-color-close') {
      this.setState({selected_tool: 'fill'});
    } else if (type === 'remove-color') {
      this.setState(state => {
        const new_colors = state.colors.slice(0,state.selected_color_index).concat(
          state.colors.slice(state.selected_color_index+1));
        return {
          selected_tool: null,
          colors: new_colors,
          selected_color_index: null
        }
      });
    } else if (type === 'erase') {
      this.setState({
        selected_tool: 'erase',
        selected_color_index: null
      });
    } else console.warn(`Unrecognized toolbar command: ${type}`);
  }

  getDownloadURI() {
    return encodeURIComponent(JSON.stringify({
      hexdata: this.state.hexdata,
      colors: this.state.colors
    }));
  }

  loadFileText(file_text) {
    let result;
    try {
      result = JSON.parse(file_text);
    } catch (e) {
      return false;
    }
    const valid_props = new Set(['hexdata', 'colors']);
    for (let prop in result) {
      if (!valid_props.has(prop)) return false;
      valid_props.delete(prop);
    }
    if (valid_props.size) return false;
    if (window.confirm('Are you sure you want to load this file? All unsaved changes will be lost.')) {
      this.setState(result);
    }
    return true;
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
          file_operation={this.state.file_operation}
          handleToolbar={this.handleToolbar}
          getDownloadURI={this.getDownloadURI}
          loadFileText={this.loadFileText}
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
