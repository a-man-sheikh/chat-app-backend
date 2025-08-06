// Groups Module
class Groups {
    constructor() {
        this.baseURL = 'http://localhost:5000/api';
        this.groups = [];
        this.currentGroup = null;
        this.selectedParticipants = [];
        this.availableUsers = [];
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Create group button
        const createGroupBtn = document.getElementById('createGroupBtn');
        if (createGroupBtn) {
            createGroupBtn.addEventListener('click', () => this.showCreateGroupModal());
        }

        // Create group form
        const createGroupForm = document.getElementById('createGroupForm');
        if (createGroupForm) {
            createGroupForm.addEventListener('submit', (e) => this.handleCreateGroup(e));
        }

        // Cancel create group
        const cancelCreateGroup = document.getElementById('cancelCreateGroup');
        if (cancelCreateGroup) {
            cancelCreateGroup.addEventListener('click', () => this.closeModal('createGroupModal'));
        }
    }

    async loadGroups() {
        try {
            console.log('Loading groups...');
            const response = await window.auth.makeAuthenticatedRequest(`${this.baseURL}/group/user/groups`);

            const data = await response.json();
            console.log('Groups response:', data);

            if (data.success) {
                this.groups = data.data.groups || [];
                console.log('Groups loaded:', this.groups);
                console.log('Groups array length:', this.groups.length);
                console.log('Groups list element:', document.getElementById('groupsList'));
                this.renderGroups();
            } else {
                console.error('Failed to load groups:', data.message);
                window.auth.showToast(data.message || 'Failed to load groups', 'error');
            }
        } catch (error) {
            console.error('Error loading groups:', error);
            window.auth.showToast('Failed to load groups', 'error');
        }
    }

