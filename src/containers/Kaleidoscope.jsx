import produce from 'immer';
import { add, flatten, inv, multiply, subtract } from 'mathjs';
import { useEffect, useReducer, useState } from 'react';
import { Col, Container, Row } from 'react-bootstrap';
// CreateReactApp won't currently allow web workers. This is a workaround.
// eslint-disable-next-line import/no-webpack-loader-syntax
import Worker from 'worker-loader!../utils/worker';
import ConfirmModal from '../components/ConfirmModal';
import { HexPoint } from '../utils/HexUtils';
import { CHUNK_SIZE, coalesceHistory, INITIAL_STATE, MAX_ZOOM, MIN_ZOOM, ZOOM_WHEEL_SENSITIVITY } from '../utils/KaleidoscopeUtils';
import DisplayArea from './DisplayArea';
import './Kaleidoscope.scss';
import LoadFileModal from './LoadFileModal';
import MainSidebar from './MainSideBar';
import SaveFileModal from './SaveFileModal';
/** @typedef {import('../utils/HexUtils').HexMap<V>} HexMap @template V */
/** @typedef {import('../utils/HexUtils').HexPointEdge} HexPointEdge */

// const reducer = produce((state, {type, ...action}) => {
//   const { mode } = state;
//   const current = state[mode];
//   let update_history = true;
//   switch (type) {
//     case 'set': {
//       const { name, value } = action;
//       state[name] = value;
//     } break;
//     case 'set-current': {
//       const { name, value } = action;
//       current[name] = value;
//     } break;
//     case 'toggle-current': {
//       const { name } = action;
//       current[name] = !current[name];
//     } break;
//     case 'load-project': {
//       const { data } = action;
//       state[mode] = data;
//     } break;
//     case 'undo': {
//       const { history, history_index } = current;
//       if (history_index) result = {
//         [mode]: {
//           ...current,
//           history_index: history_index - 1,
//           ...history[history_index - 1]
//         }
//       };
//     } break;
//     case 'redo': {
//       let { history, history_index } = current;
//       if (history && history_index + 1 < history.length) result = {
//         [mode]: {
//           ...current,
//           history_index: history_index + 1,
//           ...history[history_index + 1]
//         }
//       };
//     } break;
//     case 'select-tool': {
//       let { tool } = action;
//       if (tool === current.tool) tool = null;
//       result = { [mode]: { ...current, tool } };
//     } break;
//     case 'load-tessellations': {
//       if (current.tessellation_signature === current.tile_shape_signature) break;
//       let prev_tessellation = current.tessellations?.[current.tessellation_index];
//       let { tessellations, signature: tessellation_signature } = action;
//       if (tessellation_signature === current.tile_shape_signature) {
//         let tessellation_index = null;
//         // Check if the current tessellation exists in the new set
//         if (prev_tessellation) {
//           let prev_inv = inv(prev_tessellation);
//           tessellations.forEach((tessellation, i) => {
//             if (flatten(multiply(tessellation, prev_inv)).every(
//               x => Math.abs(x - Math.round(x)) < 1e-5
//             )) tessellation_index = i;
//           });
//         }
//         result = { [mode]: { ...current, tessellations, tessellation_signature, tessellation_index } };
//       }
//     } break;
//     case 'select-color': {
//       let { color_index } = action;
//       let { tool } = current;
//       if (color_index === current.color_index) {
//         color_index = null;
//         if (['fill-color', 'flood-color'].includes(tool)) tool = null;
//       } else if (tool !== 'flood-color') tool = 'fill-color';
//       result = { [mode]: { ...current, color_index, tool } };
//     } break;
//     case 'add-color': {
//       let { tool } = current;
//       let new_color = `#${Math.floor(Math.random() * (1 << (8 * 3))).toString(16).padStart(6, '0')}`;
//       let colors = current.colors.slice();
//       colors.push(new_color);
//       if (tool !== 'flood-color') tool = 'fill-color';
//       result = {
//         [mode]: {
//           ...current,
//           colors,
//           color_index: colors.length - 1,
//           tool
//         }
//       };
//     } break;
//     case 'change-color': {
//       let { color, color_index } = action;
//       color_index = color_index ?? current.color_index;
//       let colors = current.colors.slice();
//       colors[color_index] = color;
//       result = { [mode]: { ...current, colors } };
//       update_history = false;
//     } break;
//     case 'change-color-dismiss': {
//       let { colors, history, history_index } = current;
//       let prev = history?.[history_index]?.colors;
//       if (prev?.every((color, i) => colors[i] === color)) colors = prev;
//       result = { [mode]: { ...current, colors } };
//     } break;
//     case 'remove-color': {
//       let { color_index: remove_index } = action;
//       let { colors, color_index, tool } = current;
//       remove_index = remove_index ?? color_index;
//       colors = colors.slice(0, remove_index)
//         .concat(colors.slice(remove_index + 1));
//       if (remove_index === color_index) {
//         if (['fill-color', 'flood-color'].includes(tool)) tool = null;
//         color_index = null;
//       } else if (remove_index < color_index) --color_index;
//       result = { [mode]: { ...current, colors, color_index, tool } };
//     } break;
//     case 'swap-colors': {
//       let { color_indices: [i, j] } = action;
//       let { color_index } = current;
//       let colors = current.colors.slice();
//       colors[i] = current.colors[j];
//       colors[j] = current.colors[i];
//       if (color_index === i) color_index = j;
//       else if (color_index === j) color_index = i;
//       result = { [mode]: { ...current, colors, color_index } };
//     } break;
//     case 'clear-all': {
//       let { tiledata, chunk_signatures } = INITIAL_STATE[mode];
//       let next = { ...current, tiledata };
//       if (current.chunk_signatures) next.chunk_signatures = chunk_signatures;
//       result = { [mode]: next };
//     } break;
//     case 'zoom': {
//       let { zoom, delta } = action;
//       if (!zoom)
//         zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, current.zoom - ZOOM_WHEEL_SENSITIVITY * delta));
//       let next = { ...current, zoom };
//       if (current.pan) next.pan = current.pan.multiply(zoom / current.zoom);
//       result = { [mode]: next };
//     } break;
//     case 'pan': {
//       let { ds } = action;
//       let { pan } = current;
//       result = { [mode]: { ...current, pan: pan.add(ds) } };
//     } break;
//     case 'hex-click': {
//       let { point } = action;
//       let { tool } = current;
//       if (state.grabbing) break;
//       if (current.pan && state.shiftKey) tool = 'pan';
//       switch (tool) {
//         case 'tile-shape': {
//           let { shape_action } = action;
//           switch (shape_action) {
//             case 'add': {
//               let tiledata = new current.tiledata.constructor(current.tiledata);
//               const fill_hole = point => {
//                 if (!(tiledata.has(point))) {
//                   tiledata.set(point, '#ffffff');
//                   point.adjacent.forEach(adj_point => fill_hole(adj_point));
//                 }
//               };
//               tiledata.set(point, '#ffffff');
//               for (let hole of /** @type {HexMap<string>} */ (tiledata).holes()) {
//                 const [point, i] = /** @type {HexPointEdge} */ (hole.next().value);
//                 fill_hole(point.step(i));
//               }
//               result = { [mode]: { ...current, tiledata, tile_shape_signature: Symbol() } };
//             } break;
//             case 'remove': {
//               let tiledata = new current.tiledata.constructor(current.tiledata);
//               tiledata.delete(point);
//               if (!tiledata.isConnected())
//                 tiledata = tiledata.getComponent(new HexPoint(0, 0));
//               result = { [mode]: { ...current, tiledata, tile_shape_signature: Symbol() } };
//             } break;
//             default: {
//               console.warn(`Unrecognized tile shape action: ${shape_action}`);
//               break;
//             }
//           }
//         } break;
//         case 'tile-swap': {
//           let { add: to_add, remove } = action;
//           let { tessellations, tessellation_index } = current;
//           let tessellation = tessellations[tessellation_index];
//           let tiledata = new current.tiledata.constructor(current.tiledata);
//           tiledata.set(to_add, tiledata.get(remove));
//           tiledata.delete(remove);
//           // Modify principal translations if necessary (both should be adjacent to the tile)
//           for (let [i, translation] of tessellation.entries()) {
//             let translated = tiledata.translate(translation, true);
//             if (tiledata.adjacentTo(translated)) continue;
//             tessellations = tessellations.slice();
//             tessellation = tessellation.slice();
//             let other_translation = tessellation[Number(!i)];
//             let new_tr = add(translation, other_translation);
//             if (tiledata.adjacentTo(tiledata.translate(new_tr, true))) tessellation[i] = new_tr;
//             else tessellation[i] = subtract(translation, other_translation);
//             tessellations[tessellation_index] = tessellation;
//             break;
//           }
//           result = { [mode]: { ...current, tiledata, tile_shape_signature: Symbol(), tessellations } };
//         } break;
//         case 'fill-color': {
//           let { tiledata, chunk_signatures } = current;
//           let color = current.colors[current.color_index];
//           if (color === tiledata.get(point)) break;
//           tiledata = new tiledata.constructor(tiledata);
//           tiledata.set(point, color);
//           let next = { ...current, tiledata };
//           if (chunk_signatures) {
//             chunk_signatures = new chunk_signatures.constructor(chunk_signatures);
//             chunk_signatures.set(point.divide(CHUNK_SIZE).floor(), Symbol());
//             next.chunk_signatures = chunk_signatures;
//           }
//           result = { [mode]: next };
//         } break;
//         case 'flood-color': {
//           let { tiledata, chunk_signatures } = current;
//           let color = current.colors[current.color_index];
//           let prev = tiledata.get(point);
//           if (!prev || color === prev) break;
//           tiledata = new tiledata.constructor(tiledata);
//           if (chunk_signatures) chunk_signatures = new chunk_signatures.constructor(chunk_signatures);
//           let explore = point => point.adjacent.forEach(adj_point => {
//             if (tiledata.get(adj_point) === prev) {
//               tiledata.set(adj_point, color);
//               chunk_signatures?.set(adj_point.divide(CHUNK_SIZE).floor(), Symbol());
//               explore(adj_point);
//             }
//           });
//           explore(point);
//           let next = { ...current, tiledata };
//           if (chunk_signatures) next.chunk_signatures = chunk_signatures;
//           result = { [mode]: next };
//         } break;
//         case 'clear-color': {
//           let { tiledata, chunk_signatures } = current;
//           if (!tiledata.has(point)) break;
//           tiledata = new tiledata.constructor(tiledata);
//           tiledata.delete(point);
//           let next = { ...current, tiledata };
//           if (chunk_signatures) {
//             chunk_signatures = new chunk_signatures.constructor(chunk_signatures);
//             chunk_signatures.set(point.divide(CHUNK_SIZE).floor(), Symbol());
//             next.chunk_signatures = chunk_signatures;
//           }
//           result = { [mode]: next };
//         } break;
//         case 'eyedropper-color': {
//           let color = current.tiledata.get(point);
//           if (!color) break;
//           let colors = current.colors.slice();
//           colors.push(color);
//           result = {
//             [mode]: {
//               ...current,
//               colors,
//               color_index: colors.length - 1,
//               tool: 'fill-color'
//             }
//           };
//         } break;
//         default: break;
//       }
//     } break;
//     case 'hex-doubleclick': {
//       let next = reducer({ ...state, [mode]: { ...current, tool: 'clear-color' } },
//         { ...action, type: 'hex-click' });
//       return { ...next, [mode]: { ...next[mode], tool: current.tool } };
//     }
//     default: {
//       console.warn(`Unrecognized action type: ${type}`);
//       return state;
//     }
//   }
//   if (!result) return state;
//   let next = { ...state, ...result };
//   if (update_history) coalesceHistory(next.mode, next[next.mode]);
//   return next;
// });

