const crypto = require('crypto');
import EventSource from "eventsource"
const shasum = crypto.createHash('sha1');
import fetch from 'cross-fetch';


export const defaultHeaders = {
  'Accept': 'application/json',
  'Content-Type': 'application/json'
};

interface sseOptions {
  sseUrl:      string,
  loginUrl:    string,
  hubLoginUrl: string,
  autoreconnect: boolean
};
const DEFAULT_URLS = {
  sse:       "https://events.crownstone.rocks/sse",
  login:     "https://cloud.crownstone.rocks/api/users/login",
  hubLogin:  "https://cloud.crownstone.rocks/api/Hubs/login"
}

export class CrownstoneSSE {
  autoreconnect : boolean = false;

  eventSource : EventSource = null;
  accessToken : string | null = null;

  eventCallback : (data: SseEvent) => void;
  reconnectTimeout = null;

  sse_url      = DEFAULT_URLS.sse;
  login_url    = DEFAULT_URLS.login;
  hubLogin_url = DEFAULT_URLS.hubLogin;

  constructor( options? : sseOptions ) {
    this.sse_url       = options.sseUrl      || DEFAULT_URLS.sse;
    this.login_url     = options.loginUrl    || DEFAULT_URLS.login;
    this.hubLogin_url  = options.hubLoginUrl || DEFAULT_URLS.hubLogin;
    this.autoreconnect = options.autoreconnect === undefined ? true : options.autoreconnect;
  }

  async login(email, password) {
    shasum.update(password);
    let hashedPassword = shasum.digest('hex');
    return await this.loginHashed(email, hashedPassword)
  }

  async loginHashed(email, sha1passwordHash) {
    return fetch(
      this.login_url,
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
          console.error("Unknown error while trying to login to", this.login_url);
          throw err;
        }
      })
  }

  setAccessToken(token) {
    this.accessToken = token;
  }

  async start(eventCallback : (data : SseEvent) => void) : Promise<void> {
    if (this.accessToken === null) {
      throw "AccessToken is required. Use .setAccessToken() or .login() to set one."
    }

    this.eventCallback = eventCallback;

    clearTimeout(this.reconnectTimeout);

    if (this.eventSource !== null) {
      this.eventSource.close();
    }
    return new Promise((resolve, reject) => {
      this.eventSource = new EventSource(this.sse_url + "?accessToken=" + this.accessToken);
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
