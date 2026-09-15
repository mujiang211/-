package com.example.coursecatalog.dto;

import jakarta.validation.constraints.*;
import java.time.LocalDateTime;

public class CourseRequestDTO {

    @NotBlank(message = "课程名称不能为空")
    @Size(max = 255, message = "课程名称不能超过255个字符")
    private String name;

    @NotNull(message = "课时数不能为空")
    @Positive(message = "课时数必须大于0")
    private Integer hours;

    private String description;

    private String syllabus;

    private LocalDateTime enrollmentDeadline;

    // Getters and Setters
    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Integer getHours() {
        return hours;
    }

    public void setHours(Integer hours) {
        this.hours = hours;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getSyllabus() {
        return syllabus;
    }

    public void setSyllabus(String syllabus) {
        this.syllabus = syllabus;
    }

    public LocalDateTime getEnrollmentDeadline() {
        return enrollmentDeadline;
    }

    public void setEnrollmentDeadline(LocalDateTime enrollmentDeadline) {
        this.enrollmentDeadline = enrollmentDeadline;
    }
}