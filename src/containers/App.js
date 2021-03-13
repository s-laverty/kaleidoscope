import React from 'react'
import './App.scss';
import DisplayArea from './DisplayArea';
import MainToolbar from './MainToolbar';
import Hexagon from '../Hexagon';
import { add, deepEqual, max } from 'mathjs';

class App extends React.Component {
  static saved_props = {
    'hex-freestyle': new Set(['hexcolors','colors','pan','zoom']),
    'hex-tessellate': new Set()
  }
  static default_props = {
    'hex-freestyle': {
      hexcolors: {},
      history: [{hexcolors: {}}],
      history_index: 0,
      colors: ['#ff0000','#00ff00','#0000ff'],
      active_color_index: null,
      active_tool: null,
      active_option: null,
      pan: {x: 0, y: 0},
      zoom: 1.0
    },
    'hex-tessellate': {
      tiledata: {
        '0,0': {
          coords: [0,0],
          edges: 0b111111,
        }
      },
      adjacent: new Set(['0,1','1,0','-1,1','-1,0','0,-1','1,-1']),
      tessellations: [],
      active_tessellation_index: null,
      active_tool: null,
      zoom: 1.0
    }
  }

  constructor() {
    super();
    this.state = {
      active_dropdown: null,
      mode: 'hex-freestyle',
      file_operation: null,
      ...App.default_props
    };
    this._toolbar_handlers = {
      'set-dropdown': dropdown => {
        this.setState(state => {
          if (state.mode === 'hex-freestyle'
          && state['hex-freestyle'].active_option === 'change-color'
          && !state.active_dropdown) return;
          return {
            active_dropdown: (state.active_dropdown === dropdown ? null : dropdown)
          };
        });
      },
      'set-mode': mode => this.setState({mode: mode}),
      'set-file-operation': operation => this.setState({file_operation: operation}),
      'load-from-text': file_text => this.loadFromText(file_text),
      'get-save-uri': () => this.getSaveURI(),
      'undo': () => {
        this.setState(state => {
          const current = state[state.mode];
          if (current.history_index) {
            return {
              [state.mode]: {...current,
                history_index: current.history_index - 1,
                ...current.history[current.history_index - 1]
              }
            };
          }
        });
      },
      'redo': () => {
        this.setState(state => {
          const current = state[state.mode];
          if (current.history && current.history.length > current.history_index + 1) {
            return {
              [state.mode]: {...current,
                history_index: current.history_index + 1,
                ...current.history[current.history_index + 1]
              }
            };
          }
        });
      },
      'set-tool': (tool, ...args) => this.setState(state => {
        const current = state[state.mode];
        const other = {};
        if ('active_color_index' in current) other.active_color_index = null;
        if (tool === 'color') {
          const i = args[0];
          if (current.active_color_index === i) tool = null;
          else other.active_color_index = i;
        } else if (current.active_tool === tool) tool = null;
        return {[state.mode]: {...current, active_tool: tool, ...other}};
      }),
      'set-option': (option, ...args) => this.setState(state => {
        const current = state[state.mode];
        const other = {};
        if (current.active_option === option) option = null;
        return {[state.mode]: {...current, active_option: option, ...other}};
      }),
      'swap-colors': (...args) => this.setState(state => {
        const current = state[state.mode];
        let [i,j] = args.sort();
        let active_color_index = current.active_color_index;
        if (active_color_index === i) active_color_index = j;
        else if (active_color_index === j) active_color_index = i;
        const colors = current.colors.slice();
        let temp = colors[i];
        colors[i] = colors[j];
        colors[j] = temp;
        return {
          [state.mode]: {...current,
            active_color_index: active_color_index,
            colors: colors
          }
        };
      }),
      'add-color': () => this.setState(state => {
        const current = state[state.mode];
        const new_color = `#${Math.floor(Math.random()*(1<<(8*3))).toString(16).padStart(6,'0')}`;
        const colors = current.colors.slice();
        colors.push(new_color);
        return {
          [state.mode]: {...current,
            active_tool: 'color',
            active_option: 'change-color-click',
            colors: colors,
            active_color_index: current.colors.length
          }
        };
      }),
      'change-color': color => {
        this.setState(state => {
          const current = state[state.mode];
          const colors = current.colors.slice();
          colors[current.active_color_index] = color;
          return {
            [state.mode]: {...current, colors: colors}
          };
        });
      },
      'remove-color': i => this.setState(state => {
        const current = state[state.mode];
        let active_color_index = current.active_color_index;
        if (i === undefined) i = active_color_index;
        if (i === active_color_index) active_color_index = null;
        else if (i < active_color_index) --active_color_index;
        const colors = current.colors.slice(0, i).concat(
          current.colors.slice(i + 1));
        return {
          [state.mode]: {...current,
            active_tool: null,
            colors: colors,
            active_color_index: active_color_index
          }
        };
      }),
      'clear-all': () => {
        if (window.confirm('Are you sure you want to clear everything?')) {
          this.setState(state => ({
            [state.mode]: {...state[state.mode], hexcolors: {}}
          }));
        }
      },
      'tile-shape-init': () => this.setState(state => ({
        [state.mode]: {...state[state.mode],
          tessellations: [],
          active_tessellation_index: null,
        }
      })),
      'tile-shape-confirm': () => this.tessellate(),
      'set-tessellation-index': i => this.setState(state => ({
        [state.mode]: {...state[state.mode],
          active_tessellation_index: i,
        }
      }))
    };
    this._display_handlers = {
      'hex-click': (action, coords) => {
        let log_change = false;
        this.setState(state => {
          const current = state[state.mode];
          switch (current.active_tool) {
            case 'color':
              if (current.active_option === 'ink-dropper') {
                const colors = current.colors.slice();
                if (current.hexcolors[coords])
                  colors[current.active_color_index] = current.hexcolors[coords];
                return {
                  [state.mode]: {...current,
                    active_option: null,
                    colors: colors
                  }
                }
              } else {
                if (current.hexcolors[coords] !== current.colors[current.active_color_index]) {
                  log_change = true;
                  return {
                    [state.mode]: {...current,
                      hexcolors: {...current.hexcolors,
                        [coords]: current.colors[current.active_color_index]
                      }
                    }
                  }
                }
              }
              break;
            case 'erase':
              log_change = true;
              const hexcolors = {...current.hexcolors};
              delete hexcolors[coords];
              return {
                [state.mode]: {...current,
                  hexcolors: hexcolors
                }
              }
            case 'tile-shape':
              const tiledata = {...current.tiledata};
              const adjacent = new Set(current.adjacent);
              const toggle_edge = (coords, edge) => {
                const current = tiledata[coords];
                tiledata[coords] = {...current,
                  edges: current.edges ^ (1<<edge)
                };
              }
              const fill_hole = coords => {
                if (!(coords in tiledata)) {
                  adjacent.delete(String(coords));
                  tiledata[coords] = {coords: coords, edges: 0};
                  Hexagon.forEachAdjacent(coords, other_coords => fill_hole(other_coords));
                }
              };
              const remove_adjacent = coords => {
                Hexagon.forEachAdjacent(coords, other_coords => {
                  if (adjacent.has(String(other_coords)) && !Hexagon.someAdjacent(other_coords,
                    coords => coords in tiledata
                  )) adjacent.delete(String(other_coords));
                });
              };
              switch(action) {
                case 'tile-add':
                  tiledata[coords] = {coords: coords, edges: 0};
                  adjacent.delete(String(coords));
                  Hexagon.forEachAdjacent(coords, (other_coords,i) => {
                    if (other_coords in tiledata) toggle_edge(other_coords, (i+3)%6);
                    else {
                      adjacent.add(String(other_coords));
                      tiledata[coords].edges |= 1<<i;
                    }
                  });
                  Hexagon.getHoles(tiledata).forEach(hole => {
                    hole.forEach(([{coords},edge]) => toggle_edge(coords, edge));
                    const [{coords: start_coords}, start_edge] = hole[0];
                    fill_hole(add(start_coords, Hexagon.moves[start_edge]));
                  });
                  break;
                case 'tile-remove':
                  delete tiledata[coords];
                  adjacent.add(String(coords));
                  Hexagon.forEachAdjacent(coords, (coords,i) => {
                    if (coords in tiledata) toggle_edge(coords, (i+3)%6);
                  });
                  remove_adjacent(coords);
                  Hexagon.getConnectedParts(tiledata).forEach(connected_part => {
                    if ('0,0' in connected_part) return;
                    Object.values(connected_part).forEach(({coords}) => {
                      delete tiledata[coords];
                      remove_adjacent(coords);
                    });
                  });
                  break;
                default: console.warn(`Unrecognized tile-shape action: ${action}`);
              }
              return {
                [state.mode]: {...current,
                  tiledata: tiledata, adjacent: adjacent
                }
              };
            default: break;
          }
        }, () => log_change && this.saveState());
      },
      'pan': (dx,dy) => this.setState(state => {
        const current = state[state.mode];
        return {
          [state.mode]: {...current,
            pan: {x: current.pan.x + dx, y: current.pan.y + dy}
          }
        };
      }),
      'zoom': zoom => this.setState(state => {
        const current = state[state.mode];
        const ratio = zoom / current.zoom;
        let other = {};
        if ('pan' in current) other.pan = {
          x: current.pan.x * ratio,
          y: current.pan.y * ratio
        }
        return {
          [state.mode]: {...current, zoom: zoom, ...other}
        };
      })
    };
    this.handleClick = this.handleClick.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleDisplay = this.handleDisplay.bind(this);
    this.handleToolbar = this.handleToolbar.bind(this);
  }

