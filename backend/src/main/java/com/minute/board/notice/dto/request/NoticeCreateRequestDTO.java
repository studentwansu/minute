package com.minute.board.notice.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank; // 유효성 검사를 위해 추가
import jakarta.validation.constraints.Size;    // 유효성 검사를 위해 추가
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Schema(description = "공지사항 생성 요청 DTO")
public class NoticeCreateRequestDTO {

    @NotBlank(message = "제목은 필수 입력 항목입니다.")
    @Size(max = 255, message = "제목은 255자를 초과할 수 없습니다.")
    @Schema(description = "공지사항 제목", example = "새로운 이벤트 안내", requiredMode = Schema.RequiredMode.REQUIRED)
    private String noticeTitle;

    @NotBlank(message = "내용은 필수 입력 항목입니다.")
    @Schema(description = "공지사항 내용", example = "푸짐한 경품이 가득한 이벤트를 지금 바로 만나보세요!", requiredMode = Schema.RequiredMode.REQUIRED)
    private String noticeContent;

    @Schema(description = "중요 공지 여부 (기본값: false)", example = "false", defaultValue = "false")
    private boolean noticeIsImportant = false;

}