const crypto = require('crypto');
import EventSource from "eventsource"
const shasum = crypto.createHash('sha1');
import fetch from 'cross-fetch';


export const defaultHeaders = {
  'Accept': 'application/json',
  'Content-Type': 'application/json'
};

export class BluenetSSE {

  url : string;
  loginUrl : string = "https://cloud.crownstone.rocks/api/users/login"
  autoreconnect : boolean = false;

  eventSource : EventSource = null;
  accessToken : string | null = null;

  eventCallback : (data: SseEvent) => void;
  reconnectTimeout = null;

  constructor(autoreconnect= true, url="https://events.crownstone.rocks/sse") {
    this.url = url;
    this.autoreconnect = autoreconnect;
  }

  async login(email, password) {
    shasum.update(password);
    let hashedPassword = shasum.digest('hex');
    return await this.loginHashed(email, hashedPassword)
  }

  async loginHashed(email, sha1passwordHash) {
    return fetch(
      this.loginUrl,
      {method:"POST", headers:defaultHeaders, body: JSON.stringify({email, password:sha1passwordHash})}
      )
      .then((result) => {
        return result.json()
      })
      .then((result) => {
        if (result?.error?.statusCode == 401) {
          throw result.error
        }
        this.accessToken = result.id;
      })
      .catch((err) => {
        if (err?.code === "LOGIN_FAILED_EMAIL_NOT_VERIFIED") {
          console.info("This email address has not been verified yet.");
          throw err;
        }
        else if (err?.code === "LOGIN_FAILED") {
          console.info("Incorrect email/password");
          throw err;
        }
        else {
          console.error("Unknown error while trying to login to", this.loginUrl);
          throw err;
        }
      })

  }

  setAccessToken(token) {
    this.accessToken = token;
  }

  async start(eventCallback : (data) => void) {
    if (this.accessToken === null) {
      throw "AccessToken is required. Use .setAccessToken() or .login() to set one."
    }

    this.eventCallback = eventCallback;

    clearTimeout(this.reconnectTimeout);

    if (this.eventSource !== null) {
      this.eventSource.close();
    }
    return new Promise((resolve, reject) => {
      this.eventSource = new EventSource(this.url + "?accessToken=" + this.accessToken);
      this.eventSource.onopen = (event) => {
        console.log("Connection is open.");
        resolve();
      };
      this.eventSource.onmessage = (event) => {
        if (event?.data) {
          let message = JSON.parse(event.data);
          
          // if (message.type === 'system' && message.code === 401 && message.subtype == "TOKEN_EXPIRED") {
          //    // TODO: automatic log-in again and get a new token.
          // }

          this.eventCallback(message as any);
        }
      };
      this.eventSource.onerror = (event) => {
        if (this.autoreconnect) {
          console.log("Something went wrong with the connection. Attempting reconnect...");
          this.reconnectTimeout = setTimeout(() => { this.start(this.eventCallback) }, 2000);
        }
      }

    })
  }
}
