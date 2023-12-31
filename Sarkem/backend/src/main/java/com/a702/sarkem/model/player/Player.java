package com.a702.sarkem.model.player;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
@RequiredArgsConstructor
@AllArgsConstructor
public class Player {

	private String playerId; // 아이디
	private String nickname; // 닉네임
	private LocalDateTime lastUpdateTime;	// 마지막 연결 시간
}
