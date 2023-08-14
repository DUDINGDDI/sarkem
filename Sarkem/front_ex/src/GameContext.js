import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router';
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';
import { useRoomContext } from './Context';
import { GestureRecognizer, FilesetResolver } from '@mediapipe/tasks-vision';
import ChatButtonAndPopup from './components/buttons/ChatButtonAndPopup';
import DayPopup from './components/games/DayPopup';
import { Message } from '@stomp/stompjs';
import axios from "axios";
import nightCamAudio from './components/camera/DayNightCamera';

const GameContext = createContext();

const GameProvider = ({ children }) => {
  const { roomSession, player, setPlayer, players, setPlayers, leaveSession } = useRoomContext();
  const [ gameSession, setGameSession ] = useState({});
  // 현재 시스템 메시지를 저장할 상태 추가
  const [currentSysMessage, setCurrentSysMessage] = useState(null);
  const [currentSysMessagesArray, setCurrentSysMessagesArray] = useState([]); // 배열 추가
  const [chatMessages, setChatMessages] = useState([]); 
  const [chatConnected, setChatConnected] = useState(false);
  const [message, setMessage] = useState("");
  
  const [winner, setWinner] = useState(null);
  const jungleRefs = useRef([]);
  const mixedMediaStreamRef = useRef(null);
  const audioContext = useRef(new (window.AudioContext || window.webkitAudioContext)()).current;
  
  const [myVote, setMyVote] = useState(0);
  const [dayCount, setDayCount] = useState(0);
  const [startVote, setStartVote] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState("");
  const [expulsionTarget, setExpulsionTarget] = useState("");
  const [voteSituation, setVotesituation] = useState({});
  const [threatedTarget, setThreatedTarget] = useState("");
  // twilight 투표 설정 위한 타겟id
  const [targetId, setTargetId] = useState("");
  // 남은 시간
  const [remainTime, setRemainTime] = useState(0);
  
  const [psyTarget, setPsyTarget] = useState("");
  const [psychologist, setPsychologist] = useState(false);//심리학자 실행
  const [hiddenMission, setHiddenMission] = useState(false);//히든미션 실행
  const hiddenMissionType = ["Thumb_Up", "Thumb_Down", "Victory", "Pointing_Up", "Closed_Fist", "ILoveYou"];//히든미션 리스트
  const [missionNumber, setMissionNumber] = useState(0);
  const [selectMission, setSelectMission] = useState("");//히든 선택된 히든미션
  const [scMiniPopUp, setScMiniPopUp] = useState(true);//첫날만 직업 카드 자동으로 뜸
  
  // 낮 투표 타겟 저장 위한 타겟
  const [voteTargetId, setVoteTargetId] = useState("");
  const [phase, setphase] = useState("");
  const [gestureRecognizer, setGestureRecognizer] = useState(null);
  const [detectedGesture, setDetectedGesture] = useState('');
  const [animationFrameId, setAnimationFrameId] = useState(null);
  
  // 캠 배열에서 제거하기 위함
  const [deadIds, setDeadIds] = useState([]);

  // 게임 결과 출력을 위한 직업 저장
  const roleAssignedArray = useRef([]);
  
  const navigate = useNavigate();
  const location = useLocation();
  let stompClient = useRef({});
  const pingSession = useRef();

  
  const Roles = new Map(Object.entries({
    CITIZEN: "CITIZEN",
    SARK: "SARK",
    DOCTOR: "DOCTOR", 
    POLICE: "POLICE", 
    OBSERVER: "OBSERVER", 
    PSYCHO: "PSYCHO", 
    BULLY: "BULLY", 
    DETECTIVE: "DETECTIVE",
  }));
  
  ////////////   GameContext Effect   ////////////
  
  useEffect(() => {
    console.log('GameProvider 생성');
    jungleRefs.current = [];
  }, []);


  useEffect(() => {
    setCurrentSysMessage(null);
    setCurrentSysMessagesArray([]);
    
  }, [gameSession.gameId]);


  // useEffect(() => {
  //   if (players.size>0) {
      
  //   }
  // }, [players])

  useEffect(() => {
    console.log("GestureRecognizer 생성 완료");
  }, [gestureRecognizer]);
  
  // 게임 옵션이 변경되면, callChangeOption 호출
  useEffect(()=> {

    if(!player.current.isHost) return;

    callChangeOption();

  }, [gameSession.gameOption]);


  ////////////   GameContext 함수   ////////////

  // WebSocket 연결
  const connectGameWS = async (event) => {
    
    if (pingSession.current) clearInterval(pingSession.current);

    if (stompClient.current === undefined) return;
    console.log("connectGameWS");
    let socket = new SockJS("http://localhost:8080/ws-stomp");
    stompClient.current = Stomp.over(socket);
    await stompClient.current.connect({}, () => {
      setTimeout(function() {
        // onSocketConnected();
        console.log(players);
        connectGame();
        connectChat();
        sendChatPubMessage();
        // onConnected();
       console.log(stompClient.current.connected);
    }, 500);
    });
    socket.onclose = () => {
      leaveSession();
      if (pingSession.current) clearInterval(pingSession.current);
      alert("socket error");
      navigate("/");
    }

    sendPing();
  }

  const unsubscribeRedisTopic = () => {
    try{
      unconnectChat();
      unconnectGame();
    } catch(error) {
      console.log(error);
    }
  }

  const sendPing = () => {
    if (pingSession.current) clearInterval(pingSession.current);
    
    // 연결되어 있음을 알리는 메시지 전송
    pingSession.current = setInterval(() => {
      if (!stompClient.current.connected) {
        console.log('sendPing');
        console.log('stompClient.current null');
        if (pingSession.current) clearInterval(pingSession.current);
        if (roomSession.roomId !== undefined) {
          navigate(`/${roomSession.roomId}`);
        }
        else {
          navigate(`/`);
        }
      }

      if (player.current.playerId === undefined) {
        console.log('sendPing');
        console.log('player.current.playerId null');
        if (pingSession.current) clearInterval(pingSession.current);
        if (roomSession.roomId !== undefined) {
          navigate(`/${roomSession.roomId}`);
        }
        else {
          navigate(`/`);
        }
      }
      
      if (roomSession.gameId === undefined) {
        console.log('sendPing');
        console.log('roomSession.gameId null');
        if (pingSession.current) clearInterval(pingSession.current);
      }

      console.log('send ping');
      if (!stompClient.current.connected) {
        if (pingSession.current) clearInterval(pingSession.current);
        return;
      }
      stompClient.current.send('/pub/game/action', {}, JSON.stringify({
        code:'PING',
        roomId: roomSession.roomId,
        gameId: roomSession.gameId,
        playerId:player.current.playerId, 
      }));
    }, 5000);
  }

  // 게임룸 redis 구독
  const connectGame = () => {
    if (!stompClient.current.connected) return;
    console.log('/sub/game/system/' + roomSession.roomId + " redis 구독")
    stompClient.current.subscribe('/sub/game/system/' + roomSession.roomId, receiveMessage)
  }

  // 게임 끝나거나 비활성화 할때 //
  const unconnectGame = () => {
    console.log('/sub/game/system/' + roomSession.roomId + " redis 구독 취소");
    stompClient.current.unsubscribe('/sub/game/system/' + roomSession.roomId, receiveMessage);
  };


  const receiveChatMessage = async (message) => {
    const parsedMessage = JSON.parse(message.body);
    const chatMessage = parsedMessage.message;
    const playerId = parsedMessage.playerId;
    
    console.log(chatMessage, "메세지 수신2"); // 메시지 수신 여부 확인을 위한 로그
    setChatMessages((prevMessages) => [...prevMessages, { message: chatMessage, playerId }]);
  };
  

  const sendChatPubMessage = (message) => {
    console.log("chat publish 들어감"); 
    if (stompClient.current.connected && player.current.playerId !== null) {
      console.log("Enter 메시지 보냄, roomId", roomSession.roomId); 
      stompClient.current.send('/pub/chat/room', {}, JSON.stringify({
        type:'ENTER',
        playerId:player.current.playerId,
        nickName:player.current.nickName,
        roomId: roomSession.roomId,
        message: message
      }));
    }
  };

  // 채팅 연결할 때 //
  const connectChat = () => {
    if (!stompClient.current.connected) return;
    console.log('/sub/chat/room/' + window.sessionStorage.getItem("roomId") + " redis 구독")
    stompClient.current.subscribe('/sub/chat/room/' + window.sessionStorage.getItem("roomId"), receiveChatMessage);
  };

  const sendMessage = (message) => {
    if (stompClient.current.connected && player.current.playerId !== null) {
      console.log("Talk 타입 메시지 들간다"); 
      console.log("메시지: ", message); 
      stompClient.current.send('/pub/chat/room', {}, JSON.stringify({
        type:'TALK', 
        roomId: roomSession.roomId,
        playerId:player.current.playerId,
        message: message
      }));
    }
  }
  
  // 게임 끝나거나 비활성화 할때 //
  const unconnectChat = () => {
    console.log('/sub/chat/room/' + roomSession.roomId + " redis 구독 취소");
    stompClient.current.unsubscribe('/sub/chat/room/' + roomSession.roomId, receiveMessage);
  };

  const getGameSession = async (roomId) => {
    try {
      // 게임세션 정보 획득
      const response = await axios.get('/api/game/session/' + roomId, {
        headers: { 'Content-Type': 'application/json;charset=utf-8', },
      });

      if (response.status === 208) {
        console.log("이미 진행중인 게임입니다.");
        return false;
      }

      console.log('gamesession 획득');
      console.log(response);
      setGameSession((prev) => {
        return ({
          ...prev,
          gameOption: response.data.gameOption,
        });
      });

      return true;
    }
    catch {
      console.log("게임 세션 요청 실패");
      return false;
    }
  }

  // 게임 시작 버튼 클릭
  const handleGamePageClick = () => {
    stompClient.current.send("/pub/game/action", {}, 
      JSON.stringify({
          code:'GAME_START', 
          roomId: roomSession.roomId, 
          playerId: player.current.playerId
      })
      );
  };


  const getAlivePlayers = () => {
    // console.log(players.current.values(), "getAlivePlayers");
    // console.log(Array.from(players.current.values()).filter((player) => player.isAlive === true), "getAlivePlayers");
    return Array.from(players.current.values()).filter((player) => player.isAlive === true);
  }


  const receiveMessage = async (message) => {
    // 시스템 메시지 처리
    let sysMessage = JSON.parse(message.body);

    if (sysMessage.playerId === "ALL" || player.current.playerId === sysMessage.playerId) {
    switch (sysMessage.code) {
      // param에 phase, message
    case "NOTICE_MESSAGE":
        console.log(sysMessage.param);
        setCurrentSysMessage(()=>sysMessage);
        console.log(sysMessage.param.phase);
        console.log(sysMessage.param.phase==="DAY");
        if(sysMessage.param.phase==="DAY"){
          console.log("들어간다");
          setCurrentSysMessagesArray(prevMessages => [ ...prevMessages,
          { ...sysMessage, dayCount: sysMessage.param.day }]);
        }
    break;

    case "GAME_START":   
        // 게임상태 초기화
        for (let player of players.current.values()) {
          console.log(player, "handleGamePageClick");
          player.isAlive = true;
        }
        navigate(`/${roomSession.roomId}/day`);
        break;

    case "ONLY_HOST_ACTION":
        console.log(sysMessage);
        // alert('방장만 실행 가능합니다.');
        break;

    case "OPTION_CHANGED":
        if(player.current.isHost) return;
        setGameSession((prev) => {
          return ({
            ...prev,
            gameOption: sysMessage.param,
          });
        });
        break;

    // 역할 저장을 위해 넣었음 //
    case "ROLE_ASSIGNED":
        const assignedRole = Roles.get(sysMessage.param.role);
        if (assignedRole == null) {
          alert("직업배정에 실패했습니다.", assignedRole);
          return;
        }
        console.log(`당신은 ${assignedRole} 입니다.`);
        // setPlayer((prev) => {
        //   return ({
        //     ...prev,
        //     role: assignedRole,
        //   });
        // });
        setPlayer([{key: 'role', value: assignedRole}]);
        break;
        
    case "PHASE_DAY":
        setphase("day");
        navigate(`/${roomSession.roomId}/day`);
        break;

    case "PHASE_TWILIGHT":
        setphase("twilight");
        navigate(`/${roomSession.roomId}/sunset`);
        setThreatedTarget(false); // 저녁 되면 협박 풀림
        setHiddenMission(false);
        break;

    case "PHASE_NIGHT":
        setphase("night");
        setThreatedTarget(false); // 밤 되면 협박 풀림
        setPsyTarget("");//심리학자 끝
        setPsychologist(false);
        setHiddenMission(false);// 밤이 되면 마피아 미션 끝
        setCurrentSysMessagesArray([]);
        console.log(phase);
        navigate(`/${roomSession.roomId}/night`);
        break;

    case "GAME_END":
        navigate(`/${roomSession.roomId}/result`);
        const nowWinner = sysMessage.param.winner;
        console.log(nowWinner);
        setWinner(nowWinner);
        setphase("");
        break;

    case "TARGET_SELECTION":
        setVotesituation({});
        // alert('투표가 시작됐습니다');
        setStartVote(true);
        if (sysMessage.param && sysMessage.param.day !== undefined && sysMessage.param.day !== null) {
            setDayCount(sysMessage.param.day);
        }
        break;

    case "VOTE_SITUATION":
        if (sysMessage.param.hasOwnProperty("target")) {
            // setVotesituation(sysMessage.param.target);
            console.log(sysMessage.param.target, "타겟저장");
            setVotesituation({ [sysMessage.param.target]: 1 });
        } else {
            setVotesituation(sysMessage.param);
            setVoteTargetId("");
        }
        break;

    case "DAY_VOTE_END":
        setStartVote(false);
        setTargetId(sysMessage.param.targetId);
        console.log(sysMessage.param.targetId, "이거");
        console.log(targetId, "이놈확인해라");
        
        // 2번 -> sunsetpage로 넘겨서 사용해라

        break;

    case "TARGET_SELECTION_END":
        // alert("선택 완료", sysMessage.param.targetNickname);
        setSelectedTarget("");
        break;

    case "TWILIGHT_SELECTION":
        alert("죽일지 살릴지 선택해주세요");
        setStartVote(true);
        break;

    case "TWILIGHT_SELECTION_END":
        // 추방 투표 완료(개인)
        console.log("추방 투표 완료");
        break;

    case "TWILIGHT_VOTE_END":
        setStartVote(false);
        // alert("저녁 투표 완료 \n 투표 결과: " + sysMessage.param.result);
        players.current.get(sysMessage.param.targetId).isAlive = false;
        break;

    case "BE_EXCLUDED":
        // setPlayer((prev) => {
        //   return ({
        //     ...prev,
        //     role: "OBSERVER",
        //     isAlive: false,
        //   });
        // });
        setPlayer([{key: 'role', value: 'OBSERVER'}, {key: 'isAlive', value: false}]);
        break;

    case "BE_HUNTED":
        const newDeadId = sysMessage.param.deadPlayerId;
        console.log(sysMessage.param.deadPlayerId, "여김다");
        console.log(newDeadId, "여김다");
        setDeadIds(prevDeadIds => [...prevDeadIds, newDeadId]);
        players.current.get(newDeadId).isAlive = false;
        
        if (sysMessage.param && sysMessage.param.deadPlayerId === player.current.playerId) {
          // setPlayer((prev) => {
          //   return ({
          //     ...prev,
          //     role: "OBSERVER",
          //   });
          // });
          setPlayer([{key: 'role', value: 'OBSERVER'}]);
        }
        break;

    case "BE_THREATED":
        // alert("냥아치 협박 시작!", sysMessage.playerId);
        setThreatedTarget(true);
        // setPlayer((prev) => {
        //   return ({
        //     ...prev,
        //     isMicOn: false,
        //   });
        // });
        break;

    case "PSYCHOANALYSIS_START":
        setPsyTarget(sysMessage.param.targetId);
        setPsychologist(true);
        break;
    case "MISSION_START":
        console.log("미션시작");
        setHiddenMission(true);
        setMissionNumber(sysMessage.param.missionIdx);
        setSelectMission(hiddenMissionType[sysMessage.param.missionIdx]);
        console.log(selectMission);
        break;

    case "PHASE_NIGHT":
        navigate(`/${roomSession.roomId}/night`);
        break;

    case "CHANGE_HOST":
      console.log(`지금부터 당신이 방장입니다.`);
      // setPlayer((prev) => {
      //   return ({
      //     ...prev,
      //     isHost: true
      //   });
      // });
      setPlayer([{key: 'isHost', value: true}]);
      break;

    case "REMAIN_TIME":
        setRemainTime(sysMessage.param.time);
        // console.log("남은 시간: ",sysMessage.param.time);
        break;

    case "JOB_DISCLOSE":
        const disclosedRoles = sysMessage.param;
        // console.log(sysMessage.param)
        // console.log(sysMessage.param.job.length)
        const newRoleAssignedArray = [];
    
        for (let i = 0; i < disclosedRoles.job.length; i++) {
          const nickname = disclosedRoles.nickname[i];
          const job = disclosedRoles.job[i];
          const role = disclosedRoles.role[i];
          let team = "";
    
          if (job === "삵") {
            team = "sark";
          } else {
            team = "citizen";
          }
    
          newRoleAssignedArray.push({
            team: team,
            nickname: nickname,
            job: job,
            role: role,
          });
        }
        // TODO: 게임 종료됐을 때, 직업 구성 받기
        roleAssignedArray.current = newRoleAssignedArray;
        console.log(roleAssignedArray, "roleAssignedArray");
        break;
      }
    }
    else {

      // 역할 저장을 위해 넣었음 //
      switch (sysMessage.code) {
      case "ROLE_ASSIGNED":
          console.log("안녕하십니ㅏ");
          const assignedRole = Roles.get(sysMessage.param.role);
          if (assignedRole == null) {
            alert("직업배정에 오류가 발생했습니다.", assignedRole);
            return;
          }
          let player = players.current.get(sysMessage.playerId);
          if (player == null) {
            alert("ROLE_ASSIGNED - 플레이어 정보를 불러오는데 실패했습니다.", sysMessage.playerId);
            return;
          }
          player.role = assignedRole;
          setPlayers(player);
          // setPlayers((prev) => {
          //   return new Map([
          //     ...prev,
          //     [player.current.playerId, player],
          //   ]);
          // });
          // players.current.set(player.current.playerId, player);
          break;

      }
    }
    handleSystemMessage(message);
  }


  const selectAction = ((target) => {
      console.log(target, "2번");
      if (selectedTarget !== "") {
          setSelectedTarget("");
          target.playerId = "";
      }
      else {
          setSelectedTarget(target.playerId)
      }
      console.log("다른 플레이어 선택 " + target.playerId);
      if (stompClient.current.connected && player.current.playerId !== null) {
          stompClient.current.send("/pub/game/action", {},
              JSON.stringify({
                  code: 'TARGET_SELECT',
                  roomId: roomSession.roomId,
                  playerId: player.current.playerId,
                  param: {
                      target: target.playerId
                  }
              }))
      }
  });
  
  // 대상 확정
  const selectConfirm = () => {

      // console.log(voteTargetId, "여기에요");
      if (stompClient.current.connected && player.current.playerId !== null) {
          stompClient.current.send("/pub/game/action", {},
              JSON.stringify({
                  code: 'TARGET_SELECTED', // 스킵했을 때도 얘도 보내달라
                  roomId: roomSession.roomId,
                  playerId: player.current.playerId,
                  param: {
                      // target: selectedTarget
                  }
              }));
      }
  };
  
  // 추방 투표 동의
  const agreeExpulsion = () => {
      stompClient.current.send("/pub/game/action", {}, 
          JSON.stringify({
              code: 'EXPULSION_VOTE',
              roomId: roomSession.roomId, 
              playerId: player.current.playerId,
              param: {
                  result: true
              }
          })
      );
  };
  
  // 추방 투표 반대
  const disagreeExpulsion = () => {
      stompClient.current.send("/pub/game/action", {}, 
          JSON.stringify({
              code: 'EXPULSION_VOTE',
              roomId: roomSession.roomId, 
              playerId: player.current.playerId,
              param: {
                  result: false
              }
          })
      );
  };

    // noticemessage 처리
    const [systemMessages, setSystemMessages] = useState([]);
    const handleSystemMessage = (message) => {
      const sysMessage = JSON.parse(message.body);
      setSystemMessages((prevMessages) => [...prevMessages, sysMessage]);
    };
  
    // 제스처 인식기 생성
    const loadGestureRecognizer = async () => {
      const vision = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm');
      const recognizer = await GestureRecognizer.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task',
          delegate: 'GPU',
          numHands: 2
        },
        runningMode: 'VIDEO',
      });
      setGestureRecognizer(recognizer);
    };

    // 미션성공
    const missionConplete = () => {
      console.log("미션 성공");
      setHiddenMission(false);
      setSelectMission("");
      stopPredicting();
        if (stompClient.current.connected && player.current.playerId !== undefined) {
            stompClient.current.send("/pub/game/action", {},
                JSON.stringify({
                    code: 'HIDDENMISSION_SUCCESS ', // 스킵했을 때도 얘도 보내달라
                    roomId: roomSession.roomId,
                    playerId: player.current.playerId,
                    param: {
                        // target: selectedTarget
                    }
                }));
        }
    };

    // 
    const predictWebcam = () => {
        if (gestureRecognizer) {
          const videoElement = player.current.stream.videos[player.current.stream.videos.length-1].video;
          const nowInMs = Date.now();
          const results = gestureRecognizer.recognizeForVideo(videoElement, nowInMs);
          if (results.gestures.length > 0) {
            const detectedGestureName = results.gestures[0][0].categoryName;
            console.log(detectedGestureName);
            if(selectMission===detectedGestureName){
              missionConplete();
              setHiddenMission(false);
            }
          }
        }
        setAnimationFrameId(setTimeout(() => requestAnimationFrame(predictWebcam), 500));
  };

  const stopPredicting = () => {
    // cancelAnimationFrame(animationFrameId); // requestAnimationFrame 중지
    // if(animationFrameId) {
    //   clearTimeout(animationFrameId);
    // }
    // setAnimationFrameId(null);
    if (animationFrameId !== null) {
      console.log("미션 끝");
      cancelAnimationFrame(animationFrameId); // Cancel the animation frame
      clearTimeout(animationFrameId); // Clear the timeout
      setAnimationFrameId(null);
    }
  };

    // 중복 제거 함수 정의
