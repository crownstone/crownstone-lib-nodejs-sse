interface sseConstructorOptions {
  log: {
    error: (...args) => void,
    warn: (...args) => void,
    info: (...args) => void,
    debug: (...args) => void,
  },
  sha1: (data: string) => string,
  EventSource: any,
  fetch:       any,
}

interface sseOptions {
  sseUrl?:        string,
  loginUrl?:      string,
  hubLoginBase?:  string,
  autoreconnect?: boolean,
}

interface cachedLoginData {
  hub?:  {hubId: string, hubToken:       string},
  user?: {email: string, hashedPassword: string}
}