const reducer = (state, { type, ...action }) => {
  let { mode } = state;
  let current = state[mode];
  let result;
  let update_history = true;
  switch (type) {
    case 'set': {
      let { name, value } = action;
      if (value !== state[name]) result = { [name]: value };
    } break;
    case 'set-current': {
      let { name, value } = action;
      if (value !== current[name]) result = { [mode]: { ...current, [name]: value } };
    } break;
    case 'toggle-current': {
      let { name } = action;
      result = { [mode]: { ...current, [name]: !current[name] } }
    } break;
    case 'load-project': {
      let { data } = action;
      result = { [mode]: data };
    } break;
    case 'undo': {
      let { history, history_index } = current;
      if (history_index) result = {
        [mode]: {
          ...current,
          history_index: history_index - 1,
          ...history[history_index - 1]
        }
      };
    } break;
    case 'redo': {
      let { history, history_index } = current;
      if (history && history_index + 1 < history.length) result = {
        [mode]: {
          ...current,
          history_index: history_index + 1,
          ...history[history_index + 1]
        }
      };
    } break;
    case 'select-tool': {
      let { tool } = action;
      if (tool === current.tool) tool = null;
      result = { [mode]: { ...current, tool } };
    } break;
    case 'load-tessellations': {
      if (current.tessellation_signature === current.tile_shape_signature) break;
      let prev_tessellation = current.tessellations?.[current.tessellation_index];
      let { tessellations, signature: tessellation_signature } = action;
      if (tessellation_signature === current.tile_shape_signature) {
        let tessellation_index = null;
        // Check if the current tessellation exists in the new set
        if (prev_tessellation) {
          let prev_inv = inv(prev_tessellation);
          tessellations.forEach((tessellation, i) => {
            if (flatten(multiply(tessellation, prev_inv)).every(
              x => Math.abs(x - Math.round(x)) < 1e-5
            )) tessellation_index = i;
          });
        }
        result = { [mode]: { ...current, tessellations, tessellation_signature, tessellation_index } };
      }
    } break;
    case 'select-color': {
      let { color_index } = action;
      let { tool } = current;
      if (color_index === current.color_index) {
        color_index = null;
        if (['fill-color', 'flood-color'].includes(tool)) tool = null;
      } else if (tool !== 'flood-color') tool = 'fill-color';
      result = { [mode]: { ...current, color_index, tool } };
    } break;
    case 'add-color': {
      let { tool } = current;
      let new_color = `#${Math.floor(Math.random() * (1 << (8 * 3))).toString(16).padStart(6, '0')}`;
      let colors = current.colors.slice();
      colors.push(new_color);
      if (tool !== 'flood-color') tool = 'fill-color';
      result = {
        [mode]: {
          ...current,
          colors,
          color_index: colors.length - 1,
          tool
        }
      };
    } break;
    case 'change-color': {
      let { color, color_index } = action;
      color_index = color_index ?? current.color_index;
      let colors = current.colors.slice();
      colors[color_index] = color;
      result = { [mode]: { ...current, colors } };
      update_history = false;
    } break;
    case 'change-color-dismiss': {
      let { colors, history, history_index } = current;
      let prev = history?.[history_index]?.colors;
      if (prev?.every((color, i) => colors[i] === color)) colors = prev;
      result = { [mode]: { ...current, colors } };
    } break;
    case 'remove-color': {
      let { color_index: remove_index } = action;
      let { colors, color_index, tool } = current;
      remove_index = remove_index ?? color_index;
      colors = colors.slice(0, remove_index)
        .concat(colors.slice(remove_index + 1));
      if (remove_index === color_index) {
        if (['fill-color', 'flood-color'].includes(tool)) tool = null;
        color_index = null;
      } else if (remove_index < color_index) --color_index;
      result = { [mode]: { ...current, colors, color_index, tool } };
    } break;
    case 'swap-colors': {
      let { color_indices: [i, j] } = action;
      let { color_index } = current;
      let colors = current.colors.slice();
      colors[i] = current.colors[j];
      colors[j] = current.colors[i];
      if (color_index === i) color_index = j;
      else if (color_index === j) color_index = i;
      result = { [mode]: { ...current, colors, color_index } };
    } break;
    case 'clear-all': {
      let { tiledata, chunk_signatures } = INITIAL_STATE[mode];
      let next = { ...current, tiledata };
      if (current.chunk_signatures) next.chunk_signatures = chunk_signatures;
      result = { [mode]: next };
    } break;
    case 'zoom': {
      let { zoom, delta } = action;
      if (!zoom)
        zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, current.zoom - ZOOM_WHEEL_SENSITIVITY * delta));
      let next = { ...current, zoom };
      if (current.pan) next.pan = current.pan.multiply(zoom / current.zoom);
      result = { [mode]: next };
    } break;
    case 'pan': {
      let { ds } = action;
      let { pan } = current;
      result = { [mode]: { ...current, pan: pan.add(ds) } };
    } break;
    case 'hex-click': {
      let { point } = action;
      let { tool } = current;
      if (state.grabbing) break;
      if (current.pan && state.shiftKey) tool = 'pan';
      switch (tool) {
        case 'tile-shape': {
          let { shape_action } = action;
          switch (shape_action) {
            case 'add': {
              let tiledata = new current.tiledata.constructor(current.tiledata);
              const fill_hole = point => {
                if (!(tiledata.has(point))) {
                  tiledata.set(point, '#ffffff');
                  point.adjacent.forEach(adj_point => fill_hole(adj_point));
                }
              };
              tiledata.set(point, '#ffffff');
              for (let hole of /** @type {HexMap<string>} */ (tiledata).holes()) {
                const [point, i] = /** @type {HexPointEdge} */ (hole.next().value);
                fill_hole(point.step(i));
              }
              result = { [mode]: { ...current, tiledata, tile_shape_signature: Symbol() } };
            } break;
            case 'remove': {
              let tiledata = new current.tiledata.constructor(current.tiledata);
              tiledata.delete(point);
              if (!tiledata.isConnected())
                tiledata = tiledata.getComponent(new HexPoint(0, 0));
              result = { [mode]: { ...current, tiledata, tile_shape_signature: Symbol() } };
            } break;
            default: {
              console.warn(`Unrecognized tile shape action: ${shape_action}`);
              break;
            }
          }
        } break;
        case 'tile-swap': {
          let { add: to_add, remove } = action;
          let { tessellations, tessellation_index } = current;
          let tessellation = tessellations[tessellation_index];
          let tiledata = new current.tiledata.constructor(current.tiledata);
          tiledata.set(to_add, tiledata.get(remove));
          tiledata.delete(remove);
          // Modify principal translations if necessary (both should be adjacent to the tile)
          for (let [i, translation] of tessellation.entries()) {
            let translated = tiledata.translate(translation, true);
            if (tiledata.adjacentTo(translated)) continue;
            tessellations = tessellations.slice();
            tessellation = tessellation.slice();
            let other_translation = tessellation[Number(!i)];
            let new_tr = add(translation, other_translation);
            if (tiledata.adjacentTo(tiledata.translate(new_tr, true))) tessellation[i] = new_tr;
            else tessellation[i] = subtract(translation, other_translation);
            tessellations[tessellation_index] = tessellation;
            break;
          }
          result = { [mode]: { ...current, tiledata, tile_shape_signature: Symbol(), tessellations } };
        } break;
        case 'fill-color': {
          let { tiledata, chunk_signatures } = current;
          let color = current.colors[current.color_index];
          if (color === tiledata.get(point)) break;
          tiledata = new tiledata.constructor(tiledata);
          tiledata.set(point, color);
          let next = { ...current, tiledata };
          if (chunk_signatures) {
            chunk_signatures = new chunk_signatures.constructor(chunk_signatures);
            chunk_signatures.set(point.divide(CHUNK_SIZE).floor(), Symbol());
            next.chunk_signatures = chunk_signatures;
          }
          result = { [mode]: next };
        } break;
        case 'flood-color': {
          let { tiledata, chunk_signatures } = current;
          let color = current.colors[current.color_index];
          let prev = tiledata.get(point);
          if (!prev || color === prev) break;
          tiledata = new tiledata.constructor(tiledata);
          if (chunk_signatures) chunk_signatures = new chunk_signatures.constructor(chunk_signatures);
          let explore = point => point.adjacent.forEach(adj_point => {
            if (tiledata.get(adj_point) === prev) {
              tiledata.set(adj_point, color);
              chunk_signatures?.set(adj_point.divide(CHUNK_SIZE).floor(), Symbol());
              explore(adj_point);
            }
          });
          explore(point);
          let next = { ...current, tiledata };
          if (chunk_signatures) next.chunk_signatures = chunk_signatures;
          result = { [mode]: next };
        } break;
        case 'clear-color': {
          let { tiledata, chunk_signatures } = current;
          if (!tiledata.has(point)) break;
          tiledata = new tiledata.constructor(tiledata);
          tiledata.delete(point);
          let next = { ...current, tiledata };
          if (chunk_signatures) {
            chunk_signatures = new chunk_signatures.constructor(chunk_signatures);
            chunk_signatures.set(point.divide(CHUNK_SIZE).floor(), Symbol());
            next.chunk_signatures = chunk_signatures;
          }
          result = { [mode]: next };
        } break;
        case 'eyedropper-color': {
          let color = current.tiledata.get(point);
          if (!color) break;
          let colors = current.colors.slice();
          colors.push(color);
          result = {
            [mode]: {
              ...current,
              colors,
              color_index: colors.length - 1,
              tool: 'fill-color'
            }
          };
        } break;
        default: break;
      }
    } break;
    case 'hex-doubleclick': {
      let next = reducer({ ...state, [mode]: { ...current, tool: 'clear-color' } },
        { ...action, type: 'hex-click' });
      return { ...next, [mode]: { ...next[mode], tool: current.tool } };
    }
    default: {
      console.warn(`Unrecognized action type: ${type}`);
      return state;
    }
  }
  if (!result) return state;
  let next = { ...state, ...result };
  if (update_history) coalesceHistory(next.mode, next[next.mode]);
  return next;
};

