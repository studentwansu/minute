package com.minute.board.free.service;

import com.minute.auth.service.DetailUser;
import com.minute.board.common.dto.response.PageResponseDTO;
import com.minute.board.common.dto.response.ReportSuccessResponseDTO;
import com.minute.board.free.dto.request.*;
import com.minute.board.free.dto.response.AdminReportedCommentEntryDTO;
import com.minute.board.free.dto.response.CommentLikeResponseDTO;
import com.minute.board.free.dto.response.FreeboardCommentResponseDTO;
import com.minute.board.free.entity.FreeboardComment;
import com.minute.board.free.entity.FreeboardCommentLike;
import com.minute.board.free.entity.FreeboardCommentReport;
import com.minute.board.free.entity.FreeboardPost;
import com.minute.board.free.repository.FreeboardCommentLikeRepository;
import com.minute.board.free.repository.FreeboardCommentReportRepository;
import com.minute.board.free.repository.FreeboardCommentRepository;
import com.minute.board.free.repository.FreeboardPostRepository;
import com.minute.board.free.repository.specification.FreeboardCommentSpecification;
import com.minute.user.entity.User;
import com.minute.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.lang.Nullable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j // <<< @Slf4j 어노테이션 추가
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FreeboardCommentServiceImpl implements FreeboardCommentService {

    private final FreeboardCommentRepository freeboardCommentRepository;
    private final FreeboardPostRepository freeboardPostRepository;
    private final UserRepository userRepository;
    private final FreeboardCommentLikeRepository freeboardCommentLikeRepository;
    private final FreeboardCommentReportRepository freeboardCommentReportRepository;

    private String getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated() &&
                !(authentication.getPrincipal() instanceof String &&
                        authentication.getPrincipal().equals("anonymousUser"))) {
            Object principal = authentication.getPrincipal();
            if (principal instanceof DetailUser) {
                DetailUser detailUser = (DetailUser) principal;
                if (detailUser.getUser() != null) {
                    return detailUser.getUser().getUserId();
                }
            }
        }
        return null;
    }

    private User getCurrentUserEntity() {
        String currentUserId = getCurrentUserId();
        if (currentUserId != null) {
            return userRepository.findUserByUserId(currentUserId).orElse(null);
        }
        return null;
    }

    @Override
    public PageResponseDTO<FreeboardCommentResponseDTO> getCommentsByPostId(Integer postId, Pageable pageable) {
        Page<FreeboardComment> commentPage = freeboardCommentRepository.findByFreeboardPost_PostId(postId, pageable);
        List<FreeboardComment> comments = commentPage.getContent();

        Set<Integer> likedCommentIds = Collections.emptySet();
        Set<Integer> reportedCommentIds = Collections.emptySet();
        String currentUserId = getCurrentUserId();

        log.debug("[getCommentsByPostId] Fetching comments for postId: {}", postId);
        log.debug("[getCommentsByPostId] Current logged in user ID: {}", currentUserId != null ? currentUserId : "null (guest)");
        log.debug("[getCommentsByPostId] Number of comments fetched from DB: {}", comments.size());

        if (currentUserId != null && !comments.isEmpty()) {
            List<Integer> commentIds = comments.stream().map(FreeboardComment::getCommentId).collect(Collectors.toList());
            log.debug("[getCommentsByPostId] Passing comment IDs to like/report repo: {}", commentIds);

            likedCommentIds = freeboardCommentLikeRepository.findLikedCommentIdsByUserIdAndCommentIdsIn(currentUserId, commentIds);
            log.debug("[getCommentsByPostId] Fetched likedCommentIds from repository: {}", likedCommentIds);

            reportedCommentIds = freeboardCommentReportRepository.findReportedCommentIdsByUserIdAndCommentIdsIn(currentUserId, commentIds);
            log.debug("[getCommentsByPostId] Fetched reportedCommentIds from repository: {}", reportedCommentIds);
        }

        final Set<Integer> finalLikedCommentIds = likedCommentIds;
        final Set<Integer> finalReportedCommentIds = reportedCommentIds;

        List<FreeboardCommentResponseDTO> dtoList = comments.stream()
                .map(comment -> {
                    boolean isLiked = finalLikedCommentIds.contains(comment.getCommentId());
                    boolean isReported = finalReportedCommentIds.contains(comment.getCommentId());
                    log.debug("[getCommentsByPostId] Comment ID: {}, isLiked (final in DTO): {}, isReported (final in DTO): {}", comment.getCommentId(), isLiked, isReported);
                    return convertToDto(comment, finalLikedCommentIds, finalReportedCommentIds);
                })
                .collect(Collectors.toList());

        return PageResponseDTO.<FreeboardCommentResponseDTO>builder()
                .content(dtoList)
                .currentPage(commentPage.getNumber() + 1)
                .totalPages(commentPage.getTotalPages())
                .totalElements(commentPage.getTotalElements())
                .size(commentPage.getSize())
                .first(commentPage.isFirst())
                .last(commentPage.isLast())
                .empty(commentPage.isEmpty())
                .build();
    }

    @Override
    @Transactional
    public FreeboardCommentResponseDTO createComment(Integer postId, FreeboardCommentRequestDTO requestDto, String currentUserIdFromController) {
        FreeboardPost targetPost = freeboardPostRepository.findById(postId)
                .orElseThrow(() -> new EntityNotFoundException("댓글을 작성할 게시글을 찾을 수 없습니다: " + postId));

        User author = userRepository.findUserByUserId(currentUserIdFromController)
                .orElseThrow(() -> new EntityNotFoundException("댓글 작성자 정보를 찾을 수 없습니다: " + currentUserIdFromController));

        FreeboardComment newComment = FreeboardComment.builder()
                .commentContent(requestDto.getCommentContent())
                .user(author)
                .freeboardPost(targetPost)
                .build();

        FreeboardComment savedComment = freeboardCommentRepository.save(newComment);
        return convertToDto(savedComment, Collections.emptySet(), Collections.emptySet());
    }

    @Override
    @Transactional
    public FreeboardCommentResponseDTO updateComment(Integer commentId, FreeboardCommentRequestDTO requestDto, String currentUserIdFromController) {
        FreeboardComment commentToUpdate = freeboardCommentRepository.findById(commentId)
                .orElseThrow(() -> new EntityNotFoundException("수정할 댓글을 찾을 수 없습니다: " + commentId));

        if (!commentToUpdate.getUser().getUserId().equals(currentUserIdFromController)) {
            throw new AccessDeniedException("댓글 수정 권한이 없습니다.");
        }

        commentToUpdate.setCommentContent(requestDto.getCommentContent());

        boolean isLiked = false;
        boolean isReported = false;
        User currentUser = getCurrentUserEntity();
        if (currentUser != null && currentUser.getUserId().equals(currentUserIdFromController)) {
            isLiked = freeboardCommentLikeRepository.findByUserAndFreeboardComment(currentUser, commentToUpdate).isPresent();
            log.debug("[updateComment] Individual like check for comment {}: {}", commentId, isLiked);
            isReported = freeboardCommentReportRepository.existsByUserAndFreeboardComment(currentUser, commentToUpdate);
        }
        Set<Integer> likedIds = isLiked ? Set.of(commentId) : Collections.emptySet();
        Set<Integer> reportedIds = isReported ? Set.of(commentId) : Collections.emptySet();

        return convertToDto(commentToUpdate, likedIds, reportedIds);
    }

    @Override
    @Transactional
    public void deleteComment(Integer commentId, String currentUserIdFromController) {
        FreeboardComment commentToDelete = freeboardCommentRepository.findById(commentId)
                .orElseThrow(() -> new EntityNotFoundException("삭제할 댓글을 찾을 수 없습니다: " + commentId));

        if (!commentToDelete.getUser().getUserId().equals(currentUserIdFromController)) {
            throw new AccessDeniedException("댓글 삭제 권한이 없습니다.");
        }

        freeboardCommentRepository.delete(commentToDelete);
    }

    @Override
    @Transactional
    public CommentLikeResponseDTO toggleCommentLike(Integer commentId, String currentUserIdFromController) {
        FreeboardComment comment = freeboardCommentRepository.findById(commentId)
                .orElseThrow(() -> new EntityNotFoundException("좋아요를 누를 댓글을 찾을 수 없습니다: " + commentId));

        User user = userRepository.findUserByUserId(currentUserIdFromController)
                .orElseThrow(() -> new EntityNotFoundException("사용자 정보를 찾을 수 없습니다: " + currentUserIdFromController));

        Optional<FreeboardCommentLike> existingLike = freeboardCommentLikeRepository.findByUserAndFreeboardComment(user, comment);
        boolean likedByCurrentUser;

        if (existingLike.isPresent()) {
            freeboardCommentLikeRepository.delete(existingLike.get());
            comment.setCommentLikeCount(Math.max(0, comment.getCommentLikeCount() - 1));
            likedByCurrentUser = false;
        } else {
            FreeboardCommentLike newLike = FreeboardCommentLike.builder()
                    .user(user)
                    .freeboardComment(comment)
                    .build();
            freeboardCommentLikeRepository.save(newLike);
            comment.setCommentLikeCount(comment.getCommentLikeCount() + 1);
            likedByCurrentUser = true;
        }
        freeboardCommentRepository.save(comment);

        return CommentLikeResponseDTO.builder()
                .commentId(comment.getCommentId())
                .currentLikeCount(comment.getCommentLikeCount())
                .likedByCurrentUser(likedByCurrentUser)
                .build();
    }

    @Override
    @Transactional
    public ReportSuccessResponseDTO reportComment(Integer commentId, String currentUserIdFromController) {
        FreeboardComment commentToReport = freeboardCommentRepository.findById(commentId)
                .orElseThrow(() -> new EntityNotFoundException("신고할 댓글을 찾을 수 없습니다: " + commentId));

        User reporter = userRepository.findUserByUserId(currentUserIdFromController)
                .orElseThrow(() -> new EntityNotFoundException("신고자 정보를 찾을 수 없습니다: " + currentUserIdFromController));

        if (commentToReport.getUser().getUserId().equals(reporter.getUserId())) {
            throw new IllegalStateException("자신의 댓글은 신고할 수 없습니다.");
        }
        boolean alreadyReported = freeboardCommentReportRepository.existsByUserAndFreeboardComment(reporter, commentToReport);
        if (alreadyReported) {
            throw new IllegalStateException("이미 신고한 댓글입니다.");
        }

        FreeboardCommentReport newReport = FreeboardCommentReport.builder()
                .user(reporter)
                .freeboardComment(commentToReport)
                .build();
        freeboardCommentReportRepository.save(newReport);

        User reportedUser = commentToReport.getUser();
        reportedUser.setUserReport(reportedUser.getUserReport() + 1);
        userRepository.save(reportedUser);

        return new ReportSuccessResponseDTO("댓글이 성공적으로 신고되었습니다.", commentId);
    }

    @Override
    public PageResponseDTO<AdminReportedCommentEntryDTO> getReportedComments(AdminReportedCommentFilterDTO filter, Pageable pageable) {
        System.out.println("Service getReportedComments - Pageable Sort: " + pageable.getSort());
        AdminReportedCommentFilterDTO queryFilter = new AdminReportedCommentFilterDTO();
        queryFilter.setSearchKeyword(filter.getSearchKeyword());
        queryFilter.setOriginalPostId(filter.getOriginalPostId());
        queryFilter.setAuthorUserId(filter.getAuthorUserId());
        queryFilter.setAuthorNickname(filter.getAuthorNickname());
        queryFilter.setIsHidden(filter.getIsHidden());

        if (filter.getCommentCreatedAtStartDate() != null) {
            queryFilter.setQueryCommentCreatedAtStartDate(filter.getCommentCreatedAtStartDate().atStartOfDay());
        }
        if (filter.getCommentCreatedAtEndDate() != null) {
            queryFilter.setQueryCommentCreatedAtEndDate(filter.getCommentCreatedAtEndDate().plusDays(1).atStartOfDay());
        }

        Page<AdminReportedCommentEntryDTO> reportedCommentPage = freeboardCommentReportRepository.findReportedCommentSummariesWithFilters(queryFilter, pageable);

        return PageResponseDTO.<AdminReportedCommentEntryDTO>builder()
                .content(reportedCommentPage.getContent())
                .currentPage(reportedCommentPage.getNumber() + 1)
                .totalPages(reportedCommentPage.getTotalPages())
                .totalElements(reportedCommentPage.getTotalElements())
                .size(reportedCommentPage.getSize())
                .first(reportedCommentPage.isFirst())
                .last(reportedCommentPage.isLast())
                .empty(reportedCommentPage.isEmpty())
                .build();
    }


    @Override
    @Transactional
    public FreeboardCommentResponseDTO updateCommentVisibility(Integer commentId, CommentVisibilityRequestDTO requestDto) {
        FreeboardComment comment = freeboardCommentRepository.findById(commentId)
                .orElseThrow(() -> new EntityNotFoundException("상태를 변경할 댓글을 찾을 수 없습니다: " + commentId));
        comment.setCommentIsHidden(requestDto.getIsHidden());
        freeboardCommentRepository.save(comment);

        boolean isLiked = false;
        boolean isReported = false;
        User currentUser = getCurrentUserEntity();
        if (currentUser != null) {
            isLiked = freeboardCommentLikeRepository.findByUserAndFreeboardComment(currentUser, comment).isPresent();
            isReported = freeboardCommentReportRepository.existsByUserAndFreeboardComment(currentUser, comment);
        }
        Set<Integer> likedIds = isLiked ? Set.of(commentId) : Collections.emptySet();
        Set<Integer> reportedIds = isReported ? Set.of(commentId) : Collections.emptySet();

        return convertToDto(comment, likedIds, reportedIds);
    }

    @Override
    public PageResponseDTO<FreeboardCommentResponseDTO> getCommentsByAuthor(String currentUserIdFromController, @Nullable AdminMyCommentFilterDTO filter, Pageable pageable) {
        User author = userRepository.findUserByUserId(currentUserIdFromController)
                .orElseThrow(() -> new EntityNotFoundException("사용자 정보를 찾을 수 없습니다: " + currentUserIdFromController));

        Specification<FreeboardComment> spec = Specification.where(FreeboardCommentSpecification.hasAuthor(author));

        if (filter != null) {
            if (StringUtils.hasText(filter.getSearchKeyword())) {
                spec = spec.and(FreeboardCommentSpecification.contentContains(filter.getSearchKeyword()));
            }
            if (filter.getStartDate() != null) {
                spec = spec.and(FreeboardCommentSpecification.createdAtAfter(filter.getStartDate()));
            }
            if (filter.getEndDate() != null) {
                spec = spec.and(FreeboardCommentSpecification.createdAtBefore(filter.getEndDate()));
            }
        }

        Page<FreeboardComment> commentPage = freeboardCommentRepository.findAll(spec, pageable);
        List<FreeboardComment> comments = commentPage.getContent();

        Set<Integer> likedCommentIds = Collections.emptySet();
        Set<Integer> reportedCommentIds = Collections.emptySet();

        if (!comments.isEmpty()) {
            List<Integer> commentIds = comments.stream().map(FreeboardComment::getCommentId).collect(Collectors.toList());
            likedCommentIds = freeboardCommentLikeRepository.findLikedCommentIdsByUserIdAndCommentIdsIn(currentUserIdFromController, commentIds);
            reportedCommentIds = freeboardCommentReportRepository.findReportedCommentIdsByUserIdAndCommentIdsIn(currentUserIdFromController, commentIds);
        }

        final Set<Integer> finalLikedCommentIds = likedCommentIds;
        final Set<Integer> finalReportedCommentIds = reportedCommentIds;

        List<FreeboardCommentResponseDTO> dtoList = comments.stream()
                .map(comment -> convertToDto(comment, finalLikedCommentIds, finalReportedCommentIds))
                .collect(Collectors.toList());

        return PageResponseDTO.<FreeboardCommentResponseDTO>builder()
                .content(dtoList)
                .currentPage(commentPage.getNumber() + 1)
                .totalPages(commentPage.getTotalPages())
                .totalElements(commentPage.getTotalElements())
                .size(commentPage.getSize())
                .first(commentPage.isFirst())
                .last(commentPage.isLast())
                .empty(commentPage.isEmpty())
                .build();
    }

    private FreeboardCommentResponseDTO convertToDto(FreeboardComment comment,
                                                     Set<Integer> likedCommentIdsForCurrentUser,
                                                     Set<Integer> reportedCommentIdsForCurrentUser) {
        User author = comment.getUser();
        Integer postId = (comment.getFreeboardPost() != null) ? comment.getFreeboardPost().getPostId() : null;

        boolean isLiked = likedCommentIdsForCurrentUser.contains(comment.getCommentId());
        boolean isReported = reportedCommentIdsForCurrentUser.contains(comment.getCommentId());
        String authorRole = (author != null && author.getRole() != null) ? author.getRole().name() : "USER";

        log.debug("[convertToDto] Final values for DTO - Comment ID: {}, isLikedByCurrentUser: {}, isReportedByCurrentUser: {}", comment.getCommentId(), isLiked, isReported);

        return FreeboardCommentResponseDTO.builder()
                .commentId(comment.getCommentId())
                .commentContent(comment.getCommentContent())
                .commentLikeCount(comment.getCommentLikeCount())
                .commentIsHidden(comment.isCommentIsHidden())
                .commentCreatedAt(comment.getCommentCreatedAt())
                .commentUpdatedAt(comment.getCommentUpdatedAt())
                .userId(author != null ? author.getUserId() : null)
                .userNickName(author != null ? author.getUserNickName() : "알 수 없는 사용자")
                .postId(postId)
                .isLikedByCurrentUser(isLiked)
                .isReportedByCurrentUser(isReported)
                .authorRole(authorRole)
                .build();
    }

    @Override
    @Transactional(readOnly = true) // 이 메소드는 읽기 전용이므로 명시
    public int getCommentPageNumber(Integer commentId, int size) {
        // 1. commentId로 대상 댓글 엔티티를 찾습니다.
        FreeboardComment targetComment = freeboardCommentRepository.findById(commentId)
                .orElseThrow(() -> new EntityNotFoundException("페이지를 계산할 댓글을 찾을 수 없습니다: " + commentId));

        // 2. 대상 댓글의 게시글 ID와 생성 시간을 가져옵니다.
        Integer postId = targetComment.getFreeboardPost().getPostId();
        LocalDateTime createdAt = targetComment.getCommentCreatedAt();

        // 3. 대상 댓글보다 먼저 작성된 댓글의 수를 계산합니다. (1단계에서 추가한 Repository 메소드 호출)
        long previousCommentsCount = freeboardCommentRepository.countPreviousComments(postId, createdAt);

        // 4. 페이지 번호를 계산합니다. (0부터 시작하는 인덱스를 페이지 크기로 나눔)
        int pageNumber = (int) (previousCommentsCount / size) + 1;

        return pageNumber;
    }
}