  saveState() {
    this.setState(state => {
      if (state.mode === 'hex-freestyle') {
        const current = state['hex-freestyle'];
        const next = {
          hexcolors: current.hexcolors
        };
        const previous = current.history[current.history_index];
        if (Object.entries(next).every(([key,val]) => val === previous[key])) return;
        const start = Math.max(current.history_index-(200-2), 0);
        const history = current.history.slice(start,current.history_index+1);
        history.push(next);
        return {
          'hex-freestyle': {...current,
            history: history,
            history_index: history.length - 1
          }
        };
      }
    });
  }

  handleClick() {
    this.setState(state => {
      const current = state[state.mode];
      if (current.active_option === 'change-color')
        return {
          [state.mode]: {...current,
            active_option: null
          }
        };
    });
  }

  handleKeyDown(e) {
    if (e.ctrlKey) {
      if (e.key === 'z') this.handleToolbar('undo');
      else if (e.key === 'y') this.handleToolbar('redo');
    }
  }

  handleDisplay(type, ...args) {
    const handler = this._display_handlers[type];
    if (handler === undefined) {
      console.warn(`Unrecognized display action: ${type}`);
      return;
    }
    return handler(...args);
  }

  handleToolbar(type, ...args) {
    const handler = this._toolbar_handlers[type];
    if (handler === undefined) {
      console.warn(`Unrecognized toolbar action: ${type}`);
      return;
    }
    return handler(...args);
  }

