package com.minute.board.free.repository.specification;

import com.minute.board.free.entity.FreeboardComment;
import com.minute.user.entity.User;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalTime;

public class FreeboardCommentSpecification {

    /**
     * 특정 사용자가 작성한 댓글인지 확인합니다.
     */
    public static Specification<FreeboardComment> hasAuthor(User user) {
        return (root, query, criteriaBuilder) ->
                criteriaBuilder.equal(root.get("user"), user);
    }

    /**
     * 댓글 내용(commentContent)에 특정 키워드를 포함하는지 확인합니다. (대소문자 구분 없이)
     */
//    public static Specification<FreeboardComment> contentContains(String keyword) {
//        return (root, query, criteriaBuilder) -> {
//            if (!StringUtils.hasText(keyword)) {
//                return null;
//            }
//            return criteriaBuilder.like(criteriaBuilder.lower(root.get("commentContent")), "%" + keyword.toLowerCase() + "%");
//        };
//    }

    public static Specification<FreeboardComment> contentContains(String keyword) {
        return (root, query, criteriaBuilder) -> {
            if (!StringUtils.hasText(keyword)) {
                return null;
            }
            return criteriaBuilder.like(root.get("commentContent"), "%" + keyword + "%");
        };
    }

    /**
     * 특정 날짜 이후에 작성된 댓글 (해당 날짜 포함)
     */
    public static Specification<FreeboardComment> createdAtAfter(LocalDate startDate) {
        return (root, query, criteriaBuilder) -> {
            if (startDate == null) {
                return null;
            }
            return criteriaBuilder.greaterThanOrEqualTo(root.get("commentCreatedAt"), startDate.atStartOfDay());
        };
    }

    /**
     * 특정 날짜 이전에 작성된 댓글 (해당 날짜 포함)
     */
    public static Specification<FreeboardComment> createdAtBefore(LocalDate endDate) {
        return (root, query, criteriaBuilder) -> {
            if (endDate == null) {
                return null;
            }
            return criteriaBuilder.lessThanOrEqualTo(root.get("commentCreatedAt"), endDate.atTime(LocalTime.MAX));
        };
    }
}