package com.minute.board.notice.controller;

import com.minute.board.common.dto.response.PageResponseDTO;
import com.minute.board.notice.dto.request.NoticeCreateRequestDTO;
import com.minute.board.notice.dto.request.NoticeImportanceUpdateRequestDTO;
import com.minute.board.notice.dto.request.NoticeUpdateRequestDTO;
import com.minute.board.notice.dto.response.NoticeDetailResponseDTO;
import com.minute.board.notice.dto.response.NoticeListResponseDTO;
import com.minute.board.notice.service.NoticeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.Parameters;
import io.swagger.v3.oas.annotations.enums.ParameterIn;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.time.LocalDateTime;

@Tag(name = "01. 공지사항 API", description = "공지사항 관련 API 목록입니다.")
@RestController
@RequestMapping("/api/v1/notices")
@RequiredArgsConstructor
public class NoticeController {

    private final NoticeService noticeService;

    @Operation(summary = "공지사항 전체 목록 및 검색/필터 조회",
            description = "페이징, 정렬, 통합 텍스트 검색(searchKeyword), 중요도 필터(isImportant), 날짜 범위 필터(dateFrom, dateTo)와 함께 공지사항 목록을 조회합니다. 중요 공지 상단 정렬 및 최신순으로 기본 정렬됩니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "공지사항 목록 조회 성공",
                    content = @Content(schema = @Schema(implementation = PageResponseDTO.class))),
            @ApiResponse(responseCode = "400", description = "잘못된 요청 파라미터 (예: 날짜 형식 오류 또는 페이지 번호 음수)"),
            @ApiResponse(responseCode = "500", description = "서버 내부 오류")
    })
    @Parameters({
            @Parameter(name = "page", description = "요청할 페이지 번호 (0부터 시작)", in = ParameterIn.QUERY,
                    schema = @Schema(type = "integer", defaultValue = "0")),
            @Parameter(name = "size", description = "페이지 당 공지사항 수", in = ParameterIn.QUERY,
                    schema = @Schema(type = "integer", defaultValue = "10")),
            @Parameter(name = "sort", description = "정렬 기준 (예: 'noticeIsImportant,desc' 또는 'noticeCreatedAt,asc'). " +
                    "여러 정렬 기준을 함께 사용할 수 있습니다 (예: 'noticeIsImportant,desc&sort=noticeCreatedAt,desc'). " +
                    "기본값: 중요도 내림차순, 작성일 내림차순.",
                    in = ParameterIn.QUERY, allowEmptyValue = true,
                    schema = @Schema(type = "array", implementation = String.class, example = "[\"noticeIsImportant,desc\", \"noticeCreatedAt,desc\"]")),
            @Parameter(name = "searchKeyword", description = "통합 검색어 (제목, 내용, 작성자ID/닉네임 대상)",
                    in = ParameterIn.QUERY, required = false, schema = @Schema(type = "string", example = "중요 안내")),
            @Parameter(name = "isImportant", description = "중요 공지 필터 (true 또는 false)",
                    in = ParameterIn.QUERY, required = false, schema = @Schema(type = "boolean", example = "true")),
            @Parameter(name = "dateFrom", description = "검색 시작일 (작성일 기준, ISO 8601 형식: yyyy-MM-ddTHH:mm:ss)",
                    in = ParameterIn.QUERY, required = false, schema = @Schema(type = "string", format = "date-time", example = "2025-05-01T00:00:00")),
            @Parameter(name = "dateTo", description = "검색 종료일 (작성일 기준, ISO 8601 형식: yyyy-MM-ddTHH:mm:ss)",
                    in = ParameterIn.QUERY, required = false, schema = @Schema(type = "string", format = "date-time", example = "2025-05-23T23:59:59"))
    })
    @GetMapping
    public ResponseEntity<PageResponseDTO<NoticeListResponseDTO>> getNoticeList(
            @PageableDefault(
                    size = 10,
                    sort = {"noticeIsImportant", "noticeCreatedAt"},
                    direction = Sort.Direction.DESC
            ) Pageable pageable,
            @RequestParam(name = "searchKeyword", required = false) String searchKeyword,
            @RequestParam(name = "isImportant", required = false) Boolean isImportant,
            @RequestParam(name = "dateFrom", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dateFrom,
            @RequestParam(name = "dateTo", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dateTo
    ) {

        PageResponseDTO<NoticeListResponseDTO> response = noticeService.getNoticeList(
                pageable, searchKeyword, isImportant, dateFrom, dateTo
        );
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "공지사항 상세 조회",
            description = "특정 ID의 공지사항 상세 정보를 조회합니다. 조회 시 해당 공지사항의 조회수가 1 증가합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "공지사항 상세 조회 성공",
                    content = @Content(schema = @Schema(implementation = NoticeDetailResponseDTO.class))),
            @ApiResponse(responseCode = "404", description = "요청한 ID에 해당하는 공지사항을 찾을 수 없음 (GlobalExceptionHandler 처리)",
                    content = @Content(schema = @Schema(example = "{\"status\":\"error\",\"message\":\"해당 ID의 공지사항을 찾을 수 없습니다: 999\"}"))),
            @ApiResponse(responseCode = "500", description = "서버 내부 오류")
    })
    @GetMapping("/{noticeId}")
    public ResponseEntity<NoticeDetailResponseDTO> getNoticeDetail(
            @Parameter(name = "noticeId", description = "조회할 공지사항의 ID", required = true, example = "1", in = ParameterIn.PATH)
            @PathVariable Integer noticeId) {
        NoticeDetailResponseDTO response = noticeService.getNoticeDetail(noticeId);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "새 공지사항 작성 (관리자 권한 필요)",
            description = "새로운 공지사항을 등록합니다. 이 API는 'ADMIN' 역할을 가진 사용자만 호출할 수 있습니다.",
            security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "공지사항 생성 성공",
                    content = @Content(schema = @Schema(implementation = NoticeDetailResponseDTO.class))),
            @ApiResponse(responseCode = "400", description = "잘못된 요청 데이터 (유효성 검사 실패)"),
            @ApiResponse(responseCode = "401", description = "인증 실패 (토큰 누락 또는 유효하지 않은 토큰)"),
            @ApiResponse(responseCode = "403", description = "접근 권한 없음 (ADMIN 역할이 아님)"),
            @ApiResponse(responseCode = "404", description = "작성자 정보를 찾을 수 없음"),
            @ApiResponse(responseCode = "500", description = "서버 내부 오류")
    })
    @PostMapping
    public ResponseEntity<NoticeDetailResponseDTO> createNotice(
            @Valid @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    description = "생성할 공지사항의 정보",
                    required = true,
                    content = @Content(schema = @Schema(implementation = NoticeCreateRequestDTO.class))
            )
            @RequestBody NoticeCreateRequestDTO requestDto,
            Authentication authentication) {

        String authenticatedUserId = authentication.getName();

        NoticeDetailResponseDTO createdNotice = noticeService.createNotice(requestDto, authenticatedUserId);

        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(createdNotice.getNoticeId())
                .toUri();

        return ResponseEntity.created(location).body(createdNotice);
    }

    @Operation(summary = "공지사항 수정 (관리자 권한 필요)",
            description = "기존 공지사항의 내용을 수정합니다. 이 API는 'ADMIN' 역할을 가진 사용자만 호출할 수 있습니다. DTO의 필드는 선택 사항이며, 제공된 필드만 업데이트됩니다.",
            security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "공지사항 수정 성공",
                    content = @Content(schema = @Schema(implementation = NoticeDetailResponseDTO.class))),
            @ApiResponse(responseCode = "400", description = "잘못된 요청 데이터 (유효성 검사 실패)"),
            @ApiResponse(responseCode = "401", description = "인증 실패 (토큰 누락 또는 유효하지 않은 토큰)"),
            @ApiResponse(responseCode = "403", description = "접근 권한 없음 (ADMIN 역할이 아님 또는 해당 공지 수정 권한 없음)"),
            @ApiResponse(responseCode = "404", description = "수정할 공지사항 또는 작성자 정보를 찾을 수 없음"),
            @ApiResponse(responseCode = "500", description = "서버 내부 오류")
    })
    @PutMapping("/{noticeId}")
    public ResponseEntity<NoticeDetailResponseDTO> updateNotice(
            @Parameter(name = "noticeId", description = "수정할 공지사항의 ID", required = true, example = "1", in = ParameterIn.PATH)
            @PathVariable Integer noticeId,
            @Valid
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    description = "수정할 공지사항의 정보. 모든 필드는 선택적입니다.",
                    required = true,
                    content = @Content(schema = @Schema(implementation = NoticeUpdateRequestDTO.class))
            )
            @RequestBody NoticeUpdateRequestDTO requestDto,
            Authentication authentication) {

        String authenticatedUserId = authentication.getName();
        NoticeDetailResponseDTO updatedNotice = noticeService.updateNotice(noticeId, requestDto, authenticatedUserId);
        return ResponseEntity.ok(updatedNotice);
    }

    @Operation(summary = "공지사항 삭제 (관리자 권한 필요)",
            description = "특정 ID의 공지사항을 삭제합니다. 이 API는 'ADMIN' 역할을 가진 사용자만 호출할 수 있습니다.",
            security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "공지사항 삭제 성공 (No Content)"),
            @ApiResponse(responseCode = "401", description = "인증 실패 (토큰 누락 또는 유효하지 않은 토큰)"),
            @ApiResponse(responseCode = "403", description = "접근 권한 없음 (ADMIN 역할이 아님 또는 해당 공지 삭제 권한 없음)"),
            @ApiResponse(responseCode = "404", description = "삭제할 공지사항을 찾을 수 없음"),
            @ApiResponse(responseCode = "500", description = "서버 내부 오류")
    })
    @DeleteMapping("/{noticeId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public ResponseEntity<Void> deleteNotice(
            @Parameter(name = "noticeId", description = "삭제할 공지사항의 ID", required = true, example = "1", in = ParameterIn.PATH)
            @PathVariable Integer noticeId,
            Authentication authentication) {

        String authenticatedUserId = authentication.getName();
        noticeService.deleteNotice(noticeId, authenticatedUserId);

        return ResponseEntity.noContent().build();
    }


    @Operation(summary = "공지사항 중요도 변경 (관리자 권한 필요)",
            description = "특정 공지사항의 중요도(isImportant) 상태를 변경합니다. 이 API는 'ADMIN' 역할을 가진 사용자만 호출할 수 있습니다.",
            security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "중요도 변경 성공",
                    content = @Content(schema = @Schema(implementation = NoticeDetailResponseDTO.class))),
            @ApiResponse(responseCode = "400", description = "잘못된 요청 데이터 (예: noticeIsImportant 필드 누락 또는 null)"),
            @ApiResponse(responseCode = "401", description = "인증 실패"),
            @ApiResponse(responseCode = "403", description = "접근 권한 없음"),
            @ApiResponse(responseCode = "404", description = "해당 공지사항을 찾을 수 없음"),
            @ApiResponse(responseCode = "500", description = "서버 내부 오류")
    })
    @PatchMapping("/{noticeId}/importance")
    public ResponseEntity<NoticeDetailResponseDTO> updateNoticeImportance(
            @Parameter(name = "noticeId", description = "중요도를 변경할 공지사항의 ID", required = true, example = "1", in = ParameterIn.PATH)
            @PathVariable Integer noticeId,
            @Valid
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    description = "새로운 중요도 상태",
                    required = true,
                    content = @Content(schema = @Schema(implementation = NoticeImportanceUpdateRequestDTO.class))
            )
            @RequestBody NoticeImportanceUpdateRequestDTO requestDto,
            Authentication authentication) {

        String authenticatedUserId = authentication.getName();
        NoticeDetailResponseDTO updatedNotice = noticeService.updateNoticeImportance(noticeId, requestDto, authenticatedUserId);
        return ResponseEntity.ok(updatedNotice);
    }

}