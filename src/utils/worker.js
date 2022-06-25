import { tessellate, HexSet, HexPoint } from './kaleidoscope';

/** worker.js runs all code synchronously, so hopefully it's not necessary to use a message id. */

/**
 * A message telling this worker what to do.
 * @typedef {object} WorkerMessage
 * @prop {string} type - The message type.
 * @prop {[number, number][]} [tileShape] - Hexagonal tile data for tessellation.
 */

/**
 * Handles incoming messages from main process.
 * @param {MessageEvent<WorkerMessage>} message - The message telling this worker what to do.
 */
const messageHandler = ({ data: { type, ...message } }) => {
  try {
    switch (type) {
      case 'tessellate': {
        const { tileShape: hexes } = message;
        const tileShape = new HexSet(hexes.map((point) => new HexPoint(...point)));
        postMessage(tessellate(tileShape));
      } break;
      default: {
        console.warn(`Unrecognized message type: ${type}`);
        postMessage(null);
      }
    }
  } catch (error) {
    console.trace(error);
    postMessage(null);
  }
};
onmessage = messageHandler;
