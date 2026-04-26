"""
Script tao du lieu mau day du cho database LearnUp.
Bao gom: Users, Tags, Articles, Article_Tags, Vocabularies,
          Quiz Questions, Quiz Attempts, Quiz Attempt Questions.
Chay: python seed_data.py
"""
import sys
import io
import mysql.connector
import uuid
import os
import bcrypt
import requests
import time
from datetime import datetime, timedelta
from dotenv import load_dotenv
from config.database import DB_CONFIG

# Fix Unicode output on Windows console
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

load_dotenv()


def fetch_word_data(word):
    """Goi API de lay phonetic, definition, example, vietnamese cho 1 tu."""
    phonetic = ""
    definition = ""
    example = ""
    vietnamese = ""

    # 1. Dictionary API
    try:
        resp = requests.get(
            f"https://api.dictionaryapi.dev/api/v2/entries/en/{requests.utils.quote(word)}",
            timeout=10
        )
        if resp.status_code == 200:
            data = resp.json()
            if data and len(data) > 0:
                entry = data[0]
                # Phonetic
                for p in entry.get("phonetics", []):
                    if p.get("text"):
                        phonetic = p["text"]
                        break
                # Definition + Example
                meanings = entry.get("meanings", [])
                if meanings:
                    defs = meanings[0].get("definitions", [])
                    if defs:
                        definition = defs[0].get("definition", "")
                        example = defs[0].get("example", "")
    except Exception as e:
        print(f"     [WARN] Dictionary API failed for '{word}': {e}")

    # 2. MyMemory Translation API (EN -> VI)
    try:
        resp = requests.get(
            f"https://api.mymemory.translated.net/get?q={requests.utils.quote(word)}&langpair=en|vi",
            timeout=10
        )
        if resp.status_code == 200:
            data = resp.json()
            if data.get("responseStatus") == 200:
                vietnamese = data.get("responseData", {}).get("translatedText", "")
    except Exception as e:
        print(f"     [WARN] MyMemory API failed for '{word}': {e}")

    return phonetic, definition, example, vietnamese


