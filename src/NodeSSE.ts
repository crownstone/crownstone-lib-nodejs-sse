import EventSource from "eventsource"
import fetch from 'cross-fetch';
import {Logger} from "./Logger";
import {SSEGenerator} from "./CrownstoneSSE";
import path from "path";


const crypto = require('crypto');
function sha1(str) {
  const shasum = crypto.createHash('sha1');
  shasum.update(str);
  return shasum.digest('hex');
}

let options : sseConstructorOptions = {
  log: (filename) => { return Logger(path.join(__dirname, "CrownstoneSSE.ts")); },
  sha1: sha1,
  fetch: fetch,
  EventSource: EventSource,
}

export const CrownstoneSSE = SSEGenerator(options);