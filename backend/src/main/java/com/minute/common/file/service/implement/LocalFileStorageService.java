package com.minute.common.file.service.implement;

import com.minute.common.file.service.FileStorageService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service("localFileStorageService")
public class LocalFileStorageService implements FileStorageService {

    @Value("${file.storage.local.base-path:C:/minute-uploads}")
    private String basePath;

    @Override
    public String uploadFile(MultipartFile file, String subDirectory) throws IOException {
        if (file == null || file.isEmpty()) return null;
        String ext = "";
        String original = file.getOriginalFilename();
        if (original != null && original.contains(".")) {
            ext = original.substring(original.lastIndexOf("."));
        }
        String savedName = UUID.randomUUID() + ext;

        Path dir = Paths.get(basePath, subDirectory == null ? "" : subDirectory);
        Files.createDirectories(dir);
        Path target = dir.resolve(savedName);
        Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

        String urlPath = "/" + (subDirectory == null ? "" : subDirectory + "/") + savedName;
        return urlPath;
    }

    @Override
    public List<String> uploadFiles(List<MultipartFile> files, String subDirectory) {
        List<String> urls = new ArrayList<>();
        if (files == null) return urls;
        for (MultipartFile f : files) {
            try {
                String u = uploadFile(f, subDirectory);
                if (u != null) urls.add(u);
            } catch (IOException ignored) { }
        }
        return urls;
    }

    @Override
    public void deleteFile(String fileKey) {
        if (fileKey == null || fileKey.isEmpty()) return;
        String rel = fileKey.startsWith("/") ? fileKey.substring(1) : fileKey;
        Path p = Paths.get(basePath, rel);
        try { Files.deleteIfExists(p); } catch (IOException ignored) { }
    }

    @Override
    public String getFileUrl(String fileKey) {
        return fileKey;
    }
}
