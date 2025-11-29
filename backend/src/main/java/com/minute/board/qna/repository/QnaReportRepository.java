package com.minute.board.qna.repository;

import com.minute.board.qna.entity.Qna;
import com.minute.board.qna.entity.QnaReport;
import com.minute.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface QnaReportRepository extends JpaRepository<QnaReport, Integer> /*, JpaSpecificationExecutor<QnaReport> */ {

    boolean existsByQnaAndUser(Qna qna, User user);

    Optional<QnaReport> findByQnaAndUser(Qna qna, User user);
}