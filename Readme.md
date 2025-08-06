# Chat App - Real-time Messaging Application

A comprehensive real-time chat application with private messaging, group chat functionality, message encryption, and WebSocket support.

## 🚀 Features

### Core Features
- **Real-time Messaging**: Instant message delivery using Socket.IO
- **Private Chat**: One-on-one conversations between users
- **Group Chat**: Multi-user group conversations with admin controls
- **Message Encryption**: End-to-end encryption for message security
- **User Authentication**: Register and login functionality
- **Modern UI**: Beautiful, responsive design with dark/light themes
- **Message Types**: Support for text, image, file, and audio messages
- **Typing Indicators**: Real-time typing status
- **Message Status**: Read receipts and delivery status
- **Conversation Management**: View and manage all conversations

### Group Chat Features
- **Group Creation**: Create new groups with custom names and descriptions
- **Participant Management**: Add/remove participants with role-based permissions
- **Admin Controls**: Group admins can manage participants and settings
- **Role-based Access**: Admin, moderator, and member roles
- **Group Encryption**: Separate encryption keys for each group

### Security Features
- **Message Encryption**: AES encryption for all messages
- **Secure Authentication**: JWT-based authentication
- **Input Validation**: Comprehensive validation for all inputs
- **Error Handling**: Robust error handling and logging

## 🛠️ Technology Stack

### Backend
- **Node.js**: Runtime environment
- **Express.js**: Web framework
- **MongoDB**: Database with Mongoose ODM
- **Socket.IO**: Real-time WebSocket communication
- **JWT**: Authentication tokens
- **bcryptjs**: Password hashing
- **Joi**: Input validation
- **Crypto**: Message encryption

### Frontend
- **HTML5**: Semantic markup
- **CSS3**: Modern styling with Flexbox and Grid
- **JavaScript (ES6+)**: Modern JavaScript features
- **Socket.IO Client**: Real-time communication
- **Font Awesome**: Icons
- **Responsive Design**: Mobile-friendly interface

## 📁 Project Structure

```
chat-app/
├── app/
│   ├── controllers/
│   │   ├── messageController.js
│   │   ├── userAuthController.js
│   │   └── groupController.js
│   ├── models/
│   │   ├── userModel.js
│   │   ├── messageModel.js
│   │   ├── conversationModel.js
│   │   └── groupModel.js
│   ├── routes/
│   │   ├── index.js
│   │   ├── userAuthRoutes.js
│   │   └── groupRoutes.js
│   ├── services/
│   │   ├── userAuthService.js
│   │   ├── groupService.js
│   │   └── socketService.js
│   ├── middleware/
│   │   ├── asyncHandler.js
│   │   ├── errorHandler.js
│   │   └── validate.js
│   ├── utils/
│   │   ├── encryption.js
│   │   ├── jwtUtils.js
│   │   └── responseHandler.js
│   └── validations/
│       ├── userValidation.js
│       └── groupValidation.js
├── config/
│   ├── db.js
│   └── constants.js
├── frontend/
│   └── index.html
├── public/
│   ├── chat-test.html
│   └── group-chat-test.html
├── app.js
├── server.js
├── package.json
└── Readme.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd chat-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   PORT=5000
   HOST=localhost
   MONGO_URI=mongodb://localhost:27017
   JWT_SECRET=your-secret-key-here
   CLIENT_URL=http://localhost:5500
   ```

4. **Start MongoDB**
   ```bash
   # If using local MongoDB
   mongod
   ```

5. **Start the server**
   ```bash
   npm start
   ```

6. **Access the application**
   - Backend API: `http://localhost:5000`
   - Frontend: Open `frontend/index.html` in your browser
   - Test files: `public/chat-test.html` and `public/group-chat-test.html`

## 📡 API Endpoints

### Authentication
- `POST /api/user/register` - Register new user
- `POST /api/user/login` - Login user
- `GET /api/user/all` - Get all users (for chat selection)
- `GET /api/user/:userId` - Get specific user details

