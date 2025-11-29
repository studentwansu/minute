package com.minute.board.free.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "관리자용 신고된 댓글 요약 정보 DTO")
public class AdminReportedCommentEntryDTO {

    @Schema(description = "댓글 ID", example = "7")
    private Integer commentId;

    @Schema(description = "댓글 내용 (전체 또는 미리보기 - JPQL에서 c.commentContent를 가져오므로 전체 내용)")
    private String commentContent;

    @Schema(description = "댓글 작성자 User ID", example = "commenter01")
    private String authorUserId;

    @Schema(description = "댓글 작성자 닉네임", example = "댓글러")
    private String authorNickname;

    @Schema(description = "댓글 작성일시", example = "2025-05-25T14:30:00")
    private LocalDateTime commentCreatedAt;

    @Schema(description = "댓글이 달린 원본 게시글 ID", example = "2")
    private Integer originalPostId;

    @Schema(description = "해당 댓글의 총 신고 횟수", example = "3")
    private Long reportCount;

    @Schema(description = "댓글 숨김 처리 여부", example = "false")
    private boolean isHidden;
}