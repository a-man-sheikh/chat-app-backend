// Authentication Module
class Auth {
    constructor() {
        this.baseURL = 'http://localhost:5000/api';
        this.currentUser = null;
        this.accessToken = null;
        this.refreshToken = null;
        this.isRefreshing = false;
        this.refreshPromise = null;
        
        this.initializeEventListeners();
        this.loadStoredAuth();
    }

    initializeEventListeners() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Register form
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }

        // Auth page switches
        const showRegister = document.getElementById('showRegister');
        const showLogin = document.getElementById('showLogin');
        
        if (showRegister) {
            showRegister.addEventListener('click', (e) => {
                e.preventDefault();
                this.showPage('register');
            });
        }
        
        if (showLogin) {
            showLogin.addEventListener('click', (e) => {
                e.preventDefault();
                this.showPage('login');
            });
        }
    }

    loadStoredAuth() {
        try {
            const storedAccessToken = localStorage.getItem('chatAccessToken');
            const storedRefreshToken = localStorage.getItem('chatRefreshToken');
            const storedUser = localStorage.getItem('chatUser');
            
            console.log('Loading stored auth - storedAccessToken:', storedAccessToken);
            console.log('Loading stored auth - storedRefreshToken:', storedRefreshToken);
            console.log('Loading stored auth - storedUser:', storedUser);
            
            if (storedAccessToken && storedRefreshToken && storedUser) {
                this.accessToken = storedAccessToken;
                this.refreshToken = storedRefreshToken;
                this.currentUser = JSON.parse(storedUser);
                console.log('Loaded stored authentication:', this.currentUser);
            } else {
                console.log('No stored authentication found');
            }
        } catch (error) {
            console.error('Error loading stored auth:', error);
            this.clearStoredAuth();
        }
    }

    clearStoredAuth() {
        localStorage.removeItem('chatAccessToken');
        localStorage.removeItem('chatRefreshToken');
        localStorage.removeItem('chatUser');
        this.accessToken = null;
        this.refreshToken = null;
        this.currentUser = null;
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;

        if (!email || !password) {
            this.showToast('Please fill in all fields', 'error');
            return;
        }

        try {
            this.showLoading(true);
            
            const response = await fetch(`${this.baseURL}/user/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (data.success) {
                this.setAuth(data.data);
                this.showToast('Login successful!', 'success');
                this.showPage('chat');
                
                // Load initial data
                if (window.app) {
                    await window.app.loadInitialData();
                }
            } else {
                this.showToast(data.message || 'Login failed', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showToast('Login failed. Please try again.', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        
        const name = document.getElementById('registerName').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const password = document.getElementById('registerPassword').value;

        if (!name || !email || !password) {
            this.showToast('Please fill in all fields', 'error');
            return;
        }

        try {
            this.showLoading(true);
            
            const response = await fetch(`${this.baseURL}/user/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email, password }),
            });

            const data = await response.json();

            if (data.success) {
                this.setAuth(data.data);
                this.showToast('Registration successful!', 'success');
                this.showPage('chat');
                
                // Load initial data
                if (window.app) {
                    await window.app.loadInitialData();
                }
            } else {
                this.showToast(data.message || 'Registration failed', 'error');
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.showToast('Registration failed. Please try again.', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    setAuth(userData) {
        console.log('Setting auth with userData:', userData);
        
        // Handle the nested structure from login response
        const user = userData.user || userData;
        const accessToken = userData.accessToken;
        const refreshToken = userData.refreshToken;
        
        console.log('Extracted user:', user);
        console.log('Extracted accessToken:', accessToken);
        console.log('Extracted refreshToken:', refreshToken);
        
        this.currentUser = {
            _id: user._id,
            name: user.name,
            email: user.email
        };
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        
        console.log('Setting currentUser:', this.currentUser);
        console.log('Setting accessToken:', this.accessToken);
        console.log('Setting refreshToken:', this.refreshToken);
        
        localStorage.setItem('chatAccessToken', this.accessToken);
        localStorage.setItem('chatRefreshToken', this.refreshToken);
        localStorage.setItem('chatUser', JSON.stringify(this.currentUser));
        
        console.log('Stored in localStorage - chatAccessToken:', localStorage.getItem('chatAccessToken'));
        console.log('Stored in localStorage - chatRefreshToken:', localStorage.getItem('chatRefreshToken'));
        console.log('Stored in localStorage - chatUser:', localStorage.getItem('chatUser'));
        
        this.updateNavigation();
        console.log('Authentication set:', this.currentUser);
        
        // Initialize WebSocket connection
        if (window.socketClient) {
            console.log('Initializing WebSocket connection...');
            window.socketClient.connect(this.accessToken, this.currentUser._id);
        } else {
            console.error('Socket client not available');
            // Try to initialize socket client if not available
            if (window.SocketClient) {
                window.socketClient = new SocketClient();
                window.socketClient.connect(this.accessToken, this.currentUser._id);
            } else {
                console.error('SocketClient class not available');
            }
        }
    }

    async logout() {
        try {
            // Call logout endpoint to revoke refresh token
            if (this.refreshToken) {
                await fetch(`${this.baseURL}/user/logout`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ refreshToken: this.refreshToken }),
                });
            }
        } catch (error) {
            console.error('Logout API error:', error);
        }

        // Disconnect WebSocket
        if (window.socketClient) {
            window.socketClient.disconnect();
        }
        
        this.clearStoredAuth();
        this.showPage('login');
        this.updateNavigation();
        this.showToast('Logged out successfully', 'success');
        console.log('User logged out');
    }

    async refreshAccessToken() {
        if (this.isRefreshing) {
            return this.refreshPromise;
        }

        if (!this.refreshToken) {
            throw new Error('No refresh token available');
        }

        this.isRefreshing = true;
        this.refreshPromise = this.performTokenRefresh();

        try {
            const result = await this.refreshPromise;
            return result;
        } finally {
            this.isRefreshing = false;
            this.refreshPromise = null;
        }
    }

    async performTokenRefresh() {
        try {
            const response = await fetch(`${this.baseURL}/user/refresh-token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refreshToken: this.refreshToken }),
            });

            const data = await response.json();

            if (data.success) {
                this.accessToken = data.data.accessToken;
                this.refreshToken = data.data.refreshToken;
                
                localStorage.setItem('chatAccessToken', this.accessToken);
                localStorage.setItem('chatRefreshToken', this.refreshToken);
                
                console.log('Tokens refreshed successfully');
                return this.accessToken;
            } else {
                throw new Error(data.message || 'Token refresh failed');
            }
        } catch (error) {
            console.error('Token refresh error:', error);
            this.clearStoredAuth();
            this.showPage('login');
            this.showToast('Session expired. Please login again.', 'error');
            throw error;
        }
    }

    async makeAuthenticatedRequest(url, options = {}) {
        // Add authorization header
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (this.accessToken) {
            headers.Authorization = `Bearer ${this.accessToken}`;
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers,
            });

            // If token is expired, try to refresh
            if (response.status === 401) {
                const errorData = await response.json();
                if (errorData.code === 'TOKEN_EXPIRED') {
                    await this.refreshAccessToken();
                    
                    // Retry the request with new token
                    headers.Authorization = `Bearer ${this.accessToken}`;
                    return await fetch(url, {
                        ...options,
                        headers,
                    });
                }
            }

            return response;
        } catch (error) {
            console.error('Request error:', error);
            throw error;
        }
    }

    isAuthenticated() {
        return !!(this.accessToken && this.refreshToken && this.currentUser);
    }

    getAccessToken() {
        return this.accessToken;
    }

    getRefreshToken() {
        return this.refreshToken;
    }

    getUser() {
        return this.currentUser;
    }

    updateNavigation() {
        const isAuth = this.isAuthenticated();
        const loginLink = document.getElementById('loginLink');
        const registerLink = document.getElementById('registerLink');
        const chatLink = document.getElementById('chatLink');
        const groupsLink = document.getElementById('groupsLink');
        const logoutBtn = document.getElementById('logoutBtn');
        const websocketStatus = document.getElementById('websocketStatus');

        if (isAuth) {
            // Show authenticated navigation
            if (loginLink) loginLink.style.display = 'none';
            if (registerLink) registerLink.style.display = 'none';
            if (chatLink) chatLink.style.display = 'inline-block';
            if (groupsLink) groupsLink.style.display = 'inline-block';
            if (logoutBtn) logoutBtn.style.display = 'inline-block';
            if (websocketStatus) websocketStatus.style.display = 'flex';
        } else {
            // Show unauthenticated navigation
            if (loginLink) loginLink.style.display = 'inline-block';
            if (registerLink) registerLink.style.display = 'inline-block';
            if (chatLink) chatLink.style.display = 'none';
            if (groupsLink) groupsLink.style.display = 'none';
            if (logoutBtn) logoutBtn.style.display = 'none';
            if (websocketStatus) websocketStatus.style.display = 'none';
        }
    }

    showPage(pageName) {
        console.log('Showing page:', pageName);
        
        // Hide all pages
        const pages = document.querySelectorAll('.page');
        pages.forEach(page => page.style.display = 'none');

        // Show selected page
        const targetPage = document.getElementById(`${pageName}Page`);
        if (targetPage) {
            targetPage.style.display = 'block';
        } else {
            console.error('Page not found:', pageName);
        }

        // Update active nav link
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => link.classList.remove('active'));
        
        const activeLink = document.querySelector(`[data-page="${pageName}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }

    showLoading(show) {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) {
            spinner.style.display = show ? 'flex' : 'none';
        }
    }

    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas ${this.getToastIcon(type)}"></i>
                <span>${message}</span>
            </div>
            <button class="toast-close">&times;</button>
        `;

        toastContainer.appendChild(toast);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 5000);

        // Close button
        const closeBtn = toast.querySelector('.toast-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            });
        }
    }

    getToastIcon(type) {
        switch (type) {
            case 'success': return 'fa-check-circle';
            case 'error': return 'fa-exclamation-circle';
            case 'warning': return 'fa-exclamation-triangle';
            default: return 'fa-info-circle';
        }
    }

    // Check authentication status on page load
    checkAuthStatus() {
        console.log('Checking auth status...');
        if (this.isAuthenticated()) {
            console.log('User is authenticated, showing chat page');
            this.showPage('chat');
            this.updateNavigation();
        } else {
            console.log('User is not authenticated, showing login page');
            this.showPage('login');
            this.updateNavigation();
        }
    }
}

// Export for use in other modules
window.Auth = Auth; 