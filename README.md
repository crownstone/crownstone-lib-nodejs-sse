# crownstone-lib-nodejs-sse
Tiny library to provide you with the SSE events from the Crownstone cloud.

## Installation

Run Yarn to install the dependencies.

```js
yarn
```

Compile the ts files to get started:

```js
npm run build
```

## Usage

There are two small examples showing you how to get started in the ./examples folder.

```js
// import the library
const sseLib = require("bluenet-nodejs-lib-sse")

// initialize the library
let sse = new sseLib.BluenetSSE();

// create a callback function to print incoming data
let eventHandler = (data) => {
  console.log("I got an event!", data);
}

// change these to match your Crownstone account credentials
let myCrownstoneEmailAddress = "<yourEmailAddressHere>";
let myCrownstonePassword     = "<yourPasswordHere>";

// There are other options to log in as well if you're not comfortable placing username/password data in code
// check the docs below for more info!

// create and start our async function.
(async function() {
  try {
    // we will login to the Crownstone cloud to obtain an accessToken.
    // It will be set automatically after successful login.
    console.log("Logging in...")
    await sse.login( myCrownstoneEmailAddress , myCrownstonePassword )
    
    // now that we have an accessToken, we can start the eventstream.
    console.log("Connecting to event server...")
    await sse.start(eventHandler);
    console.log("Let's get started!");
  }
  catch(err) {
    console.log("Something went wrong... :(");
  }
})()

```

There is a promise based example as well.

## API

You can require the library like so:
```
// import the library
const sseLib = require("bluenet-nodejs-lib-sse")

// initialize the library
let sse = new sseLib.BluenetSSE();
```

or import it like so: 

```js
import { BluenetSSE } from "bluenet-nodejs-lib-sse"

let sse = new BluenetSSE();
```

In order to get the events, we require a Crownstone AccessToken. There are a few methods to facility this:

#### login(email: string, password: string) -> Promise\<void> 
>Logs into the Crownstone Cloud and obtains the AccessToken. The token is then stored in the class and you're ready to call start().

#### loginHashed(email: string, sha1passwordHash: string) -> Promise\<void> 
>If you don't want to put a plaintext password in code, you can also use a sha1 hash of your password. 
>This method logs into the Crownstone Cloud and obtains the AccessToken. The token is then stored in the class and you're ready to call start().

#### setAccessToken(token: string)
> You can also obtain the token yourself from [https://my.crownstone.rocks](https://my.crownstone.rocks). Use this to store it in the class and you're ready to call start().


Starting the event stream after you have ensured there is an accessToken in the lib, is done by calling start():

#### start(eventCallback: (SseEvent) => void) : Promise\<void>
> Connect to https://events.crownstone.rocks/sse and forwards all events to your callback.
>

## Events

There are a number of different events you can expect from this service.

### System Events

These are used to notify you of the opening, closing and any errors with the event stream. The format of these is:
```js
interface SystemEvent {
  type:    "system",
  subType:  "TOKEN_EXPIRED" | "NO_ACCESS_TOKEN" | "NO_CONNECTION" | "STREAM_START" | "STREAM_CLOSED",
  code:     number,
  message:  string,
}
```

### Command Events

These notify actuators that they should so something. Currently there is only one for switching a Crownstone. 
A hub could use this to switch a Crownstone based on a call from [https://my.crownstone.rocks/api/Stones/id/setSwitchStateRemotely](https://my.crownstone.rocks/api/Stones/{id}/setSwitchStateRemotely).
```js
interface SwitchCrownstoneEvent {
  type:       "command",
  subType:    "switchCrownstone"
  sphere:     SphereData,
  crownstone: CrownstoneData,
}

// With subtypes:

interface SphereData {
  id:   string,
  uid:  number,
  name: string,
}

interface CrownstoneData {
  id:   string,
  uid:  number,
  name: string,
  switchState: number | null,
  macAddress: string,
}
```

### Presence events

When there is a change in user presence, these events are called. They are called on sphere enter, sphere exit, room enter and room exit for all users in the spheres you have access to.

```js
// for sphere enter/exit events
interface PresenceSphereEvent {
  type:     "presence",
  subType:  "enterSphere" | "exitSphere"
  user:     UserData,
  sphere:   SphereData
}

// for room enter/exit events
interface PresenceLocationEvent {
  type:     "presence",
  subType:  "enterLocation" | "exitLocation"
  user:     UserData,
  sphere:   SphereData,
  location: LocationData,
}

// With subtypes:

interface SphereData {
  id:   string,
  uid:  number,
  name: string,
}

interface UserData {
  id:   string,
  name: string,
}

interface LocationData {
  id:   string,
  name: string,
}
```

### Data change events

These events are called if Spheres, Users in spheres, Locations or Crownstones are added/deleted or updated. This does *not* respond to changes in power usage and switchstate.

```js
interface DataChangeEvent {
  type:        "dataChange",
  subType:     "users"   | "spheres" | "stones" | "locations",
  operation:   "create" | "delete"  | "update"
  sphere:      SphereData,
  changedItem: NameIdSet,
}

// With subtypes:

interface SphereData {
  id:   string,
  uid:  number,
  name: string,
}

interface NameIdSet {
  id:   string,
  name: string,
}
```


### Invitation change events

When someone is invited to a Sphere, or the invitation is revoked, these events are fired.

```js
interface InvitationChangeEvent {
  type:        "invitationChange",
  operation:   "invited" | "invitationRevoked"
  sphere:      SphereData,
  email:       string,
}

// With subtypes:

interface SphereData {
  id:   string,
  uid:  number,
  name: string,
}
```

























