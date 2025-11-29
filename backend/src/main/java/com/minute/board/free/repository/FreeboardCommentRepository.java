package com.minute.board.free.repository;

import com.minute.board.free.entity.FreeboardComment;
import com.minute.user.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.lang.Nullable;

import java.time.LocalDateTime;
import java.util.List;

public interface FreeboardCommentRepository extends JpaRepository<FreeboardComment, Integer>, JpaSpecificationExecutor<FreeboardComment> {

    @EntityGraph(attributePaths = {"user", "freeboardPost"})
    Page<FreeboardComment> findByFreeboardPost_PostId(Integer postId, Pageable pageable);

    @EntityGraph(attributePaths = {"user", "freeboardPost"})
    Page<FreeboardComment> findByUserOrderByCommentCreatedAtDesc(User user, Pageable pageable);

    @EntityGraph(attributePaths = {"user", "freeboardPost"})
    List<FreeboardComment> findByUserOrderByCommentCreatedAtDesc(User user);

    @Override
    @EntityGraph(attributePaths = {
            "user",
            "freeboardPost",
            "freeboardPost.user"
    })
    Page<FreeboardComment> findAll(@Nullable Specification<FreeboardComment> spec, Pageable pageable);

    @Override
    @EntityGraph(attributePaths = {
            "user",
            "freeboardPost",
            "freeboardPost.user"
    })
    List<FreeboardComment> findAll(@Nullable Specification<FreeboardComment> spec, Sort sort);

    /**
     * 특정 게시글 내에서, 주어진 생성 시간보다 먼저 작성된 댓글의 개수를 반환합니다.
     * 댓글은 오래된 순(ASC)으로 정렬된다는 것을 전제로 합니다.
     * @param postId 게시글 ID
     * @param createdAt 기준이 되는 댓글의 생성 시간
     * @return 기준 시간 이전의 댓글 수
     */
    @Query("SELECT count(c) FROM FreeboardComment c WHERE c.freeboardPost.postId = :postId AND c.commentCreatedAt < :createdAt")
    long countPreviousComments(@Param("postId") Integer postId, @Param("createdAt") LocalDateTime createdAt);
}