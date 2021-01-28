import { ReactText, useCallback, useEffect, useRef, useState } from 'react';
import {
  RTCPeerConnection,
  mediaDevices,
  RTCSessionDescription,
  RTCIceCandidate,
  MediaStream,
  MediaStreamConstraints,
  EventOnCandidate,
  RTCSessionDescriptionType,
  RTCIceCandidateType,
} from 'react-native-webrtc';

import {
  Params,
  RemoteDescriptionSet,
  CustomWebSocket,
  RemotePeerConnectionStats,
  RemotePeerConnection,
  RemoteStreams,
  Socket,
  Sender,
  IceCandidateList,
  Adaptor,
} from '../interfaces';

function useAntMedia(params: Params) {
  const {
    url,
    onopen,
    callbackError,
    callback,
    mediaConstraints,
    sdp_constraints,
    peerconnection_config,
    bandwidth: bwh,
  } = params;
  const [roomName, setRoomName] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isTurnedOf, setIsTurnedOf] = useState(false);
  const [isPlayMode, setIsPlayMode] = useState(false);
  const [remoteStreams, setRemoteStreams] = useState<RemoteStreams>({});
  const [connected, setConnected] = useState(false);
  const localStream = useRef<null | MediaStream>(null);
  const socket = useRef<Socket>({
    ws: null,
  }).current;
  const playStreamIds = useRef<string[]>([]).current;
  const remotePeerConnection = useRef<RemotePeerConnection>({}).current;
  const remotePeerConnectionStats = useRef<RemotePeerConnectionStats>({})
    .current;
  const remoteDescriptionSet = useRef<RemoteDescriptionSet>({}).current;
  const iceCandidateList = useRef<IceCandidateList>({}).current;
  const bandwidth = useRef({ value: bwh || 900 }).current;

  const adaptorRef = useRef<null | Adaptor>(null);

  const closePeerConnection = useCallback((streamId: string) => {
    if (
      remotePeerConnection[streamId] != null &&
      remotePeerConnection[streamId].signalingState !== 'closed'
    ) {
      remotePeerConnection[streamId].close();

      // @ts-ignore;
      remotePeerConnection[streamId] = null;

      delete remotePeerConnection[streamId];
      const playStreamIndex = playStreamIds.indexOf(streamId);
      setRemoteStreams(sm => {
        const obj = { ...sm };
        delete obj[streamId];
        return obj;
      });
      if (playStreamIndex !== -1) {
        playStreamIds.splice(playStreamIndex, 1);
      }
    }

    if (remotePeerConnectionStats[streamId] != null) {
      clearInterval(remotePeerConnectionStats[streamId].timerId);
      delete remotePeerConnectionStats[streamId];
    }
  }, []);

  const getVideoSender = useCallback((streamId: string) => {
    console.log('getVideoSender');
    let videoSender = null;
    const senders: Sender[] = [];

    const rmS = remotePeerConnection[streamId].getRemoteStreams();

    setRemoteStreams(rm => {
      const obj = { ...rm };
      obj[streamId] = rmS;
      return obj;
    });

    rmS.forEach(i => {
      i.getTracks().forEach(track => {
        senders.push({
          track,
          getParameters: () => ({}),
          setParameters: () => ({}),
        });
      });
    });

    for (let i = 0; i < senders.length; i++) {
      if (senders[i].track != null && senders[i].track.kind === 'video') {
        videoSender = senders[i];
        break;
      }
    }

    return videoSender;
  }, []);

  const changeBandwidth = useCallback(
    async (bw: ReactText, streamId: string) => {
      let errorDefinition = '';
      const videoSender = getVideoSender(streamId);

      if (videoSender !== null) {
        const parameters = videoSender.getParameters();

        if (!parameters.encodings) {
          parameters.encodings = [{}];
        }

        if (bw === 'unlimited') {
          delete parameters.encodings[0].maxBitrate;
        } else {
          parameters.encodings[0].maxBitrate = parseInt(bw + '', 10) * 1000;
        }

        return videoSender.setParameters(parameters);
      }
      errorDefinition = 'Video sender not found to change bandwidth';

      throw new Error(errorDefinition);
    },
    [],
  );

  const iceCandidateReceived = useCallback(
    (event: EventOnCandidate, streamId: string) => {
      if (event.candidate) {
        const jsCmd = {
          command: 'takeCandidate',
          streamId,
          label: event.candidate.sdpMLineIndex,
          id: event.candidate.sdpMid,
          candidate: event.candidate.candidate,
        };

        if (socket.ws) socket.ws.sendJson(jsCmd);
      }
    },
    [],
  );

  const onTrack = useCallback((event, streamId: string) => {
    if (!remoteStreams[streamId]) {
      setRemoteStreams(dt => {
        dt[streamId] = event.streams[0];
        return dt;
      });
      const dataObj = {
        track: event.streams[0],
        streamId,
      };
      if (adaptorRef.current)
        callback.call(adaptorRef.current, 'newStreamAvailable', dataObj);
    }
  }, []);

  const initPeerConnection = useCallback(
    async (streamId: string) => {
      if (remotePeerConnection[streamId] == null) {
        const closedStreamId = streamId;
        remotePeerConnection[streamId] = new RTCPeerConnection(
          peerconnection_config || {
            iceServers: [],
          },
        );
        remoteDescriptionSet[streamId] = false;
        iceCandidateList[streamId] = [];
        if (!playStreamIds.includes(streamId) && localStream.current) {
          remotePeerConnection[streamId].addStream(localStream.current);
        }
        try {
          remotePeerConnection[streamId].onicecandidate = event => {
            iceCandidateReceived(event, closedStreamId);
          };
          // @ts-ignore
          remotePeerConnection[streamId].ontrack = event => {
            console.log('onTrack', event);
            onTrack(event, closedStreamId);
          };

          if (!isPlayMode) {
            remotePeerConnection[
              streamId
            ].oniceconnectionstatechange = event => {
              if (event.target.iceConnectionState === 'connected') {
                (async () => {
                  try {
                    await changeBandwidth(bandwidth.value, streamId);
                  } catch (e) {
                    // console.error(e);
                  }
                })();
              }
            };
          }
        } catch (err) {
          console.log('initPeerConnectionError', err.message);
        }
      }
    },
    [isPlayMode, localStream],
  );

  const gotDescription = useCallback(
    async (configuration: RTCSessionDescriptionType, streamId: string) => {
      try {
        // const response =
        await remotePeerConnection[streamId].setLocalDescription(configuration);

        const jsCmd = {
          command: 'takeConfiguration',
          streamId,
          type: configuration.type,
          sdp: configuration.sdp,
        };

        if (socket.ws) socket.ws.sendJson(jsCmd);
      } catch (err) {
        console.log('gotDescriptionError', err);
      }
    },
    [],
  );

  const startPublishing = useCallback(
    async (streamId: string) => {
      try {
        await initPeerConnection(streamId);
        const configuration = await remotePeerConnection[streamId].createOffer(
          sdp_constraints,
        );
        await gotDescription(configuration, streamId);
      } catch (err) {
        console.log('startPublishing error', err.message, err.stack);
      }
    },
    [initPeerConnection],
  );

  const getUserMedia = useCallback(async (mdC: MediaStreamConstraints) => {
    const stream = await mediaDevices.getUserMedia(mdC);
    if (typeof stream !== 'boolean') localStream.current = stream;
  }, []);

  const publish = useCallback((streamId: string, token?: string) => {
    if (!localStream.current) return;
    const data = {
      command: 'publish',
      streamId,
      token,
      video: localStream.current.getVideoTracks().length > 0,
      audio: localStream.current.getAudioTracks().length > 0,
    };

    if (socket.ws) socket.ws.sendJson(data);
  }, []);

  const joinRoom = useCallback((room: string, streamId?: string) => {
    const data = {
      command: 'joinRoom',
      room,
      streamId,
    };
    setRoomName(room);

    if (socket.ws) socket.ws.sendJson(data);
  }, []);

  const leaveFromRoom = useCallback((room: string) => {
    const data = {
      command: 'leaveFromRoom',
      room,
    };
    setRoomName(room);
    if (socket.ws) socket.ws.sendJson(data);
  }, []);

  const join = useCallback((streamId: string) => {
    const data = {
      command: 'join',
      streamId,
    };
    if (socket.ws) socket.ws.sendJson(data);
  }, []);

  const leave = useCallback((streamId: string) => {
    const data = {
      command: 'leave',
      streamId,
    };
    if (socket.ws) socket.ws.sendJson(data);
  }, []);

  const play = useCallback(
    (streamId: string, token?: string, room?: string) => {
      playStreamIds.push(streamId);
      const data = {
        command: 'play',
        streamId,
        token,
        room,
      };

      if (token) {
        data.token = token;
      }

      if (socket.ws) socket.ws.sendJson(data);

      setIsPlayMode(true);
    },
    [],
  );

  const stop = useCallback((streamId: string) => {
    const data = {
      command: 'stop',
      streamId,
    };

    if (socket.ws) socket.ws.sendJson(data);
    setIsPlayMode(false);
  }, []);

  const handleTurnVolume = useCallback(() => {
    if (localStream.current) {
      const track = localStream.current.getAudioTracks()[0];
      track.enabled = !track.enabled;
      setIsMuted(!track.enabled);
    } else {
      if (callbackError) callbackError('NoActiveConnection');
    }
  }, []);

  const handleTurnCamera = useCallback(() => {
    if (localStream.current) {
      const track = localStream.current.getVideoTracks()[0];
      track.enabled = !track.enabled;
      setIsTurnedOf(!track.enabled);
    } else {
      if (callbackError) callbackError('NoActiveConnection');
    }
  }, []);

  const getStreamInfo = useCallback((streamId: string) => {
    const jsCmd = {
      command: 'getStreamInfo',
      streamId,
    };
    if (socket.ws) socket.ws.sendJson(jsCmd);
  }, []);

  const addIceCandidate = useCallback(
    async (streamId: string, candidate: RTCIceCandidateType) => {
      try {
        console.debug(`addIceCandidate ${streamId}`);
        await remotePeerConnection[streamId].addIceCandidate(candidate);
      } catch (err) {}
    },
    [],
  );

  const takeConfiguration = useCallback(
    async (idOfStream: string, configuration, typeOfConfiguration) => {
      const streamId = idOfStream;
      const type = typeOfConfiguration;
      const conf = configuration;

      await initPeerConnection(streamId);
      try {
        const response = await remotePeerConnection[
          streamId
        ].setRemoteDescription(
          new RTCSessionDescription({
            sdp: conf,
            type,
          }),
        );

        remoteDescriptionSet[streamId] = true;
        const { length } = Object.keys(iceCandidateList[streamId]);

        for (let i = 0; i < length; i++) {
          await addIceCandidate(streamId, iceCandidateList[streamId][i]);
        }
        iceCandidateList[streamId] = [];

        if (type === 'offer') {
          const configur = await remotePeerConnection[streamId].createAnswer(
            sdp_constraints,
          );
          await gotDescription(configur, streamId);
        }
      } catch (error) {}
    },
    [],
  );

  const takeCandidate = useCallback(
    async (idOfTheStream: string, tmpLabel, tmpCandidate, sdpMid) => {
      const streamId = idOfTheStream;
      const label = tmpLabel;
      const candidateSdp = tmpCandidate;

      const candidate = new RTCIceCandidate({
        sdpMLineIndex: label,
        candidate: candidateSdp,
        sdpMid,
      });

      await initPeerConnection(streamId);

      if (remoteDescriptionSet[streamId] === true) {
        await addIceCandidate(streamId, candidate);
      } else {
        console.debug(
          'Ice candidate is added to list because remote description is not set yet',
        );
        const index = iceCandidateList[streamId].findIndex(
          i => JSON.stringify(i) === JSON.stringify(candidate),
        );
        if (index === -1) {
          const keys = Object.keys(candidate);
          for (const key in keys) {
            // @ts-ignore
            if (candidate[key] === undefined || candidate[key] === '') {
              // @ts-ignore
              candidate[key] = null;
            }
          }
          iceCandidateList[streamId].push(candidate);
        }
      }
    },
    [],
  );

  const signallingState = useCallback((streamId: string) => {
    if (remotePeerConnection[streamId] != null) {
      return remotePeerConnection[streamId].signalingState;
    }
    return null;
  }, []);

  const init = useCallback(async () => {
    if (
      !isPlayMode &&
      typeof mediaConstraints !== 'undefined' &&
      localStream.current == null
    ) {
      await getUserMedia(mediaConstraints);
    }
  }, [isPlayMode, getUserMedia, mediaConstraints]);

  useEffect(() => {
    const ws = new WebSocket(url) as CustomWebSocket;
    let pingTimerId = -1;

    ws.onopen = (data: any) => {
      ws.sendJson = dt => {
        ws.send(JSON.stringify(dt));
      };
      pingTimerId = setInterval(() => {
        ws.sendJson({
          command: 'ping',
        });
      });
      init()
        .then(() => {
          if (onopen) onopen(data);
          socket.ws = ws;
          setConnected(true);
        })
        .catch(err => {
          if (callbackError) callbackError('initError', err);
        });
    };

    ws.onmessage = async event => {
      const data = JSON.parse(event.data);
      switch (data.command) {
        case 'start':
          startPublishing(data.streamId);
          break;
        case 'takeCandidate':
          takeCandidate(data.streamId, data.label, data.candidate, data.id);
          break;
        case 'takeConfiguration':
          takeConfiguration(data.streamId, data.sdp, data.type);
          break;
        case 'stop':
          closePeerConnection(data.streamId);
          break;
        case 'error':
          if (callbackError) {
            callbackError(data.definition, data);
          }
          break;
        case 'notification':
          if (adaptorRef.current)
            callback.call(adaptorRef.current, data.definition, data);
          if (
            data.definition === 'play_finished' ||
            data.definition === 'publish_finished'
          ) {
            closePeerConnection(data.streamId);
          }
          break;
        case 'streamInformation':
          if (adaptorRef.current)
            callback.call(adaptorRef.current, data.command, data);
          break;
        case 'pong':
          if (adaptorRef.current)
            callback.call(adaptorRef.current, data.command);
          break;
        default:
          break;
      }
    };
    ws.onerror = error => {
      setConnected(false);
      clearInterval(pingTimerId);
    };

    ws.onclose = () => {
      setConnected(false);
      clearInterval(pingTimerId);
    };

    return () => {
      ws.onopen = null;
      ws.onmessage = null;
      ws.onerror = null;
      ws.onclose = null;
      clearInterval(pingTimerId);
      setConnected(false);
    };
  }, [url]);

  useEffect(() => {
    adaptorRef.current = {
      publish,
      joinRoom,
      leaveFromRoom,
      join,
      leave,
      play,
      stop,
      localStream,
      remoteStreams,
      getUserMedia,
      getStreamInfo,
      signallingState,
      initPeerConnection,
      handleTurnVolume,
      handleTurnCamera,
      isTurnedOf,
      isMuted,
      // closePeerConnection
    };
  }, [connected]);

  return !connected
    ? null
    : ({
        publish,
        joinRoom,
        leaveFromRoom,
        join,
        leave,
        play,
        stop,
        localStream,
        remoteStreams,
        getUserMedia,
        getStreamInfo,
        signallingState,
        initPeerConnection,
        handleTurnVolume,
        handleTurnCamera,
        isTurnedOf,
        isMuted,
        // closePeerConnection
      } as Adaptor);
}

export default useAntMedia;
