package com.minute.board.free.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
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
@JsonInclude(JsonInclude.Include.NON_NULL)
@Schema(description = "신고된 댓글 항목 응답 DTO")
public class ReportedCommentEntryDTO {

    @Schema(description = "활동 유형 (COMMENT_REPORT 고정)", example = "COMMENT_REPORT")
    private String itemType;

    @Schema(description = "신고 ID (댓글 신고 ID)", example = "1")
    private Integer reportId;

    @Schema(description = "신고된 원본 댓글 ID", example = "7")
    private Integer reportedItemId;

    @Schema(description = "신고된 댓글 내용 미리보기", example = "이 댓글은 문제가 있어 보입니다...")
    private String itemTitleOrContentPreview;

    @Schema(description = "신고된 댓글 작성자 User ID", example = "commenter01")
    private String reportedItemAuthorUserId;

    @Schema(description = "신고된 댓글 작성자 닉네임", example = "댓글러")
    private String reportedItemAuthorNickname;

    @Schema(description = "신고자 User ID", example = "reporterUser456")
    private String reporterUserId;

    @Schema(description = "신고자 닉네임", example = "정의로운신고맨")
    private String reporterNickname;

    @Schema(description = "신고 일시", example = "2025-05-28T10:00:00")
    private LocalDateTime reportCreatedAt;

    @Schema(description = "신고된 원본 댓글 생성일시", example = "2025-05-27T15:00:00")
    private LocalDateTime originalItemCreatedAt;

    @Schema(description = "신고된 원본 댓글 숨김 처리 여부", example = "false")
    private boolean isItemHidden;

    @Schema(description = "댓글 신고인 경우, 원본 게시글 ID", example = "2")
    private Integer originalPostIdForComment;

}