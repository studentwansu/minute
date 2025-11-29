package com.minute.board.free.repository;

import com.minute.board.free.entity.FreeboardPost;
import com.minute.board.free.entity.FreeboardPostLike;
import com.minute.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface FreeboardPostLikeRepository extends JpaRepository<FreeboardPostLike, Integer> {

    Optional<FreeboardPostLike> findByUserAndFreeboardPost(User user, FreeboardPost freeboardPost);

    boolean existsByUserAndFreeboardPost(User user, FreeboardPost freeboardPost);

    /**
     * 특정 사용자가 주어진 게시글 ID 목록 중에서 좋아요를 누른 게시글 ID들을 조회합니다.
     * @param userId 사용자 ID
     * @param postIds 게시글 ID 목록
     * @return 좋아요를 누른 게시글 ID의 Set
     */
    @Query("SELECT fpl.freeboardPost.postId FROM FreeboardPostLike fpl WHERE fpl.user.userId = :userId AND fpl.freeboardPost.postId IN :postIds")
    Set<Integer> findLikedPostIdsByUserIdAndPostIdsIn(@Param("userId") String userId, @Param("postIds") List<Integer> postIds);

}