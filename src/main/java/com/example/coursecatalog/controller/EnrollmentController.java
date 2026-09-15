package com.example.coursecatalog.controller;

import com.example.coursecatalog.entity.User;
import com.example.coursecatalog.service.EnrollmentService;
import com.example.coursecatalog.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/courses/{courseId}/enrollment")
public class EnrollmentController {

    @Autowired
    private EnrollmentService enrollmentService;

    @Autowired
    private UserService userService;

    // Enroll in a course - POST /courses/{courseId}/enrollment
    @PostMapping
    public ResponseEntity<?> enroll(@PathVariable Long courseId) {
        try {
            Long currentUserId = getCurrentUserId();
            enrollmentService.enroll(currentUserId, courseId);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Enrolled successfully");
            response.put("enrolledCount", enrollmentService.getEnrolledCount(courseId));
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    // Drop a course - DELETE /courses/{courseId}/enrollment
    @DeleteMapping
    public ResponseEntity<?> drop(@PathVariable Long courseId) {
        try {
            Long currentUserId = getCurrentUserId();
            enrollmentService.drop(currentUserId, courseId);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Dropped successfully");
            response.put("enrolledCount", enrollmentService.getEnrolledCount(courseId));
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    // Check enrollment status - GET /courses/{courseId}/enrollment/status
    @GetMapping("/status")
    public ResponseEntity<?> getStatus(@PathVariable Long courseId) {
        Long currentUserId = getCurrentUserId();
        boolean enrolled = enrollmentService.isEnrolled(currentUserId, courseId);

        Map<String, Object> response = new HashMap<>();
        response.put("enrolled", enrolled);
        response.put("enrolledCount", enrollmentService.getEnrolledCount(courseId));
        return ResponseEntity.ok(response);
    }

    // Get enrolled students (teacher/admin only) - GET /courses/{courseId}/enrollment/students
    @GetMapping("/students")
    public ResponseEntity<?> getEnrolledStudents(@PathVariable Long courseId) {
        try {
            Long currentUserId = getCurrentUserId();
            User currentUser = getCurrentUser();

            // Check permission: must be teacher/admin or course owner
            String role = currentUser.getRole();
            if (!"ROLE_ADMIN".equals(role) && !"ROLE_TEACHER".equals(role)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied"));
            }

            List<Map<String, Object>> students = enrollmentService.getEnrolledStudents(courseId);
            return ResponseEntity.ok(students);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    private Long getCurrentUserId() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userService.findByUsername(username);
        return user.getUserId();
    }

    private User getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userService.findByUsername(username);
    }
}
