package com.minute.video.repository;

import com.minute.video.entity.Category;
import com.minute.video.entity.Video;
import com.minute.video.entity.VideoCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface VideoCategoryRepository extends JpaRepository<VideoCategory, Integer> {

    // 중복 데이터 방지를 위한 조회
    Optional<VideoCategory> findByVideoAndCategory(Video video, Category category);
}