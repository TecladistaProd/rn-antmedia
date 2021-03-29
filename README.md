# React Native AntMedia

[![rn-antmedia on NPM](https://img.shields.io/npm/v/rn-antmedia.svg)](https://www.npmjs.com/package/rn-antmedia)

Essential SDK to use antmedia with React native.

# Table of content
1. [What is RN AntMedia?](#1-what-is-rn-antmedia)
2. [Getting Started](#2-getting-started)
3. [Using](#3-using)
4. [Hook Parameters](#4-hook-parameters)
5. [Hook returned adaptor](#5-hook-returned-adaptor)
6. [Help this project](#6-help-this-project)


## 1. What is RN AntMedia?

RN AntMedia is an port of web sdk of antmedia webrtc_adaptor to react-native using [react-native-webrtc](https://github.com/react-native-webrtc/react-native-webrtc). Some functionalities still the same but others have some differences.
> Some functionalities are under development.


## 2. Getting Started

> NOTE for Expo users: this plugin doesn't work unless you eject since you need to install [react-native-webrtc](https://github.com/react-native-webrtc/react-native-webrtc) too.

**npm**
```bash
	npm i rn-antmedia react-native-webrtc
```
**yarn**
```bash
	yarn add rn-antmedia react-native-webrtc
```

## 3. Usage

To know how to use you need to see examples in examples folder, i'm working on new examples.


## 4. Hooks Parameters

When you call a hook function, you need to pass some of this params to work, by default the hook will start getUserMedia with __mediaConstraints__.

> Params with __*__ is mandatory acctually

- *__url__: string with url to your antmedia server example "wss://testserver.com/WebRTCAppEE/websocket"
- *__mediaConstraints__: object with constraints to getUserMedia (react-native-webrtc)
- *__sdp_constraints__: object with constraints to RTCSessionDescription (react-native-webrtc)
- __peerconnection_config__: object with peerconnection configurartion (react-native-webrtc)
-__debug__: boolean to show some messages on the console as some catch errors in the lib, false by default.
-__onlyDataChannel__: boolean to init only in dataChannel mode.
- *__bandwidth__: object with bandwidth config number or string example 300 or "unlimited"
- __callback__: callback function when some event is fired by antmedia server by websocket
	- __callback(this, message, data)__
	- __callback-this__: is object returned by hook to use internally in callback
	- __callback-message__: is message returned by antmedia server
	- __callback-data__: is data returned by antmedia server (by the event could be undefined)
- *__callbackError__: callback function when some error event is fired by antmedia server by websocket
	- __callbackError(errorMessage, data)__
	- __callbackError-errorMessage__: error message from antmedia event
	- __callbackError-data__: error data
- *__onopen__: callback function called when connection is done between antmedia server and client
	- __onopen-data__: is data returned by onopen event in websocket connection


## 5. Hook returned adaptor

> Params with __*__ is mandatory

- __publish(*streamId, token)__: based on publish by antmedia webrtcAdaptor
- __joinRoom(*room, streamId)__: based on joinRoom by antmedia webrtcAdaptor
- __leaveFromRoom(room: string)__: based on leaveFromRoom by antmedia webrtcAdaptor
- __join(*streamId)__: based on join by antmedia webrtcAdaptor
- __leave(*streamId)__: based on leave by antmedia webrtcAdaptor
- __play(*streamId, token, room)__: based on play by antmedia webrtcAdaptor
- __stop(*streamId)__: based on stop by antmedia webrtcAdaptor
- __peerMessage(*streamId, *definition, *data)__: based on peerMessage by antmedia webrtcAdaptor
- __sendData(*streamId, *message)__: based on sendData by antmedia webrtcAdaptor
- __localStream__: this is local stream when the hook is started
- __remoteStreams__: this is object with remote streams when have connection between peers.
- __getUserMedia(*mediaConstrants)__: based on getUserMedia (react-native-webrtc)
- __getStreamInfo(*streamId)__: based on getStreamInfo by antmedia webrtcAdaptor
- __signallingState(*streamId)__: this function return the signalling state of the gived stream id
- __initPeerConnection(*streamId)__: funcion to initPeerConnection between the stream id and the user
- __handleTurnVolume()__: function to turn on/off the volume (by default is turned on)
- __handleTurnCamera()__: function to turn on/off the camera (by default is turned on)
- __isTurnedOf__: boolean to return the state of camera (true is turned on)
- __isMuted__: boolean to return the state of volume (true is turned on)


## 6. Help this project

How could you help this project: open an **issue** when you find some error, open an **pull request** when you find the solution.

If this project help you, please consider to **help me** to develop this project continuously.

[![paypal](https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=HHWEKX97SKYAQ)