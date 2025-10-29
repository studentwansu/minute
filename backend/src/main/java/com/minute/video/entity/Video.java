package com.minute.video.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.minute.video.entity.Channel;
import com.minute.video.entity.VideoCategory;
import com.minute.video.entity.VideoTag;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "video")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Video {

    @Id
    private String videoId;

    @Column(length = 255, nullable = false)
    private String videoTitle;

    @Column(columnDefinition = "TEXT")
    private String videoDescription;

    @Column(length = 255, nullable = false)
    private String videoUrl;

    @Column(length = 255)
    private String thumbnailUrl;

    @Column(length = 255)
    private String region;

    @Column(length = 255)
    private String city;

    @ManyToOne
    @JoinColumn(name = "channel_id")
    private Channel channel;

    @OneToMany(mappedBy = "video", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    @Builder.Default
    private List<VideoTag> videoTags = new ArrayList<>();

    @OneToMany(mappedBy = "video", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    @Builder.Default
    private List<VideoCategory> videoCategories = new ArrayList<>();

    @Column(nullable = false)
    @Builder.Default
    private Long views = 0L;

    @Column(nullable = false)
    @Builder.Default
    private Long likes = 0L;

    @PrePersist
    @PreUpdate
    private void ensureDefaults() {
        if (videoTags == null) videoTags = new ArrayList<>();
        if (videoCategories == null) videoCategories = new ArrayList<>();
        if (views == null) views = 0L;
        if (likes == null) likes = 0L;
    }

    public void addCategory(VideoCategory vc) {
        vc.setVideo(this);
        getVideoCategories().add(vc);
    }
    public void addTag(VideoTag vt) {
        vt.setVideo(this);
        getVideoTags().add(vt);
    }
    public List<VideoCategory> getVideoCategories() {
        if (videoCategories == null) videoCategories = new ArrayList<>();
        return videoCategories;
    }
    public List<VideoTag> getVideoTags() {
        if (videoTags == null) videoTags = new ArrayList<>();
        return videoTags;
    }

    public void increaseLikes() { this.likes = (this.likes == null ? 0L : this.likes) + 1; }
    public void decreaseLikes() { this.likes = Math.max(0L, (this.likes == null ? 0L : this.likes) - 1); }
}
