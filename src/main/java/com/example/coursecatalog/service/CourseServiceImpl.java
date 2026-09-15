package com.example.coursecatalog.service;

import com.example.coursecatalog.dto.CourseRequestDTO;
import com.example.coursecatalog.dto.CourseResponseDTO;
import com.example.coursecatalog.entity.Course;
import com.example.coursecatalog.exception.CourseNotFoundException;
import com.example.coursecatalog.repository.CourseRepository;
import com.example.coursecatalog.repository.EnrollmentRepository;
import com.example.coursecatalog.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class CourseServiceImpl implements CourseService {

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @Override
    public CourseResponseDTO createCourse(CourseRequestDTO requestDTO, Long createdBy) {
        Course course = new Course();
        course.setName(requestDTO.getName());
        course.setHours(requestDTO.getHours());
        course.setDescription(requestDTO.getDescription());
        course.setSyllabus(requestDTO.getSyllabus());
        course.setCreatedBy(createdBy);
        course.setEnrollmentDeadline(requestDTO.getEnrollmentDeadline());

        Course savedCourse = courseRepository.save(course);
        return convertToDTO(savedCourse);
    }

    @Override
    public Page<CourseResponseDTO> getAllCourses(Pageable pageable) {
        return courseRepository.findAll(pageable)
                .map(this::convertToDTO);
    }

    @Override
    public CourseResponseDTO getCourseById(Long id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new CourseNotFoundException(id));
        return convertToDTO(course);
    }

    @Override
    public CourseResponseDTO updateCourse(Long id, CourseRequestDTO requestDTO, Long currentUserId) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new CourseNotFoundException(id));

        if (!course.getCreatedBy().equals(currentUserId)) {
            throw new RuntimeException("You are not authorized to update this course");
        }

        course.setName(requestDTO.getName());
        course.setHours(requestDTO.getHours());
        course.setDescription(requestDTO.getDescription());
        if (requestDTO.getSyllabus() != null) {
            course.setSyllabus(requestDTO.getSyllabus());
        }
        if (requestDTO.getEnrollmentDeadline() != null) {
            course.setEnrollmentDeadline(requestDTO.getEnrollmentDeadline());
        }

        Course updatedCourse = courseRepository.save(course);
        return convertToDTO(updatedCourse);
    }

    @Override
    public void deleteCourse(Long id, Long currentUserId) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new CourseNotFoundException(id));

        if (!course.getCreatedBy().equals(currentUserId)) {
            throw new RuntimeException("You are not authorized to delete this course");
        }

        courseRepository.delete(course);
    }

    @Override
    public Page<CourseResponseDTO> getCoursesByTeacher(Long teacherId, Pageable pageable) {
        return courseRepository.findByCreatedBy(teacherId, pageable)
                .map(this::convertToDTO);
    }

    @Override
    public Page<CourseResponseDTO> searchCourses(String keyword, Pageable pageable) {
        return courseRepository.findByNameContainingIgnoreCase(keyword, pageable)
                .map(this::convertToDTO);
    }

    private CourseResponseDTO convertToDTO(Course course) {
        String creatorName = userRepository.findById(course.getCreatedBy())
                .map(user -> user.getUsername())
                .orElse("Unknown");

        CourseResponseDTO dto = new CourseResponseDTO();
        dto.setCourseId(course.getCourseId());
        dto.setName(course.getName());
        dto.setHours(course.getHours());
        dto.setDescription(course.getDescription());
        dto.setSyllabus(course.getSyllabus());
        dto.setCreatedBy(course.getCreatedBy());
        dto.setCreatedByName(creatorName);
        dto.setCreatedAt(course.getCreatedAt());
        dto.setUpdatedAt(course.getUpdatedAt());
        dto.setEnrollmentDeadline(course.getEnrollmentDeadline());
        dto.setEnrolledCount(enrollmentRepository.countByCourseId(course.getCourseId()));
        return dto;
    }
}
