package com.example.coursecatalog.service;

import com.example.coursecatalog.dto.ChangePasswordRequestDTO;
import com.example.coursecatalog.dto.RegisterRequestDTO;
import com.example.coursecatalog.entity.User;

import java.util.List;

public interface UserService {
    User register(RegisterRequestDTO request);
    void changePassword(Long userId, ChangePasswordRequestDTO request);
    User findByUsername(String username);
    boolean existsByUsername(String username);
    List<User> findAllUsers();
    User changeRole(Long userId, String newRole);
}
