package com.minute.board.qna.entity;

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
@Table(name = "inquiry_attachments")
public class QnaAttachment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "img_id")
    private Integer imgId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inquiry_id", nullable = false)
    private Qna qna;

    @Column(name = "img_file_path", nullable = false, length = 255)
    private String imgFilePath;

    @Column(name = "img_original_filename", length = 255)
    private String imgOriginalFilename;

    @Column(name = "img_saved_filename", nullable = false, length = 255)
    private String imgSavedFilename;

    @CreationTimestamp
    @Column(name = "img_created_at", nullable = false, updatable = false)
    private LocalDateTime imgCreatedAt;
}