package com.minute.board.free.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
@Schema(description = "자유게시판 사용자 활동 항목 (게시글 또는 댓글) 응답 DTO")
public class FreeboardUserActivityItemDTO {

    @Schema(description = "활동 유형 (POST: 게시글, COMMENT: 댓글)", example = "POST", requiredMode = Schema.RequiredMode.REQUIRED)
    private String itemType;

    @Schema(description = "항목 ID (게시글 ID 또는 댓글 ID)", example = "101", requiredMode = Schema.RequiredMode.REQUIRED)
    private Integer itemId;

    @Schema(description = "게시글 제목 (게시글인 경우)", example = "오늘의 일기")
    private String postTitle;

    @Schema(description = "댓글 내용 미리보기 (댓글인 경우, 50자 제한)", example = "정말 공감합니다! 좋은 하루 되세요...")
    private String commentContentPreview;

    @Schema(description = "댓글이 달린 원본 게시글 ID (댓글인 경우)", example = "205")
    private Integer originalPostId;

    @Schema(description = "댓글이 달린 원본 게시글 제목 (댓글인 경우, 선택적)", example = "자유게시판 질문입니다.")
    private String originalPostTitle;


    @Schema(description = "작성자 User ID", example = "wansu00", requiredMode = Schema.RequiredMode.REQUIRED)
    private String authorUserId;

    @Schema(description = "작성자 닉네임", example = "완수최고", requiredMode = Schema.RequiredMode.REQUIRED)
    private String authorNickname;

    @Schema(description = "항목 생성/작성 일시 (이 필드를 기준으로 정렬)", example = "2025-05-26T10:00:00", requiredMode = Schema.RequiredMode.REQUIRED)
    private LocalDateTime createdAt;

    @Schema(description = "좋아요 수 (게시글 또는 댓글의)", example = "10")
    private Integer likeCount;

    @Schema(description = "조회 수 (게시글인 경우)", example = "100")
    private Integer viewCount;
}