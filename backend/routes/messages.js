const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Send a message
router.post('/send', auth, async (req, res) => {
  try {
    const { receiverId, content } = req.body;

    if (!receiverId || !content) {
      return res.status(400).json({ error: 'Receiver and content are required' });
    }

    // Check if receiver exists
    const receiverRow = await User.findById(receiverId);
    if (!receiverRow) {
      return res.status(404).json({ error: 'Receiver not found' });
    }

    const messageId = await Message.createMessage({
      senderId: req.user.userId,
      receiverId,
      content: content.trim(),
    });

    const message = await Message.getMessageByIdPopulated(messageId);

    res.status(201).json({
      message: 'Message sent successfully',
      data: message
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Get all conversations (list of users you've messaged with)
router.get('/conversations', auth, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Find all messages where user is sender or receiver
    const messages = await Message.getMessagesForUserPopulated(userId);

    // Create a map of unique conversation partners
    const conversationsMap = new Map();

    messages.forEach(msg => {
      const partnerId = msg.sender._id === userId ? msg.receiver._id : msg.sender._id;
      
      if (!conversationsMap.has(partnerId)) {
        const partner = msg.sender._id === userId ? msg.receiver : msg.sender;
        const unreadCount = messages.filter(m => 
          m.sender._id === partnerId && 
          m.receiver._id === userId && 
          !m.read
        ).length;

        conversationsMap.set(partnerId, {
          user: partner,
          lastMessage: msg.content,
          lastMessageTime: msg.createdAt,
          unreadCount: unreadCount
        });
      }
    });

    const conversations = Array.from(conversationsMap.values())
      .sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));

    res.json({ conversations });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Get messages with a specific user
router.get('/conversation/:userId', auth, async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const otherUserId = req.params.userId;

    // Get other user info
    const otherUserRow = await User.findById(otherUserId);
    if (!otherUserRow) {
      return res.status(404).json({ error: 'User not found' });
    }

    const otherUserPublic = User.rowToPublicUser(otherUserRow);

    // Get all messages between these two users
    const messages = await Message.getConversationPopulated(currentUserId, otherUserId);

    // Mark messages from other user as read
    await Message.markConversationRead({ senderId: otherUserId, receiverId: currentUserId });

    res.json({
      otherUser: {
        _id: otherUserPublic._id,
        fullName: otherUserPublic.fullName,
        photo: otherUserPublic.photo,
        role: otherUserPublic.role
      },
      messages
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Get unread message count
router.get('/unread-count', auth, async (req, res) => {
  try {
    const count = await Message.countUnread(req.user.userId);

    res.json({ unreadCount: count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

module.exports = router;