const removeDuplicateVideosFromStream = (player) => {
  player.stream.videos = player.stream.videos.filter((video, index, self) => {
    const firstIndex = self.findIndex(v => v.id === video.id && v.name === video.name);
    const lastIndex = self.lastIndexOf(v => v.id === video.id && v.name === video.name);
    return index === firstIndex || index === lastIndex;
  });
}

const uniquePlayers = () => {
  // Map의 각 요소에 대해 중복 제거 함수 적용
  console.log("중복값제거")
  players.current.forEach((player) => {
    console.log("중복 제거", player);
    removeDuplicateVideosFromStream(player);
  });
}

  // 변경된 게임 옵션을 redis 토픽에 전달
  const callChangeOption = () => {
    if(stompClient.current.connected) {
      stompClient.current.send("/pub/game/action", {}, 
          JSON.stringify({
              code:'OPTION_CHANGE', 
              roomId: roomSession.roomId,
              playerId: player.current.playerId,
              param: gameSession.gameOption
      }));
      console.log(gameSession.gameOption);
    }
  };

  const chatVisible = () =>{
    // DEBUG:
    // if (player.current.role === 'OBSERVER'){
      return (
        <>
          <ChatButtonAndPopup />
        </>
      )
    // }
  }

  return (
    <GameContext.Provider value={{ stompClient, startVote, selectAction, setSelectedTarget, selectConfirm, handleGamePageClick, connectGameWS,
      systemMessages, handleSystemMessage, dayCount, agreeExpulsion, disagreeExpulsion, predictWebcam, stopPredicting, detectedGesture, chatMessages, receiveChatMessage,
      voteSituation, currentSysMessage, currentSysMessagesArray, setCurrentSysMessagesArray,phase, targetId, sendMessage, threatedTarget, getGameSession, gameSession, setGameSession, chatVisible, 
      Roles, sendMessage, jungleRefs, mixedMediaStreamRef, audioContext, winner, setWinner, voteTargetId, deadIds, psyTarget, hiddenMission, setHiddenMission, remainTime, 
      psychologist, scMiniPopUp, setScMiniPopUp, loadGestureRecognizer, missionNumber, getAlivePlayers, roleAssignedArray, unsubscribeRedisTopic, uniquePlayers }}
    >
      {children}
    </GameContext.Provider>
  );


};

const useGameContext = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('roomContext must be used within a RoomProvider');
  }
  return context;
};



export { GameProvider, useGameContext };
