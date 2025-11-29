package com.minute.board.free.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Schema(description = "자유게시판 댓글 생성 및 수정 요청 DTO")
public class FreeboardCommentRequestDTO {


    @NotBlank(message = "댓글 내용은 필수 입력 항목입니다.")
    @Schema(description = "댓글 내용", example = "정말 유용한 정보 감사합니다!", requiredMode = Schema.RequiredMode.REQUIRED)
    private String commentContent;

    public FreeboardCommentRequestDTO(String commentContent) {
        this.commentContent = commentContent;
    }
}