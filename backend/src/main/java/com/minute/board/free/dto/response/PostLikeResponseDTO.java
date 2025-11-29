package com.minute.board.free.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
@Schema(description = "게시글 좋아요 처리 응답 DTO")
public class PostLikeResponseDTO {

    @Schema(description = "게시글 ID", example = "1")
    private Integer postId;

    @Schema(description = "현재 게시글의 총 좋아요 수", example = "15")
    private int currentLikeCount;

    @Schema(description = "현재 요청한 사용자가 이 게시글을 좋아요 했는지 여부", example = "true")
    private boolean likedByCurrentUser;
}