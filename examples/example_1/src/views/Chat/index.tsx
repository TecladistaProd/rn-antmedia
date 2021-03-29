import React, {useCallback, useRef, useState, useEffect} from 'react';

import {useAntMedia} from 'rn-antmedia';

import {Container, Button, Text, TextContainer, Input} from './styles';

const defaultStreamName = 'stream3';

const Chat: React.FC = () => {
  const streamNameRef = useRef<string>(defaultStreamName);
  const [isPlaying, setIsPlaying] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const events = useRef<{
    [key: string]: fn;
  }>({});
  const adaptor = useAntMedia({
    url: 'wss://server.com:5443/WebRTCAppEE/websocket',
    // or url: 'ws://server.com:5080/WebRTCAppEE/websocket',
    mediaConstraints: {},
    onlyDataChannel: true,
    sdp_constraints: {},
    bandwidth: 300,
    peerconnection_config: {
      iceServers: [
        {
          url: 'stun:stun.l.google.com:19302',
        },
      ],
    },
    callback(command, data) {
      switch (command) {
        case 'pong':
          break;
        case 'joined':
          setIsPlaying(true);
          break;
        case 'data_received':
          // console.log(command, data.event.data);
          setMessages((msgs) => [...msgs, data.event.data]);
          break;
        default:
          console.log(command);
          break;
      }
    },
    callbackError: (err, data) => {
      console.error('callbackError', err, data);
    },
  });

  const handleConnect = useCallback(() => {
    if (!adaptor) {
      return;
    }

    adaptor.join(streamNameRef.current);
  }, [adaptor]);

  const sendMessage = useCallback(() => {
    if (!adaptor) {
      return;
    }
    adaptor.sendData(streamNameRef.current, message);
    setMessages((msgs) => [...msgs, message]);
    setMessage('');
  }, [message, adaptor]);

  const handleLeave = useCallback(() => {
    if (!adaptor) {
      return;
    }
    adaptor.leave(streamNameRef.current);
    setIsPlaying(false);
  }, [adaptor]);

  useEffect(() => {
    events.current.handleLeave = handleLeave;
  }, [handleLeave]);

  useEffect(() => {
    const toLeave = events.current.handleLeave;
    return () => {
      if (streamNameRef.current) {
        toLeave();
      }
    };
  }, []);

  return (
    <Container>
      {!isPlaying ? (
        <>
          <Button
            onPress={handleConnect}
            style={{alignSelf: 'center', marginHorizontal: 'auto'}}>
            <Text>ENTRAR</Text>
          </Button>
        </>
      ) : (
        <>
          <TextContainer>
            {messages.map((i, k) => (
              <Text key={k}>{i}</Text>
            ))}
          </TextContainer>
          <Input value={message} onChangeText={setMessage} />
          <Button style={{marginTop: 10}} onPress={sendMessage}>
            <Text>ENVIAR</Text>
          </Button>
          <Button onPress={handleLeave} style={{marginTop: 20}}>
            <Text>SAIR</Text>
          </Button>
        </>
      )}
    </Container>
  );
};

export default Chat;
