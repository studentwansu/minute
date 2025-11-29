package com.minute.board.free.repository;

import com.minute.board.free.entity.FreeboardComment;
import com.minute.board.free.entity.FreeboardCommentLike;
import com.minute.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface FreeboardCommentLikeRepository extends JpaRepository<FreeboardCommentLike, Integer> {
    Optional<FreeboardCommentLike> findByUserAndFreeboardComment(User user, FreeboardComment freeboardComment);

    /**
     * 특정 사용자가 주어진 댓글 ID 목록 중에서 좋아요를 누른 댓글 ID들을 조회합니다.
     * @param userId 사용자 ID
     * @param commentIds 댓글 ID 목록
     * @return 좋아요를 누른 댓글 ID의 Set
     */
    @Query("SELECT fcl.freeboardComment.commentId FROM FreeboardCommentLike fcl WHERE fcl.user.userId = :userId AND fcl.freeboardComment.commentId IN :commentIds")
    Set<Integer> findLikedCommentIdsByUserIdAndCommentIdsIn(@Param("userId") String userId, @Param("commentIds") List<Integer> commentIds);
}