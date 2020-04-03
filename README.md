# Voice 2D

> Add some imaginary distance to your long-distance communication

VOIP applications can be overwhelming: everyone in the room is constantly front-and-centre, and even with some good prioritization algorithms dynamically changing the volume once in a while, it always feels like there's someone _right in your face_. That'd be like having an in-person chat with 5 people by splitting into 4 clones and walking in front of every one of the other people at the same time every time you wanted to say anything, and, well, that's just inhuman.

Voice-2D attempts to solve this cognitive disconnect by adding in the simulation of distance and positioning into a standard chat application. I (@JacobLuke) was inspired by the various online 3D games which integrate proximity-dependant voice communication, but wanted to strip out the bare essentials and really focus on what _works_ about that (without having to, y'know, build a AAA game).

# Project structure

This project consists of two parts:
 * A socket-server backend that does all the state management and audio multiplexing
 * An Electron frontend for joining chat rooms


# Prerequisites

Make sure you have [Node-13](https://nodejs.org/en/) and[Yarn](https://yarnpkg.com/) installed. Currently the app doesn't rely on any external dependencies outside of the yarn packages.

# Running the app locally

Before running do the following steps:

 * Set the environment:

```
echo 'BACKEND_SERVER_URL=ws://localhost:5000` > ./frontend-electron/.env
```

 * Install packages:

```
yarn install
```

Then to build and run both components in dev mode, run:

```
yarn start
```

This will bring up the Frontend Electron app and Backend Socket Server, restarting either as the code is changed

# Notes

**Important** the Frontend app currently cannot be run from VS Code's built-in terminal, because requesting permissions on OSX crashes the app for some reason.