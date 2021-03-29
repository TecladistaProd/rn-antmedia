import styled from 'styled-components/native';

export const Container = styled.View`
  flex: 1;
  position: relative;
  height: 100%;
  background-color: #ffffff;
  padding: 30px;
`;

export const Button = styled.TouchableOpacity`
  width: 100%;
  position: relative;
  height: 42px;
  border-radius: 4px;
  align-items: center;
  justify-content: center;
  background-color: #2b5b9b;
`;

export const Text = styled.Text`
  position: relative;
  color: #ffffff;
  font-size: 20px;
`;

export const TextContainer = styled.ScrollView`
  width: 100%;
  height: auto;
  flex: 1;
  background-color: #232323;
`;

export const Input = styled.TextInput`
  width: 100%;
  height: 50px;
  border: 1px solid rgba(0, 0, 0, 0.2);
`;
