import React from 'react';
import {NativeRouter, Route} from 'react-router-native';
import styled from 'styled-components/native';

import Room from './views/Room';
import Peer from './views/Peer';
import Chat from './views/Chat';

const SafeArea = styled.SafeAreaView`
  flex: 1;
`;

const Container = styled.SafeAreaView`
  flex: 1;
`;

const src: React.FC = () => {
  return (
    <SafeArea>
      <NativeRouter>
        <Container>
          <Route exact path="/peer" component={Peer} />
          <Route exact path="/" component={Chat} />
        </Container>
      </NativeRouter>
    </SafeArea>
  );
};

export default src;