### Group Management
- `POST /api/group/create` - Create new group
- `GET /api/group/user/groups` - Get user's groups
- `GET /api/group/:groupId` - Get group details
- `PUT /api/group/:groupId` - Update group
- `DELETE /api/group/:groupId` - Delete group
- `POST /api/group/participant/add` - Add participant to group
- `POST /api/group/participant/remove` - Remove participant from group

### Group Messaging
- `POST /api/group/message/send` - Send group message
- `GET /api/group/:groupId/messages` - Get group messages

## 🔌 WebSocket Events

### Client to Server
- `send_message` - Send private message
- `send_group_message` - Send group message
- `typing_start` - Start typing indicator
- `typing_stop` - Stop typing indicator
- `mark_read` - Mark message as read
- `set_online_status` - Set online status

### Server to Client
- `message` - Receive private message
- `group_message` - Receive group message
- `message_sent` - Confirm message sent
- `group_message_sent` - Confirm group message sent
- `typing_start` - Show typing indicator
- `typing_stop` - Hide typing indicator
- `message_read` - Message read confirmation
- `user_status_change` - User online/offline status

## 🎨 Frontend Features

### User Interface
- **Modern Design**: Clean, intuitive interface
- **Responsive Layout**: Works on desktop and mobile
- **Real-time Updates**: Instant message delivery
- **Tabbed Interface**: Switch between contacts and groups
- **Message Bubbles**: Clear message distinction
- **Typing Indicators**: Real-time typing status

### Authentication
- **Login/Register**: Seamless authentication flow
- **User Session**: Persistent login state
- **Profile Display**: User information in sidebar

### Chat Features
- **Contact List**: View all conversations
- **Group Management**: Create and manage groups
- **Message History**: Scrollable message history
- **Send Messages**: Text input with send button
- **Message Status**: Read receipts and timestamps

## 🔒 Security Features

### Message Encryption
- **AES Encryption**: All messages are encrypted
- **Unique Keys**: Each conversation has its own encryption key
- **Secure Storage**: Encrypted content stored separately

### Authentication
- **JWT Tokens**: Secure authentication
- **Password Hashing**: bcrypt for password security
- **Input Validation**: Comprehensive validation

### Data Protection
- **Input Sanitization**: Prevent XSS attacks
- **Error Handling**: Secure error messages
- **Rate Limiting**: Prevent abuse

## 🧪 Testing

### Manual Testing
1. **Open the frontend**: `frontend/index.html`
2. **Register users**: Create multiple test accounts
3. **Test private chat**: Send messages between users
4. **Test group chat**: Create groups and add participants
5. **Test real-time features**: Typing indicators, online status

### API Testing
Use the provided Postman collection:
- `Chat_App_API.postman_collection.json`
- `Chat_App_Environment.postman_environment.json`

## 🚀 Deployment

### Environment Variables
```env
PORT=5000
HOST=localhost
MONGO_URI=mongodb://localhost:27017
JWT_SECRET=your-secret-key-here
CLIENT_URL=http://localhost:5500
NODE_ENV=production
```

### Production Considerations
- Use HTTPS in production
- Set up proper MongoDB security
- Configure CORS for your domain
- Use environment variables for secrets
- Set up proper logging
- Configure rate limiting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the API documentation
- Review the WebSocket events list

## 🔄 Updates and Roadmap

### Planned Features
- [ ] File upload support
- [ ] Voice messages
- [ ] Video calls
- [ ] Message reactions
- [ ] Message search
- [ ] User profiles
- [ ] Message forwarding
- [ ] Message editing
- [ ] Message deletion
- [ ] Group avatars
- [ ] Push notifications
- [ ] Offline message sync
- [ ] Message backup
- [ ] Admin dashboard
- [ ] Analytics

### Recent Updates
- ✅ Group chat functionality
- ✅ Message encryption
- ✅ Real-time WebSocket support
- ✅ Modern frontend interface
- ✅ Comprehensive API documentation
- ✅ Input validation
- ✅ Error handling
- ✅ Responsive design

---

**Built with ❤️ using Node.js, Express, MongoDB, Socket.IO, and modern web technologies.**

