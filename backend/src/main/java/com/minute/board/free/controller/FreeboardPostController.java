package com.minute.board.free.controller;

import com.minute.auth.service.DetailUser;
import com.minute.board.common.dto.response.PageResponseDTO;
import com.minute.board.common.dto.response.ReportSuccessResponseDTO;
import com.minute.board.free.dto.request.*;
import com.minute.board.free.dto.response.*;
import com.minute.board.free.service.FreeboardCommentService;
import com.minute.board.free.service.FreeboardPostService;
import com.minute.board.free.service.admin.AdminReportViewService;
import io.micrometer.common.lang.Nullable;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.time.LocalDate;

@Tag(name = "01. 자유게시판 API", description = "자유게시판 게시글 관련 API입니다.")
@RestController
@RequestMapping("/api/v1/board/free")
@RequiredArgsConstructor
public class FreeboardPostController {

    private final FreeboardPostService freeboardPostService;
    private final FreeboardCommentService freeboardCommentService;
    private final AdminReportViewService adminReportViewService;

    @Operation(summary = "자유게시판 게시글 목록 조회", description = "페이징 처리된 자유게시판 게시글 목록을 조회합니다.")
    @GetMapping
    public ResponseEntity<PageResponseDTO<FreeboardPostSimpleResponseDTO>> getAllPosts(
            @PageableDefault(size = 10, sort = "postId", direction = Sort.Direction.DESC) Pageable pageable,
            @RequestParam(required = false) @Nullable String authorUserId,
            @RequestParam(required = false) @Nullable String searchKeyword,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) @Nullable LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) @Nullable LocalDate endDate) {
        PageResponseDTO<FreeboardPostSimpleResponseDTO> response = freeboardPostService.getAllPosts(pageable, authorUserId, searchKeyword, startDate, endDate);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "자유게시판 게시글 상세 조회", description = "특정 ID의 게시글 상세 정보를 조회하고, 조회수를 1 증가시킵니다.")
    @GetMapping("/{postId}")
    public ResponseEntity<FreeboardPostResponseDTO> getPostById(@PathVariable Integer postId) {
        FreeboardPostResponseDTO responseDto = freeboardPostService.getPostById(postId);
        return ResponseEntity.ok(responseDto);
    }

    @Operation(summary = "자유게시판 게시글 작성", description = "새로운 자유게시판 게시글을 작성합니다. (로그인 필요)")
    @PostMapping
    public ResponseEntity<FreeboardPostResponseDTO> createPost(
            @Valid @RequestBody FreeboardPostRequestDTO requestDto,
            @AuthenticationPrincipal DetailUser principal) {

        if (principal == null || principal.getUser() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        String currentUserId = principal.getUser().getUserId();

        FreeboardPostResponseDTO responseDto = freeboardPostService.createPost(requestDto, currentUserId);

        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(responseDto.getPostId())
                .toUri();
        return ResponseEntity.created(location).body(responseDto);
    }

    @Operation(summary = "자유게시판 게시글 수정", description = "기존 자유게시판 게시글을 수정합니다. (로그인 필요, 본인 글만)")
    @PutMapping("/{postId}")
    public ResponseEntity<FreeboardPostResponseDTO> updatePost(
            @PathVariable Integer postId,
            @Valid @RequestBody FreeboardPostRequestDTO requestDto,
            @AuthenticationPrincipal DetailUser principal) {

        if (principal == null || principal.getUser() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        String currentUserId = principal.getUser().getUserId();

        FreeboardPostResponseDTO responseDto = freeboardPostService.updatePost(postId, requestDto, currentUserId);
        return ResponseEntity.ok(responseDto);
    }

    @Operation(summary = "자유게시판 게시글 삭제", description = "특정 ID의 게시글을 삭제합니다. (로그인 필요, 본인 글만 또는 관리자)")
    @DeleteMapping("/{postId}")
    public ResponseEntity<Void> deletePost(
            @PathVariable Integer postId,
            @AuthenticationPrincipal DetailUser principal) {

        if (principal == null || principal.getUser() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        String currentUserId = principal.getUser().getUserId();

        freeboardPostService.deletePost(postId, currentUserId );
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "특정 게시글의 댓글 목록 조회", description = "페이징 처리된 댓글 목록을 조회합니다.")
    @GetMapping("/{postId}/comments")
    public ResponseEntity<PageResponseDTO<FreeboardCommentResponseDTO>> getCommentsByPostId(
            @PathVariable Integer postId,
            @PageableDefault(size = 5, sort = "commentCreatedAt", direction = Sort.Direction.ASC) Pageable pageable) {
        PageResponseDTO<FreeboardCommentResponseDTO> response = freeboardCommentService.getCommentsByPostId(postId, pageable);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "특정 게시글에 댓글 작성", description = "새로운 댓글을 작성합니다. (로그인 필요)")
    @PostMapping("/{postId}/comments")
    public ResponseEntity<FreeboardCommentResponseDTO> createComment(
            @PathVariable Integer postId,
            @Valid @RequestBody FreeboardCommentRequestDTO requestDto,
            @AuthenticationPrincipal DetailUser principal) {

        if (principal == null || principal.getUser() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        String currentUserId = principal.getUser().getUserId();

        FreeboardCommentResponseDTO responseDto = freeboardCommentService.createComment(postId, requestDto, currentUserId);

        URI location = ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/api/v1/board/free/{postId}/comments")
                .queryParam("commentId", responseDto.getCommentId())
                .buildAndExpand(postId)
                .toUri();
        return ResponseEntity.created(location).body(responseDto);
    }

    @Operation(summary = "댓글 수정", description = "기존 댓글의 내용을 수정합니다. (로그인 필요, 본인 댓글만)")
    @PutMapping("/comments/{commentId}")
    public ResponseEntity<FreeboardCommentResponseDTO> updateComment(
            @PathVariable Integer commentId,
            @Valid @RequestBody FreeboardCommentRequestDTO requestDto,
            @AuthenticationPrincipal DetailUser principal) {

        if (principal == null || principal.getUser() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        String currentUserId = principal.getUser().getUserId();

        FreeboardCommentResponseDTO responseDto = freeboardCommentService.updateComment(commentId, requestDto, currentUserId);
        return ResponseEntity.ok(responseDto);
    }

    @Operation(summary = "댓글 삭제", description = "특정 ID의 댓글을 삭제합니다. (로그인 필요, 본인 댓글만 또는 관리자)")
    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(
            @PathVariable Integer commentId,
            @AuthenticationPrincipal DetailUser principal) {

        if (principal == null || principal.getUser() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        String currentUserId = principal.getUser().getUserId();

        freeboardCommentService.deleteComment(commentId, currentUserId );
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "게시글 좋아요 토글", description = "특정 게시글에 대한 사용자의 좋아요 상태를 추가하거나 삭제(토글)합니다. (로그인 필요)")
    @PostMapping("/{postId}/like")
    public ResponseEntity<PostLikeResponseDTO> togglePostLike(
            @PathVariable Integer postId,
            @AuthenticationPrincipal DetailUser principal) {

        if (principal == null || principal.getUser() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        String currentUserId = principal.getUser().getUserId();

        PostLikeResponseDTO responseDto = freeboardPostService.togglePostLike(postId, currentUserId);
        return ResponseEntity.ok(responseDto);
    }

    @Operation(summary = "댓글 좋아요 토글", description = "특정 댓글에 대한 사용자의 좋아요 상태를 추가하거나 삭제(토글)합니다. (로그인 필요)")
    @PostMapping("/comments/{commentId}/like")
    public ResponseEntity<CommentLikeResponseDTO> toggleCommentLike(
            @PathVariable Integer commentId,
            @AuthenticationPrincipal DetailUser principal) {

        if (principal == null || principal.getUser() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        String currentUserId = principal.getUser().getUserId();

        CommentLikeResponseDTO responseDto = freeboardCommentService.toggleCommentLike(commentId, currentUserId);
        return ResponseEntity.ok(responseDto);
    }

    @Operation(summary = "게시글 신고", description = "특정 게시글을 신고합니다. (로그인 필요)")
    @PostMapping("/{postId}/report")
    public ResponseEntity<ReportSuccessResponseDTO> reportPost(
            @PathVariable Integer postId,
            @AuthenticationPrincipal DetailUser principal) {

        if (principal == null || principal.getUser() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        String currentUserId = principal.getUser().getUserId();

        ReportSuccessResponseDTO responseDto = freeboardPostService.reportPost(postId, currentUserId);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest().build().toUri();
        return ResponseEntity.created(location).body(responseDto);
    }

    @Operation(summary = "댓글 신고", description = "특정 댓글을 신고합니다. (로그인 필요)")
    @PostMapping("/comments/{commentId}/report")
    public ResponseEntity<ReportSuccessResponseDTO> reportComment(
            @PathVariable Integer commentId,
            @AuthenticationPrincipal DetailUser principal) {

        if (principal == null || principal.getUser() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        String currentUserId = principal.getUser().getUserId();

        ReportSuccessResponseDTO responseDto = freeboardCommentService.reportComment(commentId, currentUserId);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest().build().toUri();
        return ResponseEntity.created(location).body(responseDto);
    }

    @Operation(summary = "내 자유게시판 활동 목록 조회 (통합)", description = "현재 사용자가 작성한 게시글 및 댓글 전체를 최신순으로 페이징하여 조회합니다. (로그인 필요)")
    @GetMapping("/activity/my")
    public ResponseEntity<PageResponseDTO<FreeboardUserActivityItemDTO>> getMyFreeboardActivity(
            @AuthenticationPrincipal DetailUser principal,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        if (principal == null || principal.getUser() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        String currentUserId = principal.getUser().getUserId();

        PageResponseDTO<FreeboardUserActivityItemDTO> response = freeboardPostService.getUserFreeboardActivity(currentUserId, pageable);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "내가 쓴 댓글 목록 조회", description = "특정 사용자가 작성한 댓글 목록을 페이징하여 조회합니다. (로그인 필요 시 본인 댓글)")
    @GetMapping("/comments/by-user")
    public ResponseEntity<PageResponseDTO<FreeboardCommentResponseDTO>> getCommentsByAuthor(
            @AuthenticationPrincipal DetailUser principal,
            @ModelAttribute AdminMyCommentFilterDTO filter,
            @PageableDefault(size = 10, sort = "commentCreatedAt", direction = Sort.Direction.DESC) Pageable pageable) {

        if (principal == null || principal.getUser() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        String currentUserId = principal.getUser().getUserId();

        PageResponseDTO<FreeboardCommentResponseDTO> response = freeboardCommentService.getCommentsByAuthor(currentUserId, filter, pageable);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "[관리자] 신고된 게시글 목록 조회", description = "신고된 게시글 목록을 조회합니다. (관리자용)")
    @GetMapping("/reports/posts")
    public ResponseEntity<PageResponseDTO<ReportedPostEntryDTO>> getReportedPosts(
            @ModelAttribute AdminReportedPostFilterDTO filter,
            @PageableDefault(size = 10) Pageable pageable
            ) {
        PageResponseDTO<ReportedPostEntryDTO> response = freeboardPostService.getReportedPosts(filter, pageable);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "[관리자] 신고된 댓글 목록 조회", description = "신고된 댓글 목록을 조회합니다. (관리자용)")
    @GetMapping("/reports/comments")
    public ResponseEntity<PageResponseDTO<AdminReportedCommentEntryDTO>> getReportedComments(
            @ModelAttribute AdminReportedCommentFilterDTO filter,
            @PageableDefault(size = 10) Pageable pageable
            ) {
        PageResponseDTO<AdminReportedCommentEntryDTO> response = freeboardCommentService.getReportedComments(filter, pageable);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "[관리자] 게시글 숨김/공개 처리", description = "특정 게시글의 숨김 또는 공개 상태를 변경합니다. (관리자용)")
    @PatchMapping("/posts/{postId}/visibility")
    public ResponseEntity<FreeboardPostResponseDTO> updatePostVisibility(
            @PathVariable Integer postId,
            @Valid @RequestBody PostVisibilityRequestDTO requestDto
            ) {
        FreeboardPostResponseDTO responseDto = freeboardPostService.updatePostVisibility(postId, requestDto);
        return ResponseEntity.ok(responseDto);
    }

    @Operation(summary = "[관리자] 댓글 숨김/공개 처리", description = "특정 댓글의 숨김 또는 공개 상태를 변경합니다. (관리자용)")
    @PatchMapping("/comments/{commentId}/visibility")
    public ResponseEntity<FreeboardCommentResponseDTO> updateCommentVisibility(
            @PathVariable Integer commentId,
            @Valid @RequestBody CommentVisibilityRequestDTO requestDto
            ) {
        FreeboardCommentResponseDTO responseDto = freeboardCommentService.updateCommentVisibility(commentId, requestDto);
        return ResponseEntity.ok(responseDto);
    }

    @Operation(summary = "[관리자] 전체 신고된 활동 목록 조회 (통합)", description = "신고된 모든 게시글 및 댓글 활동을 조회합니다. (관리자용)")
    @GetMapping("/admin/reports/all")
    public ResponseEntity<PageResponseDTO<AdminReportedActivityItemDTO>> getAllReportedActivities(
            @ModelAttribute AdminReportFilterDTO filter,
            @PageableDefault(size = 10, sort = "reportCreatedAt", direction = Sort.Direction.DESC) Pageable pageable
            ) {
        PageResponseDTO<AdminReportedActivityItemDTO> response = adminReportViewService.getAllReportedActivities(filter, pageable);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "특정 댓글의 페이지 번호 조회", description = "댓글 ID를 통해 해당 댓글이 목록의 몇 번째 페이지에 위치하는지 조회합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "페이지 번호 조회 성공", content = @Content(schema = @Schema(implementation = CommentPageResponseDTO.class))),
            @ApiResponse(responseCode = "404", description = "해당 댓글을 찾을 수 없음", content = @Content)
    })
    @GetMapping("/comments/page")
    public ResponseEntity<CommentPageResponseDTO> getCommentPage(
            @Parameter(description = "페이지를 조회할 댓글의 ID", required = true) @RequestParam("commentId") Integer commentId,
            @Parameter(description = "한 페이지당 댓글 수 (프론트엔드와 동일한 값이어야 함)") @RequestParam(value = "size", defaultValue = "5") int size) {

        int pageNumber = freeboardCommentService.getCommentPageNumber(commentId, size);
        CommentPageResponseDTO response = new CommentPageResponseDTO(pageNumber);

        return ResponseEntity.ok(response);
    }
}