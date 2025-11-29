package com.minute.board.qna.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;
import java.time.LocalDateTime;

@Getter
@Builder
@Schema(description = "QnA 첨부파일 응답 DTO")
public class QnaAttachmentResponseDTO {

    @Schema(description = "첨부파일 ID (DB상 ID)", example = "1")
    private Integer imgId;

    @Schema(description = "파일 S3 URL", example = "https://minuteproject.s3.ap-northeast-2.amazonaws.com/qna/uuid_filename.jpg")
    private String fileUrl;

    @Schema(description = "원본 파일명", example = "증빙자료.jpg")
    private String originalFilename;

    @Schema(description = "업로드된 시각")
    private LocalDateTime createdAt;

}