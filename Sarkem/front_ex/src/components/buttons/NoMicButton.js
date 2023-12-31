import React from 'react';
import styled from 'styled-components';
import micButtonImageSrc from '../../img/nomicbutton.png';

const MicButtonImage = styled.img`
  width: 60px;
  height: 60px;
  position: absolute;
  left: 30px;
  top: 220px;
  overflow: visible;
  z-index: 1;
`;

const NoMicButton = ({  }) => {

  return (
    <MicButtonImage src={micButtonImageSrc} />
  );
};

export default NoMicButton;
