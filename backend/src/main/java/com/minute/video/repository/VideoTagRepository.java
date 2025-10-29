package com.minute.video.repository;

import com.minute.video.entity.Tag;
import com.minute.video.entity.Video;
import com.minute.video.entity.VideoTag;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VideoTagRepository extends JpaRepository<VideoTag, VideoTag.VideoTagId> {
    /**
     * 특정 Video, Tag 조합이 이미 존재하는지 여부를 DB에서 바로 조회
     */
    boolean existsByVideoAndTag(Video video, Tag tag);
}