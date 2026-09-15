package com.example.coursecatalog.service;

import java.util.List;
import java.util.Map;

public interface EnrollmentService {

    void enroll(Long studentId, Long courseId);

    void drop(Long studentId, Long courseId);

    boolean isEnrolled(Long studentId, Long courseId);

    long getEnrolledCount(Long courseId);

    List<Map<String, Object>> getEnrolledStudents(Long courseId);
}