    renderGroups() {
        console.log('Rendering groups:', this.groups);
        const groupsList = document.getElementById('groupsList');
        if (!groupsList) {
            console.error('Groups list container not found');
            return;
        }

        console.log('Groups list element found:', groupsList);
        console.log('Groups array length:', this.groups.length);

        if (this.groups.length === 0) {
            console.log('No groups to render, showing empty state');
            groupsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-users"></i>
                    <h3>No groups yet</h3>
                    <p>Create a group to start group messaging</p>
                </div>
            `;
            return;
        }

        console.log('Rendering', this.groups.length, 'groups');
        const groupsHtml = this.groups.map(group => {
            console.log('Processing group:', group);
            const participantCount = group.participants ? group.participants.length : 0;
            const lastMessage = group.lastMessage ? group.lastMessage.content : 'No messages yet';
            const lastMessageTime = group.lastMessageAt ? 
                new Date(group.lastMessageAt).toLocaleDateString() : '';

            return `
                <div class="group-card" onclick="window.groups.selectGroup('${group._id}')">
                    <h3>${group.name}</h3>
                    <p>${group.description || 'No description'}</p>
                    <div class="group-meta">
                        <span><i class="fas fa-users"></i> ${participantCount} members</span>
                        <span>${lastMessageTime}</span>
                    </div>
                    <p class="last-message">${lastMessage}</p>
                </div>
            `;
        }).join('');
        
        console.log('Generated HTML:', groupsHtml);
        groupsList.innerHTML = groupsHtml;
        console.log('Groups rendered successfully');
    }

    async selectGroup(groupId) {
        try {
            console.log('Selecting group:', groupId);
            const response = await window.auth.makeAuthenticatedRequest(`${this.baseURL}/group/${groupId}`);

            const data = await response.json();
            console.log('Group data:', data);

            if (data.success) {
                this.currentGroup = data.data;
                console.log('Current group set:', this.currentGroup);
                this.showGroupChat(groupId);
            } else {
                console.error('Failed to load group:', data.message);
                window.auth.showToast(data.message || 'Failed to load group', 'error');
            }
        } catch (error) {
            console.error('Error loading group:', error);
            window.auth.showToast('Failed to load group', 'error');
        }
    }

    showGroupChat(groupId) {
        console.log('Showing group chat for group:', groupId);
        
        // Clear any existing messages first
        this.clearChatContainer();
        
        // Initialize group messages array
        this.groupMessages = [];
        
        // Switch to chat page and load group messages
        window.auth.showPage('chat');
        
        // Set global flag to indicate we're in a group chat
        window.currentGroupId = groupId;
        window.isGroupChat = true;
        
        // Update chat header for group
        const chatName = document.getElementById('currentChatName');
        const chatStatus = document.getElementById('currentChatStatus');
        const inputContainer = document.getElementById('chatInputContainer');
        const messageInput = document.getElementById('messageInput');
        const sendButton = document.querySelector('#messageForm button');

        if (this.currentGroup) {
            console.log('Setting up group chat header for:', this.currentGroup.name);
            chatName.textContent = this.currentGroup.name;
            chatStatus.textContent = `Group • ${this.currentGroup.participants.length} members`;
            inputContainer.style.display = 'block';
            messageInput.disabled = false;
            sendButton.disabled = false;

            // Load group messages
            this.loadGroupMessages(groupId);
        } else {
            console.error('No current group set for group chat');
        }
    }

    clearChatContainer() {
        console.log('Clearing chat container');
        const chatMessages = document.getElementById('chatMessages');
        if (chatMessages) {
            chatMessages.innerHTML = '';
        }
    }

    async loadGroupMessages(groupId) {
        try {
            console.log('Loading group messages for group:', groupId);
            const response = await window.auth.makeAuthenticatedRequest(`${this.baseURL}/group/${groupId}/messages`);

            const data = await response.json();
            console.log('Group messages response:', data);

            if (data.success) {
                console.log('Group messages loaded:', data.data.messages);
                // Store messages in the groupMessages array
                this.groupMessages = data.data.messages || [];
                this.renderGroupMessages(this.groupMessages);
            } else {
                console.error('Failed to load group messages:', data.message);
                window.auth.showToast(data.message || 'Failed to load group messages', 'error');
                // Initialize empty array if failed
                this.groupMessages = [];
                this.renderGroupMessages(this.groupMessages);
            }
        } catch (error) {
            console.error('Error loading group messages:', error);
            window.auth.showToast('Failed to load group messages', 'error');
            // Initialize empty array if error
            this.groupMessages = [];
            this.renderGroupMessages(this.groupMessages);
        }
    }

    renderGroupMessages(messages) {
        console.log('Rendering group messages:', messages);
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) {
            console.error('Chat messages container not found');
            return;
        }

        if (messages.length === 0) {
            console.log('No group messages to render, showing welcome message');
            chatMessages.innerHTML = `
                <div class="welcome-message">
                    <i class="fas fa-users"></i>
                    <h3>No messages in this group yet</h3>
                    <p>Start the conversation by sending a message</p>
                </div>
            `;
            return;
        }

        const currentUser = window.auth.getUser();
        console.log('Current user for group messages:', currentUser);
        
        chatMessages.innerHTML = messages.map(message => {
            const isSent = message.sender._id === currentUser._id;
            const time = new Date(message.createdAt).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
            });

            return `
                <div class="message ${isSent ? 'sent' : 'received'}">
                    <div class="message-content">
                        ${!isSent ? `<div class="message-sender">${message.sender.name}</div>` : ''}
                        ${message.content}
                        <div class="message-time">${time}</div>
                    </div>
                </div>
            `;
        }).join('');

        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
        console.log('Group messages rendered successfully');
    }

    async showCreateGroupModal() {
        console.log('Showing create group modal');
        const modal = document.getElementById('createGroupModal');
        if (modal) {
            modal.style.display = 'block';
            this.selectedParticipants = [];
            await this.loadUsersForGroup();
        }
    }

    async loadUsersForGroup() {
        try {
            console.log('Loading users for group creation...');
            const response = await window.auth.makeAuthenticatedRequest(`${this.baseURL}/user/all`);

            const data = await response.json();
            console.log('Users for group response:', data);

            if (data.success) {
                this.availableUsers = data.data;
                console.log('Available users loaded:', this.availableUsers);
                this.renderParticipantsList();
                this.renderSelectedParticipants();
            } else {
                console.error('Failed to load users for group:', data.message);
                window.auth.showToast(data.message || 'Failed to load users', 'error');
            }
        } catch (error) {
            console.error('Error loading users for group:', error);
            window.auth.showToast('Failed to load users', 'error');
        }
    }

    renderParticipantsList() {
        console.log('Rendering participants list:', this.availableUsers);
        const participantsList = document.getElementById('participantsList');
        if (!participantsList) {
            console.error('Participants list container not found');
            return;
        }

        if (this.availableUsers.length === 0) {
            participantsList.innerHTML = `
                <div class="empty-state">
                    <p>No other users available</p>
                </div>
            `;
            return;
        }

        participantsList.innerHTML = this.availableUsers.map(user => {
            const isSelected = this.selectedParticipants.some(p => p._id === user._id);
            const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase();
            return `
                <div class="participant-item ${isSelected ? 'selected' : ''}" 
                     onclick="window.groups.toggleParticipant('${user._id}', '${user.name}', '${user.email}')">
                    <input type="checkbox" class="participant-checkbox" ${isSelected ? 'checked' : ''}>
                    <div class="user-avatar">${initials}</div>
                    <div class="user-info">
                        <h4>${user.name}</h4>
                        <p>${user.email}</p>
                    </div>
                </div>
            `;
        }).join('');
        
        console.log('Participants list rendered successfully');
    }

    renderSelectedParticipants() {
        console.log('Rendering selected participants:', this.selectedParticipants);
        const selectedParticipants = document.getElementById('selectedParticipants');
        if (!selectedParticipants) {
            console.error('Selected participants container not found');
            return;
        }

        if (this.selectedParticipants.length === 0) {
            selectedParticipants.innerHTML = '<p style="color: #666; text-align: center;">No participants selected</p>';
            return;
        }

        selectedParticipants.innerHTML = this.selectedParticipants.map(participant => {
            const initials = participant.name.split(' ').map(n => n[0]).join('').toUpperCase();
            return `
                <span class="selected-participant">
                    <div class="user-avatar" style="width: 20px; height: 20px; font-size: 0.8rem;">${initials}</div>
                    ${participant.name}
                    <button class="remove-participant" onclick="window.groups.removeParticipant('${participant._id}')">&times;</button>
                </span>
            `;
        }).join('');
        
        console.log('Selected participants rendered successfully');
    }

    toggleParticipant(userId, userName, userEmail) {
        console.log('Toggling participant:', userId, userName);
        const existingIndex = this.selectedParticipants.findIndex(p => p._id === userId);
        
        if (existingIndex >= 0) {
            // Remove participant
            this.selectedParticipants.splice(existingIndex, 1);
            console.log('Removed participant:', userName);
        } else {
            // Add participant
            this.selectedParticipants.push({
                _id: userId,
                name: userName,
                email: userEmail
            });
            console.log('Added participant:', userName);
        }
        
        this.renderParticipantsList();
        this.renderSelectedParticipants();
    }

    removeParticipant(userId) {
        console.log('Removing participant:', userId);
        this.selectedParticipants = this.selectedParticipants.filter(p => p._id !== userId);
        this.renderParticipantsList();
        this.renderSelectedParticipants();
    }

    async handleCreateGroup(e) {
        e.preventDefault();
        
        const name = document.getElementById('groupName').value.trim();
        const description = document.getElementById('groupDescription').value.trim();

        if (!name) {
            window.auth.showToast('Group name is required', 'error');
            return;
        }

        try {
            console.log('Creating group:', { name, description, participants: this.selectedParticipants });
            const token = window.auth.getToken();
            const payload = {
                name,
                description,
            };

            // Add selected participants
            if (this.selectedParticipants.length > 0) {
                const participantIds = this.selectedParticipants.map(p => p._id);
                payload.participants = participantIds;
                console.log('Adding participants:', participantIds);
            }

            const response = await window.auth.makeAuthenticatedRequest(`${this.baseURL}/group/create`, {
                method: 'POST',
                body: JSON.stringify(payload),
            });

            const data = await response.json();
            console.log('Create group response:', data);

            if (data.success) {
                this.closeModal('createGroupModal');
                
                // Clear form and selections
                document.getElementById('groupName').value = '';
                document.getElementById('groupDescription').value = '';
                this.selectedParticipants = [];
                
                window.auth.showToast('Group created successfully!', 'success');
                
                // Switch to groups page and refresh
                console.log('Switching to groups page...');
                window.auth.showPage('groups');
                
                console.log('Loading groups after creation...');
                await this.loadGroups(); // Refresh groups list
                
                console.log('Groups after creation:', this.groups);
                console.log('Groups list element:', document.getElementById('groupsList'));
                
                // Force a re-render
                this.renderGroups();
                
                console.log('Group creation completed successfully');
            } else {
                console.error('Failed to create group:', data.message);
                window.auth.showToast(data.message || 'Failed to create group', 'error');
            }
        } catch (error) {
            console.error('Error creating group:', error);
            window.auth.showToast('Failed to create group', 'error');
        }
    }

    async sendGroupMessage(groupId, content) {
        try {
            console.log('Sending group message via WebSocket to group:', groupId);
            
            // Send via WebSocket only - no fallback
            const success = window.socketClient.sendGroupMessage(groupId, content);
            if (success) {
                // Message will be added to UI when socket confirms it was sent
                return true;
            } else {
                window.auth.showToast('Failed to send message - WebSocket not connected', 'error');
                return false;
            }
        } catch (error) {
            console.error('Error sending group message:', error);
            window.auth.showToast('Failed to send message', 'error');
            return false;
        }
    }

    closeModal(modalId) {
        console.log('Closing modal:', modalId);
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // WebSocket event handlers
    onSocketConnected() {
        console.log('Groups module: WebSocket connected');
    }

    onNewGroupMessage(message) {
        console.log('Groups module: Received new group message:', message);
        
        // Add message to current group if it matches
        if (this.currentGroup && message.groupId === this.currentGroup._id) {
            // Check if message already exists to prevent duplicates
            if (!this.groupMessages) this.groupMessages = [];
            
            const messageExists = this.groupMessages.some(m => m._id === message._id);
            if (!messageExists) {
                this.groupMessages.push(message);
                this.renderGroupMessages(this.groupMessages);
            }
            
            // Update groups list
            this.loadGroups();
        }
        
        // Show notification only if not from current user
        const currentUser = window.auth.getUser();
        if (message.sender._id !== currentUser._id) {
            window.auth.showToast(`New message in ${message.group?.name || 'group'}`, 'info');
        }
    }

    onGroupMessageSent(message) {
        console.log('Groups module: Group message sent successfully:', message);
        
        // Add message to current group immediately
        if (this.currentGroup && message.groupId === this.currentGroup._id) {
            if (!this.groupMessages) this.groupMessages = [];
            
            // Check if message already exists to prevent duplicates
            const messageExists = this.groupMessages.some(m => m._id === message._id);
            if (!messageExists) {
                this.groupMessages.push(message);
                this.renderGroupMessages(this.groupMessages);
            }
        }
        
        // Show success notification
        window.auth.showToast('Group message sent successfully', 'success');
    }

    // Public method to refresh groups
    refresh() {
        this.loadGroups();
    }
}

// Export for use in other modules
window.Groups = Groups; 