  getSaveURI() {
    const save_state = {mode: this.state.mode};
    const current = this.state[this.state.mode];
    App.saved_props[this.state.mode].forEach(key => save_state[key] = current[key]);
    return encodeURIComponent(JSON.stringify(save_state));
  }

  loadFromText(file_text) {
    let result;
    try {
      result = JSON.parse(file_text);
    } catch (e) {
      return 'invalid';
    }
    if (result.mode !== this.state.mode) return 'wrong-mode';
    delete result.mode;
    const valid_props = new Set(App.saved_props[this.state.mode]);
    for (let prop in result) {
      if (!valid_props.has(prop)) return 'invalid';
      valid_props.delete(prop);
    }
    if (valid_props.size) return 'invalid';
    if (window.confirm('Are you sure you want to load this file? All unsaved changes will be lost.')) {
      this.setState({...result,
        [this.state.mode]: {...App.default_props[this.state.mode], ...result}
      });
      return 'success';
    }
    return 'user-cancel';
  }

  tessellate() {
    const current = this.state[this.state.mode];
    const tiledata = current.tiledata;
    let initial_x = 1;
    while (Hexagon.hasOverlap(tiledata, tiledata, [initial_x,0])) ++initial_x;
    let translate = [initial_x,0];
    let tile = Hexagon.translate(tiledata, translate);
    const path = [];
    let prev = 0;
    let max_translate=[0,0,0]; // z=(x+y), y, -x
    while (!deepEqual(translate,[-initial_x,0])) {
      path.push([translate, tile]);
      [tile, prev] = Hexagon.revolve(tiledata, tile, prev);
      translate = add(translate, Hexagon.moves[prev]);
      max_translate = max([[translate[0]+translate[1],translate[1],-translate[0]],max_translate], 0);
    }
    max_translate[2] = -max_translate[2];
    const test_translate = (translate) => {
      if (path.some(([other_translate]) => deepEqual(translate, other_translate))) return;
      let tile = Hexagon.translate(tiledata, translate);
      if (Hexagon.isAdjacent(tiledata, tile) && !Hexagon.hasOverlap(tiledata, tile))
        path.push([translate, tile]);
    };
    for (let y = 1; y < max_translate[1]; ++y) {
      for (let x = max_translate[0] - y - 1; x > 0; --x) {
        test_translate([x,y]);
      }
    }
    for (let x = 0; x > max_translate[2]; --x) {
      for (let y = Math.min(max_translate[0] - x, max_translate[1]) - 1; x+y > 0; --y) {
        test_translate([x,y]);
      }
    }
    for (let z = 0; z > max_translate[2]; --z) {
      for (let y = Math.min(max_translate[1], z - max_translate[2]) - 1; y > 0; --y) {
        test_translate([z-y,y]);
      }
    }
    const tessellations = [];
    const exclude = new Set();
    while (path.length) {
      let [translate1, tile1] = path.shift();
      if (exclude.has(translate1)) continue;
      path.forEach(([translate2,tile2]) => {
        if (Hexagon.isAdjacent(tile1, tile2) && !Hexagon.hasOverlap(tile1, tile2)) {
          const merged = Hexagon.merge(tiledata, tile1, tile2, Hexagon.translate(tile1, translate2));
          if (!Hexagon.hasHoles(merged)) {
            tessellations.push([translate1, translate2]);
            exclude.add(translate2);
          }
        }
      });
    };
    this.setState(state => ({
      [state.mode]: {...state[state.mode],
        tessellations: tessellations
      }
    }));
  }

  render() {
    return (
      <div className='App' onClick={this.handleClick}>
        <DisplayArea
          mode={this.state.mode}
          current={this.state[this.state.mode]}
          handleDisplay={this.handleDisplay}
        />
        <MainToolbar
          mode={this.state.mode}
          current={this.state[this.state.mode]}
          file_operation={this.state.file_operation}
          active_dropdown={this.state.active_dropdown}
          handleToolbar={this.handleToolbar}
        />
      </div>
    );
  }
  componentDidUpdate() {
    this.setState(state => {
      if (state.mode === 'hex-freestyle') {
        const current = state['hex-freestyle'];
        if (current.active_option === 'change-color-click') {
          return {
            'hex-freestyle': {...current,
              active_option: 'change-color'
            }
          };
        }
      }
    });
  }
  componentDidMount() {
    window.addEventListener('keydown', this.handleKeyDown);
  }
  componentWillUnmount() {
    window.removeEventListener('keydown', this.handleKeyDown);
  }
}

export default App;
