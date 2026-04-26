Tên Dự án: LearnUP
1. Tổng quan Dự án (Project Overview)
Ứng dụng học tiếng Anh LearnUP, hỗ trợ học viên học tiếng Anh. Hệ thống bao gồm:

Frontend: HTML, CSS, JavaScript.
Backend: FastAPI, tuân thủ RESTful API.
Database: MySQL (tương tác trực tiếp bằng mysql.connector).
Authentication: Xác thực phân quyền bằng JWT và bcrypt.
Các tính năng chính (Key Features)
Quản lý Tài khoản: Phân quyền rõ ràng cho Admin và Người học.
Quản lý Bài viết: API tạo và quản lý bài viết.
Quản lý Tài liệu: API tạo và quản lý tài liệu.
Quản lý Câu hỏi: API tạo và quản lý câu hỏi.
Quản lý Câu trả lời: API tạo và quản lý câu trả lời.
2. Hướng dẫn Cài đặt & Chạy Local (Setup & Run)
Yêu cầu (Prerequisites)
Python (v3.10 trở lên).
MySQL Server hoặc XAMPP (đã cài đặt và đang chạy).
Git.
Bước 1: Clone dự án
git clone https://github.com/Hoa2-p/English-learning-app.git
cd English-learning-app
Bước 2: Cài đặt Dependencies
# Cài Frontend
pip install -r requirements.txt

# Cài Backend
cd backend
pip install -r requirements.txt
cd ..
Bước 3: Khởi tạo Database
Mở MySQL Workbench, phpMyAdmin hoặc Command Line.
Import file backend/database.sql — file này sẽ tự động tạo database learnup và toàn bộ bảng.
Bước 4: Cấu hình Môi trường (.env)
Tạo file .env tại thư mục backend/ với nội dung sau:

PORT=5000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=LearnUp

# Cấu hình gửi mail (Quên mật khẩu)
EMAIL_USER=
EMAIL_PASS=
Lưu ý: Chỉnh DB_PORT và DB_PASSWORD cho khớp với MySQL của bạn. XAMPP thường dùng port 3307, MySQL standalone dùng 3306. Lưu ý tính năng Quên mật khẩu: Để hệ thống gửi email thật, hãy tạo "App Password" của Gmail và điền vào 2 biến EMAIL_USER và EMAIL_PASS. Nếu bỏ trống, hệ thống sẽ tự động sinh link test thư giả lập ra Terminal.

Bước 5: Sinh dữ liệu mẫu (Seed Data)
cd backend
python seed_data.py
Script này tự động tạo bài viết mẫu.

Bước 6: Chạy dự án
Terminal 1 — Backend:

cd backend
python main.py
Server chạy tại http://localhost:8001.

Terminal 2 — Frontend:

live server
Giao diện chạy tại http://localhost:5500.

3. Cấu trúc Dự án (Project Structure)
np-education/
├── src/                    # Frontend (HTML, CSS, JavaScript)
│   ├── components/         # Các Widget UI (Dashboard, Schedule...)
│   ├── api.js              # Cấu hình gọi API
│   ├── App.jsx             # Logic chính Frontend
│   └── index.css           # Global Styles
├── backend/                # Backend (Python)
│   ├── config/             # Cấu hình kết nối MySQL (db.js)
│   ├── controllers/        # Xử lý Logic (auth, class, schedule...)
│   ├── middleware/         # Xác thực JWT Token và Phân quyền (RBAC)
│   ├── routes/             # Cấu hình API Endpoints
│   ├── database.sql        # File SQL tạo bảng Schema trống
│   ├── seed-data.py        # File rải dữ liệu mồi bằng Python
│   ├── server.py           # Entry point của toàn bộ Server
│   └── generate-postman.js # Tự sinh file cấu hình test API cho Postman
├── .env                    # (Nên đưa vào .gitignore) Biến môi trường
├── requirements.txt            # Quản lý dependencies chung
└── README.md               # Sổ tay dự án này
