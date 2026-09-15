package com.example.coursecatalog.service;

import com.example.coursecatalog.entity.Course;
import com.example.coursecatalog.entity.Enrollment;
import com.example.coursecatalog.entity.User;
import com.example.coursecatalog.repository.CourseRepository;
import com.example.coursecatalog.repository.EnrollmentRepository;
import com.example.coursecatalog.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class EnrollmentServiceImpl implements EnrollmentService {

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private UserRepository userRepository;

    @Override
    @Transactional
    public void enroll(Long studentId, Long courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));

        // Check deadline
        if (course.getEnrollmentDeadline() != null && LocalDateTime.now().isAfter(course.getEnrollmentDeadline())) {
            throw new RuntimeException("Enrollment deadline has passed");
        }

        // Check if already enrolled
        if (enrollmentRepository.existsByStudentIdAndCourseId(studentId, courseId)) {
            throw new RuntimeException("Already enrolled in this course");
        }

        Enrollment enrollment = new Enrollment();
        enrollment.setStudentId(studentId);
        enrollment.setCourseId(courseId);
        enrollmentRepository.save(enrollment);
    }

    @Override
    @Transactional
    public void drop(Long studentId, Long courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));

        // Check deadline for dropping
        if (course.getEnrollmentDeadline() != null && LocalDateTime.now().isAfter(course.getEnrollmentDeadline())) {
            throw new RuntimeException("Cannot drop after deadline has passed");
        }

        Enrollment enrollment = enrollmentRepository.findByStudentIdAndCourseId(studentId, courseId)
                .orElseThrow(() -> new RuntimeException("Not enrolled in this course"));

        enrollmentRepository.delete(enrollment);
    }

    @Override
    public boolean isEnrolled(Long studentId, Long courseId) {
        return enrollmentRepository.existsByStudentIdAndCourseId(studentId, courseId);
    }

    @Override
    public long getEnrolledCount(Long courseId) {
        return enrollmentRepository.countByCourseId(courseId);
    }

    @Override
    public List<Map<String, Object>> getEnrolledStudents(Long courseId) {
        List<Enrollment> enrollments = enrollmentRepository.findByCourseId(courseId);

        return enrollments.stream().map(enrollment -> {
            Map<String, Object> studentInfo = new HashMap<>();
            User student = userRepository.findById(enrollment.getStudentId()).orElse(null);
            if (student != null) {
                studentInfo.put("userId", student.getUserId());
                studentInfo.put("username", student.getUsername());
                studentInfo.put("email", student.getEmail());
                studentInfo.put("enrolledAt", enrollment.getEnrolledAt());
            }
            return studentInfo;
        }).filter(m -> !m.isEmpty()).collect(Collectors.toList());
    }
}
