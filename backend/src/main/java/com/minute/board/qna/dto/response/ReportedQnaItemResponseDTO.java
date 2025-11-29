package com.minute.board.qna.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;
import java.time.LocalDateTime;

@Getter
@Builder
@Schema(description = "관리자용 신고된 QnA 목록 아이템 응답 DTO")
public class ReportedQnaItemResponseDTO {

    @Schema(description = "신고 대상 QnA ID (inquiryId)", example = "101")
    private Integer id;

    @Schema(description = "항목 타입 (항상 'QNA' 또는 'INQUIRY')", example = "QNA")
    private String itemType;
    @Schema(description = "QnA 작성자 User ID", example = "user123")
    private String authorId;

    @Schema(description = "QnA 작성자 닉네임", example = "궁금해요")
    private String authorNickname;

    @Schema(description = "QnA 제목", example = "이용 중 특정 기능 문의")
    private String titleOrContentSnippet;

    @Schema(description = "QnA 작성일")
    private LocalDateTime originalPostDate;
    @Schema(description = "해당 QnA에 대한 (관리자) 누적 신고 건수", example = "1")
    private long reportCount;
}