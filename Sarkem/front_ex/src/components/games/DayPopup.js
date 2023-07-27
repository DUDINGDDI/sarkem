import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';

const fadeInOut = keyframes`
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
`;

const StyledPopupContainer = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%); /* 중앙 정렬 */
  background: #f3b7bf;
  border-radius: 30.94px;
  border: 5.16px solid #000000;
  padding: 61.87px;
  display: flex;
  flex-direction: column;
  gap: 12.89px;
  align-items: center;
  justify-content: center;
  box-shadow: 0px 5.16px 5.16px 0px rgba(0, 0, 0, 0.25), 10.31px 10.31px 0px 0px rgba(0, 0, 0, 1);
  z-index: 9999;
  opacity: ${({ showPopup }) => (showPopup ? 1 : 0)};
  animation: ${fadeInOut} 4s ease-in-out forwards;
`;

const StyledPopupTitle = styled.div`
  color: #ffffff;
  font-size: 42px;
  font-family: "RixInooAriDuri", sans-serif;
  text-align: center;
  text-shadow: 1px 1px black;
  -webkit-text-stroke: 1px black; /* For webkit-based browsers like Chrome, Safari */
  text-stroke: 1px black; /* Standard property for future compatibility */
  padding: 10px; /* Optionally, you can add some padding to create space between the text and the border */
`;


const DayPopup = () => {
  const [showPopup, setShowPopup] = useState(true);

  useEffect(() => {
    const fadeOutTimeout = setTimeout(() => {
      setShowPopup(false);
    }, 4000);

    return () => clearTimeout(fadeOutTimeout);
  }, []);

  return (
    <StyledPopupContainer showPopup={showPopup}>
      {/* Your popup content */}
      <div
        style={{
          flexShrink: '0',
          width: '59.29px',
          height: '0.01px',
          position: 'relative',
          transformOrigin: '0 0',
          // transform: 'rotate(0deg) scale(1, -1)',
        }}
      >
        <div
          style={{
            background: '#ffffff',
            borderRadius: '72.18px',
            borderStyle: 'solid',
            borderColor: '#000000',
            borderWidth: '5.16px',
            padding: '10.31px 21.91px 10.31px 21.91px',
            display: 'flex',
            flexDirection: 'row',
            gap: '12.89px',
            alignItems: 'center',
            justifyContent: 'center', // Center the content horizontally
            width: '229.44px',
            height: '45px',
            position: 'relative',
            bottom: 'calc(50% + 100px)',
            right: '110px',
          }}
        >
          N일차 낮
        </div>
      </div>

      <StyledPopupTitle>닉네임 님이 추방되었습니다.</StyledPopupTitle>
    </StyledPopupContainer>
  );
};

export default DayPopup;