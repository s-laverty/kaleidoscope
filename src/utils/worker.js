/*
 * worker.js runs all code synchronously, so hopefully it's not necessary to use a message id.
 */

import { HexPoint, HexTile } from './HexUtils';
import { tessellate } from './KaleidoscopeUtils';

onmessage = ({data: {type, ...message}}) => {
  try {
    switch (type) {
      case 'tessellate': {
        let tiledata = new HexTile(message.tiledata.map(point => [new HexPoint(...point), null]));
        postMessage(tessellate(tiledata));
      } break;
      default: {
        console.warn(`Unrecognized message type: ${type}`);
        postMessage(null);
      }
    }
  } catch(error) {
    console.error(error);
    postMessage(null);
  }
};
