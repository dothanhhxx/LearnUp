import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

ACTIVE_AI_MODEL = os.getenv("ACTIVE_AI_MODEL", "gemini").lower()

SYSTEM_PROMPT = """
You are an AI English Learning Assistant for a platform called LearnUp.
Your role is to help users practice English, explain grammar, correct their sentences, and provide vocabulary hints.
Be encouraging, polite, and clear. Keep your answers relatively concise to fit in a chat window.
If the user speaks in Vietnamese, you can respond in Vietnamese to explain English concepts.
"""

class ChatbotService:
    @staticmethod
    def get_response(user_message: str, context: dict = None, current_user: dict = None, conn=None) -> str:
        """
        Routes the message to the active AI model configured in .env.
        """
        if ACTIVE_AI_MODEL == "gemini":
            return ChatbotService._get_gemini_response(user_message, context, current_user, conn)
        elif ACTIVE_AI_MODEL == "chatgpt":
            return ChatbotService._get_openai_response(user_message, context, current_user, conn)
        elif ACTIVE_AI_MODEL == "claude":
            return ChatbotService._get_claude_response(user_message, context, current_user, conn)
        else:
            return "Error: Invalid active AI model configuration."

    @staticmethod
    def _get_gemini_response(user_message: str, context: dict = None, current_user: dict = None, conn=None) -> str:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            return "Gemini API key is not configured."
        
        dynamic_system_prompt = SYSTEM_PROMPT
        if current_user:
            dynamic_system_prompt += f"\n\nThe user's name is {current_user.get('name', 'Alex')}. "
            if conn:
                try:
                    from repositories.user_repository import get_dashboard_stats
                    stats = get_dashboard_stats(conn, current_user["sub"])
                    vocab_today = stats.get("vocab", {}).get("today", 0)
                    dynamic_system_prompt += f"They have learned {vocab_today} new words today. "
                except Exception:
                    pass
        
        if context:
            if context.get("daily_vocab_goal"):
                dynamic_system_prompt += f"Their daily vocabulary goal is {context.get('daily_vocab_goal')} words. Act as an encouraging coach and remind them if relevant. "
            if context.get("article_title"):
                article_content = context.get('article_content', '')[:1500]
                dynamic_system_prompt += f"\n\nContext: The user is currently reading an article titled '{context.get('article_title')}'. Content snippet: {article_content}... If they ask questions, answer based on this article."

        try:
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            
            tools = []
            if conn:
                def search_articles_in_db(keyword: str) -> str:
                    """Search the LearnUp database for articles containing the keyword. Use this tool when you want to recommend a real-life reading article to the user based on a vocabulary word they asked about."""
                    from repositories.article_repository import search_articles
                    results = search_articles(conn, keyword, limit=3)
                    if not results:
                        return "No articles found containing this keyword."
                    return "\n".join([f"Title: '{r['title']}' (Difficulty: {r['difficulty']})" for r in results])
                
                tools.append(search_articles_in_db)

            model = genai.GenerativeModel(
                model_name="gemini-2.5-flash",
                system_instruction=dynamic_system_prompt,
                tools=tools if tools else None
            )
            chat = model.start_chat(enable_automatic_function_calling=bool(tools))
            response = chat.send_message(user_message)
            return response.text
        except Exception as e:
            print(f"Gemini API Error: {e}")
            import traceback
            traceback.print_exc()
            return "I'm sorry, I'm having trouble connecting to my brain right now. Please try again later."

    @staticmethod
    def _get_openai_response(user_message: str, context: dict = None, current_user: dict = None, conn=None) -> str:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            return "OpenAI API key is not configured."
        
        try:
            from openai import OpenAI
            client = OpenAI(api_key=api_key)
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_message}
                ]
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"OpenAI API Error: {e}")
            return "I'm sorry, I encountered an error connecting to OpenAI."

    @staticmethod
    def _get_claude_response(user_message: str, context: dict = None, current_user: dict = None, conn=None) -> str:
        api_key = os.getenv("CLAUDE_API_KEY")
        if not api_key:
            return "Claude API key is not configured."
        
        try:
            from anthropic import Anthropic
            client = Anthropic(api_key=api_key)
            response = client.messages.create(
                model="claude-3-haiku-20240307",
                max_tokens=500,
                system=SYSTEM_PROMPT,
                messages=[
                    {"role": "user", "content": user_message}
                ]
            )
            return response.content[0].text
        except Exception as e:
            print(f"Claude API Error: {e}")
            return "I'm sorry, I encountered an error connecting to Claude."