def seed():
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()

    try:
        # ========================================
        # 0. XOA DU LIEU CU (theo thu tu FK)
        # ========================================
        print("[*] Dang xoa du lieu cu...")
        cursor.execute("DELETE FROM quiz_attempt_questions")
        cursor.execute("DELETE FROM quiz_attempts")
        cursor.execute("DELETE FROM quiz_questions")
        cursor.execute("DELETE FROM vocabularies")
        cursor.execute("DELETE FROM article_tags")
        cursor.execute("DELETE FROM articles")
        cursor.execute("DELETE FROM tags")
        cursor.execute("DELETE FROM users")
        conn.commit()

        # ========================================
        # 1. TAO USERS (2 user + 1 admin)
        # ========================================
        print("[*] Dang tao users...")
        default_pwd = b"12345678"
        hashed_pwd = bcrypt.hashpw(default_pwd, bcrypt.gensalt()).decode('utf-8')

        users_data = [
            ("user1@gmail.com", hashed_pwd, "Nguyen Van A", "user"),
            ("user2@gmail.com", hashed_pwd, "Tran Thi B", "user"),
            ("admin1@gmail.com", hashed_pwd, "Admin LearnUp", "admin"),
        ]
        for email, pwd, name, role in users_data:
            cursor.execute(
                "INSERT INTO users (email, password_hash, name, role) VALUES (%s, %s, %s, %s)",
                (email, pwd, name, role),
            )
        conn.commit()

        # Lay user IDs
        cursor.execute("SELECT id, email FROM users")
        user_map = {email: uid for uid, email in cursor.fetchall()}
        user1_id = user_map["user1@gmail.com"]
        user2_id = user_map["user2@gmail.com"]
        print(f"   [OK] Tao {len(users_data)} users (password mac dinh: 12345678)")

        # ========================================
        # 2. TAO TAGS
        # ========================================
        print("[*] Dang tao tags...")
        tags = ["Sport", "Business", "Culture", "Science", "Lifestyle", "Technology"]
        for tag_name in tags:
            cursor.execute("INSERT INTO tags (name) VALUES (%s)", (tag_name,))
        conn.commit()

        # Lay tag IDs
        cursor.execute("SELECT id, name FROM tags")
        tag_map = {name: tid for tid, name in cursor.fetchall()}
        print(f"   [OK] Tao {len(tags)} tags: {', '.join(tags)}")

        # ========================================
        # 3. TAO ARTICLES + ARTICLE_TAGS
        # ========================================
        print("[*] Dang tao articles...")
        articles = [
            {
                "title": "DOMIXI: another hamstring injury",
                "content": "Reece James has suffered the 10th hamstring injury of his career. The Chelsea defender is expected to be out for several months. This continuous string of injuries has raised questions about his long-term career prospects at the highest level of football.\n\nKey vocabulary:\n- hamstring (n): co gan kheo\n- injury (n): chan thuong\n- defender (n): hau ve\n- career prospects (n): trien vong nghe nghiep",
                "image_url": "https://images.unsplash.com/photo-1600250644078-d50d03bfa8dc?w=500&q=80",
                "tags": ["Sport"],
            },
            {
                "title": "Laporta after Barcelona re-election",
                "content": "Joan Laporta said the door is always open for Lionel Messi to return to Barcelona. After winning the re-election as club president, Laporta outlined his vision for the future of the club, emphasizing youth development and financial stability.\n\nKey vocabulary:\n- re-election (n): tai dac cu\n- president (n): chu tich\n- emphasize (v): nhan manh\n- financial stability (n): on dinh tai chinh",
                "image_url": "https://images.unsplash.com/photo-1508344928928-7165b67de128?w=500&q=80",
                "tags": ["Sport"],
            },
            {
                "title": "Manchester City need perfect game to get past Real Madrid",
                "content": "Pep Guardiola believes Manchester City must play the perfect game to eliminate Real Madrid from the Champions League. The tactical battle between two of Europe's elite coaches promises to be one of the most compelling matchups this season.\n\nKey vocabulary:\n- eliminate (v): loai, loai bo\n- tactical (adj): chien thuat\n- elite (adj): tinh hoa, hang dau\n- compelling (adj): hap dan, loi cuon",
                "image_url": "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=500&q=80",
                "tags": ["Sport"],
            },
            {
                "title": "The Future of Remote Work in 2026",
                "content": "As companies continue to adapt to hybrid work models, new studies show that remote workers report higher productivity levels. However, challenges around collaboration and company culture remain significant concerns for business leaders worldwide.\n\nThe shift toward remote work has accelerated the adoption of digital tools and platforms, fundamentally changing how teams communicate and collaborate across different time zones.\n\nKey vocabulary:\n- hybrid (adj): lai, ket hop\n- productivity (n): nang suat\n- collaboration (n): su hop tac\n- accelerate (v): tang toc",
                "image_url": "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=500&q=80",
                "tags": ["Business", "Lifestyle"],
            },
            {
                "title": "AI Revolution: How Machine Learning is Changing Healthcare",
                "content": "Artificial intelligence is transforming the healthcare industry, from early disease detection to personalized treatment plans. Researchers have developed new algorithms that can predict patient outcomes with unprecedented accuracy, potentially saving millions of lives.\n\nDeep learning models are now capable of analyzing medical images, identifying patterns that even experienced radiologists might miss, marking a new era in diagnostic medicine.\n\nKey vocabulary:\n- artificial intelligence (n): tri tue nhan tao\n- algorithm (n): thuat toan\n- unprecedented (adj): chua tung co\n- diagnostic (adj): chan doan",
                "image_url": "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=500&q=80",
                "tags": ["Science", "Technology"],
            },
            {
                "title": "Japanese Tea Ceremony: A Window into Traditional Culture",
                "content": "The Japanese tea ceremony, known as chanoyu, is much more than just drinking tea. It represents harmony, respect, purity, and tranquility. This ancient practice continues to influence modern Japanese culture and has gained appreciation worldwide.\n\nEvery element of the ceremony - from the arrangement of flowers to the selection of utensils - carries deep symbolic meaning and reflects centuries of refined aesthetic sensibility.\n\nKey vocabulary:\n- ceremony (n): nghi le\n- harmony (n): su hai hoa\n- tranquility (n): su yen binh\n- aesthetic (adj): tham my",
                "image_url": "https://images.unsplash.com/photo-1545048702-79362596cdc9?w=500&q=80",
                "tags": ["Culture", "Lifestyle"],
            },
            {
                "title": "Climate Change and the Global Economy",
                "content": "Climate change poses one of the greatest challenges to the global economy. Rising temperatures, extreme weather events, and sea-level rise threaten infrastructure, agriculture, and public health systems around the world.\n\nEconomists estimate that without significant intervention, climate change could reduce global GDP by up to 23 percent by 2100. However, the transition to a green economy also presents enormous business opportunities.\n\nKey vocabulary:\n- climate change (n): bien doi khi hau\n- infrastructure (n): co so ha tang\n- intervention (n): su can thiep\n- transition (n): su chuyen doi",
                "image_url": "https://images.unsplash.com/photo-1569163139394-de4e4f43e4e3?w=500&q=80",
                "tags": ["Science", "Business"],
            },
            {
                "title": "The Rise of Electric Vehicles in Southeast Asia",
                "content": "Southeast Asia is experiencing a rapid shift toward electric vehicles (EVs), driven by government incentives, environmental awareness, and falling battery costs. Vietnam, Thailand, and Indonesia are leading the charge in EV adoption across the region.\n\nMajor automakers are investing billions in EV manufacturing plants across the region, creating new jobs and transforming the traditional automotive supply chain.\n\nKey vocabulary:\n- electric vehicle (n): xe dien\n- incentive (n): uu dai, khuyen khich\n- adoption (n): su chap nhan, ung dung\n- supply chain (n): chuoi cung ung",
                "image_url": "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=500&q=80",
                "tags": ["Technology", "Business"],
            },
            {
                "title": "Meditation and Mental Health Benefits",
                "content": "Scientific research increasingly supports the mental health benefits of regular meditation practice. Studies show that just 10 minutes of daily meditation can reduce anxiety, improve focus, and enhance emotional regulation.\n\nMindfulness meditation, in particular, has been shown to physically change brain structure, increasing gray matter density in areas associated with learning, memory, and self-awareness.\n\nKey vocabulary:\n- meditation (n): thien\n- anxiety (n): lo au\n- emotional regulation (n): dieu tiet cam xuc\n- mindfulness (n): chanh niem",
                "image_url": "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=500&q=80",
                "tags": ["Lifestyle", "Science"],
            },
            {
                "title": "Street Food Culture Around the World",
                "content": "Street food is more than just quick, affordable meals - it is a window into a country's culture, history, and identity. From Vietnamese pho to Mexican tacos, street food tells the story of a nation's culinary traditions and social fabric.\n\nIn recent years, street food has gained recognition from food critics and institutions alike, with several street food vendors receiving prestigious awards and even Michelin stars.\n\nKey vocabulary:\n- affordable (adj): gia phai chang\n- culinary (adj): thuoc ve am thuc\n- vendor (n): nguoi ban hang\n- prestigious (adj): danh gia",
                "image_url": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500&q=80",
                "tags": ["Culture", "Lifestyle"],
            },
        ]

        article_ids = []
        for article in articles:
            article_id = str(uuid.uuid4())
            article_ids.append(article_id)
            cursor.execute(
                "INSERT INTO articles (id, title, content, image_url) VALUES (%s, %s, %s, %s)",
                (article_id, article["title"], article["content"], article["image_url"]),
            )
            # Gan tags
            for tag_name in article["tags"]:
                tag_id = tag_map.get(tag_name)
                if tag_id:
                    cursor.execute(
                        "INSERT INTO article_tags (article_id, tag_id) VALUES (%s, %s)",
                        (article_id, tag_id),
                    )
        conn.commit()
        print(f"   [OK] Tao {len(articles)} articles voi tags lien ket")

        # ========================================
        # 4. TAO VOCABULARIES
        # ========================================
        print("[*] Dang tao vocabularies...")
        vocabularies = [
            # User 1 - bat dau voi library rong (tu vung se duoc luu tu bai viet)
            # User 2 - tu vung mau
            (user2_id, "infrastructure", article_ids[6]),
            (user2_id, "transition", article_ids[6]),
            (user2_id, "incentive", article_ids[7]),
            (user2_id, "supply chain", article_ids[7]),
            (user2_id, "meditation", article_ids[8]),
            (user2_id, "anxiety", article_ids[8]),
            (user2_id, "affordable", article_ids[9]),
            (user2_id, "prestigious", article_ids[9]),
        ]
        for user_id, word, art_id in vocabularies:
            vocab_id = str(uuid.uuid4())
            print(f"     Fetching data for '{word}'...")
            phonetic, definition, example, vietnamese = fetch_word_data(word)
            cursor.execute(
                """INSERT INTO vocabularies (id, user_id, word, article_id, phonetic, definition, example, vietnamese)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
                (vocab_id, user_id, word, art_id, phonetic, definition, example, vietnamese),
            )
            time.sleep(0.3)  # Rate limit: tranh spam API
        conn.commit()
        print(f"   [OK] Tao {len(vocabularies)} tu vung voi du lieu tu API")

        # ========================================
        # 5. TAO QUIZ QUESTIONS (20 cau)
        # ========================================
        print("[*] Dang tao quiz questions...")
        quiz_questions = [
            # --- Grammar ---
            ("What is the past tense of 'go'?", "went", "goes", "gone", "going"),
            ("Choose the correct sentence:", "She has been working here since 2020.", "She have been working here since 2020.", "She has been work here since 2020.", "She been working here since 2020."),
            ("Which word is an adjective?", "beautiful", "beautifully", "beauty", "beautify"),
            ("Fill in the blank: If I ___ rich, I would travel the world.", "were", "am", "was been", "will be"),
            ("Choose the correct form: She suggested ___ to the park.", "going", "to going", "go", "went"),
            # --- Vocabulary ---
            ("What does 'unprecedented' mean?", "Never done or known before", "Very common", "Expected", "Repeated"),
            ("The word 'collaborate' means:", "To work together", "To compete", "To argue", "To separate"),
            ("What is the synonym of 'eliminate'?", "Remove", "Add", "Include", "Create"),
            ("'Aesthetic' relates to:", "Beauty and art appreciation", "Mathematics", "Physical exercise", "Cooking"),
            ("What does 'infrastructure' mean?", "Basic physical structures needed for society", "A type of building material", "The design of furniture", "A method of transport"),
            # --- Reading Comprehension ---
            ("In the phrase 'financial stability', what does 'stability' mean?", "The state of being steady and not changing", "The growth of money", "The decline of economy", "The exchange of currency"),
            ("What is a 'hybrid work model'?", "A mix of remote and office work", "Working only from home", "Working only in office", "Working while traveling"),
            ("'Culinary traditions' refers to:", "Food and cooking customs", "Sports activities", "Religious ceremonies", "Musical performances"),
            ("What does 'adoption' mean in a technology context?", "The acceptance and use of something new", "Legally taking someone's child", "The rejection of old methods", "A training program"),
            ("The phrase 'career prospects' means:", "Future opportunities in one's job", "Current salary", "Past achievements", "Work schedule"),
            # --- Common Phrases ---
            ("What does 'break a leg' mean?", "Good luck", "Get injured", "Run fast", "Take a rest"),
            ("'Under the weather' means:", "Feeling sick or unwell", "Standing in the rain", "Being cold", "Looking at the sky"),
            ("What does 'get past' mean in 'City need to get past Real Madrid'?", "To defeat or overcome", "To walk behind", "To ignore", "To greet"),
            ("'Raise questions' means:", "To cause people to have doubts", "To answer questions", "To write questions", "To avoid questions"),
            ("What does 'play it by ear' mean?", "To improvise or decide as things happen", "To listen to music", "To practice piano", "To follow strict rules"),
        ]

        for q_data in quiz_questions:
            cursor.execute(
                """INSERT INTO quiz_questions (question, correct_answer, wrong1, wrong2, wrong3)
                   VALUES (%s, %s, %s, %s, %s)""",
                q_data,
            )
        conn.commit()

        # Lay question IDs
        cursor.execute("SELECT id FROM quiz_questions ORDER BY id")
        question_ids = [row[0] for row in cursor.fetchall()]
        print(f"   [OK] Tao {len(quiz_questions)} cau hoi quiz")

        # ========================================
        # 6. TAO QUIZ ATTEMPTS + CHI TIET
        # ========================================
        print("[*] Dang tao quiz attempts...")

        now = datetime.now()

        # --- Attempt 1: User 1 lam 10 cau dau, dung 7 ---
        attempt1_start = now - timedelta(days=3, hours=2)
        attempt1_end = attempt1_start + timedelta(minutes=15)
        cursor.execute(
            """INSERT INTO quiz_attempts (user_id, total_questions, correct_answers, started_at, ended_at)
               VALUES (%s, %s, %s, %s, %s)""",
            (user1_id, 10, 7, attempt1_start, attempt1_end),
        )
        attempt1_id = cursor.lastrowid

        # Chi tiet attempt 1 (10 cau dau)
        attempt1_answers = [
            (question_ids[0], "went", 1),
            (question_ids[1], "She has been working here since 2020.", 1),
            (question_ids[2], "beautiful", 1),
            (question_ids[3], "am", 0),            # sai
            (question_ids[4], "going", 1),
            (question_ids[5], "Never done or known before", 1),
            (question_ids[6], "To compete", 0),     # sai
            (question_ids[7], "Remove", 1),
            (question_ids[8], "Mathematics", 0),     # sai
            (question_ids[9], "Basic physical structures needed for society", 1),
        ]
        for q_id, answer, correct in attempt1_answers:
            cursor.execute(
                """INSERT INTO quiz_attempt_questions (attempt_id, question_id, selected_answer, is_correct)
                   VALUES (%s, %s, %s, %s)""",
                (attempt1_id, q_id, answer, correct),
            )

        # --- Attempt 2: User 1 lam 10 cau cuoi, dung 8 ---
        attempt2_start = now - timedelta(days=1, hours=5)
        attempt2_end = attempt2_start + timedelta(minutes=12)
        cursor.execute(
            """INSERT INTO quiz_attempts (user_id, total_questions, correct_answers, started_at, ended_at)
               VALUES (%s, %s, %s, %s, %s)""",
            (user1_id, 10, 8, attempt2_start, attempt2_end),
        )
        attempt2_id = cursor.lastrowid

        attempt2_answers = [
            (question_ids[10], "The state of being steady and not changing", 1),
            (question_ids[11], "A mix of remote and office work", 1),
            (question_ids[12], "Food and cooking customs", 1),
            (question_ids[13], "The acceptance and use of something new", 1),
            (question_ids[14], "Future opportunities in one's job", 1),
            (question_ids[15], "Good luck", 1),
            (question_ids[16], "Being cold", 0),     # sai
            (question_ids[17], "To defeat or overcome", 1),
            (question_ids[18], "To answer questions", 0),  # sai
            (question_ids[19], "To improvise or decide as things happen", 1),
        ]
        for q_id, answer, correct in attempt2_answers:
            cursor.execute(
                """INSERT INTO quiz_attempt_questions (attempt_id, question_id, selected_answer, is_correct)
                   VALUES (%s, %s, %s, %s)""",
                (attempt2_id, q_id, answer, correct),
            )

        # --- Attempt 3: User 2 lam 10 cau, dung 6 ---
        attempt3_start = now - timedelta(hours=8)
        attempt3_end = attempt3_start + timedelta(minutes=20)
        cursor.execute(
            """INSERT INTO quiz_attempts (user_id, total_questions, correct_answers, started_at, ended_at)
               VALUES (%s, %s, %s, %s, %s)""",
            (user2_id, 10, 6, attempt3_start, attempt3_end),
        )
        attempt3_id = cursor.lastrowid

        attempt3_answers = [
            (question_ids[0], "went", 1),
            (question_ids[1], "She have been working here since 2020.", 0),  # sai
            (question_ids[2], "beautifully", 0),     # sai
            (question_ids[3], "were", 1),
            (question_ids[4], "going", 1),
            (question_ids[5], "Very common", 0),     # sai
            (question_ids[6], "To work together", 1),
            (question_ids[7], "Remove", 1),
            (question_ids[8], "Beauty and art appreciation", 1),
            (question_ids[9], "A type of building material", 0),  # sai
        ]
        for q_id, answer, correct in attempt3_answers:
            cursor.execute(
                """INSERT INTO quiz_attempt_questions (attempt_id, question_id, selected_answer, is_correct)
                   VALUES (%s, %s, %s, %s)""",
                (attempt3_id, q_id, answer, correct),
            )

        conn.commit()
        print(f"   [OK] Tao 3 quiz attempts voi chi tiet cau tra loi")

        # ========================================
        # TONG KET
        # ========================================
        print("")
        print("=" * 50)
        print("  SEED DATA THANH CONG!")
        print("=" * 50)
        print(f"   Users:              {len(users_data)} (2 user + 1 admin)")
        print(f"   Tags:               {len(tags)}")
        print(f"   Articles:           {len(articles)}")
        print(f"   Vocabularies:       {len(vocabularies)}")
        print(f"   Quiz Questions:     {len(quiz_questions)}")
        print(f"   Quiz Attempts:      3")
        print("=" * 50)
        print("")
        print("  Tai khoan dang nhap:")
        print("   User:  user1@gmail.com / 12345678")
        print("   User:  user2@gmail.com / 12345678")
        print("   Admin: admin1@gmail.com / 12345678")

    except Exception as e:
        conn.rollback()
        print(f"\n[ERROR] Loi khi seed data: {e}")
        import traceback
        traceback.print_exc()
    finally:
        cursor.close()
        conn.close()


if __name__ == "__main__":
    seed()
