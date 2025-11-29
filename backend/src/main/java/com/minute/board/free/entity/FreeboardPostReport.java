package com.minute.board.free.entity;

import com.minute.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "freeboard_post_reports",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_fpr_user_post", columnNames = {"user_id", "post_id"})
        }
)
public class FreeboardPostReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "post_report_id")
    private Integer postReportId;

    @CreationTimestamp
    @Column(name = "post_report_date", nullable = false, updatable = false)
    private LocalDateTime postReportDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private FreeboardPost freeboardPost;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, referencedColumnName = "user_id")
    private User user;
}