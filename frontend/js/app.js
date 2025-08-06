// Main Application Module
class App {
    constructor() {
        this.auth = null;
        this.chat = null;
        this.groups = null;
        this.initialized = false;
        
        this.init();
    }

    async init() {
        try {
            console.log('Initializing Chat App...');
            
            // Initialize modules
            this.auth = new Auth();
            this.chat = new Chat();
            this.groups = new Groups();
            this.socketClient = new SocketClient();
            
            // Set up global references
            window.auth = this.auth;
            window.chat = this.chat;
            window.groups = this.groups;
            window.socketClient = this.socketClient;
            
            // Initialize navigation
            this.initializeNavigation();
            
            // Check authentication status and connect socket if authenticated
            if (this.auth.isAuthenticated()) {
                console.log('User is authenticated, connecting WebSocket...');
                this.socketClient.connect(this.auth.getAccessToken(), this.auth.getUser()._id);
                await this.loadInitialData();
            }
            
            this.initialized = true;
            console.log('Chat App initialized successfully');
            
        } catch (error) {
            console.error('Error initializing app:', error);
        }
    }

    initializeNavigation() {
        const navLinks = document.querySelectorAll('.nav-link[data-page]');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.getAttribute('data-page');
                this.navigateToPage(page);
            });
        });

        // Handle logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.auth.logout();
            });
        }
    }

    async navigateToPage(pageName) {
        console.log('Navigating to page:', pageName);
        
        // Show the selected page
        this.auth.showPage(pageName);

        // Load page-specific data
        if (this.auth.isAuthenticated()) {
            switch (pageName) {
                case 'chat':
                    console.log('Loading chat page data...');
                    await this.chat.loadConversations();
                    break;
                case 'groups':
                    console.log('Loading groups page data...');
                    await this.groups.loadGroups();
                    break;
                case 'login':
                case 'register':
                    // Clear any current data when going to auth pages
                    this.chat.currentConversation = null;
                    this.groups.currentGroup = null;
                    break;
            }
        }
    }

    async loadInitialData() {
        console.log('Loading initial data...');
        try {
            // Load conversations and groups in the background
            await Promise.all([
                this.chat.loadConversations(),
                this.groups.loadGroups()
            ]);
            console.log('Initial data loaded successfully');
        } catch (error) {
            console.error('Error loading initial data:', error);
        }
    }

    refreshAll() {
        if (this.auth.isAuthenticated()) {
            console.log('Refreshing all data...');
            this.chat.loadConversations();
            this.groups.loadGroups();
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing app...');
    window.app = new App();
});

// Handle page visibility changes to refresh data when user returns
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && window.app && window.app.auth.isAuthenticated()) {
        console.log('Page became visible, refreshing data...');
        window.app.refreshAll();
    }
});

// Handle online/offline status
window.addEventListener('online', () => {
    console.log('App is online');
    if (window.app && window.app.auth.isAuthenticated()) {
        window.app.refreshAll();
    }
});

window.addEventListener('offline', () => {
    console.log('App is offline');
}); 