/*
 * worker.js runs all code synchronously, so hopefully it's not necessary to use a message id.
 */

import { HexPoint, HexMap } from './HexUtils';
import { tessellate } from './KaleidoscopeUtils';

onmessage = ({data: {type, ...message}}) => {
  try {
    switch (type) {
      case 'tessellate': {
        let tiledata = new HexMap(message.tiledata.map(point => [new HexPoint(...point)]));
        postMessage(tessellate(tiledata));
      } break;
      default: {
        console.warn(`Unrecognized message type: ${type}`);
        postMessage(null);
      }
    }
  } catch(error) {
    console.trace(error);
    postMessage(null);
  }
};
