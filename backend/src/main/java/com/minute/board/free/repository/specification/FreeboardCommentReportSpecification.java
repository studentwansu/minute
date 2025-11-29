package com.minute.board.free.repository.specification;

import com.minute.board.free.entity.FreeboardComment;
import com.minute.board.free.entity.FreeboardCommentReport;
import com.minute.board.free.entity.FreeboardPost;
import com.minute.user.entity.User;
import jakarta.persistence.criteria.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalTime;

public class FreeboardCommentReportSpecification {

    private static Join<FreeboardCommentReport, FreeboardComment> getCommentJoin(Root<FreeboardCommentReport> root) {
        return root.join("freeboardComment", JoinType.INNER);
    }

    private static Join<FreeboardComment, User> getCommentAuthorJoin(Root<FreeboardCommentReport> root) {
        return getCommentJoin(root).join("user", JoinType.INNER);
    }

    private static Join<FreeboardComment, FreeboardPost> getOriginalPostJoin(Root<FreeboardCommentReport> root) {
        return getCommentJoin(root).join("freeboardPost", JoinType.INNER);
    }

    public static Specification<FreeboardCommentReport> commentIdEquals(Integer itemId) {
        return (root, query, cb) -> itemId == null ? null : cb.equal(getCommentJoin(root).get("commentId"), itemId);
    }

    public static Specification<FreeboardCommentReport> commentAuthorUserIdEquals(String keyword) {
        return (root, query, cb) -> !StringUtils.hasText(keyword) ? null : cb.equal(getCommentAuthorJoin(root).get("userId"), keyword);
    }

    public static Specification<FreeboardCommentReport> commentAuthorNicknameContains(String keyword) {
        return (root, query, cb) -> !StringUtils.hasText(keyword) ? null : cb.like(cb.lower(getCommentAuthorJoin(root).get("userNickName")), "%" + keyword.toLowerCase() + "%");
    }

    public static Specification<FreeboardCommentReport> commentContentContains(String keyword) {
        return (root, query, cb) -> !StringUtils.hasText(keyword) ? null : cb.like(cb.lower(getCommentJoin(root).get("commentContent")), "%" + keyword.toLowerCase() + "%");
    }

    public static Specification<FreeboardCommentReport> isCommentHidden(Boolean isHidden) {
        return (root, query, cb) -> isHidden == null ? null : cb.equal(getCommentJoin(root).get("commentIsHidden"), isHidden);
    }

    public static Specification<FreeboardCommentReport> reportDateAfter(LocalDate startDate) {
        return (root, query, cb) -> startDate == null ? null : cb.greaterThanOrEqualTo(root.get("commentReportDate"), startDate.atStartOfDay());
    }

    public static Specification<FreeboardCommentReport> reportDateBefore(LocalDate endDate) {
        return (root, query, cb) -> endDate == null ? null : cb.lessThanOrEqualTo(root.get("commentReportDate"), endDate.atTime(LocalTime.MAX));
    }

    public static Specification<FreeboardCommentReport> originalCommentCreatedAtAfter(LocalDate startDate) {
        return (root, query, cb) -> startDate == null ? null : cb.greaterThanOrEqualTo(getCommentJoin(root).get("commentCreatedAt"), startDate.atStartOfDay());
    }

    public static Specification<FreeboardCommentReport> originalCommentCreatedAtBefore(LocalDate endDate) {
        return (root, query, cb) -> endDate == null ? null : cb.lessThanOrEqualTo(getCommentJoin(root).get("commentCreatedAt"), endDate.atTime(LocalTime.MAX));
    }
}