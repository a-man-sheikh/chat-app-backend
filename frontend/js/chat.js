// Chat Module
class Chat {
    constructor() {
        this.baseURL = 'http://localhost:5000/api';
        this.currentConversation = null;
        this.conversations = [];
        this.messages = [];
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // New chat button
        const newChatBtn = document.getElementById('newChatBtn');
        if (newChatBtn) {
            newChatBtn.addEventListener('click', () => this.showNewChatModal());
        }

        // Message form
        const messageForm = document.getElementById('messageForm');
        if (messageForm) {
            messageForm.addEventListener('submit', (e) => this.handleSendMessage(e));
        }

        // Message input for typing indicators
        const messageInput = document.getElementById('messageInput');
        if (messageInput) {
            let typingTimeout;
            messageInput.addEventListener('input', () => {
                // Send typing start
                if (this.currentConversation && window.socketClient) {
                    window.socketClient.sendTypingStart(this.currentConversation.otherUser._id);
                }
                
                // Clear previous timeout
                clearTimeout(typingTimeout);
                
                // Set timeout to send typing stop
                typingTimeout = setTimeout(() => {
                    if (this.currentConversation && window.socketClient) {
                        window.socketClient.sendTypingStop(this.currentConversation.otherUser._id);
                    }
                }, 1000);
            });
        }

        // New chat modal
        const cancelNewChat = document.getElementById('cancelNewChat');
        if (cancelNewChat) {
            cancelNewChat.addEventListener('click', () => this.closeModal('newChatModal'));
        }

        // Modal close buttons
        const closeButtons = document.querySelectorAll('.close');
        closeButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) {
                    modal.style.display = 'none';
                }
            });
        });

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });
    }

    async loadConversations() {
        try {
            console.log('Loading conversations...');
            const response = await window.auth.makeAuthenticatedRequest(`${this.baseURL}/message/conversations`);

            const data = await response.json();
            console.log('Conversations response:', data);

            if (data.success) {
                this.conversations = data.data.conversations || [];
                console.log('Conversations loaded:', this.conversations);
                this.renderConversations();
            } else {
                console.error('Failed to load conversations:', data.message);
                window.auth.showToast(data.message || 'Failed to load conversations', 'error');
            }
        } catch (error) {
            console.error('Error loading conversations:', error);
            window.auth.showToast('Failed to load conversations', 'error');
        }
    }

    renderConversations() {
        const conversationsList = document.getElementById('conversationsList');
        if (!conversationsList) {
            console.error('Conversations list element not found');
            return;
        }

        if (!this.conversations || this.conversations.length === 0) {
            conversationsList.innerHTML = `
                <div class="no-conversations">
                    <p>No conversations yet</p>
                    <button onclick="window.chat.showNewChatModal()" class="btn btn-primary">Start New Chat</button>
                </div>
            `;
            return;
        }

        console.log('Rendering', this.conversations.length, 'conversations');
        const conversationHtml = this.conversations.map(conv => {
            console.log('Processing conversation:', conv);
            
            // Handle different conversation structures from backend
            let otherUser = null;
            let lastMessage = null;
            
            // First, try to get otherUser directly from the conversation
            if (conv.otherUser) {
                otherUser = conv.otherUser;
            } else if (conv.lastMessage) {
                // If otherUser is not directly available, try to get it from lastMessage
                const currentUser = window.auth.getUser();
                if (conv.lastMessage.sender && conv.lastMessage.sender._id === currentUser._id) {
                    otherUser = conv.lastMessage.receiver;
                } else if (conv.lastMessage.receiver && conv.lastMessage.receiver._id === currentUser._id) {
                    otherUser = conv.lastMessage.sender;
                }
            }
            
            if (!otherUser) {
                console.error('Could not determine other user for conversation:', conv);
                return ''; // Skip this conversation
            }
            
            // Ensure otherUser has a name
            if (!otherUser.name) {
                console.error('Other user has no name:', otherUser);
                return ''; // Skip this conversation
            }
            
            lastMessage = conv.lastMessage;
            const isActive = this.currentConversation && 
                           this.currentConversation.otherUser && 
                           this.currentConversation.otherUser._id === otherUser._id;

            // Handle different message content structures
            let messageContent = 'No messages yet';
            if (lastMessage) {
                if (lastMessage.content) {
                    messageContent = lastMessage.content;
                } else if (lastMessage.encryptedContent) {
                    messageContent = '[Encrypted Message]';
                }
            }

            return `
                <div class="conversation-item ${isActive ? 'active' : ''}" 
                     data-user-id="${otherUser._id}" 
                     onclick="window.chat.selectConversation('${otherUser._id}')">
                    <h4>${otherUser.name}</h4>
                    <p>${messageContent}</p>
                    ${conv.unreadCount > 0 ? `<span class="unread-badge">${conv.unreadCount}</span>` : ''}
                </div>
            `;
        }).filter(html => html !== '').join('');
        
        conversationsList.innerHTML = conversationHtml;
        console.log('Conversations rendered successfully');
    }

    async selectConversation(userId) {
        console.log('Selecting conversation for user:', userId);
        
        // Clear group chat flags when switching to individual chat
        window.isGroupChat = false;
        window.currentGroupId = null;
        
        // Find existing conversation - handle different conversation structures
        this.currentConversation = this.conversations.find(conv => {
            // Direct otherUser structure
            if (conv.otherUser && conv.otherUser._id === userId) {
                return true;
            }
            
            // If otherUser is not directly available, try to get it from lastMessage
            if (conv.lastMessage) {
                const currentUser = window.auth.getUser();
                let otherUser = null;
                
                if (conv.lastMessage.sender && conv.lastMessage.sender._id === currentUser._id) {
                    otherUser = conv.lastMessage.receiver;
                } else if (conv.lastMessage.receiver && conv.lastMessage.receiver._id === currentUser._id) {
                    otherUser = conv.lastMessage.sender;
                }
                
                if (otherUser && otherUser._id === userId) {
                    // Ensure the conversation has the otherUser field set
                    conv.otherUser = otherUser;
                    return true;
                }
            }
            
            return false;
        });

        console.log('Found existing conversation:', this.currentConversation);

        if (!this.currentConversation) {
            console.log('No existing conversation, finding user by ID...');
            // Try to find user by ID for new conversations
            const user = await this.findUserById(userId);
            console.log('Found user by ID:', user);
            if (user) {
                this.currentConversation = {
                    otherUser: user,
                    lastMessage: null,
                    unreadCount: 0
                };
            } else {
                console.error('User not found:', userId);
                return;
            }
        }

        console.log('Setting up conversation:', this.currentConversation);
        this.updateChatHeader();
        await this.loadMessages(userId);
    }

    async findUserById(userId) {
        try {
            console.log('Finding user by ID:', userId);
            const response = await window.auth.makeAuthenticatedRequest(`${this.baseURL}/user/${userId}`);

            const data = await response.json();
            console.log('Find user response:', data);
            
            if (data.success) {
                return data.data;
            } else {
                console.error('Failed to find user:', data.message);
                return null;
            }
        } catch (error) {
            console.error('Error finding user:', error);
            return null;
        }
    }

    updateChatHeader() {
        console.log('Updating chat header, current conversation:', this.currentConversation);
        
        const chatName = document.getElementById('currentChatName');
        const chatStatus = document.getElementById('currentChatStatus');
        const inputContainer = document.getElementById('chatInputContainer');
        const messageInput = document.getElementById('messageInput');
        const sendButton = document.querySelector('#messageForm button');

        if (this.currentConversation && this.currentConversation.otherUser) {
            console.log('Setting chat header for:', this.currentConversation.otherUser.name);
            chatName.textContent = this.currentConversation.otherUser.name;
            chatStatus.textContent = 'Online';
            inputContainer.style.display = 'block';
            messageInput.disabled = false;
            sendButton.disabled = false;
        } else {
            console.log('No current conversation, setting default header');
            chatName.textContent = 'Select a conversation';
            chatStatus.textContent = 'Choose someone to start chatting';
            inputContainer.style.display = 'none';
        }
    }

    async loadMessages(userId) {
        console.log('Loading messages for user:', userId);
        
        try {
            const response = await window.auth.makeAuthenticatedRequest(`${window.auth.baseURL}/message/conversation?receiver=${userId}`);

            const data = await response.json();
            console.log('Messages response:', data);

            if (data.success) {
                this.messages = data.data.messages || [];
                this.renderMessages();
            } else {
                console.log('Failed to load messages:', data.message);
                // If conversation not found, it might be a new conversation
                if (data.message === 'Conversation not found') {
                    console.log('Conversation not found, this might be a new conversation');
                    this.messages = [];
                    this.renderMessages();
                } else {
                    window.auth.showToast('Failed to load messages: ' + data.message, 'error');
                }
            }
        } catch (error) {
            console.error('Error loading messages:', error);
            window.auth.showToast('Failed to load messages', 'error');
        }
    }

    renderMessages() {
        console.log('Rendering messages:', this.messages);
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) {
            console.error('Chat messages container not found');
            return;
        }

        if (this.messages.length === 0) {
            console.log('No messages to render, showing welcome message');
            chatMessages.innerHTML = `
                <div class="welcome-message">
                    <i class="fas fa-comments"></i>
                    <h3>No messages yet</h3>
                    <p>Start the conversation by sending a message</p>
                </div>
            `;
            return;
        }

        const currentUser = window.auth.getUser();
        console.log('Current user:', currentUser);
        
        chatMessages.innerHTML = this.messages.map(message => {
            const isSent = message.sender._id === currentUser._id;
            const time = new Date(message.createdAt).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
            });

            // Handle different message content structures
            let messageContent = message.content || '[Encrypted Message]';

            return `
                <div class="message ${isSent ? 'sent' : 'received'}">
                    <div class="message-content">
                        ${messageContent}
                        <div class="message-time">${time}</div>
                    </div>
                </div>
            `;
        }).join('');

        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
        console.log('Messages rendered successfully');
    }

    async handleSendMessage(e) {
        e.preventDefault();
        
        const messageInput = document.getElementById('messageInput');
        const content = messageInput.value.trim();
        
        if (!content) return;

        // Check if we're in a group chat
        if (window.isGroupChat && window.currentGroupId) {
            console.log('Sending group message via WebSocket');
            const success = window.socketClient.sendGroupMessage(window.currentGroupId, content);
            if (success) {
                messageInput.value = '';
            } else {
                window.auth.showToast('Failed to send message - WebSocket not connected', 'error');
            }
            return;
        }

        // Handle individual chat
        if (!this.currentConversation) {
            console.error('No current conversation for sending message');
            window.auth.showToast('Please select a conversation first', 'error');
            return;
        }

        try {
            const receiverId = this.currentConversation.otherUser._id;
            console.log('Sending individual message via WebSocket to:', receiverId);
            
            // Send via WebSocket only - no fallback
            const success = window.socketClient.sendMessage(receiverId, content);
            if (success) {
                messageInput.value = '';
                // Message will be added to UI when socket confirms it was sent
            } else {
                window.auth.showToast('Failed to send message - WebSocket not connected', 'error');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            window.auth.showToast('Failed to send message', 'error');
        }
    }

    async showNewChatModal() {
        console.log('Showing new chat modal');
        const modal = document.getElementById('newChatModal');
        if (modal) {
            modal.style.display = 'block';
            await this.loadUsers();
        }
    }

    async loadUsers() {
        try {
            console.log('Loading users for new chat...');
            const response = await window.auth.makeAuthenticatedRequest(`${this.baseURL}/user/all`);

            const data = await response.json();
            console.log('Users response:', data);

            if (data.success) {
                this.renderUsers(data.data);
            } else {
                console.error('Failed to load users:', data.message);
                window.auth.showToast(data.message || 'Failed to load users', 'error');
            }
        } catch (error) {
            console.error('Error loading users:', error);
            window.auth.showToast('Failed to load users', 'error');
        }
    }

    renderUsers(users) {
        console.log('Rendering users:', users);
        const usersList = document.getElementById('usersList');
        if (!usersList) {
            console.error('Users list container not found');
            return;
        }

        if (users.length === 0) {
            usersList.innerHTML = `
                <div class="empty-state">
                    <p>No other users available</p>
                </div>
            `;
            return;
        }

        usersList.innerHTML = users.map(user => {
            const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase();
            return `
                <div class="user-item" onclick="window.chat.selectUser('${user._id}', '${user.name}')">
                    <div class="user-avatar">${initials}</div>
                    <div class="user-info">
                        <h4>${user.name}</h4>
                        <p>${user.email}</p>
                    </div>
                </div>
            `;
        }).join('');
        
        console.log('Users rendered successfully');
    }

    selectUser(userId, userName) {
        console.log('Selecting user for new chat:', userId, userName);
        this.closeModal('newChatModal');
        
        // Check if conversation already exists
        const existingConv = this.conversations.find(conv => 
            conv.otherUser && conv.otherUser._id === userId
        );
        
        if (!existingConv) {
            console.log('Creating new conversation for user:', userName);
            // Create new conversation object that matches backend structure
            const newConversation = {
                otherUser: {
                    _id: userId,
                    name: userName,
                    email: '' // Will be populated when conversation is loaded from backend
                },
                lastMessage: null,
                unreadCount: 0
            };
            
            // Add to beginning of conversations list
            this.conversations.unshift(newConversation);
            console.log('Added new conversation to list:', newConversation);
            
            // Re-render conversations to show the new one
            this.renderConversations();
        }
        
        this.selectConversation(userId);
        window.auth.showToast(`Chat started with ${userName}`, 'success');
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // WebSocket event handlers
    onSocketConnected() {
        console.log('Chat module: WebSocket connected');
        // Set online status
        if (window.socketClient) {
            window.socketClient.setOnlineStatus(true);
        }
    }

    onNewMessage(message) {
        console.log('Chat module: Received new message:', message);
        
        // Add message to current conversation if it matches
        if (this.currentConversation && 
            ((message.sender._id === this.currentConversation.otherUser._id) || 
             (message.receiver._id === this.currentConversation.otherUser._id))) {
            
            // Add message to messages array
            this.messages.push(message);
            this.renderMessages();
            
            // Update conversation list to include the new conversation
            this.loadConversations();
        }
        
        // Show notification
        window.auth.showToast(`New message from ${message.sender.name}`, 'info');
    }

    onMessageSent(message) {
        console.log('Chat module: Message sent successfully:', message);
        
        // Add message to current conversation immediately
        if (this.currentConversation && 
            ((message.sender._id === this.currentConversation.otherUser._id) || 
             (message.receiver._id === this.currentConversation.otherUser._id))) {
            
            this.messages.push(message);
            this.renderMessages();
            
            // Update conversation list to include the new conversation
            this.loadConversations();
        }
        
        // Show success notification
        window.auth.showToast('Message sent successfully', 'success');
    }

    onTypingStart(data) {
        console.log('Chat module: User started typing:', data);
        // Show typing indicator
        const chatStatus = document.getElementById('currentChatStatus');
        if (chatStatus && data.userId === this.currentConversation?.otherUser._id) {
            chatStatus.textContent = `${data.userName} is typing...`;
        }
    }

    onTypingStop(data) {
        console.log('Chat module: User stopped typing:', data);
        // Hide typing indicator
        const chatStatus = document.getElementById('currentChatStatus');
        if (chatStatus && data.userId === this.currentConversation?.otherUser._id) {
            chatStatus.textContent = 'Online';
        }
    }

    onMessageRead(data) {
        console.log('Chat module: Message read:', data);
        // Update message read status in UI
        const messageElement = document.querySelector(`[data-message-id="${data.messageId}"]`);
        if (messageElement) {
            messageElement.classList.add('read');
        }
    }

    onUserStatusChange(data) {
        console.log('Chat module: User status changed:', data);
        // Update user status in conversation list
        this.loadConversations();
    }

    // Public method to refresh conversations
    refresh() {
        this.loadConversations();
    }
}

// Export for use in other modules
window.Chat = Chat; 