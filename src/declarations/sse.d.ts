interface sseConstructorOptions {
  log: {
    error:     (...args) => void,
    warn:      (...args) => void,
    info:      (...args) => void,
    debug:     (...args) => void,
  },
  sha1:        (data: string) => string,
  EventSource: any,
  fetch:       any,

  setTimeout?:    (cb,ms) => void
  setInterval?:   (cb,ms) => void
  clearTimeout?:  (id) => void
  clearInterval?: (id) => void
}

interface sseOptions {
  sseUrl?:        string,
  loginUrl?:      string,
  hubLoginBase?:  string,
  autoreconnect?: boolean,
  requireAuthentication?: boolean
}

interface cachedLoginData {
  hub?:  {hubId: string, hubToken:       string},
  user?: {email: string, hashedPassword: string}
}