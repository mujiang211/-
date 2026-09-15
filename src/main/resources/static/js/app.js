// ========== API 基础地址 ==========
const API_BASE = 'http://localhost:8080';

// ========== 全局变量 ==========
let currentUser = null;      // 当前登录用户
let currentPage = 0;         // 当前页码
let pageSize = 5;            // 每页显示数量
let searchKeyword = '';      // 搜索关键词
let showMyCoursesOnly = false; // 是否只显示我的课程
let currentDetailCourseId = null; // 当前查看详情的课程ID

// ========== Toast 提示函数 ==========
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) {
        // 如果没有 toast 容器，回退到 alert
        alert(message);
        return;
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <span>${escapeHtml(message)}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
    `;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-in forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ========== 权限判断函数 ==========
function hasTeacherPermission() {
    if (!currentUser) return false;
    const role = currentUser.role;
    return role === 'ROLE_TEACHER' || role === 'ROLE_ADMIN';
}

function isCourseOwner(course) {
    if (!currentUser || !course) return false;
    return currentUser.id === course.createdBy;
}

function isAdmin() {
    if (!currentUser) return false;
    const role = currentUser.role;
    return role === 'ROLE_ADMIN';
}

// ========== 初始化页面 ==========
document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();      // 检查登录状态
    loadCourses();           // 加载课程列表
    setupEventListeners();   // 设置事件监听
    setupAuthEventListeners(); // 设置认证事件监听
});

// ========== 课程相关函数 ==========

// 加载课程列表
async function loadCourses() {
    try {
        let url;
        if (showMyCoursesOnly && currentUser) {
            url = `${API_BASE}/courses/teacher/${currentUser.id}?page=${currentPage}&size=${pageSize}`;
        } else if (searchKeyword) {
            url = `${API_BASE}/courses/search?keyword=${encodeURIComponent(searchKeyword)}&page=${currentPage}&size=${pageSize}`;
        } else {
            url = `${API_BASE}/courses?page=${currentPage}&size=${pageSize}`;
        }

        const response = await fetch(url, { credentials: 'include' });
        if (!response.ok) throw new Error('Failed to load courses');

        const data = await response.json();
        renderCourseList(data.content);
        renderPagination(data);
    } catch (error) {
        console.error('Error loading courses:', error);
        document.getElementById('courseList').innerHTML = '<div class="empty-message">Failed to load courses. Please make sure the backend is running.</div>';
    }
}

// 渲染课程列表
function renderCourseList(courses) {
    const container = document.getElementById('courseList');

    if (!courses || courses.length === 0) {
        container.innerHTML = '<div class="empty-message">' + (showMyCoursesOnly ? 'You have not created any courses yet.' : 'No courses available.') + '</div>';
        return;
    }

    container.innerHTML = courses.map(course => {
        const canEdit = isCourseOwner(course);
        const createdDate = course.createdAt ? new Date(course.createdAt).toLocaleDateString() : 'N/A';
        const deadlineStr = course.enrollmentDeadline ? new Date(course.enrollmentDeadline).toLocaleDateString() : 'No deadline';
        const now = new Date();
        const deadlinePassed = course.enrollmentDeadline && now > new Date(course.enrollmentDeadline);

        return `
        <div class="course-card" data-id="${course.courseId}">
            <h3 class="clickable" onclick="showCourseDetail(${course.courseId})">${escapeHtml(course.name)}</h3>
            <div class="hours">📖 ${course.hours} hours</div>
            <div class="teacher">👤 Teacher: ${escapeHtml(course.createdByName || 'Unknown')}</div>
            <div class="course-time">📅 Created: ${createdDate} | ⏰ Deadline: ${deadlineStr}${deadlinePassed ? ' (Closed)' : ''}</div>
            <div class="enrolled-count">👥 ${course.enrolledCount || 0} students enrolled</div>
            <div class="description">${escapeHtml(course.description || 'No description')}</div>
            <div class="syllabus">
                📎 Syllabus: ${course.syllabus ? `<a href="#" onclick="downloadFile('${getFilenameFromPath(course.syllabus)}'); return false;">Download Syllabus</a>` : 'Not available'}
            </div>
            ${canEdit ? `
                <div class="actions">
                    <button class="edit-btn" onclick="showEditModal(${course.courseId})">Edit</button>
                    <button class="delete-btn" onclick="deleteCourse(${course.courseId})">Delete</button>
                    <button class="students-btn" onclick="viewEnrolledStudents(${course.courseId})">View Students</button>
                </div>
            ` : ''}
        </div>
        `;
    }).join('');
}

// 渲染分页控件
function renderPagination(pageData) {
    const container = document.getElementById('pagination');
    const totalPages = pageData.totalPages;

    if (!container) return;

    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    let html = '';

    if (currentPage > 0) {
        html += `<button onclick="goToPage(${currentPage - 1})">← Previous</button>`;
    }

    for (let i = 0; i < totalPages; i++) {
        if (i === 0 || i === totalPages - 1 || (i >= currentPage - 1 && i <= currentPage + 1)) {
            html += `<button onclick="goToPage(${i})" class="${i === currentPage ? 'active' : ''}">${i + 1}</button>`;
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            html += `<button disabled>...</button>`;
        }
    }

    if (currentPage < totalPages - 1) {
        html += `<button onclick="goToPage(${currentPage + 1})">Next →</button>`;
    }

    container.innerHTML = html;
}

// 跳转到指定页面
function goToPage(page) {
    currentPage = page;
    loadCourses();
}

// 搜索课程
function searchCourses() {
    searchKeyword = document.getElementById('searchInput').value.trim();
    currentPage = 0;
    showMyCoursesOnly = false;
    updateFilterButtons();
    loadCourses();
}

// 切换“我的课程”筛选
function toggleMyCourses() {
    showMyCoursesOnly = !showMyCoursesOnly;
    searchKeyword = '';
    document.getElementById('searchInput').value = '';
    currentPage = 0;
    updateFilterButtons();
    loadCourses();
}

function updateFilterButtons() {
    const myCoursesBtn = document.getElementById('myCoursesBtn');
    const allCoursesBtn = document.getElementById('allCoursesBtn');
    if (myCoursesBtn) {
        myCoursesBtn.className = showMyCoursesOnly ? 'active' : '';
    }
}

// 显示课程详情
async function showCourseDetail(courseId) {
    currentDetailCourseId = courseId;
    try {
        const response = await fetch(`${API_BASE}/courses/${courseId}`, { credentials: 'include' });
        if (!response.ok) throw new Error('Failed to load course');

        const course = await response.json();
        const createdDate = course.createdAt ? new Date(course.createdAt).toLocaleString() : 'N/A';
        const updatedDate = course.updatedAt ? new Date(course.updatedAt).toLocaleString() : 'N/A';
        const deadlineStr = course.enrollmentDeadline ? new Date(course.enrollmentDeadline).toLocaleString() : 'No deadline';

        document.getElementById('detailCourseName').textContent = course.name;
        document.getElementById('detailCourseHours').textContent = course.hours;
        document.getElementById('detailCourseTeacher').textContent = course.createdByName || 'Unknown';
        document.getElementById('detailCourseCreated').textContent = createdDate;
        document.getElementById('detailCourseUpdated').textContent = updatedDate;
        document.getElementById('detailCourseDesc').textContent = course.description || 'No description';
        document.getElementById('detailDeadline').textContent = deadlineStr;
        document.getElementById('detailEnrolledCount').textContent = course.enrolledCount || 0;

        const syllabusEl = document.getElementById('detailCourseSyllabus');
        if (course.syllabus) {
            const filename = getFilenameFromPath(course.syllabus);
            syllabusEl.innerHTML = `<a href="#" onclick="downloadFile('${filename}'); return false;">Download Syllabus</a>`;
        } else {
            syllabusEl.textContent = 'Not available';
        }

        // Handle enrollment actions for students
        const enrollmentActions = document.getElementById('enrollmentActions');
        const enrolledStudentsSection = document.getElementById('enrolledStudentsSection');
        if (currentUser && currentUser.role === 'ROLE_STUDENT') {
            enrollmentActions.style.display = 'block';
            // Check enrollment status
            const statusResp = await fetch(`${API_BASE}/courses/${courseId}/enrollment/status`, { credentials: 'include' });
            if (statusResp.ok) {
                const status = await statusResp.json();
                const enrollBtn = document.getElementById('enrollBtn');
                const dropBtn = document.getElementById('dropBtn');
                if (status.enrolled) {
                    enrollBtn.style.display = 'none';
                    dropBtn.style.display = 'inline-block';
                } else {
                    enrollBtn.style.display = 'inline-block';
                    dropBtn.style.display = 'none';
                }
                // Disable if deadline passed
                if (course.enrollmentDeadline && new Date() > new Date(course.enrollmentDeadline)) {
                    enrollBtn.disabled = true;
                    enrollBtn.textContent = 'Deadline Passed';
                    dropBtn.disabled = true;
                } else {
                    enrollBtn.disabled = false;
                    enrollBtn.textContent = 'Enroll';
                    dropBtn.disabled = false;
                }
            }
        } else {
            enrollmentActions.style.display = 'none';
        }

        // Show enrolled students for teachers/admins
        if (currentUser && hasTeacherPermission()) {
            enrolledStudentsSection.style.display = 'block';
            loadEnrolledStudentsInDetail(courseId);
        } else {
            enrolledStudentsSection.style.display = 'none';
        }

        document.getElementById('courseDetailModal').style.display = 'flex';
    } catch (error) {
        console.error('Error loading course detail:', error);
        showToast('Failed to load course details', 'error');
    }
}

function closeCourseDetailModal() {
    const modal = document.getElementById('courseDetailModal');
    if (modal) modal.style.display = 'none';
}

// 显示添加课程模态框
function showAddModal() {
    document.getElementById('modalTitle').textContent = 'Add New Course';
    document.getElementById('courseId').value = '';
    document.getElementById('name').value = '';
    document.getElementById('hours').value = '';
    document.getElementById('description').value = '';
    document.getElementById('syllabusFile').value = '';
    document.getElementById('enrollmentDeadline').value = '';
    document.getElementById('courseModal').style.display = 'flex';
}

// 显示编辑课程模态框
async function showEditModal(courseId) {
    try {
        const response = await fetch(`${API_BASE}/courses/${courseId}`, {
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to load course');

        const course = await response.json();

        document.getElementById('modalTitle').textContent = 'Edit Course';
        document.getElementById('courseId').value = course.courseId;
        document.getElementById('name').value = course.name;
        document.getElementById('hours').value = course.hours;
        document.getElementById('description').value = course.description || '';
        document.getElementById('syllabusFile').value = '';
        // Set deadline value for editing
        const deadlineInput = document.getElementById('enrollmentDeadline');
        if (course.enrollmentDeadline) {
            deadlineInput.value = course.enrollmentDeadline.substring(0, 16);
        } else {
            deadlineInput.value = '';
        }
        document.getElementById('courseModal').style.display = 'flex';
    } catch (error) {
        console.error('Error loading course:', error);
        alert('Failed to load course details');
    }
}

// 保存课程（创建或更新）
async function saveCourse(event) {
    event.preventDefault();

    const courseId = document.getElementById('courseId').value;
    const name = document.getElementById('name').value;
    const hours = parseInt(document.getElementById('hours').value);
    const description = document.getElementById('description').value;
    const syllabusFile = document.getElementById('syllabusFile').files[0];

    let syllabus = '';

    if (syllabusFile) {
        const formData = new FormData();
        formData.append('file', syllabusFile);

        try {
            const uploadResponse = await fetch(`${API_BASE}/courses/upload`, {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });

            if (uploadResponse.ok) {
                syllabus = await uploadResponse.text();
            } else {
                alert('File upload failed');
                return;
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('File upload failed');
            return;
        }
    }

    const courseData = {
        name: name,
        hours: hours,
        description: description,
        syllabus: syllabus
    };

    const deadlineVal = document.getElementById('enrollmentDeadline').value;
    if (deadlineVal) {
        courseData.enrollmentDeadline = deadlineVal;
    }

    try {
        let response;
        if (courseId) {
            response = await fetch(`${API_BASE}/courses/${courseId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(courseData),
                credentials: 'include'
            });
        } else {
            response = await fetch(`${API_BASE}/courses`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(courseData),
                credentials: 'include'
            });
        }

        if (response.ok) {
            hideModal();
            showToast(courseId ? 'Course updated successfully!' : 'Course created successfully!', 'success');
            loadCourses();
        } else {
            const error = await response.json();
            showToast('Save failed: ' + (error.message || 'Unknown error'), 'error');
        }
    } catch (error) {
        console.error('Save error:', error);
        alert('Save failed');
    }
}

