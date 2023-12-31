package com.a702.sarkem.model.chat;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ChatMessage {

    // 메시지 타입 : 입장, 채팅
    public enum MessageType {
        ENTER, TALK
    }

    private MessageType type; // 메시지 타입
    private String roomId; // 방번호
    private String gameId; // 게임번호
    private String playerId; // 메시지 보낸사람
    private String nickName; // 메시지 보낸사람 닉네임
    private String message; // 메시지
}