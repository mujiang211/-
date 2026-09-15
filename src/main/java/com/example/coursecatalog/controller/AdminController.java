package com.example.coursecatalog.controller;

import com.example.coursecatalog.entity.User;
import com.example.coursecatalog.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin")
public class AdminController {

    @Autowired
    private UserService userService;

    // 获取所有用户列表
    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers() {
        List<User> users = userService.findAllUsers();

        List<Map<String, Object>> userList = users.stream().map(user -> {
            Map<String, Object> userInfo = new HashMap<>();
            userInfo.put("userId", user.getUserId());
            userInfo.put("username", user.getUsername());
            userInfo.put("email", user.getEmail());
            userInfo.put("role", user.getRole());
            userInfo.put("createdAt", user.getCreatedAt());
            return userInfo;
        }).toList();

        return ResponseEntity.ok(userList);
    }

    // 将用户角色改为教师
    @PutMapping("/users/{userId}/to-teacher")
    public ResponseEntity<?> changeToTeacher(@PathVariable Long userId) {
        try {
            User user = userService.changeRole(userId, "ROLE_TEACHER");
            Map<String, String> response = new HashMap<>();
            response.put("message", "User role changed to TEACHER successfully");
            response.put("username", user.getUsername());
            response.put("newRole", user.getRole());
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    // 将用户角色改为学生
    @PutMapping("/users/{userId}/to-student")
    public ResponseEntity<?> changeToStudent(@PathVariable Long userId) {
        try {
            User user = userService.changeRole(userId, "ROLE_STUDENT");
            Map<String, String> response = new HashMap<>();
            response.put("message", "User role changed to STUDENT successfully");
            response.put("username", user.getUsername());
            response.put("newRole", user.getRole());
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
}