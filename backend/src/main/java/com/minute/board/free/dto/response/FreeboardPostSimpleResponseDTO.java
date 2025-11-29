package com.minute.board.free.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
@Schema(description = "자유게시판 게시글 목록 아이템 응답 DTO")
public class FreeboardPostSimpleResponseDTO {

    @Schema(description = "게시글 ID", example = "1")
    private Integer postId;

    @Schema(description = "게시글 제목", example = "오늘 날씨가 좋네요!")
    private String postTitle;

    @Schema(description = "게시글 조회수", example = "105")
    private int postViewCount;

    @Schema(description = "게시글 좋아요수", example = "15")
    private int postLikeCount;

    @Schema(description = "게시글 작성일시", example = "2025-05-24T10:30:00")
    private LocalDateTime postCreatedAt;

    @Schema(description = "작성자 User ID", example = "testUser123")
    private String userId;

    @Schema(description = "작성자 닉네임", example = "날씨요정")
    private String userNickName;

    @Schema(description = "현재 로그인한 사용자의 해당 게시글 좋아요 여부", example = "true")
    private boolean isLikedByCurrentUser;

    @Schema(description = "현재 로그인한 사용자의 해당 게시글 신고 여부", example = "false")
    private boolean isReportedByCurrentUser;

}