package com.minute.board.qna.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
@Schema(description = "관리자용 QnA 상세 조회 응답 DTO")
public class AdminQnaDetailResponseDTO {

    @Schema(description = "문의 ID", example = "101")
    private Integer inquiryId;

    @Schema(description = "문의 제목", example = "서비스 이용 중 궁금한 점")
    private String inquiryTitle;

    @Schema(description = "문의 내용", example = "이용 중 특정 기능이...")
    private String inquiryContent;

    @Schema(description = "작성자 User ID", example = "user123")
    private String authorUserId;

    @Schema(description = "작성자 닉네임", example = "궁금해요")
    private String authorNickname;

    @Schema(description = "문의 상태 (PENDING, ANSWERED)", example = "PENDING")
    private String inquiryStatus;

    @Schema(description = "문의 작성 시각")
    private LocalDateTime inquiryCreatedAt;

    @Schema(description = "문의 수정 시각")
    private LocalDateTime inquiryUpdatedAt;

    @Schema(description = "첨부파일 목록")
    private List<QnaAttachmentResponseDTO> attachments;

    @Schema(description = "답변 정보 (없을 경우 null)")
    private QnaReplyResponseDTO reply;

    @Schema(description = "해당 문의에 대한 신고 건수", example = "0")
    private long reportCount;

    @Schema(description = "현재 요청한 관리자가 이 문의를 신고했는지 여부", example = "false")
    private boolean reportedByCurrentUserAdmin;


}