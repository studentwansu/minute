package com.minute.board.free.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Schema(description = "자유게시판 게시글 생성 및 수정 요청 DTO")
public class FreeboardPostRequestDTO {

    @NotBlank(message = "제목은 필수 입력 항목입니다.")
    @Size(min = 1, max = 255, message = "제목은 1자 이상 255자 이하로 입력해주세요.")
    @Schema(description = "게시글 제목", example = "오늘 날씨가 좋네요!", requiredMode = Schema.RequiredMode.REQUIRED, minLength = 1, maxLength = 255)
    private String postTitle;

    @NotBlank(message = "내용은 필수 입력 항목입니다.")
    @Schema(description = "게시글 내용", example = "산책하기 좋은 날씨입니다. 다들 뭐하시나요?", requiredMode = Schema.RequiredMode.REQUIRED)
    private String postContent;

    public FreeboardPostRequestDTO(String postTitle, String postContent) {
        this.postTitle = postTitle;
        this.postContent = postContent;
    }
}