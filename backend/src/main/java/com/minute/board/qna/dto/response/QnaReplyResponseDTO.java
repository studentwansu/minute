package com.minute.board.qna.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;
import java.time.LocalDateTime;

@Getter
@Builder
@Schema(description = "QnA 답변 응답 DTO")
public class QnaReplyResponseDTO {

    @Schema(description = "답변 ID", example = "1")
    private Integer replyId;

    @Schema(description = "답변 내용", example = "문의주신 내용에 대해 답변드립니다...")
    private String replyContent;

    @Schema(description = "답변 작성자 닉네임 (관리자)", example = "운영팀")
    private String replierNickname;

    @Schema(description = "답변 작성 시각")
    private LocalDateTime replyCreatedAt;

    @Schema(description = "답변 수정 시각")
    private LocalDateTime replyUpdatedAt;

}