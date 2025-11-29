package com.minute.board.notice.service;

import com.minute.board.notice.entity.Notice;
import com.minute.user.entity.User;
import jakarta.persistence.criteria.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;

public class NoticeSpecification {

    /**
     * 여러 필드(제목, 내용, 작성자ID, 작성자 닉네임)에서 키워드로 통합 검색하는 Specification
     * @param keyword 검색어
     * @return Specification 객체
     */
    public static Specification<Notice> searchByCombinedFields(final String keyword) {
        if (!StringUtils.hasText(keyword)) {
            return null;
        }

        return (Root<Notice> root, CriteriaQuery<?> query, CriteriaBuilder cb) -> {
            Join<Notice, User> userJoin = root.join("user", JoinType.LEFT);

            String lowerKeyword = keyword.toLowerCase();

            Predicate titlePredicate = cb.like(cb.lower(root.get("noticeTitle")), "%" + lowerKeyword + "%");
            Predicate nicknamePredicate = cb.like(cb.lower(userJoin.get("userNickName")), "%" + lowerKeyword + "%");
            Predicate userIdPredicate = cb.like(cb.lower(userJoin.get("userId")), "%" + lowerKeyword + "%");

            Predicate contentPredicate = cb.like(root.get("noticeContent"), "%" + keyword + "%");

            return cb.or(titlePredicate, contentPredicate, nicknamePredicate, userIdPredicate);
        };
    }

    /**
     * 중요도(isImportant) 필터링을 위한 Specification
     * @param isImportant 필터링할 중요도 값 (true 또는 false). null이면 이 조건은 적용되지 않음.
     * @return Specification 객체
     */
    public static Specification<Notice> isImportant(final Boolean isImportant) {
        return (Root<Notice> root, CriteriaQuery<?> query, CriteriaBuilder cb) -> {
            if (isImportant == null) {
                return null;
            }
            return cb.equal(root.get("noticeIsImportant"), isImportant);
        };
    }

    /**
     * 작성일(createdAt) 날짜 범위 필터링을 위한 Specification
     * @param dateFrom 시작일 (포함). null이면 시작일 제한 없음.
     * @param dateTo 종료일 (포함). null이면 종료일 제한 없음.
     * @return Specification 객체
     */
    public static Specification<Notice> createdAtBetween(final LocalDateTime dateFrom, final LocalDateTime dateTo) {
        return (Root<Notice> root, CriteriaQuery<?> query, CriteriaBuilder cb) -> {
            if (dateFrom == null && dateTo == null) {
                return null;
            }
            if (dateFrom != null && dateTo == null) {
                return cb.greaterThanOrEqualTo(root.get("noticeCreatedAt"), dateFrom);
            }
            if (dateFrom == null && dateTo != null) {
                return cb.lessThanOrEqualTo(root.get("noticeCreatedAt"), dateTo);
            }
            return cb.between(root.get("noticeCreatedAt"), dateFrom, dateTo);
        };
    }


}
