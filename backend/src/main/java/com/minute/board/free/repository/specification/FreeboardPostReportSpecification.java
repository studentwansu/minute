package com.minute.board.free.repository.specification;

import com.minute.board.free.entity.FreeboardPost;
import com.minute.board.free.entity.FreeboardPostReport;
import com.minute.user.entity.User;
import jakarta.persistence.criteria.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalTime;

public class FreeboardPostReportSpecification {

    private static Join<FreeboardPostReport, FreeboardPost> getPostJoin(Root<FreeboardPostReport> root) {
        return root.join("freeboardPost", JoinType.INNER);
    }

    private static Join<FreeboardPost, User> getPostAuthorJoin(Root<FreeboardPostReport> root) {
        return getPostJoin(root).join("user", JoinType.INNER);
    }


    /**
     * 신고된 게시글의 ID로 검색합니다. (AdminReportFilterDTO의 reportedItemId 필드 값을 받음)
     */
    public static Specification<FreeboardPostReport> postIdEquals(Integer postId) {
        return (root, query, cb) -> postId == null ? null : cb.equal(getPostJoin(root).get("postId"), postId);
    }

    public static Specification<FreeboardPostReport> reportedPostAuthorUserIdEquals(String keyword) {
        return (root, query, cb) -> !StringUtils.hasText(keyword) ? null : cb.equal(getPostAuthorJoin(root).get("userId"), keyword);
    }

    public static Specification<FreeboardPostReport> reportedPostAuthorNicknameContains(String keyword) {
        return (root, query, cb) -> !StringUtils.hasText(keyword) ? null : cb.like(cb.lower(getPostAuthorJoin(root).get("userNickName")), "%" + keyword.toLowerCase() + "%");
    }

    public static Specification<FreeboardPostReport> postTitleContains(String keyword) {
        return (root, query, cb) -> !StringUtils.hasText(keyword) ? null : cb.like(cb.lower(getPostJoin(root).get("postTitle")), "%" + keyword.toLowerCase() + "%");
    }

    public static Specification<FreeboardPostReport> postContentContains(String keyword) {
        return (root, query, cb) -> !StringUtils.hasText(keyword) ? null : cb.like(cb.lower(getPostJoin(root).get("postContent")), "%" + keyword.toLowerCase() + "%");
    }

    public static Specification<FreeboardPostReport> isPostHidden(Boolean isHidden) {
        return (root, query, cb) -> isHidden == null ? null : cb.equal(getPostJoin(root).get("postIsHidden"), isHidden);
    }

    public static Specification<FreeboardPostReport> reportDateAfter(LocalDate startDate) {
        return (root, query, cb) -> startDate == null ? null : cb.greaterThanOrEqualTo(root.get("postReportDate"), startDate.atStartOfDay());
    }

    public static Specification<FreeboardPostReport> reportDateBefore(LocalDate endDate) {
        return (root, query, cb) -> endDate == null ? null : cb.lessThanOrEqualTo(root.get("postReportDate"), endDate.atTime(LocalTime.MAX));
    }

    public static Specification<FreeboardPostReport> originalPostCreatedAtAfter(LocalDate startDate) {
        return (root, query, cb) -> startDate == null ? null : cb.greaterThanOrEqualTo(getPostJoin(root).get("postCreatedAt"), startDate.atStartOfDay());
    }

    public static Specification<FreeboardPostReport> originalPostCreatedAtBefore(LocalDate endDate) {
        return (root, query, cb) -> endDate == null ? null : cb.lessThanOrEqualTo(getPostJoin(root).get("postCreatedAt"), endDate.atTime(LocalTime.MAX));
    }
}