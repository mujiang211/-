// repository/CourseRepository.java
package com.example.coursecatalog.repository;

import com.example.coursecatalog.entity.Course;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {

    // 根据教师ID查询其创建的课程
    Page<Course> findByCreatedBy(Long teacherId, Pageable pageable);

    // 根据课程名称模糊搜索
    Page<Course> findByNameContainingIgnoreCase(String keyword, Pageable pageable);
}