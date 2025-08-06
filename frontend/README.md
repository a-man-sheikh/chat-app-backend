# Chat Application - Complete Implementation

## Overview

This is a complete real-time chat application with the following features:

- **User Authentication**: Register, login, and logout functionality
- **Individual Chat**: One-on-one messaging between users
- **Group Chat**: Create groups and send messages to multiple participants
- **Real-time Messaging**: Send and receive messages instantly
- **User Management**: View all available users and manage participants
- **Modern UI**: Responsive design with intuitive user interface

## Features

### Authentication
- User registration with name, email, and password
- Secure login with JWT token authentication
- Automatic token storage and retrieval
- Logout functionality

### Individual Chat
- View all conversations
- Start new chats with any user
- Send and receive messages
- Real-time message updates
- Message history and timestamps

### Group Chat
- Create new groups with custom names and descriptions
- Add multiple participants to groups
- Send messages to all group members
- View group message history
- Group participant management

### User Interface
- Responsive design that works on all devices
- Modern, clean interface with intuitive navigation
- Real-time notifications and toast messages
- Loading states and error handling
- Modal dialogs for user interactions

## Technical Implementation

### Frontend Architecture

The application uses a modular JavaScript architecture:

#### Core Modules

1. **Auth Module** (`js/auth.js`)
   - Handles user authentication
   - Manages JWT tokens
   - Controls page navigation
   - Provides toast notifications

2. **Chat Module** (`js/chat.js`)
   - Manages individual conversations
   - Handles message sending and receiving
   - Loads conversation history
   - Manages user selection for new chats

3. **Groups Module** (`js/groups.js`)
   - Manages group creation and management
   - Handles group messaging
   - Manages group participants
   - Loads group messages

4. **App Module** (`js/app.js`)
   - Main application controller
   - Initializes all modules
   - Handles navigation and data loading
   - Manages application state

### Key Features

#### Authentication Flow
```javascript
// User registration
await auth.register({ name, email, password });

// User login
await auth.login({ email, password });

// Check authentication status
if (auth.isAuthenticated()) {
    // Load user data
}
```

#### Chat Functionality
```javascript
// Load conversations
await chat.loadConversations();

// Send message
await chat.sendMessage(receiverId, content);

// Select conversation
await chat.selectConversation(userId);
```

#### Group Management
```javascript
// Create group
await groups.createGroup({ name, description, participants });

// Send group message
await groups.sendGroupMessage(groupId, content);

// Load group messages
await groups.loadGroupMessages(groupId);
```

### API Endpoints

#### Authentication
- `POST /api/user/register` - User registration
- `POST /api/user/login` - User login
- `GET /api/user/all` - Get all users (authenticated)
- `GET /api/user/:userId` - Get user by ID (authenticated)

#### Messages
- `GET /api/message/conversations` - Get user conversations
- `POST /api/message/send` - Send individual message
- `GET /api/message/conversation?receiver=:userId` - Get conversation messages

#### Groups
- `POST /api/group/create` - Create new group
- `GET /api/group/user/groups` - Get user's groups
- `GET /api/group/:groupId` - Get group details
- `GET /api/group/:groupId/messages` - Get group messages
- `POST /api/group/message/send` - Send group message

### Database Models

#### User Model
```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  password: String (hashed),
  isVerified: Boolean,
  createdAt: Date
}
```

#### Message Model
```javascript
{
  _id: ObjectId,
  sender: ObjectId (ref: User),
  receiver: ObjectId (ref: User),
  group: ObjectId (ref: Group),
  content: String,
  messageType: String,
  createdAt: Date
}
```

#### Group Model
```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  creator: ObjectId (ref: User),
  participants: [{
    user: ObjectId (ref: User),
    isActive: Boolean,
    joinedAt: Date
  }],
  lastMessage: ObjectId (ref: Message),
  lastMessageAt: Date,
  createdAt: Date
}
```

## Setup and Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB database
- Modern web browser

### Backend Setup
1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables:
   Create a `.env` file with:
   ```
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/chat-app
   JWT_SECRET=your-secret-key
   ```

3. Start the server:
   ```bash
   npm start
   ```

### Frontend Setup
1. Open `frontend/index.html` in a web browser
2. The application will automatically connect to the backend
3. Register a new account or login with existing credentials

## Usage Guide

### Getting Started
1. **Register/Login**: Create an account or login with existing credentials
2. **Navigate**: Use the navigation menu to switch between Chat and Groups
3. **Start Chatting**: Click on conversations or create new ones

### Individual Chat
1. **View Conversations**: All your conversations appear in the sidebar
2. **Start New Chat**: Click the "+" button to start a new conversation
3. **Select User**: Choose from the list of available users
4. **Send Messages**: Type and send messages in real-time

### Group Chat
1. **Create Group**: Click "Create Group" button
2. **Add Details**: Enter group name and description
3. **Select Participants**: Choose users to add to the group
4. **Send Messages**: Send messages to all group members

### Features in Detail

#### Real-time Messaging
- Messages appear instantly for all participants
- Message history is preserved
- Timestamps show when messages were sent
- Different styling for sent vs received messages

#### User Management
- View all available users in the system
- Add/remove participants from groups
- User avatars with initials
- Online status indicators

#### Group Management
- Create groups with custom names and descriptions
- Add multiple participants to groups
- View group member count
- Group message history

#### Security Features
- JWT token authentication
- Password hashing with bcrypt
- Protected API endpoints
- Secure token storage

## Troubleshooting

### Common Issues

1. **Server not starting**
   - Check if port 5000 is available
   - Verify MongoDB connection
   - Check environment variables

2. **Authentication issues**
   - Clear browser storage
   - Check JWT token validity
   - Verify API endpoints

3. **Messages not sending**
   - Check network connection
   - Verify user authentication
   - Check browser console for errors

4. **Groups not loading**
   - Verify user permissions
   - Check group creation process
   - Review API responses

### Debug Mode
The application includes comprehensive logging:
- Open browser developer tools
- Check console for detailed logs
- Use the test page (`frontend/test.html`) for API testing

## API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/user/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

#### Login User
```http
POST /api/user/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

### Message Endpoints

#### Get Conversations
```http
GET /api/message/conversations
Authorization: Bearer <token>
```

#### Send Message
```http
POST /api/message/send
Authorization: Bearer <token>
Content-Type: application/json

{
  "receiver": "user-id",
  "content": "Hello!"
}
```

### Group Endpoints

#### Create Group
```http
POST /api/group/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "My Group",
  "description": "Group description",
  "participants": ["user1-id", "user2-id"]
}
```

#### Send Group Message
```http
POST /api/group/message/send
Authorization: Bearer <token>
Content-Type: application/json

{
  "groupId": "group-id",
  "content": "Hello group!"
}
```

## Future Enhancements

### Planned Features
- **File Sharing**: Upload and share files in chats
- **Voice Messages**: Record and send voice messages
- **Video Calls**: Real-time video calling
- **Message Reactions**: React to messages with emojis
- **Message Search**: Search through message history
- **Push Notifications**: Browser notifications for new messages
- **Message Encryption**: End-to-end encryption
- **User Profiles**: Customizable user profiles
- **Message Status**: Read receipts and typing indicators

### Technical Improvements
- **WebSocket Integration**: Real-time updates without polling
- **Message Pagination**: Load messages in chunks
- **Image Optimization**: Compress and optimize images
- **Caching**: Implement client-side caching
- **Offline Support**: Work offline with message queuing
- **Progressive Web App**: PWA features for mobile

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Check the troubleshooting section
- Review the API documentation
- Test with the provided test page
- Check browser console for errors 