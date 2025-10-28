package com.minute.video.controller;

import com.minute.video.dto.WatchHistoryRequestDTO;
import com.minute.video.dto.WatchHistoryResponseDTO;
import com.minute.video.service.WatchHistoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@Tag(name = "WatchHistory",description = "영상 시청 기록 API")
@SecurityRequirement(name = "bearerAuth")
@RequestMapping("/api/v1/auth/{userId}/watch-history")
public class WatchHistoryController {

    private final WatchHistoryService watchHistoryService;

    @Operation(summary = "시청 기록 저장",description = "사용자의 시청 기록을 저장합니다.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "시청 기록이 정상적으로 저장되었습니다."),
            @ApiResponse(responseCode = "400", description = "요청하신 시청 기록 정보가 올바르지 않습니다. 다시 확인해 주세요."),
            @ApiResponse(responseCode = "500", description = "서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.")
    })
    @PostMapping
    public ResponseEntity<Void> save(
            @PathVariable("userId") String userId,
            @RequestBody WatchHistoryRequestDTO dto) {
        watchHistoryService.saveWatchHistory(userId,dto);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "시청 기록 삭제", description = "사용자의 특정 영상 시청 기록을 삭제합니다.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "시청 기록이 정상적으로 삭제되었습니다."),
            @ApiResponse(responseCode = "400", description = "잘못된 요청입니다. userId나 videoId를 확인해 주세요."),
            @ApiResponse(responseCode = "500", description = "서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.")
    })
    @DeleteMapping("/{videoId}")
    public ResponseEntity<Void> delete(
            @PathVariable("userId") String userId,
            @PathVariable("videoId") String videoId) {
        watchHistoryService.deleteWatchHistory(userId, videoId);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "사용자 시청 기록 조회",description = "해당 사용자의 시청 기록을 최신순으로 반환합니다.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "시청 기록 목록을 정상적으로 반환하였습니다."),
            @ApiResponse(responseCode = "400", description = "잘못된 사용자 ID입니다. 다시 확인해 주세요."),
            @ApiResponse(responseCode = "500", description = "서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.")
    })
    @GetMapping
    public ResponseEntity<List<WatchHistoryResponseDTO>> list(
            @PathVariable("userId") String userId){
        List<WatchHistoryResponseDTO> histories = watchHistoryService.getUserWatchHistory(userId);
        return ResponseEntity.ok(histories);
    }
}