// 删除课程
async function deleteCourse(courseId) {
    if (confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
        try {
            const response = await fetch(`${API_BASE}/courses/${courseId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (response.ok) {
                showToast('Course deleted successfully!', 'success');
                loadCourses();
            } else if (response.status === 403) {
                showToast('You are not authorized to delete this course', 'error');
            } else {
                showToast('Delete failed', 'error');
            }
        } catch (error) {
            console.error('Delete error:', error);
            showToast('Delete failed', 'error');
        }
    }
}

// 隐藏模态框
function hideModal() {
    const modal = document.getElementById('courseModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// 从路径中提取文件名
function getFilenameFromPath(filePath) {
    if (!filePath) return '';
    return filePath.substring(filePath.lastIndexOf('/') + 1);
}

// 下载文件
async function downloadFile(filename) {
    console.log("Downloading: " + filename);

    try {
        const encodedFilename = encodeURIComponent(filename);
        const url = `${API_BASE}/courses/download/${encodedFilename}`;

        const response = await fetch(url, {
            credentials: 'include'
        });

        if (response.ok) {
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(downloadUrl);
        } else {
            alert('Download failed: File not found');
        }
    } catch (error) {
        console.error('Download error:', error);
        alert('Download error: ' + error.message);
    }
}

// 防XSS攻击
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ========== 通用事件监听 ==========
function setupEventListeners() {
    const addCourseBtn = document.getElementById('addCourseBtn');
    if (addCourseBtn) {
        addCourseBtn.addEventListener('click', showAddModal);
    }

    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
        searchBtn.addEventListener('click', searchCourses);
    }

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') searchCourses();
        });
    }

    const courseForm = document.getElementById('courseForm');
    if (courseForm) {
        courseForm.addEventListener('submit', saveCourse);
    }

    const cancelBtn = document.getElementById('cancelBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', hideModal);
    }

    const closeBtn = document.querySelector('.close');
    if (closeBtn) {
        closeBtn.addEventListener('click', hideModal);
    }
}

// ========== 认证相关函数 ==========

// 检查登录状态
async function checkLoginStatus() {
    try {
        const response = await fetch('/auth/current-user', { credentials: 'include' });
        if (response.ok) {
            const user = await response.json();
            currentUser = {
                id: user.userId,
                username: user.username,
                role: user.role
            };
            updateUIForLoggedInUser();
            loadCourses();
        } else {
            currentUser = null;
            updateUIForLoggedOutUser();
        }
    } catch (error) {
        console.error('Check login status error:', error);
        currentUser = null;
        updateUIForLoggedOutUser();
    }
}

// 登录
async function login(username, password) {
    try {
        const response = await fetch('/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
            credentials: 'include'
        });

        if (response.ok) {
            const data = await response.json();
            currentUser = {
                id: data.userId,
                username: data.username,
                role: data.role
            };
            updateUIForLoggedInUser();
            closeLoginModal();
            showToast('Login successful! Welcome, ' + data.username, 'success');
            loadCourses();
            return true;
        } else {
            const error = await response.json();
            showToast(error.error || 'Login failed', 'error');
            return false;
        }
    } catch (error) {
        console.error('Login error:', error);
        showToast('Login failed', 'error');
        return false;
    }
}

// 注册
async function register(username, email, password) {
    try {
        const response = await fetch('/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password }),
            credentials: 'include'
        });

        if (response.ok) {
            const data = await response.json();
            showToast('Registration successful! Please login.', 'success');
            closeRegisterModal();
            showLoginModal();
            return true;
        } else {
            const error = await response.json();
            showToast(error.error || 'Registration failed', 'error');
            return false;
        }
    } catch (error) {
        console.error('Register error:', error);
        showToast('Registration failed', 'error');
        return false;
    }
}

// 登出
async function logout() {
    try {
        await fetch('/auth/logout', { method: 'POST', credentials: 'include' });
        currentUser = null;
        showMyCoursesOnly = false;
        updateUIForLoggedOutUser();
        loadCourses();
        showToast('Logged out successfully', 'info');
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// 修改密码
async function changePassword(oldPassword, newPassword, confirmPassword) {
    if (newPassword !== confirmPassword) {
        showToast('New passwords do not match', 'error');
        return false;
    }

    try {
        const response = await fetch('/auth/change-password', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ oldPassword, newPassword }),
            credentials: 'include'
        });

        if (response.ok) {
            showToast('Password changed successfully!', 'success');
            closeChangePwdModal();
            return true;
        } else if (response.status === 401 || response.status === 403) {
            showToast('Please login first', 'error');
            showLoginModal();
            return false;
        } else {
            const error = await response.json();
            showToast(error.error || 'Password change failed', 'error');
            return false;
        }
    } catch (error) {
        console.error('Change password error:', error);
        showToast('Password change failed', 'error');
        return false;
    }
}

// 更新UI - 已登录状态
function updateUIForLoggedInUser() {
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const changePwdBtn = document.getElementById('changePwdBtn');
    const addCourseBtn = document.getElementById('addCourseBtn');
    const adminLink = document.getElementById('adminLink');
    const myCoursesBtn = document.getElementById('myCoursesBtn');
    const allCoursesBtn = document.getElementById('allCoursesBtn');

    if (loginBtn) loginBtn.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'inline-block';
    if (changePwdBtn) changePwdBtn.style.display = 'inline-block';

    if (currentUser && currentUser.role === 'ROLE_ADMIN') {
        if (adminLink) adminLink.style.display = 'inline-block';
    } else {
        if (adminLink) adminLink.style.display = 'none';
    }

    if (hasTeacherPermission()) {
        if (addCourseBtn) addCourseBtn.style.display = 'inline-block';
        if (myCoursesBtn) myCoursesBtn.style.display = 'inline-block';
        if (allCoursesBtn) allCoursesBtn.style.display = 'inline-block';
    } else {
        if (addCourseBtn) addCourseBtn.style.display = 'none';
        if (myCoursesBtn) myCoursesBtn.style.display = 'none';
        if (allCoursesBtn) allCoursesBtn.style.display = 'none';
    }
}

// 更新UI - 未登录状态
function updateUIForLoggedOutUser() {
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const changePwdBtn = document.getElementById('changePwdBtn');
    const addCourseBtn = document.getElementById('addCourseBtn');
    const adminLink = document.getElementById('adminLink');
    const myCoursesBtn = document.getElementById('myCoursesBtn');
    const allCoursesBtn = document.getElementById('allCoursesBtn');

    if (loginBtn) loginBtn.style.display = 'inline-block';
    if (logoutBtn) logoutBtn.style.display = 'none';
    if (changePwdBtn) changePwdBtn.style.display = 'none';
    if (addCourseBtn) addCourseBtn.style.display = 'none';
    if (adminLink) adminLink.style.display = 'none';
    if (myCoursesBtn) myCoursesBtn.style.display = 'none';
    if (allCoursesBtn) allCoursesBtn.style.display = 'none';
}

// ========== 模态框控制 ==========

function showLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) modal.style.display = 'flex';
}

function closeLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) modal.style.display = 'none';
    const form = document.getElementById('loginForm');
    if (form) form.reset();
}

function showRegisterModal() {
    const modal = document.getElementById('registerModal');
    if (modal) modal.style.display = 'flex';
}

function closeRegisterModal() {
    const modal = document.getElementById('registerModal');
    if (modal) modal.style.display = 'none';
    const form = document.getElementById('registerForm');
    if (form) form.reset();
}

function showChangePwdModal() {
    const modal = document.getElementById('changePwdModal');
    if (modal) modal.style.display = 'flex';
}

function closeChangePwdModal() {
    const modal = document.getElementById('changePwdModal');
    if (modal) modal.style.display = 'none';
    const form = document.getElementById('changePwdForm');
    if (form) form.reset();
}

// ========== 认证事件监听 ==========
function setupAuthEventListeners() {
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', showLoginModal);
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    const changePwdBtn = document.getElementById('changePwdBtn');
    if (changePwdBtn) {
        changePwdBtn.addEventListener('click', showChangePwdModal);
    }

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('loginUsername').value;
            const password = document.getElementById('loginPassword').value;
            login(username, password);
        });
    }

    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('regUsername').value;
            const email = document.getElementById('regEmail').value;
            const password = document.getElementById('regPassword').value;
            register(username, email, password);
        });
    }

    const changePwdForm = document.getElementById('changePwdForm');
    if (changePwdForm) {
        changePwdForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const oldPassword = document.getElementById('oldPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            changePassword(oldPassword, newPassword, confirmPassword);
        });
    }

    // “我的课程”按钮事件
    const myCoursesBtn = document.getElementById('myCoursesBtn');
    if (myCoursesBtn) {
        myCoursesBtn.addEventListener('click', toggleMyCourses);
    }
}

// ========== 选课相关函数 ==========

// 选课
async function enrollCourse() {
    if (!currentDetailCourseId) return;
    try {
        const response = await fetch(`${API_BASE}/courses/${currentDetailCourseId}/enrollment`, {
            method: 'POST',
            credentials: 'include'
        });
        if (response.ok) {
            showToast('Enrolled successfully!', 'success');
            showCourseDetail(currentDetailCourseId); // Refresh detail
            loadCourses(); // Refresh list
        } else {
            const error = await response.json();
            showToast(error.error || 'Enrollment failed', 'error');
        }
    } catch (error) {
        console.error('Enroll error:', error);
        showToast('Enrollment failed', 'error');
    }
}

// 退课
async function dropCourse() {
    if (!currentDetailCourseId) return;
    if (!confirm('Are you sure you want to drop this course?')) return;
    try {
        const response = await fetch(`${API_BASE}/courses/${currentDetailCourseId}/enrollment`, {
            method: 'DELETE',
            credentials: 'include'
        });
        if (response.ok) {
            showToast('Dropped successfully!', 'success');
            showCourseDetail(currentDetailCourseId);
            loadCourses();
        } else {
            const error = await response.json();
            showToast(error.error || 'Drop failed', 'error');
        }
    } catch (error) {
        console.error('Drop error:', error);
        showToast('Drop failed', 'error');
    }
}

// 在详情弹窗中加载选课学生列表
async function loadEnrolledStudentsInDetail(courseId) {
    try {
        const response = await fetch(`${API_BASE}/courses/${courseId}/enrollment/students`, {
            credentials: 'include'
        });
        if (response.ok) {
            const students = await response.json();
            renderEnrolledStudents(students);
        }
    } catch (error) {
        console.error('Load enrolled students error:', error);
    }
}

// 从课程卡片查看选课学生
async function viewEnrolledStudents(courseId) {
    currentDetailCourseId = courseId;
    try {
        const response = await fetch(`${API_BASE}/courses/${courseId}/enrollment/students`, {
            credentials: 'include'
        });
        if (response.ok) {
            const students = await response.json();
            renderEnrolledStudents(students);
            document.getElementById('enrolledStudentsSection').style.display = 'block';
            showToast(`Loaded ${students.length} enrolled students`, 'info');
        } else {
            showToast('Failed to load enrolled students', 'error');
        }
    } catch (error) {
        console.error('Load enrolled students error:', error);
        showToast('Failed to load enrolled students', 'error');
    }
}

// 渲染选课学生列表
function renderEnrolledStudents(students) {
    const container = document.getElementById('enrolledStudentsList');
    if (!container) return;

    if (!students || students.length === 0) {
        container.innerHTML = '<p class="no-students">No students enrolled yet.</p>';
        return;
    }

    let html = '<table class="students-table"><thead><tr><th>#</th><th>Username</th><th>Email</th><th>Enrolled At</th></tr></thead><tbody>';
    students.forEach((student, index) => {
        const enrolledAt = student.enrolledAt ? new Date(student.enrolledAt).toLocaleString() : 'N/A';
        html += `<tr>
            <td>${index + 1}</td>
            <td>${escapeHtml(student.username)}</td>
            <td>${escapeHtml(student.email)}</td>
            <td>${enrolledAt}</td>
        </tr>`;
    });
    html += '</tbody></table>';
    container.innerHTML = html;
}