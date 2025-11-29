package com.minute.board.free.repository;

import com.minute.board.free.dto.request.AdminReportedCommentFilterDTO;
import com.minute.board.free.dto.response.AdminReportedCommentEntryDTO;
import com.minute.board.free.entity.FreeboardComment;
import com.minute.board.free.entity.FreeboardCommentReport;
import com.minute.user.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Set;

public interface FreeboardCommentReportRepository extends JpaRepository<FreeboardCommentReport, Integer>, JpaSpecificationExecutor<FreeboardCommentReport> {

    boolean existsByUserAndFreeboardComment(User user, FreeboardComment freeboardComment);

    @Query("SELECT new com.minute.board.free.dto.response.AdminReportedCommentEntryDTO(" +
            "c.commentId, c.commentContent, u.userId, u.userNickName, c.commentCreatedAt, p.postId, COUNT(r.commentReportId), c.commentIsHidden) " +
            "FROM FreeboardCommentReport r " +
            "JOIN r.freeboardComment c " +
            "JOIN c.user u " +
            "JOIN c.freeboardPost p " +
            "WHERE (:#{#filter.originalPostId} IS NULL OR p.postId = :#{#filter.originalPostId}) " +
            "AND (:#{#filter.authorUserId} IS NULL OR u.userId LIKE %:#{#filter.authorUserId}%) " +
            "AND (:#{#filter.authorNickname} IS NULL OR u.userNickName LIKE %:#{#filter.authorNickname}%) " +
            "AND (:#{#filter.searchKeyword} IS NULL OR (" +
            "      c.commentContent LIKE %:#{#filter.searchKeyword}% OR " +
            "      u.userId LIKE %:#{#filter.searchKeyword}% OR " +
            "      u.userNickName LIKE %:#{#filter.searchKeyword}%" +
            ")) " +
            "AND (:#{#filter.isHidden} IS NULL OR c.commentIsHidden = :#{#filter.isHidden}) " +
            "AND (:#{#filter.queryCommentCreatedAtStartDate} IS NULL OR c.commentCreatedAt >= :#{#filter.queryCommentCreatedAtStartDate}) " +
            "AND (:#{#filter.queryCommentCreatedAtEndDate} IS NULL OR c.commentCreatedAt < :#{#filter.queryCommentCreatedAtEndDate}) " +
            "GROUP BY c.commentId, c.commentContent, u.userId, u.userNickName, c.commentCreatedAt, p.postId, c.commentIsHidden " +
            "ORDER BY COUNT(r.commentReportId) DESC, c.commentCreatedAt DESC")
    Page<AdminReportedCommentEntryDTO> findReportedCommentSummariesWithFilters(
            @Param("filter") AdminReportedCommentFilterDTO filter,
            Pageable pageable
    );

    @Query("SELECT fcr.freeboardComment.commentId FROM FreeboardCommentReport fcr WHERE fcr.user.userId = :userId AND fcr.freeboardComment.commentId IN :commentIds")
    Set<Integer> findReportedCommentIdsByUserIdAndCommentIdsIn(@Param("userId") String userId, @Param("commentIds") List<Integer> commentIds);
}