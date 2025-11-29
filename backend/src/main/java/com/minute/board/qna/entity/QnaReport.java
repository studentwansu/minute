package com.minute.board.qna.entity;

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
@Table(name = "inquiry_reports",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_ir_user_inquiry", columnNames = {"user_id", "inquiry_id"})
        }
)
public class QnaReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "inquiry_report_id")
    private Integer inquiryReportId;

    @CreationTimestamp
    @Column(name = "inquiry_report_date", nullable = false, updatable = false)
    private LocalDateTime inquiryReportDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inquiry_id", nullable = false)
    private Qna qna;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, referencedColumnName = "user_id")
    private User user;
}