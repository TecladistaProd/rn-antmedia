# React Native AntMedia
Essential SDK to use antmedia with React native.

# Table of content
1. [What is RN AntMedia?](#1-what-is-rn-antmedia)
2. [Getting Started](#2-getting-started)
3. [Using](#3-using)
4. [Hook Parameters](#4-hook-parameters)
5. [Hook returned adaptor](#5-hook-returned-adaptor)
6. [Help this project](#6-help-this-project)


## 1. What is RN AntMedia?

RN AntMedia is an port of web sdk of antmedia webrtc_adaptor to react-native using react-native-webrtc. Some functionalities is equal but others is an approach but have some differences.
> Some functionalities is under development.


## 2. Getting Started

To use in your react-native projects, should be in **pure** react-native. And you need to install [react-native-webrtc](https://github.com/react-native-webrtc/react-native-webrtc) too.
**npm**
```bash
	npm i rn-antmedia react-native-webrtc
```
**yarn**
```bash
	yarn add rn-antmedia react-native-webrtc
```


## 3. Using

```jsx
import React, { useState, useRef, useCallback } from 'react';
import {SafeAreaView, Button} from 'react-native';
import {RTCView} from 'react-native-webrtc';
/* importing lib */
import { useAntMedia } from 'rn-antmedia';

const App = () => {
	const [localStream, setLocalStream] = useState('');
	const [remoteStream, setRemoteStream] = useState(null);
	const stream = useRef({id: ''}).current;
	
	const adaptor = useAntMedia({
    url: 'wss://testserver.com/WebRTCAppEE/websocket',
    mediaConstraints: {
      video: true,
      audio: true,
    },
    sdp_constraints: {
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    },
		bandwidth: 300,
    callback(command, data) {
      switch (command) {
        case 'pong':
          break;
        case 'joinedTheRoom':
          if ('onJoinedRoom' in events) {
            const tok = data.ATTR_ROOM_NAME;
            this.initPeerConnection(data.streamId);
            this.publish(data.streamId, tok);

            const streams = data.streams;

            if (streams != null) {
              streams.forEach((item) => {
                if (item === stream.id) return;
                this.play(item, tok, roomId);
              });
            }
          }
          break;
        case 'streamJoined':
          if ('onStreamJoined' in events) {
            this.play(data.streamId, token, roomId);
          }
          break;
        default:
          break;
      }
    },
    callbackError: (err, data) => {
      console.error('callbackError', err, data);
    },
	});

	const handleConnect = useCallback(() => {
		if (adaptor) {
			const streamId = `12ans1`;
			const roomId = '5abcd1';

			stream.id = streamId;

			adaptor.joinRoom(roomId, streamId);
		};
	}, [adaptor]);

	useEffect(() => {
    if (adaptor) {
      const verify = () => {
        if (
          adaptor.localStream.current &&
          adaptor.localStream.current.toURL()
        ) {
          return setLocalStream(adaptor.localStream.current.toURL());
        }
        setTimeout(verify, 3000);
      };
      verify();
    }
	}, [adaptor]);
	
	useEffect(() => {
    if (adaptor && Object.keys(adaptor.remoteStreams).length > 0) {
      for (let i in adaptor.remoteStreams) {
        if (i !== stream.id) {
          let st =
            adaptor.remoteStreams[i][0] &&
            'toURL' in adaptor.remoteStreams[i][0]
              ? adaptor.remoteStreams[i][0].toURL()
              : null;
          setRemoteStream(st);
          break;
        } else {
          setRemoteStream(null);
        }
      }
    }
  }, [adaptor, stream.id]);

	
	return (
		<SafeAreaView style={{flex: 1;}}>
		{
			localStream && remoteStream ? (
				<>
					<RTCView
						style={{flex: 1}}
						objectFit="cover"
						streamURL={remoteStream}
					/>
					<RTCView
						style={{ width: 200, height: 200,  position: 'absolute', bottom: 0, right: 0, }}
						objectFit="cover"
						streamURL={localStream}
					/>
				</>
			) : (
				<Button
					onPress={handleConnect}
					title="Join room"
					color="#841584"
					accessibilityLabel="Connect to antmedia"
				/>
			)
		}
		</SafeAreaView>
	)
};
```


## 4. Hook Parameters

When you call hook function, you need to pass some of this params to work, by default the hook will start getUserMedia with __mediaConstraints__.

> Params with __*__ is mandatory acctually

- *__url__: string with url to your antmedia server example "wss://testserver.com/WebRTCAppEE/websocket"
- *__mediaConstraints__: object with constraints to getUserMedia (react-native-webrtc)
- *__sdp_constraints__: object with constraints to RTCSessionDescription (react-native-webrtc)
- __peerconnection_config__: object with peerconnection configurartion (react-native-webrtc)
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
- __joinRoom(*room, streamId)__: based on publish by antmedia webrtcAdaptor
- __leaveFromRoom(room: string)__: based on publish by antmedia webrtcAdaptor
- __join(*streamId)__: based on publish by antmedia webrtcAdaptor
- __leave(*streamId)__: based on publish by antmedia webrtcAdaptor
- __play(*streamId, token, room)__: based on publish by antmedia webrtcAdaptor
- __stop(*streamId)__: based on publish by antmedia webrtcAdaptor
- __localStream__: this is local stream when the hook is started
- __remoteStreams__: this is object with remote streams when have connection between peers, acctually localStream come inside remoteStream, be careful when use this to renderize the other peers
- __getUserMedia(*mediaConstrants)__: based on getUserMedia (react-native-webrtc)
- __getStreamInfo(*streamId)__: based on publish by antmedia webrtcAdaptor
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