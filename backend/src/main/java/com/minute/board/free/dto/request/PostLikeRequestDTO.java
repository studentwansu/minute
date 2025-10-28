package com.minute.board.free.dto.request; // 실제 프로젝트 구조에 맞게 패키지 경로를 수정해주세요.

import io.swagger.v3.oas.annotations.media.Schema;
// import jakarta.validation.constraints.NotBlank; // 더 이상 필요하지 않음
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Schema(description = "게시글 좋아요 요청 DTO (인증 연동 후에는 내용이 없을 수 있습니다)")
public class PostLikeRequestDTO {

    // userId 필드가 제거되어 내용이 없는 DTO가 되었습니다.
    // 좋아요/싫어요 같은 토글(toggle) 기능은 보통 요청 본문에 추가 데이터 없이
    // 경로 변수(어떤 게시글에 대한 좋아요인지)와 인증 정보(누가 좋아요를 누르는지)만으로 처리 가능합니다.
    // 만약 API 설계상 POST 요청 시 빈 본문이라도 보내야 한다면 이 DTO를 그대로 사용하고,
    // 아니라면 컨트롤러에서 @RequestBody 어노테이션 없이 해당 API를 설계할 수도 있습니다.

}