-- Khởi tạo Database LearnUp
CREATE DATABASE IF NOT EXISTS LearnUp 
DEFAULT CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;
-- → Tạo DB hỗ trợ tiếng Việt + emoji

USE LearnUp;
-- → Chọn DB để làm việc

-- =============================
-- 2. XÓA BẢNG CŨ (RESET DB)
-- =============================
-- Lưu ý: Xóa bảng con trước (có FK), rồi mới bảng cha
DROP TABLE IF EXISTS article_tags;
DROP TABLE IF EXISTS vocabularies;
DROP TABLE IF EXISTS quiz_attempt_questions;
DROP TABLE IF EXISTS quiz_attempts;
DROP TABLE IF EXISTS quiz_questions;
DROP TABLE IF EXISTS tags;
DROP TABLE IF EXISTS articles;
DROP TABLE IF EXISTS users;

-- =============================
-- 3. BẢNG USERS (NGƯỜI DÙNG)
-- =============================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY, -- ID tự tăng
    email VARCHAR(255) NOT NULL UNIQUE, -- Email đăng nhập (không trùng)
    password_hash VARCHAR(255) NOT NULL, -- Mật khẩu đã mã hóa
    name VARCHAR(255) NOT NULL, -- Tên người dùng
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Thời gian tạo
    role ENUM('user', 'admin') DEFAULT 'user' -- Phân quyền
);

-- 2. Bảng Người dùng chung
-- CREATE TABLE users (
--     id INT AUTO_INCREMENT PRIMARY KEY,
--     email VARCHAR(255) NOT NULL UNIQUE,
--     password_hash VARCHAR(255) NOT NULL,
--     name VARCHAR(255) NOT NULL,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--      role ENUM('user', 'admin') DEFAULT 'user'
-- );

-- =============================
-- 4. BẢNG ARTICLES (BÀI VIẾT)
-- =============================
CREATE TABLE articles (
    id VARCHAR(36) PRIMARY KEY, 
    -- → Dùng UUID (KHÔNG dùng AUTO_INCREMENT với VARCHAR)
    title VARCHAR(255) NOT NULL UNIQUE, -- Tiêu đề bài viết
    content TEXT, -- Nội dung
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Ngày tạo
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- Ngày update
    image_url VARCHAR(2083), -- Link ảnh
    difficulty ENUM('Beginner', 'Intermediate', 'Advanced') DEFAULT 'Beginner'
);

-- =============================
-- 5. BẢNG TAGS (CHỦ ĐỀ)
-- =============================
CREATE TABLE tags (
    id INT AUTO_INCREMENT PRIMARY KEY, -- ID tự tăng
    name VARCHAR(50) NOT NULL -- Tên tag (vd: TOEIC, Grammar)
);

-- =============================
-- 6. BẢNG ARTICLE_TAGS (N-N)
-- =============================
CREATE TABLE article_tags (
    article_id VARCHAR(36), -- FK tới articles
    tag_id INT, -- FK tới tags
    PRIMARY KEY (article_id, tag_id), -- Khóa chính kép
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
    -- → Xóa article → xóa luôn liên kết
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    -- → Xóa tag → xóa luôn liên kết
);

-- =============================
-- 7. BẢNG VOCABULARIES (TỪ VỰNG)
-- =============================
CREATE TABLE vocabularies (
    id CHAR(36) PRIMARY KEY,
    -- → UUID (KHÔNG dùng AUTO_INCREMENT với CHAR)
    user_id INT, -- Người học từ
    word VARCHAR(255) NOT NULL, -- Từ vựng
    article_id VARCHAR(36), -- Lấy từ bài viết nào
    phonetic VARCHAR(255),
    definition TEXT,
    example TEXT,
    vietnamese TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    -- → Xóa user → xóa vocab của user
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
    -- → Xóa article → xóa vocab liên quan
);

-- =============================
-- 8. BẢNG QUIZ QUESTIONS
-- =============================
CREATE TABLE quiz_questions (
    id INT AUTO_INCREMENT PRIMARY KEY, -- ID câu hỏi
    question TEXT, -- Nội dung câu hỏi
    correct_answer VARCHAR(255), -- Đáp án đúng
    wrong1 VARCHAR(255), -- Đáp án sai 1
    wrong2 VARCHAR(255), -- Đáp án sai 2
    wrong3 VARCHAR(255), -- Đáp án sai 3
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================
-- 9. BẢNG QUIZ ATTEMPTS (LẦN LÀM BÀI)
-- =============================
CREATE TABLE quiz_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY, -- ID attempt
    user_id INT, -- Người làm bài
    total_questions INT, -- Tổng câu
    correct_answers INT, -- Số câu đúng
    started_at TIMESTAMP, -- Bắt đầu
    ended_at TIMESTAMP, -- Kết thúc

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    -- → Xóa user → xóa toàn bộ lịch sử làm bài
);
-- =============================
-- 10. BẢNG QUIZ ATTEMPT QUESTIONS
-- =============================
CREATE TABLE quiz_attempt_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    attempt_id INT, -- Thuộc attempt nào
    question_id INT, -- Câu hỏi nào
    selected_answer VARCHAR(255), -- User chọn gì
    is_correct TINYINT(1), -- Đúng hay sai (0/1)
    FOREIGN KEY (attempt_id) REFERENCES quiz_attempts(id) ON DELETE CASCADE,
    -- → Xóa attempt → xóa chi tiết
    FOREIGN KEY (question_id) REFERENCES quiz_questions(id) ON DELETE CASCADE
    -- → Xóa question → xóa dữ liệu liên quan
);