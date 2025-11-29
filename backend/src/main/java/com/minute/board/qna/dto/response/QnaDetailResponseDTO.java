package com.minute.board.qna.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
@Schema(description = "사용자용 QnA 상세 조회 응답 DTO")
public class QnaDetailResponseDTO {

    @Schema(description = "문의 ID", example = "101")
    private Integer inquiryId;

    @Schema(description = "문의 제목", example = "결제 관련 문의입니다.")
    private String inquiryTitle;

    @Schema(description = "문의 내용", example = "안녕하세요, 결제 시 오류가 발생하여 문의드립니다...")
    private String inquiryContent;

    @Schema(description = "작성자 닉네임", example = "행복한쿼카")
    private String authorNickname;

    @Schema(description = "문의 상태 (PENDING, ANSWERED)", example = "ANSWERED")
    private String inquiryStatus;

    @Schema(description = "문의 작성 시각")
    private LocalDateTime inquiryCreatedAt;

    @Schema(description = "문의 수정 시각")
    private LocalDateTime inquiryUpdatedAt;

    @Schema(description = "첨부파일 목록")
    private List<QnaAttachmentResponseDTO> attachments;

    @Schema(description = "답변 정보 (없을 경우 null)")
    private QnaReplyResponseDTO reply;

}