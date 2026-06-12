"""
Password Reset Service — OTP via Gmail SMTP.
Flow: request_otp → verify_otp → reset_password
"""
import random
import string
import smtplib
import time
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from config.settings import EMAIL_USER, EMAIL_PASS
from utils.exceptions import BadRequestException, NotFoundException

# In-memory OTP store: {email: {"otp": str, "expires_at": float, "verified": bool}}
_otp_store: dict = {}

OTP_EXPIRY_SECONDS = 600  # 10 minutes


def _generate_otp(length: int = 6) -> str:
    """Tạo mã OTP số ngẫu nhiên."""
    return ''.join(random.choices(string.digits, k=length))


def _send_otp_email(to_email: str, otp: str) -> bool:
    """Gửi email chứa OTP qua Gmail SMTP."""
    if not EMAIL_USER or not EMAIL_PASS:
        # Dev mode — just print the OTP
        print(f"[DEV] OTP for {to_email}: {otp}")
        return True

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "LearnUP — Password Reset Code"
        msg["From"] = EMAIL_USER
        msg["To"] = to_email

        html_body = f"""
        <!DOCTYPE html>
        <html>
        <body style="margin:0;padding:0;font-family:'Nunito',sans-serif;background:#f8fafc;">
          <div style="max-width:480px;margin:40px auto;background:#fff;border-radius:16px;
                      border:1px solid #e2e8f0;overflow:hidden;">
            <!-- Header -->
            <div style="background:linear-gradient(135deg,#2563eb,#3b82f6);padding:32px 40px;text-align:center;">
              <div style="font-size:32px;font-weight:900;color:#fff;letter-spacing:-1px;">LearnUP</div>
              <div style="color:#bfdbfe;font-size:13px;margin-top:4px;">Master English Every Day</div>
            </div>
            <!-- Body -->
            <div style="padding:40px;">
              <h2 style="color:#0f172a;font-size:22px;font-weight:700;margin:0 0 8px;">
                Reset Your Password
              </h2>
              <p style="color:#64748b;font-size:15px;margin:0 0 32px;">
                Use the code below to reset your password. It expires in <strong>10 minutes</strong>.
              </p>
              <!-- OTP Box -->
              <div style="background:#eff6ff;border:2px dashed #2563eb;border-radius:12px;
                          padding:24px;text-align:center;margin-bottom:32px;">
                <div style="font-size:42px;font-weight:900;letter-spacing:12px;color:#2563eb;
                            font-family:monospace;">{otp}</div>
                <div style="color:#64748b;font-size:13px;margin-top:8px;">
                  This code is valid for 10 minutes
                </div>
              </div>
              <p style="color:#94a3b8;font-size:13px;margin:0;">
                If you didn't request a password reset, you can safely ignore this email.
              </p>
            </div>
            <!-- Footer -->
            <div style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;
                        text-align:center;color:#94a3b8;font-size:12px;">
              © 2026 LearnUP · All rights reserved
            </div>
          </div>
        </body>
        </html>
        """

        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(EMAIL_USER, EMAIL_PASS)
            server.sendmail(EMAIL_USER, to_email, msg.as_string())
        return True

    except Exception as e:
        print(f"[Email] Failed to send OTP to {to_email}: {e}")
        return False


def request_otp(email: str, conn) -> dict:
    """
    Bước 1: Tạo OTP và gửi email.
    """
    from repositories import user_repository

    user = user_repository.find_by_email(conn, email)
    if not user:
        raise NotFoundException("No account found with this email address.")

    otp = _generate_otp()
    _otp_store[email] = {
        "otp": otp,
        "expires_at": time.time() + OTP_EXPIRY_SECONDS,
        "verified": False,
    }

    sent = _send_otp_email(email, otp)

    return {
        "success": True,
        "message": "A verification code has been sent to your email." if sent else
                   "OTP generated (email not configured — check server logs).",
        "dev_otp": otp if not (EMAIL_USER and EMAIL_PASS) else None,
    }


def verify_otp(email: str, otp: str) -> dict:
    """
    Bước 2: Xác minh OTP.
    """
    entry = _otp_store.get(email)
    if not entry:
        raise BadRequestException("No OTP requested for this email. Please request again.")

    if time.time() > entry["expires_at"]:
        del _otp_store[email]
        raise BadRequestException("OTP has expired. Please request a new one.")

    if entry["otp"] != otp.strip():
        raise BadRequestException("Invalid verification code. Please try again.")

    # Mark as verified — allow password reset
    _otp_store[email]["verified"] = True

    return {"success": True, "message": "OTP verified successfully."}


def reset_password(email: str, new_password: str, conn) -> dict:
    """
    Bước 3: Đặt mật khẩu mới (chỉ sau khi OTP đã verified).
    """
    from repositories import user_repository
    from services.auth_service import hash_password

    entry = _otp_store.get(email)
    if not entry or not entry.get("verified"):
        raise BadRequestException("Please verify your OTP before resetting password.")

    if time.time() > entry["expires_at"]:
        del _otp_store[email]
        raise BadRequestException("Session expired. Please start over.")

    if len(new_password) < 8:
        raise BadRequestException("Password must be at least 8 characters long.")

    new_hash = hash_password(new_password)
    updated = user_repository.update_password_by_email(conn, email, new_hash)
    if not updated:
        raise NotFoundException("User not found.")

    # Clean up OTP store
    del _otp_store[email]

    return {"success": True, "message": "Password reset successfully. You can now log in."}
