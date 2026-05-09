/**
 * Chatbot UI Component
 * Handles rendering the chatbot bubble, window, and interacting with the backend API.
 */

class Chatbot {
    constructor() {
        this.isOpen = false;
        this.isTyping = false;
        this.init();
    }

    init() {
        // Build DOM elements
        this.buildUI();
        this.attachEvents();
        // Check visibility based on auth status
        this.checkVisibility();
    }

    buildUI() {
        // Chat Bubble
        this.bubble = document.createElement('div');
        this.bubble.className = 'chatbot-bubble';
        this.bubble.id = 'chatbot-bubble';
        this.bubble.innerHTML = '<i class="fa-solid fa-robot"></i>';
        this.bubble.style.display = 'none'; // Hidden by default

        // Chat Window
        this.window = document.createElement('div');
        this.window.className = 'chatbot-window';
        this.window.id = 'chatbot-window';
        
        this.window.innerHTML = `
            <div class="chat-header">
                <div class="chat-header-info">
                    <div class="chat-header-icon"><i class="fa-solid fa-robot"></i></div>
                    <div>
                        <h3>English Assistant</h3>
                        <p>Powered by AI</p>
                    </div>
                </div>
                <button class="chat-close" id="chatbot-close"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="chat-messages" id="chatbot-messages">
                <div class="message bot">
                    <div class="message-content">Hello! I'm your English learning assistant. How can I help you today?</div>
                    <span class="message-time">${this.getCurrentTime()}</span>
                </div>
            </div>
            <div class="chat-input-area">
                <input type="text" id="chatbot-input" class="chat-input" placeholder="Type a message..." autocomplete="off">
                <button id="chatbot-send" class="chat-send-btn"><i class="fa-solid fa-paper-plane"></i></button>
            </div>
        `;

        document.body.appendChild(this.bubble);
        document.body.appendChild(this.window);

        // Cache elements
        this.messagesContainer = document.getElementById('chatbot-messages');
        this.inputField = document.getElementById('chatbot-input');
        this.sendBtn = document.getElementById('chatbot-send');
        this.closeBtn = document.getElementById('chatbot-close');
    }

    attachEvents() {
        this.bubble.addEventListener('click', () => this.toggleWindow());
        this.closeBtn.addEventListener('click', () => this.toggleWindow());
        
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.inputField.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });

        // Listen for auth changes to show/hide chatbot
        // LearnUp uses AppState and isLoggedIn()
        window.addEventListener('hashchange', () => this.checkVisibility());
        document.addEventListener('click', (e) => {
            if (e.target.closest('.logout-btn') || e.target.closest('#login-form') || e.target.closest('#register-form')) {
                setTimeout(() => this.checkVisibility(), 500); // Check after a short delay
            }
        });
    }

    checkVisibility() {
        if (typeof isLoggedIn === 'function' && isLoggedIn()) {
            this.bubble.style.display = 'flex';
        } else {
            this.bubble.style.display = 'none';
            if (this.isOpen) this.toggleWindow();
        }
    }

    toggleWindow() {
        this.isOpen = !this.isOpen;
        if (this.isOpen) {
            this.window.classList.add('open');
            this.inputField.focus();
        } else {
            this.window.classList.remove('open');
        }
    }

    getCurrentTime() {
        const now = new Date();
        return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    addMessage(text, sender) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${sender}`;
        
        // Basic markdown formatting (bold, code)
        let formattedText = text;
        if (sender === 'bot') {
            formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            formattedText = formattedText.replace(/\n/g, '<br>');
        }

        msgDiv.innerHTML = `
            <div class="message-content">${formattedText}</div>
            <span class="message-time">${this.getCurrentTime()}</span>
        `;
        
        this.messagesContainer.appendChild(msgDiv);
        this.scrollToBottom();
    }

    showTyping() {
        this.isTyping = true;
        const msgDiv = document.createElement('div');
        msgDiv.className = 'message bot typing-msg';
        msgDiv.id = 'chatbot-typing';
        msgDiv.innerHTML = `
            <div class="message-content">
                <div class="typing-indicator">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            </div>
        `;
        this.messagesContainer.appendChild(msgDiv);
        this.scrollToBottom();
        this.sendBtn.disabled = true;
    }

    removeTyping() {
        this.isTyping = false;
        const typingEl = document.getElementById('chatbot-typing');
        if (typingEl) typingEl.remove();
        this.sendBtn.disabled = false;
        this.inputField.focus();
    }

    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    async sendMessage() {
        const text = this.inputField.value.trim();
        if (!text || this.isTyping) return;

        // Display user message
        this.addMessage(text, 'user');
        this.inputField.value = '';
        
        // Show typing indicator
        this.showTyping();

        try {
            // Gather context
            const context = {};
            if (typeof AppState !== 'undefined' && AppState.currentView === 'article-detail' && AppState.selectedArticle) {
                context.article_title = AppState.selectedArticle.title;
                context.article_content = AppState.selectedArticle.content ? AppState.selectedArticle.content.substring(0, 1500) : '';
            }
            const dailyGoal = localStorage.getItem('learnup_daily_vocab_goal');
            if (dailyGoal) {
                context.daily_vocab_goal = parseInt(dailyGoal, 10);
            }

            // Call Backend API
            // Try to use the project's apiFetch if available, else native fetch
            let responseText = '';
            
            const requestBody = { message: text, context: context };

            if (typeof apiFetch === 'function') {
                const res = await apiFetch('/api/chatbot/chat', {
                    method: 'POST',
                    body: JSON.stringify(requestBody)
                });
                
                if (res.success && res.data) {
                    responseText = res.data.response;
                } else {
                    throw new Error(res.error || 'Failed to get response');
                }
            } else {
                // Fallback for native fetch (assuming token is in localStorage)
                const token = localStorage.getItem('token');
                const headers = { 'Content-Type': 'application/json' };
                if (token) headers['Authorization'] = `Bearer ${token}`;

                const res = await fetch('http://localhost:5000/api/chatbot/chat', {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify(requestBody)
                });
                const data = await res.json();
                if (res.ok && data.success) {
                    responseText = data.data.response;
                } else {
                    throw new Error(data.error || 'Failed to get response');
                }
            }

            this.removeTyping();
            this.addMessage(responseText, 'bot');

        } catch (error) {
            console.error('Chatbot error:', error);
            this.removeTyping();
            this.addMessage("I'm sorry, I encountered an error. Please try again later.", 'bot');
        }
    }
}

// Initialize Chatbot when DOM is ready
function initChatbot() {
    // Ensure it's a singleton
    if (!window.learnUpChatbot) {
        window.learnUpChatbot = new Chatbot();
    }
}
