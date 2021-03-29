import { useState, useRef, useCallback, useEffect } from 'react';
import { RTCPeerConnection, mediaDevices, RTCSessionDescription, RTCIceCandidate } from 'react-native-webrtc';

function _extends() {
  _extends = Object.assign || function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];

      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }

    return target;
  };

  return _extends.apply(this, arguments);
}

// A type of promise-like that resolves synchronously and supports only one observer
const _Pact = /*#__PURE__*/(function() {
	function _Pact() {}
	_Pact.prototype.then = function(onFulfilled, onRejected) {
		const result = new _Pact();
		const state = this.s;
		if (state) {
			const callback = state & 1 ? onFulfilled : onRejected;
			if (callback) {
				try {
					_settle(result, 1, callback(this.v));
				} catch (e) {
					_settle(result, 2, e);
				}
				return result;
			} else {
				return this;
			}
		}
		this.o = function(_this) {
			try {
				const value = _this.v;
				if (_this.s & 1) {
					_settle(result, 1, onFulfilled ? onFulfilled(value) : value);
				} else if (onRejected) {
					_settle(result, 1, onRejected(value));
				} else {
					_settle(result, 2, value);
				}
			} catch (e) {
				_settle(result, 2, e);
			}
		};
		return result;
	};
	return _Pact;
})();

// Settles a pact synchronously
function _settle(pact, state, value) {
	if (!pact.s) {
		if (value instanceof _Pact) {
			if (value.s) {
				if (state & 1) {
					state = value.s;
				}
				value = value.v;
			} else {
				value.o = _settle.bind(null, pact, state);
				return;
			}
		}
		if (value && value.then) {
			value.then(_settle.bind(null, pact, state), _settle.bind(null, pact, 2));
			return;
		}
		pact.s = state;
		pact.v = value;
		const observer = pact.o;
		if (observer) {
			observer(pact);
		}
	}
}

function _isSettledPact(thenable) {
	return thenable instanceof _Pact && thenable.s & 1;
}

const _iteratorSymbol = /*#__PURE__*/ typeof Symbol !== "undefined" ? (Symbol.iterator || (Symbol.iterator = Symbol("Symbol.iterator"))) : "@@iterator";

const _asyncIteratorSymbol = /*#__PURE__*/ typeof Symbol !== "undefined" ? (Symbol.asyncIterator || (Symbol.asyncIterator = Symbol("Symbol.asyncIterator"))) : "@@asyncIterator";

// Asynchronously implement a generic for loop
function _for(test, update, body) {
	var stage;
	for (;;) {
		var shouldContinue = test();
		if (_isSettledPact(shouldContinue)) {
			shouldContinue = shouldContinue.v;
		}
		if (!shouldContinue) {
			return result;
		}
		if (shouldContinue.then) {
			stage = 0;
			break;
		}
		var result = body();
		if (result && result.then) {
			if (_isSettledPact(result)) {
				result = result.s;
			} else {
				stage = 1;
				break;
			}
		}
		if (update) {
			var updateValue = update();
			if (updateValue && updateValue.then && !_isSettledPact(updateValue)) {
				stage = 2;
				break;
			}
		}
	}
	var pact = new _Pact();
	var reject = _settle.bind(null, pact, 2);
	(stage === 0 ? shouldContinue.then(_resumeAfterTest) : stage === 1 ? result.then(_resumeAfterBody) : updateValue.then(_resumeAfterUpdate)).then(void 0, reject);
	return pact;
	function _resumeAfterBody(value) {
		result = value;
		do {
			if (update) {
				updateValue = update();
				if (updateValue && updateValue.then && !_isSettledPact(updateValue)) {
					updateValue.then(_resumeAfterUpdate).then(void 0, reject);
					return;
				}
			}
			shouldContinue = test();
			if (!shouldContinue || (_isSettledPact(shouldContinue) && !shouldContinue.v)) {
				_settle(pact, 1, result);
				return;
			}
			if (shouldContinue.then) {
				shouldContinue.then(_resumeAfterTest).then(void 0, reject);
				return;
			}
			result = body();
			if (_isSettledPact(result)) {
				result = result.v;
			}
		} while (!result || !result.then);
		result.then(_resumeAfterBody).then(void 0, reject);
	}
	function _resumeAfterTest(shouldContinue) {
		if (shouldContinue) {
			result = body();
			if (result && result.then) {
				result.then(_resumeAfterBody).then(void 0, reject);
			} else {
				_resumeAfterBody(result);
			}
		} else {
			_settle(pact, 1, result);
		}
	}
	function _resumeAfterUpdate() {
		if (shouldContinue = test()) {
			if (shouldContinue.then) {
				shouldContinue.then(_resumeAfterTest).then(void 0, reject);
			} else {
				_resumeAfterTest(shouldContinue);
			}
		} else {
			_settle(pact, 1, result);
		}
	}
}

