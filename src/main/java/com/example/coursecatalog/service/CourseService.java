package com.example.coursecatalog.service;

import com.example.coursecatalog.dto.CourseRequestDTO;
import com.example.coursecatalog.dto.CourseResponseDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface CourseService {

    CourseResponseDTO createCourse(CourseRequestDTO requestDTO, Long createdBy);

    Page<CourseResponseDTO> getAllCourses(Pageable pageable);

    CourseResponseDTO getCourseById(Long id);

    CourseResponseDTO updateCourse(Long id, CourseRequestDTO requestDTO, Long currentUserId);

    void deleteCourse(Long id, Long currentUserId);

    Page<CourseResponseDTO> getCoursesByTeacher(Long teacherId, Pageable pageable);

    Page<CourseResponseDTO> searchCourses(String keyword, Pageable pageable);
}