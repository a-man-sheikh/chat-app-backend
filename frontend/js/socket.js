// WebSocket Client Module
class SocketClient {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.baseURL = 'http://localhost:5000';
    }

    updateWebSocketStatus(status, text) {
        const statusDiv = document.getElementById('websocketStatus');
        const statusIcon = document.getElementById('wsStatusIcon');
        const statusText = document.getElementById('wsStatusText');
        
        if (statusDiv && statusIcon && statusText) {
            statusDiv.className = `websocket-status ${status}`;
            statusText.textContent = text;
            
            // Show status when connected, hide when disconnected
            if (status === 'connected') {
                statusDiv.style.display = 'flex';
            } else if (status === 'disconnected') {
                statusDiv.style.display = 'none';
            } else {
                statusDiv.style.display = 'flex';
            }
        }
    }

    connect(token, userId) {
        try {
            console.log('Connecting to WebSocket server...', { userId, baseURL: this.baseURL });
            
            // Update status to connecting
            this.updateWebSocketStatus('connecting', 'Connecting...');
            
            // Disconnect existing connection if any
            if (this.socket) {
                console.log('Disconnecting existing socket...');
                this.socket.disconnect();
                this.socket = null;
            }
            
            // Connect to WebSocket server with authentication
            this.socket = io(this.baseURL, {
                auth: {
                    token: token,
                    userId: userId
                },
                transports: ['websocket', 'polling'],
                timeout: 15000,
                forceNew: true,
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000
            });

            this.setupEventListeners();
            
        } catch (error) {
            console.error('Error connecting to WebSocket:', error);
            this.isConnected = false;
            this.updateWebSocketStatus('disconnected', 'Connection Failed');
            window.auth.showToast('Failed to connect to real-time chat', 'error');
        }
    }

    setupEventListeners() {
        if (!this.socket) {
            console.error('Socket not available for event listeners');
            return;
        }

        // Connection events
        this.socket.on('connect', () => {
            console.log('WebSocket connected successfully', { socketId: this.socket.id });
            this.isConnected = true;
            this.reconnectAttempts = 0;
            
            // Show connection status
            window.auth.showToast('Real-time chat connected', 'success');
            
            // Notify other modules that socket is connected
            if (window.chat) {
                window.chat.onSocketConnected();
            }
            if (window.groups) {
                window.groups.onSocketConnected();
            }
            this.updateWebSocketStatus('connected', 'Connected');
        });

        this.socket.on('disconnect', (reason) => {
            console.log('WebSocket disconnected:', reason);
            this.isConnected = false;
            
            // Show disconnection status
            window.auth.showToast('Real-time chat disconnected', 'warning');
            
            // Attempt to reconnect
            if (this.reconnectAttempts < this.maxReconnectAttempts) {
                setTimeout(() => {
                    this.reconnectAttempts++;
                    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
                    this.socket.connect();
                }, this.reconnectDelay * this.reconnectAttempts);
            } else {
                window.auth.showToast('Real-time chat connection lost', 'error');
                this.updateWebSocketStatus('disconnected', 'Connection Lost');
            }
        });

        this.socket.on('connect_error', (error) => {
            console.error('WebSocket connection error:', error);
            this.isConnected = false;
            window.auth.showToast('Failed to connect to real-time chat', 'error');
            this.updateWebSocketStatus('disconnected', 'Connection Failed');
        });

        this.socket.on('reconnect', (attemptNumber) => {
            console.log('WebSocket reconnected after', attemptNumber, 'attempts');
            this.isConnected = true;
            this.reconnectAttempts = 0;
            window.auth.showToast('Real-time chat reconnected', 'success');
            this.updateWebSocketStatus('connected', 'Connected');
        });

        this.socket.on('reconnect_error', (error) => {
            console.error('WebSocket reconnection error:', error);
        });

        this.socket.on('reconnect_failed', () => {
            console.error('WebSocket reconnection failed after all attempts');
            window.auth.showToast('Real-time chat connection permanently lost', 'error');
            this.updateWebSocketStatus('disconnected', 'Connection Failed');
        });

        // Message events
        this.socket.on('message', (data) => {
            console.log('Received new message:', data);
            if (window.chat) {
                window.chat.onNewMessage(data.data);
            }
        });

        this.socket.on('message_sent', (data) => {
            console.log('Message sent successfully:', data);
            if (window.chat) {
                window.chat.onMessageSent(data.data);
            }
        });

        this.socket.on('message_error', (data) => {
            console.error('Message error:', data);
            window.auth.showToast(data.message || 'Failed to send message', 'error');
        });

        // Group message events
        this.socket.on('group_message', (data) => {
            console.log('Received new group message:', data);
            if (window.groups) {
                window.groups.onNewGroupMessage(data.data);
            }
        });

        this.socket.on('group_message_sent', (data) => {
            console.log('Group message sent successfully:', data);
            if (window.groups) {
                window.groups.onGroupMessageSent(data.data);
            }
        });

        this.socket.on('group_message_error', (data) => {
            console.error('Group message error:', data);
            window.auth.showToast(data.message || 'Failed to send group message', 'error');
        });

        // Typing indicators
        this.socket.on('typing_start', (data) => {
            console.log('User started typing:', data);
            if (window.chat) {
                window.chat.onTypingStart(data);
            }
        });

        this.socket.on('typing_stop', (data) => {
            console.log('User stopped typing:', data);
            if (window.chat) {
                window.chat.onTypingStop(data);
            }
        });

        // Message read events
        this.socket.on('message_read', (data) => {
            console.log('Message read:', data);
            if (window.chat) {
                window.chat.onMessageRead(data);
            }
        });

        // User status events
        this.socket.on('user_status_change', (data) => {
            console.log('User status changed:', data);
            if (window.chat) {
                window.chat.onUserStatusChange(data);
            }
        });
    }

    // Send individual message
    sendMessage(receiverId, content, messageType = 'text', mediaUrl = null, replyTo = null) {
        if (!this.isConnected || !this.socket) {
            console.error('WebSocket not connected - cannot send message');
            return false;
        }

        console.log('Sending message via WebSocket:', {
            receiver: receiverId,
            content: content,
            messageType: messageType
        });

        this.socket.emit('send_message', {
            receiver: receiverId,
            content: content,
            messageType: messageType,
            mediaUrl: mediaUrl,
            replyTo: replyTo
        });

        return true;
    }

    // Send group message
    sendGroupMessage(groupId, content, messageType = 'text', mediaUrl = null, replyTo = null) {
        if (!this.isConnected || !this.socket) {
            console.error('WebSocket not connected - cannot send group message');
            return false;
        }

        console.log('Sending group message via WebSocket:', {
            groupId: groupId,
            content: content,
            messageType: messageType
        });

        this.socket.emit('send_group_message', {
            groupId: groupId,
            content: content,
            messageType: messageType,
            mediaUrl: mediaUrl,
            replyTo: replyTo
        });

        return true;
    }

    // Send typing indicators
    sendTypingStart(receiverId) {
        if (this.isConnected && this.socket) {
            this.socket.emit('typing_start', { receiver: receiverId });
        }
    }

    sendTypingStop(receiverId) {
        if (this.isConnected && this.socket) {
            this.socket.emit('typing_stop', { receiver: receiverId });
        }
    }

    // Mark message as read
    markMessageAsRead(messageId) {
        if (this.isConnected && this.socket) {
            this.socket.emit('mark_read', { messageId: messageId });
        }
    }

    // Set online status
    setOnlineStatus(isOnline) {
        if (this.isConnected && this.socket) {
            this.socket.emit('set_online_status', { isOnline: isOnline });
        }
    }

    // Disconnect
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
            this.updateWebSocketStatus('disconnected', 'Disconnected');
        }
    }

    // Check connection status
    isSocketConnected() {
        return this.isConnected && this.socket && this.socket.connected;
    }
}

// Export for use in other modules
window.SocketClient = SocketClient; 