// Asynchronously call a function and send errors to recovery continuation
function _catch(body, recover) {
	try {
		var result = body();
	} catch(e) {
		return recover(e);
	}
	if (result && result.then) {
		return result.then(void 0, recover);
	}
	return result;
}

function useAntMedia(params) {
  var url = params.url,
      onopen = params.onopen,
      callbackError = params.callbackError,
      callback = params.callback,
      mediaConstraints = params.mediaConstraints,
      sdp_constraints = params.sdp_constraints,
      peerconnection_config = params.peerconnection_config,
      bwh = params.bandwidth,
      debug = params.debug,
      onlyDataChannel = params.onlyDataChannel;

  var _useState = useState(''),
      roomName = _useState[0],
      setRoomName = _useState[1];

  var _useState2 = useState(false),
      isMuted = _useState2[0],
      setIsMuted = _useState2[1];

  var _useState3 = useState(false),
      isTurnedOf = _useState3[0],
      setIsTurnedOf = _useState3[1];

  var _useState4 = useState(false),
      isPlayMode = _useState4[0],
      setIsPlayMode = _useState4[1];

  var _useState5 = useState({}),
      remoteStreams = _useState5[0],
      setRemoteStreams = _useState5[1];

  var _useState6 = useState(false),
      connected = _useState6[0],
      setConnected = _useState6[1];

  var localStream = useRef(null);
  var socket = useRef({
    ws: null
  }).current;
  var playStreamIds = useRef([]).current;
  var remotePeerConnection = useRef({}).current;
  var remotePeerConnectionStats = useRef({}).current;
  var remoteDescriptionSet = useRef({}).current;
  var iceCandidateList = useRef({}).current;
  var bandwidth = useRef({
    value: bwh || 900
  }).current;
  var adaptorRef = useRef(null);
  var closePeerConnection = useCallback(function (streamId) {
    if (remotePeerConnection[streamId] != null) {
      // @ts-ignore
      if (remotePeerConnection[streamId].dataChannel != null) // @ts-ignore
        remotePeerConnection[streamId].dataChannel.close();
      setRemoteStreams(function (value) {
        var val = _extends({}, value);

        var streams = [].concat(remotePeerConnection[streamId].getLocalStreams());
        streams.forEach(function (stream) {
          var _localStream$current;

          if (((_localStream$current = localStream.current) == null ? void 0 : _localStream$current.toURL()) !== stream.toURL()) {
            delete val[stream.toURL()];
          }
        });
        return val;
      });

      if (remotePeerConnection[streamId].signalingState !== 'closed') {
        remotePeerConnection[streamId].close(); // @ts-ignore;

        remotePeerConnection[streamId] = null;
        delete remotePeerConnection[streamId];
        var playStreamIndex = playStreamIds.indexOf(streamId);

        if (playStreamIndex !== -1) {
          playStreamIds.splice(playStreamIndex, 1);
        }
      }
    }

    if (remotePeerConnectionStats[streamId] != null) {
      clearInterval(remotePeerConnectionStats[streamId].timerId);
      delete remotePeerConnectionStats[streamId];
    }
  }, []);
  var getVideoSender = useCallback(function (streamId) {
    var videoSender = null;
    var senders = [];
    var rmS = remotePeerConnection[streamId].getRemoteStreams();
    setRemoteStreams(function (value) {
      var val = _extends({}, value);

      var streams = [].concat(remotePeerConnection[streamId].getLocalStreams(), remotePeerConnection[streamId].getRemoteStreams());
      streams.forEach(function (stream) {
        var _localStream$current2;

        if (((_localStream$current2 = localStream.current) == null ? void 0 : _localStream$current2.toURL()) !== stream.toURL()) {
          val[stream.toURL()] = stream;
        }
      });
      return val;
    });
    rmS.forEach(function (i) {
      i.getTracks().forEach(function (track) {
        senders.push({
          track: track,
          getParameters: function getParameters() {
            return {};
          },
          setParameters: function setParameters() {
            return {};
          }
        });
      });
    });

    for (var i = 0; i < senders.length; i++) {
      if (senders[i].track != null && senders[i].track.kind === 'video') {
        videoSender = senders[i];
        break;
      }
    }

    return videoSender;
  }, []);
  var changeBandwidth = useCallback(function (bw, streamId) {
    try {
      var errorDefinition = '';
      var videoSender = getVideoSender(streamId);

      if (videoSender !== null) {
        var parameters = videoSender.getParameters();

        if (!parameters.encodings) {
          parameters.encodings = [{}];
        }

        if (bw === 'unlimited') {
          delete parameters.encodings[0].maxBitrate;
        } else {
          parameters.encodings[0].maxBitrate = parseInt(bw + '', 10) * 1000;
        }

        return Promise.resolve(videoSender.setParameters(parameters));
      }

      errorDefinition = 'Video sender not found to change bandwidth';
      throw new Error(errorDefinition);
    } catch (e) {
      return Promise.reject(e);
    }
  }, []);
  var iceCandidateReceived = useCallback(function (event, streamId) {
    if (event.candidate) {
      var jsCmd = {
        command: 'takeCandidate',
        streamId: streamId,
        label: event.candidate.sdpMLineIndex,
        id: event.candidate.sdpMid,
        candidate: event.candidate.candidate
      };
      if (socket.ws) socket.ws.sendJson(jsCmd);
    }
  }, []);
  var onTrack = useCallback(function (event, streamId) {
    if (!remoteStreams[streamId]) {
      // setRemoteStreams(dt => {
      //   dt[streamId] = event.streams[0];
      //   return dt;
      // });
      var dataObj = {
        track: event.streams[0],
        streamId: streamId
      };
      if (adaptorRef.current) callback.call(adaptorRef.current, 'newStreamAvailable', dataObj);
    }
  }, []); // data channel mode can be "publish" , "play" or "peer" based on this it is decided which way data channel is created

  var initPeerConnection = useCallback(function (streamId, dataChannelMode) {
    try {
      if (remotePeerConnection[streamId] == null) {
        var closedStreamId = streamId;
        remotePeerConnection[streamId] = new RTCPeerConnection(peerconnection_config || {
          iceServers: []
        });
        remoteDescriptionSet[streamId] = false;
        iceCandidateList[streamId] = [];

        if (!playStreamIds.includes(streamId) && localStream.current) {
          remotePeerConnection[streamId].addStream(localStream.current);
        }

        try {
          remotePeerConnection[streamId].onicecandidate = function (event) {
            iceCandidateReceived(event, closedStreamId);
          }; // @ts-ignore


          remotePeerConnection[streamId].ontrack = function (event) {
            if (debug) console.log('onTrack', event);
            onTrack(event, closedStreamId);
          };

          remotePeerConnection[streamId].onaddstream = function (e) {
            setRemoteStreams(function (value) {
              var val = _extends({}, value);

              var streams = [].concat(remotePeerConnection[streamId].getLocalStreams(), remotePeerConnection[streamId].getRemoteStreams());
              streams.forEach(function (stream) {
                var _localStream$current3;

                if (((_localStream$current3 = localStream.current) == null ? void 0 : _localStream$current3.toURL()) !== stream.toURL()) {
                  val[stream.toURL()] = stream;
                }
              });
              return val;
            });
          };

          if (dataChannelMode === 'publish') {
            //open data channel if it's publish mode peer connection
            var dataChannelOptions = {
              ordered: true
            };
            var dataChannelPeer = remotePeerConnection[streamId].createDataChannel(streamId, dataChannelOptions);
            initDataChannel(streamId, dataChannelPeer);
          } else if (dataChannelMode === 'play') {
            //in play mode, server opens the data channel
            // Property 'ondatachannel' does not exist on type 'RTCPeerConnection' react-native-webrtc
            // @ts-ignore
            remotePeerConnection[streamId].ondatachannel = function (event) {
              initDataChannel(streamId, event.channel);
            };
          } else {
            //for peer mode do both for now
            var _dataChannelOptions = {
              ordered: true
            };

            var _dataChannelPeer = remotePeerConnection[streamId].createDataChannel(streamId, _dataChannelOptions);

            initDataChannel(streamId, _dataChannelPeer); // @ts-ignore

            remotePeerConnection[streamId].ondatachannel = function (ev) {
              initDataChannel(streamId, ev.channel);
            };
          }

          if (!isPlayMode) {
            remotePeerConnection[streamId].oniceconnectionstatechange = function (event) {
              if (!event.target.iceConnectionState.match(/(closed|disconnected|failed)/i)) {
                // console.log(event.target.iceConnectionState);
                try {
                  getVideoSender(streamId);
                } catch (err) {}
              }

              if (event.target.iceConnectionState === 'connected') {
                (function () {
                  try {
                    var _temp2 = _catch(function () {
                      return Promise.resolve(changeBandwidth(bandwidth.value, streamId)).then(function () {});
                    }, function (e) {
                      if (debug) console.error(e);
                    });

                    return _temp2 && _temp2.then ? _temp2.then(function () {}) : void 0;
                  } catch (e) {
                    Promise.reject(e);
                  }
                })();
              }
            };
          }
        } catch (err) {
          if (debug) console.error('initPeerConnectionError', err.message);
        }
      }

      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e);
    }
  }, [isPlayMode, localStream]);
  var initDataChannel = useCallback(function (streamId, dataChannel) {
    console.log(streamId, dataChannel);

    dataChannel.onerror = function (error) {
      // console.log("Data Channel Error:", error );
      var obj = {
        streamId: streamId,
        error: error
      }; // console.log("channel status: ", dataChannel.readyState);

      if (dataChannel.readyState !== 'closed' && callbackError) {
        callbackError('data_channel_error', obj);
      }
    };

    dataChannel.onmessage = function (event) {
      var obj = {
        streamId: streamId,
        event: event
      };
      if (callback && adaptorRef.current) callback.call(adaptorRef.current, 'data_received', obj);
    };

    dataChannel.onopen = function () {
      // @ts-ignore
      remotePeerConnection[streamId].dataChannel = dataChannel; // console.log("Data channel is opened");

      if (callback && adaptorRef.current) callback.call(adaptorRef.current, 'data_channel_opened', streamId);
    };

    dataChannel.onclose = function () {
      // console.log("Data channel is closed");
      if (callback && adaptorRef.current) callback.call(adaptorRef.current, 'data_channel_closed', streamId);
    };
  }, []);
  var gotDescription = useCallback(function (configuration, streamId) {
    try {
      var _temp4 = _catch(function () {
        // const response =
        return Promise.resolve(remotePeerConnection[streamId].setLocalDescription(configuration)).then(function () {
          var jsCmd = {
            command: 'takeConfiguration',
            streamId: streamId,
            type: configuration.type,
            sdp: configuration.sdp
          };
          if (socket.ws) socket.ws.sendJson(jsCmd);
        });
      }, function (err) {
        if (debug) console.log('gotDescriptionError', err);
      });

      return Promise.resolve(_temp4 && _temp4.then ? _temp4.then(function () {}) : void 0);
    } catch (e) {
      return Promise.reject(e);
    }
  }, []);
  var startPublishing = useCallback(function (streamId) {
    try {
      var _temp6 = _catch(function () {
        return Promise.resolve(initPeerConnection(streamId, 'publish')).then(function () {
          return Promise.resolve(remotePeerConnection[streamId].createOffer(sdp_constraints)).then(function (configuration) {
            return Promise.resolve(gotDescription(configuration, streamId)).then(function () {});
          });
        });
      }, function (err) {
        if (debug) console.log('startPublishing error', err.message, err.stack);
      });

      return Promise.resolve(_temp6 && _temp6.then ? _temp6.then(function () {}) : void 0);
    } catch (e) {
      return Promise.reject(e);
    }
  }, [initPeerConnection]);
  var getUserMedia = useCallback(function (mdC) {
    try {
      return Promise.resolve(mediaDevices.getUserMedia(mdC)).then(function (stream) {
        if (typeof stream !== 'boolean') localStream.current = stream;
      });
    } catch (e) {
      return Promise.reject(e);
    }
  }, []);
  var publish = useCallback(function (streamId, token, subscriberId, subscriberCode) {
    var data = {};

    if (onlyDataChannel) {
      data = {
        command: 'publish',
        streamId: streamId,
        token: token,
        subscriberId: typeof subscriberId !== undefined ? subscriberId : '',
        subscriberCode: typeof subscriberCode !== undefined ? subscriberCode : '',
        video: false,
        audio: false
      };
    } else {
      if (localStream.current) return;
      var video = false,
          audio = false;

      if (localStream.current) {
        // @ts-ignore
        video = localStream.current.getVideoTracks().lengh > 0; // @ts-ignore

        audio = localStream.current.getAudioTracks().lengh > 0;
      }

      data = {
        command: 'publish',
        streamId: streamId,
        token: token,
        subscriberId: typeof subscriberId !== undefined ? subscriberId : '',
        subscriberCode: typeof subscriberCode !== undefined ? subscriberCode : '',
        video: video,
        audio: audio
      };
    }

    if (socket.ws) socket.ws.sendJson(data);
  }, []);
  var joinRoom = useCallback(function (room, streamId) {
    var data = {
      command: 'joinRoom',
      room: room,
      streamId: streamId
    };
    setRoomName(room);
    if (socket.ws) socket.ws.sendJson(data);
  }, []);
  var leaveFromRoom = useCallback(function (room) {
    var data = {
      command: 'leaveFromRoom',
      room: room
    };
    setRoomName(room);
    if (socket.ws) socket.ws.sendJson(data);
  }, []);
  var join = useCallback(function (streamId) {
    var data = {
      command: 'join',
      streamId: streamId
    };
    if (socket.ws) socket.ws.sendJson(data);
  }, []);
  var leave = useCallback(function (streamId) {
    var data = {
      command: 'leave',
      streamId: streamId
    };
    if (socket.ws) socket.ws.sendJson(data);
  }, []);
  var play = useCallback(function (streamId, token, room) {
    playStreamIds.push(streamId);
    var data = {
      command: 'play',
      streamId: streamId,
      token: token,
      room: room
    };

    if (token) {
      data.token = token;
    }

    if (socket.ws) socket.ws.sendJson(data);
    setIsPlayMode(true);
  }, []);
  var stop = useCallback(function (streamId) {
    var data = {
      command: 'stop',
      streamId: streamId
    };
    if (socket.ws) socket.ws.sendJson(data);
    setIsPlayMode(false);
  }, []);
  var handleTurnVolume = useCallback(function () {
    if (localStream.current) {
      var track = localStream.current.getAudioTracks()[0];
      track.enabled = !track.enabled;
      setIsMuted(!track.enabled);
    } else {
      if (callbackError) callbackError('NoActiveConnection');
    }
  }, []);
  var handleTurnCamera = useCallback(function () {
    if (localStream.current) {
      var track = localStream.current.getVideoTracks()[0];
      track.enabled = !track.enabled;
      setIsTurnedOf(!track.enabled);
    } else {
      if (callbackError) callbackError('NoActiveConnection');
    }
  }, []);
  var getStreamInfo = useCallback(function (streamId) {
    var jsCmd = {
      command: 'getStreamInfo',
      streamId: streamId
    };
    if (socket.ws) socket.ws.sendJson(jsCmd);
  }, []);
  var addIceCandidate = useCallback(function (streamId, candidate) {
    try {
      var _temp8 = _catch(function () {
        if (debug) console.debug("addIceCandidate " + streamId);
        return Promise.resolve(remotePeerConnection[streamId].addIceCandidate(candidate)).then(function () {});
      }, function () {});

      return Promise.resolve(_temp8 && _temp8.then ? _temp8.then(function () {}) : void 0);
    } catch (e) {
      return Promise.reject(e);
    }
  }, []);
  var takeConfiguration = useCallback(function (idOfStream, configuration, typeOfConfiguration) {
    try {
      var streamId = idOfStream;
      var type = typeOfConfiguration;
      var conf = configuration;
      var isTypeOffer = type === 'offer';
      var dataChannelMode = 'publish';

      if (isTypeOffer) {
        dataChannelMode = 'play';
      }

      return Promise.resolve(initPeerConnection(streamId, dataChannelMode)).then(function () {
        var _temp12 = _catch(function () {
          return Promise.resolve(remotePeerConnection[streamId].setRemoteDescription(new RTCSessionDescription({
            sdp: conf,
            type: type
          }))).then(function (response) {
            function _temp11() {
              iceCandidateList[streamId] = [];

              var _temp9 = function () {
                if (isTypeOffer) {
                  return Promise.resolve(remotePeerConnection[streamId].createAnswer(sdp_constraints)).then(function (configur) {
                    return Promise.resolve(gotDescription(configur, streamId)).then(function () {});
                  });
                }
              }();

              if (_temp9 && _temp9.then) return _temp9.then(function () {});
            }

            remoteDescriptionSet[streamId] = true;

            var _Object$keys = Object.keys(iceCandidateList[streamId]),
                length = _Object$keys.length;

            var i = 0;

            var _temp10 = _for(function () {
              return i < length;
            }, function () {
              return i++;
            }, function () {
              return Promise.resolve(addIceCandidate(streamId, iceCandidateList[streamId][i])).then(function () {});
            });

            return _temp10 && _temp10.then ? _temp10.then(_temp11) : _temp11(_temp10);
          });
        }, function (error) {
          if (error.toString().indexOf('InvalidAccessError') > -1 || error.toString().indexOf('setRemoteDescription') > -1) {
            /**
             * This error generally occurs in codec incompatibility.
             * AMS for a now supports H.264 codec. This error happens when some browsers try to open it from VP8.
             */
            if (callbackError) callbackError('notSetRemoteDescription');
          }
        });

        if (_temp12 && _temp12.then) return _temp12.then(function () {});
      });
    } catch (e) {
      return Promise.reject(e);
    }
  }, []);
  var takeCandidate = useCallback(function (idOfTheStream, tmpLabel, tmpCandidate, sdpMid) {
    try {
      var streamId = idOfTheStream;
      var label = tmpLabel;
      var candidateSdp = tmpCandidate;
      var candidate = new RTCIceCandidate({
        sdpMLineIndex: label,
        candidate: candidateSdp,
        sdpMid: sdpMid
      });
      return Promise.resolve(initPeerConnection(streamId, 'peer')).then(function () {
        var _temp13 = function () {
          if (remoteDescriptionSet[streamId] === true) {
            return Promise.resolve(addIceCandidate(streamId, candidate)).then(function () {});
          } else {
            if (debug) console.debug('Ice candidate is added to list because remote description is not set yet');
            var index = iceCandidateList[streamId].findIndex(function (i) {
              return JSON.stringify(i) === JSON.stringify(candidate);
            });

            if (index === -1) {
              var keys = Object.keys(candidate);

              for (var key in keys) {
                // @ts-ignore
                if (candidate[key] === undefined || candidate[key] === '') {
                  // @ts-ignore
                  candidate[key] = null;
                }
              }

              iceCandidateList[streamId].push(candidate);
            }
          }
        }();

        if (_temp13 && _temp13.then) return _temp13.then(function () {});
      });
    } catch (e) {
      return Promise.reject(e);
    }
  }, []);
  var peerMessage = useCallback(function (streamId, definition, data) {
    var jsCmd = {
      command: 'peerMessageCommand',
      streamId: streamId,
      definition: definition,
      data: data
    };
    if (socket.ws) socket.ws.sendJson(jsCmd);
  }, []);
  var sendData = useCallback(function (streamId, message) {
    // @ts-ignore
    var dataChannel = remotePeerConnection[streamId].dataChannel;
    dataChannel.send(message);
  }, []);
  var signallingState = useCallback(function (streamId) {
    if (remotePeerConnection[streamId] != null) {
      return remotePeerConnection[streamId].signalingState;
    }

    return null;
  }, []);
  var init = useCallback(function () {
    try {
      var _temp15 = function () {
        if (!isPlayMode && typeof mediaConstraints !== 'undefined' && localStream.current == null && !onlyDataChannel) {
          return Promise.resolve(getUserMedia(mediaConstraints)).then(function () {});
        }
      }();

      return Promise.resolve(_temp15 && _temp15.then ? _temp15.then(function () {}) : void 0);
    } catch (e) {
      return Promise.reject(e);
    }
  }, [isPlayMode, getUserMedia, mediaConstraints]);
  useEffect(function () {
    var ws = new WebSocket(url);
    var pingTimerId = -1;

    ws.onopen = function (data) {
      ws.sendJson = function (dt) {
        ws.send(JSON.stringify(dt));
      };

      pingTimerId = setInterval(function () {
        ws.sendJson({
          command: 'ping'
        });
      });
      init().then(function () {
        if (onopen) onopen(data);
        socket.ws = ws;
        setConnected(true);
      })["catch"](function (err) {
        if (callbackError) callbackError('initError', err);
      });
    };

    ws.onmessage = function (event) {
      try {
        var data = JSON.parse(event.data);

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
            if (adaptorRef.current) callback.call(adaptorRef.current, data.definition, data);

            if (data.definition === 'play_finished' || data.definition === 'publish_finished') {
              closePeerConnection(data.streamId);
            }

            break;

          case 'streamInformation':
            if (adaptorRef.current) callback.call(adaptorRef.current, data.command, data);
            break;

          case 'pong':
            if (adaptorRef.current) callback.call(adaptorRef.current, data.command);
            break;

          default:
            break;
        }

        return Promise.resolve();
      } catch (e) {
        return Promise.reject(e);
      }
    };

    ws.onerror = function (error) {
      setConnected(false);
      clearInterval(pingTimerId);
      if (callbackError) callbackError('Error on connect', error);
    };

    ws.onclose = function () {
      setConnected(false);
      clearInterval(pingTimerId);
    };

    return function () {
      ws.onopen = null;
      ws.onmessage = null;
      ws.onerror = null;
      ws.onclose = null;
      clearInterval(pingTimerId);
      setConnected(false);
    };
  }, [url]);
  useEffect(function () {
    adaptorRef.current = {
      publish: publish,
      joinRoom: joinRoom,
      leaveFromRoom: leaveFromRoom,
      join: join,
      leave: leave,
      play: play,
      stop: stop,
      localStream: localStream,
      remoteStreams: remoteStreams,
      getUserMedia: getUserMedia,
      getStreamInfo: getStreamInfo,
      signallingState: signallingState,
      initPeerConnection: initPeerConnection,
      handleTurnVolume: handleTurnVolume,
      handleTurnCamera: handleTurnCamera,
      isTurnedOf: isTurnedOf,
      isMuted: isMuted,
      peerMessage: peerMessage,
      sendData: sendData
    };
  }, [connected]);
  return !connected ? null : {
    publish: publish,
    joinRoom: joinRoom,
    leaveFromRoom: leaveFromRoom,
    join: join,
    leave: leave,
    play: play,
    stop: stop,
    localStream: localStream,
    remoteStreams: remoteStreams,
    getUserMedia: getUserMedia,
    getStreamInfo: getStreamInfo,
    signallingState: signallingState,
    initPeerConnection: initPeerConnection,
    handleTurnVolume: handleTurnVolume,
    handleTurnCamera: handleTurnCamera,
    isTurnedOf: isTurnedOf,
    isMuted: isMuted,
    peerMessage: peerMessage,
    sendData: sendData
  };
}

export { useAntMedia };
//# sourceMappingURL=rn-antmedia.esm.js.map
