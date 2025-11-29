package com.minute.board.free.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Schema(description = "댓글 신고 요청 DTO (인증 연동 후에는 내용이 없을 수 있습니다)")
public class CommentReportRequestDTO {


}