const handleKeyEvent = (e, dispatch) => {
  if (e.shiftKey) dispatch({ type: 'set', name: 'shiftKey', value: true });
  else dispatch({ type: 'set', name: 'shiftKey', value: false });
  if (e.type === 'keydown') {
    if (e.ctrlKey) {
      switch (e.key) {
        case 'z': dispatch({ type: 'undo' }); break;
        case 'y': dispatch({ type: 'redo' }); break;
        default: break;
      }
    }
  }
}

const useWorker = () => {
  const [postMessage, setPostMessage] = useState();
  useEffect(() => {
    const worker = new Worker();
    const resolves = [];
    worker.onmessage = ({ data }) => resolves.shift()(data);
    setPostMessage(_prev => (message => new Promise(resolve => {
      resolves.push(resolve);
      worker.postMessage(message);
    })));
    return () => worker.terminate();
  }, []);
  return postMessage;
};

const Kaleidoscope = () => {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const postMessage = useWorker();

  let { shiftKey, grabbing, sidebar, modal, mode } = state;
  let current = state[state.mode];
  if (current.pan && shiftKey && !modal) current = { ...current, tool: 'pan' };

  useEffect(() => {
    const callback = e => handleKeyEvent(e, dispatch);
    window.addEventListener('keydown', callback);
    window.addEventListener('keyup', callback);
    return () => {
      window.removeEventListener('keydown', callback);
      window.removeEventListener('keydown', callback);
    }
  }, []);

  let container_className = 'vh-100 overflow-hidden p-0';
  if (grabbing) container_className += ' cursor-grabbing';

  return (
    <div className='Kaleidoscope'>
      <Container fluid className={container_className}>
        <Row noGutters className='h-100'>
          {sidebar &&
            <Col xs={12} sm={6} md={5} lg={4} xl={3}
              className='h-100 overflow-auto border-right shadow'>
              <MainSidebar {...{ mode, current, dispatch, postMessage }} />
            </Col>
          }
          <Col xs={1} className='flex-grow-1 mw-100 h-100'>
            <DisplayArea {...{ sidebar, mode, current, dispatch }} />
          </Col>
        </Row>
      </Container>
      <ConfirmModal show={modal === 'clear-all-confirm'}
        title={'Clear All'}
        onHide={() => dispatch({ type: 'set', name: 'modal', value: null })}
        onConfirm={result => result && dispatch({ type: 'clear-all' })}>
        Are you sure you want to clear everything?
      </ConfirmModal>
      <SaveFileModal show={modal === 'save-file'}
        {...{ mode, current, dispatch }} />
      <LoadFileModal show={modal === 'load-file'}
        {...{ mode, current, dispatch }} />
    </div>
  );
};

export default Kaleidoscope;
