package com.minute.board.qna.entity;

import com.minute.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "inquiry_replies")
public class QnaReply {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "reply_id")
    private Integer replyId;

    @Lob
    @Column(name = "reply_content", nullable = false, columnDefinition = "TEXT")
    private String replyContent;

    @CreationTimestamp
    @Column(name = "reply_created_at", nullable = false, updatable = false)
    private LocalDateTime replyCreatedAt;

    @UpdateTimestamp
    @Column(name = "reply_updated_at", nullable = false)
    private LocalDateTime replyUpdatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, referencedColumnName = "user_id")
    private User user;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inquiry_id", nullable = false, unique = true)
    private Qna qna;
}