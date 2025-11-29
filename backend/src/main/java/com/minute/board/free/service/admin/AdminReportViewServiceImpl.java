package com.minute.board.free.service.admin;

import com.minute.board.common.dto.response.PageResponseDTO;
import com.minute.board.free.dto.request.AdminReportFilterDTO;
import com.minute.board.free.dto.response.AdminReportedActivityItemDTO;
import com.minute.board.free.entity.FreeboardComment;
import com.minute.board.free.entity.FreeboardCommentReport;
import com.minute.board.free.entity.FreeboardPost;
import com.minute.board.free.entity.FreeboardPostReport;
import com.minute.board.free.repository.FreeboardCommentReportRepository;
import com.minute.board.free.repository.FreeboardPostReportRepository;
import com.minute.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.minute.board.free.repository.specification.FreeboardPostReportSpecification;
import com.minute.board.free.repository.specification.FreeboardCommentReportSpecification;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminReportViewServiceImpl implements AdminReportViewService {

    private final FreeboardPostReportRepository freeboardPostReportRepository;
    private final FreeboardCommentReportRepository freeboardCommentReportRepository;

    @Override
    public PageResponseDTO<AdminReportedActivityItemDTO> getAllReportedActivities(
            AdminReportFilterDTO filter,
            Pageable pageable) {

        AdminReportFilterDTO queryFilter = prepareQueryFilter(filter);

        Specification<FreeboardPostReport> postReportSpec = createPostReportSpecification(queryFilter);
        Sort postSort = replaceSortProperty(pageable.getSort(), "reportCreatedAt", "postReportDate");
        List<FreeboardPostReport> postReports = freeboardPostReportRepository.findAll(postReportSpec, postSort);

        Specification<FreeboardCommentReport> commentReportSpec = createCommentReportSpecification(queryFilter);
        Sort commentSort = replaceSortProperty(pageable.getSort(), "reportCreatedAt", "commentReportDate");
        List<FreeboardCommentReport> commentReports = freeboardCommentReportRepository.findAll(commentReportSpec, commentSort);

        List<AdminReportedActivityItemDTO> activities = new ArrayList<>();

        postReports.forEach(report -> {
            FreeboardPost post = report.getFreeboardPost();
            if (post == null) return;
            User postAuthor = post.getUser();
            User reporter = report.getUser();
            if (postAuthor == null || reporter == null) return;

            String preview = post.getPostTitle();
            if (preview != null && preview.length() > 50) {
                preview = preview.substring(0, 50) + "...";
            }
            activities.add(AdminReportedActivityItemDTO.builder()
                    .itemType("POST_REPORT")
                    .reportId(report.getPostReportId())
                    .reportedItemId(post.getPostId())
                    .itemTitleOrContentPreview(preview)
                    .reportedItemAuthorUserId(postAuthor.getUserId())
                    .reportedItemAuthorNickname(postAuthor.getUserNickName())
                    .reporterUserId(reporter.getUserId())
                    .reporterNickname(reporter.getUserNickName())
                    .reportCreatedAt(report.getPostReportDate())
                    .originalItemCreatedAt(post.getPostCreatedAt())
                    .isItemHidden(post.isPostIsHidden())
                    .build());
        });

        commentReports.forEach(report -> {
            FreeboardComment comment = report.getFreeboardComment();
            if (comment == null) return;
            User commentAuthor = comment.getUser();
            User reporter = report.getUser();
            FreeboardPost originalPost = comment.getFreeboardPost();
            if (commentAuthor == null || reporter == null || originalPost == null) return;

            String preview = comment.getCommentContent();
            if (preview != null && preview.length() > 50) {
                preview = preview.substring(0, 50) + "...";
            }
            activities.add(AdminReportedActivityItemDTO.builder()
                    .itemType("COMMENT_REPORT")
                    .reportId(report.getCommentReportId())
                    .reportedItemId(comment.getCommentId())
                    .itemTitleOrContentPreview(preview)
                    .reportedItemAuthorUserId(commentAuthor.getUserId())
                    .reportedItemAuthorNickname(commentAuthor.getUserNickName())
                    .reporterUserId(reporter.getUserId())
                    .reporterNickname(reporter.getUserNickName())
                    .reportCreatedAt(report.getCommentReportDate())
                    .originalItemCreatedAt(comment.getCommentCreatedAt())
                    .isItemHidden(comment.isCommentIsHidden())
                    .originalPostIdForComment(originalPost.getPostId())
                    .build());
        });

        if (pageable.getSort().isSorted()) {
            for (Sort.Order order : pageable.getSort()) {
                Comparator<AdminReportedActivityItemDTO> comparator = Comparator.comparing(
                        activity -> getComparableField(activity, order.getProperty()),
                        Comparator.nullsLast(Comparator.naturalOrder())
                );
                if (order.getDirection().isDescending()) {
                    comparator = comparator.reversed();
                }
                activities.sort(comparator);
            }
        } else {
            activities.sort(Comparator.comparing(AdminReportedActivityItemDTO::getReportCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())));
        }

        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), activities.size());
        List<AdminReportedActivityItemDTO> pageContent = List.of();
        if (start < end ) {
            pageContent = activities.subList(start, end);
        }

        Page<AdminReportedActivityItemDTO> activityPage = new PageImpl<>(pageContent, pageable, activities.size());

        return PageResponseDTO.<AdminReportedActivityItemDTO>builder()
                .content(activityPage.getContent())
                .currentPage(activityPage.getNumber() + 1)
                .totalPages(activityPage.getTotalPages())
                .totalElements(activityPage.getTotalElements())
                .size(activityPage.getSize())
                .first(activityPage.isFirst())
                .last(activityPage.isLast())
                .empty(activityPage.isEmpty())
                .build();
    }

    private Sort replaceSortProperty(Sort originalSort, String fromProperty, String toProperty) {
        if (!originalSort.isSorted()) {
            return originalSort;
        }
        List<Sort.Order> newOrders = originalSort.stream()
                .map(order -> {
                    if (fromProperty.equals(order.getProperty())) {
                        return new Sort.Order(order.getDirection(), toProperty, order.getNullHandling());
                    }
                    return order;
                })
                .collect(Collectors.toList());
        return Sort.by(newOrders);
    }

    private AdminReportFilterDTO prepareQueryFilter(AdminReportFilterDTO originalFilter) {
        AdminReportFilterDTO queryFilter = new AdminReportFilterDTO();
        queryFilter.setKeyword(originalFilter.getKeyword());
        queryFilter.setReportedItemId(originalFilter.getReportedItemId());
        queryFilter.setAuthorKeyword(originalFilter.getAuthorKeyword());
        queryFilter.setIsItemHidden(originalFilter.getIsItemHidden());
        queryFilter.setReportStartDate(originalFilter.getReportStartDate());
        queryFilter.setReportEndDate(originalFilter.getReportEndDate());
        queryFilter.setOriginalItemStartDate(originalFilter.getOriginalItemStartDate());
        queryFilter.setOriginalItemEndDate(originalFilter.getOriginalItemEndDate());

        if (originalFilter.getReportStartDate() != null) {
            queryFilter.setQueryReportStartDate(originalFilter.getReportStartDate().atStartOfDay());
        }
        if (originalFilter.getReportEndDate() != null) {
            queryFilter.setQueryReportEndDate(originalFilter.getReportEndDate().plusDays(1).atStartOfDay());
        }
        if (originalFilter.getOriginalItemStartDate() != null) {
            queryFilter.setQueryOriginalItemStartDate(originalFilter.getOriginalItemStartDate().atStartOfDay());
        }
        if (originalFilter.getOriginalItemEndDate() != null) {
            queryFilter.setQueryOriginalItemEndDate(originalFilter.getOriginalItemEndDate().plusDays(1).atStartOfDay());
        }
        return queryFilter;
    }

    private Comparable getComparableField(AdminReportedActivityItemDTO activity, String propertyName) {
        if (activity == null || propertyName == null) return null;
        try {
            switch (propertyName) {
                case "reportCreatedAt":
                    return activity.getReportCreatedAt();
                case "originalItemCreatedAt":
                    return activity.getOriginalItemCreatedAt();
                case "reportedItemId":
                    return activity.getReportedItemId();
                default:
                    return null;
            }
        } catch (Exception e) {
            return null;
        }
    }

    private Specification<FreeboardPostReport> createPostReportSpecification(AdminReportFilterDTO filter) {
        Specification<FreeboardPostReport> spec = Specification.where(null);

        if (filter.getReportedItemId() != null) {
            spec = spec.and(FreeboardPostReportSpecification.postIdEquals(filter.getReportedItemId()));
        }
        if (StringUtils.hasText(filter.getAuthorKeyword())) {
            spec = spec.and(
                    FreeboardPostReportSpecification.reportedPostAuthorUserIdEquals(filter.getAuthorKeyword())
                            .or(FreeboardPostReportSpecification.reportedPostAuthorNicknameContains(filter.getAuthorKeyword()))
            );
        }
        if (StringUtils.hasText(filter.getKeyword())) {
            spec = spec.and(
                    FreeboardPostReportSpecification.postTitleContains(filter.getKeyword())
                            .or(FreeboardPostReportSpecification.postContentContains(filter.getKeyword()))
            );
        }
        if (filter.getIsItemHidden() != null) {
            spec = spec.and(FreeboardPostReportSpecification.isPostHidden(filter.getIsItemHidden()));
        }
        if (filter.getQueryReportStartDate() != null) {
            spec = spec.and(FreeboardPostReportSpecification.reportDateAfter(filter.getQueryReportStartDate().toLocalDate()));
        }
        if (filter.getQueryReportEndDate() != null) {
            spec = spec.and(FreeboardPostReportSpecification.reportDateBefore(filter.getQueryReportEndDate().toLocalDate().minusDays(1)));
        }
        if (filter.getQueryOriginalItemStartDate() != null) {
            spec = spec.and(FreeboardPostReportSpecification.originalPostCreatedAtAfter(filter.getQueryOriginalItemStartDate().toLocalDate()));
        }
        if (filter.getQueryOriginalItemEndDate() != null) {
            spec = spec.and(FreeboardPostReportSpecification.originalPostCreatedAtBefore(filter.getQueryOriginalItemEndDate().toLocalDate().minusDays(1)));
        }
        return spec;
    }

    private Specification<FreeboardCommentReport> createCommentReportSpecification(AdminReportFilterDTO filter) {
        Specification<FreeboardCommentReport> spec = Specification.where(null);

        if (filter.getReportedItemId() != null) {
            spec = spec.and(FreeboardCommentReportSpecification.commentIdEquals(filter.getReportedItemId()));
        }
        if (StringUtils.hasText(filter.getAuthorKeyword())) {
            spec = spec.and(
                    FreeboardCommentReportSpecification.commentAuthorUserIdEquals(filter.getAuthorKeyword())
                            .or(FreeboardCommentReportSpecification.commentAuthorNicknameContains(filter.getAuthorKeyword()))
            );
        }
        if (StringUtils.hasText(filter.getKeyword())) {
            spec = spec.and(FreeboardCommentReportSpecification.commentContentContains(filter.getKeyword()));
        }
        if (filter.getIsItemHidden() != null) {
            spec = spec.and(FreeboardCommentReportSpecification.isCommentHidden(filter.getIsItemHidden()));
        }
        if (filter.getQueryReportStartDate() != null) {
            spec = spec.and(FreeboardCommentReportSpecification.reportDateAfter(filter.getQueryReportStartDate().toLocalDate()));
        }
        if (filter.getQueryReportEndDate() != null) {
            spec = spec.and(FreeboardCommentReportSpecification.reportDateBefore(filter.getQueryReportEndDate().toLocalDate().minusDays(1)));
        }
        if (filter.getQueryOriginalItemStartDate() != null) {
            spec = spec.and(FreeboardCommentReportSpecification.originalCommentCreatedAtAfter(filter.getQueryOriginalItemStartDate().toLocalDate()));
        }
        if (filter.getQueryOriginalItemEndDate() != null) {
            spec = spec.and(FreeboardCommentReportSpecification.originalCommentCreatedAtBefore(filter.getQueryOriginalItemEndDate().toLocalDate().minusDays(1)));
        }
        return spec;
    }
}