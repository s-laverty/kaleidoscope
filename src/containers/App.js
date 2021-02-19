import React from 'react'
import './App.scss';
import DisplayArea from './DisplayArea';
import MainToolbar from './MainToolbar';

class App extends React.Component {
  constructor() {
    super();
    this.state = {
      hexdata: {},
      selected_dropdown: null,
      file_operation: null,
      selected_option: null,
      selected_tool: null,
      colors: ['#ff0000','#00ff00','#0000ff'],
      selected_color_index: null
    };
    this.history = [];
    this.handleClick = this.handleClick.bind(this);
    this.handleHexClick = this.handleHexClick.bind(this);
    this.handleToolbar = this.handleToolbar.bind(this);
    this.loadFileText = this.loadFileText.bind(this);
    this.getDownloadURI = this.getDownloadURI.bind(this);
  }

  handleClick() {
    this.setState(state => {
      if (state.selected_option === 'change-color')
        return {selected_option: null};
    });
  }

  handleHexClick(x,y) {
    const key = `${x},${y}`;
    const type = this.state.selected_tool;
    if (type === 'color') {
      if (this.state.selected_option === 'ink-dropper')
        this.setState(state => {
          if (state.hexdata[key]) {
            const new_colors = state.colors.slice();
            new_colors[state.selected_color_index] = state.hexdata[key];
            return {
              selected_option: null,
              colors: new_colors
            };
          }
        });
      else
        this.setState(state => ({
          selected_tool: 'color',
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
    if (type === 'dropdown-toggle') {
      this.setState(state => {
        if (state.selected_option === 'change-color' && !state.selected_dropdown) return;
        return {
          selected_dropdown: (state.selected_dropdown === args[0] ? null : args[0]),
          selected_option: null
        };
      });
    } else if (type === 'load') {
      this.setState({file_operation: 'load'});
    } else if (type === 'save') {
      this.setState({file_operation: 'save'});
    } else if (type === 'file-operation-close') {
      this.setState({file_operation: null});
    } else if (type ==='color') {
      this.setState({
        selected_tool: 'color',
        selected_color_index: args[0]
      });
    } else if (type === 'add-color') {
      this.setState(state => {
        let new_color = `#${Math.floor(Math.random()*(1<<(8*3))).toString(16).padStart(6,'0')}`;
        let l = state.colors.length;
        let new_colors = state.colors.slice();
        new_colors.push(new_color);
        return {
          selected_tool: 'color',
          selected_option: 'change-color-click',
          colors: new_colors,
          selected_color_index: l
        };
      });
    } else if (type === 'change-color-click') {
      this.setState({selected_option: 'change-color-click'});
    } else if (type === 'change-color') {
      this.setState(state => {
        const new_colors = state.colors.slice();
        new_colors[state.selected_color_index] = args[0];
        return {colors: new_colors};
      });
    } else if (type === 'change-color-close') {
      this.setState({selected_option: null});
    } else if (type === 'ink-dropper') {
      this.setState(state => ({
        selected_option: (state.selected_option === 'ink-dropper' ? null : 'ink-dropper')
      }));
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
      <div className='App' onClick={this.handleClick}>
        <DisplayArea
          hexdata={this.state.hexdata}
          handleHexClick={this.handleHexClick}
        />
        <MainToolbar
          selected_dropdown={this.state.selected_dropdown}
          file_operation={this.state.file_operation}
          selected_option={this.state.selected_option}
          selected_tool={this.state.selected_tool}
          colors={this.state.colors}
          selected_color_index={this.state.selected_color_index}
          handleToolbar={this.handleToolbar}
          getDownloadURI={this.getDownloadURI}
          loadFileText={this.loadFileText}
        />
      </div>
    );
  }
  componentDidUpdate() {
    if (this.state.selected_option === 'change-color-click') {
      this.setState({selected_option: 'change-color'});
    }
  }
}

export default App;
