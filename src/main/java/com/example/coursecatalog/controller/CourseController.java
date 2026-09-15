package com.example.coursecatalog.controller;

import com.example.coursecatalog.dto.CourseRequestDTO;
import com.example.coursecatalog.dto.CourseResponseDTO;
import com.example.coursecatalog.entity.User;
import com.example.coursecatalog.service.CourseService;
import com.example.coursecatalog.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Set;

@RestController
@RequestMapping("/courses")
public class CourseController {

    @Autowired
    private CourseService courseService;

    @Autowired
    private UserService userService;

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("pdf", "doc", "docx", "ppt", "pptx", "txt", "zip");

    // 1. 创建课程 - POST /courses
    @PostMapping
    public ResponseEntity<CourseResponseDTO> createCourse(@Valid @RequestBody CourseRequestDTO requestDTO) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userService.findByUsername(username);
        CourseResponseDTO createdCourse = courseService.createCourse(requestDTO, currentUser.getUserId());
        return new ResponseEntity<>(createdCourse, HttpStatus.CREATED);
    }

    // 2. 获取所有课程（分页） - GET /courses?page=0&size=10&sort=createdAt,desc
    @GetMapping
    public ResponseEntity<Page<CourseResponseDTO>> getAllCourses(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "courseId") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {

        Sort.Direction direction = sortDir.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        Page<CourseResponseDTO> courses = courseService.getAllCourses(pageable);
        return ResponseEntity.ok(courses);
    }

    // 3. 根据ID获取单个课程 - GET /courses/{id}
    @GetMapping("/{id}")
    public ResponseEntity<CourseResponseDTO> getCourseById(@PathVariable Long id) {
        CourseResponseDTO course = courseService.getCourseById(id);
        return ResponseEntity.ok(course);
    }

    // 4. 更新课程 - PUT /courses/{id}
    @PutMapping("/{id}")
    public ResponseEntity<CourseResponseDTO> updateCourse(
            @PathVariable Long id,
            @Valid @RequestBody CourseRequestDTO requestDTO) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userService.findByUsername(username);
        CourseResponseDTO updatedCourse = courseService.updateCourse(id, requestDTO, currentUser.getUserId());
        return ResponseEntity.ok(updatedCourse);
    }

    // 5. 删除课程 - DELETE /courses/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCourse(@PathVariable Long id) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userService.findByUsername(username);
        courseService.deleteCourse(id, currentUser.getUserId());
        return ResponseEntity.noContent().build();
    }

    // 6. 根据教师ID获取课程 - GET /courses/teacher/{teacherId}?page=0&size=10
    @GetMapping("/teacher/{teacherId}")
    public ResponseEntity<Page<CourseResponseDTO>> getCoursesByTeacher(
            @PathVariable Long teacherId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size);
        Page<CourseResponseDTO> courses = courseService.getCoursesByTeacher(teacherId, pageable);
        return ResponseEntity.ok(courses);
    }

    // 7. 搜索课程 - GET /courses/search?keyword=java&page=0&size=10
    @GetMapping("/search")
    public ResponseEntity<Page<CourseResponseDTO>> searchCourses(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size);
        Page<CourseResponseDTO> courses = courseService.searchCourses(keyword, pageable);
        return ResponseEntity.ok(courses);
    }

    // ==================== 文件上传和下载 ====================

    @PostMapping("/upload")
    public ResponseEntity<String> uploadFile(@RequestParam("file") MultipartFile file) {
        try {
            String originalFilename = file.getOriginalFilename();
            if (originalFilename == null || originalFilename.isBlank()) {
                return ResponseEntity.badRequest().body("Invalid file name");
            }

            String extension = originalFilename.substring(originalFilename.lastIndexOf(".") + 1).toLowerCase();
            if (!ALLOWED_EXTENSIONS.contains(extension)) {
                return ResponseEntity.badRequest().body("File type not allowed: " + extension);
            }

            String projectDir = System.getProperty("user.dir");
            String uploadDir = projectDir + "/src/main/resources/static/uploads/";

            File dir = new File(uploadDir);
            if (!dir.exists()) {
                dir.mkdirs();
            }

            String filename = System.currentTimeMillis() + "_" + originalFilename;
            String filePath = uploadDir + filename;

            file.transferTo(new File(filePath));

            String fileUrl = "/uploads/" + filename;
            return ResponseEntity.ok(fileUrl);

        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Upload failed: " + e.getMessage());
        }
    }

    @GetMapping("/download/{filename:.+}")
    public ResponseEntity<Resource> downloadFile(@PathVariable String filename) {
        try {
            String decodedFilename = java.net.URLDecoder.decode(filename, "UTF-8");

            String projectDir = System.getProperty("user.dir");
            String uploadDir = projectDir + "/src/main/resources/static/uploads/";
            Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
            Path filePath = uploadPath.resolve(decodedFilename).normalize();

            if (!filePath.startsWith(uploadPath)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() && resource.isReadable()) {
                String encodedFileName = java.net.URLEncoder.encode(decodedFilename, "UTF-8")
                        .replaceAll("\\+", "%20");

                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION,
                                "attachment; filename*=UTF-8''" + encodedFileName)
                        .header(HttpHeaders.CONTENT_TYPE, "application/octet-stream")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
