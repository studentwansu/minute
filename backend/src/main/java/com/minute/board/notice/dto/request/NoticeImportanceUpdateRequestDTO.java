package com.minute.board.notice.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Schema(description = "공지사항 중요도 변경 요청 DTO")
public class NoticeImportanceUpdateRequestDTO {

    @NotNull(message = "중요도 값은 필수입니다.")
    @Schema(description = "새로운 중요 공지 여부 (true 또는 false)", example = "true", requiredMode = Schema.RequiredMode.REQUIRED)
    private Boolean noticeIsImportant;
}