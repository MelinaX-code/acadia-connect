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
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ error: 'Receiver not found' });
    }

    const message = new Message({
      sender: req.user.userId,
      receiver: receiverId,
      content: content.trim()
    });

    await message.save();

    // Populate sender info for immediate display
    await message.populate('sender', 'fullName photo');
    await message.populate('receiver', 'fullName photo');

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
    const messages = await Message.find({
      $or: [{ sender: userId }, { receiver: userId }]
    })
      .populate('sender', 'fullName photo')
      .populate('receiver', 'fullName photo')
      .sort({ createdAt: -1 });

    // Create a map of unique conversation partners
    const conversationsMap = new Map();

    messages.forEach(msg => {
      const partnerId = msg.sender._id.toString() === userId ? msg.receiver._id.toString() : msg.sender._id.toString();
      
      if (!conversationsMap.has(partnerId)) {
        const partner = msg.sender._id.toString() === userId ? msg.receiver : msg.sender;
        const unreadCount = messages.filter(m => 
          m.sender._id.toString() === partnerId && 
          m.receiver._id.toString() === userId && 
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

    const conversations = Array.from(conversationsMap.values());

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
    const otherUser = await User.findById(otherUserId).select('-password');
    if (!otherUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get all messages between these two users
    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: otherUserId },
        { sender: otherUserId, receiver: currentUserId }
      ]
    })
      .populate('sender', 'fullName photo')
      .populate('receiver', 'fullName photo')
      .sort({ createdAt: 1 });

    // Mark messages from other user as read
    await Message.updateMany(
      {
        sender: otherUserId,
        receiver: currentUserId,
        read: false
      },
      { read: true }
    );

    res.json({
      otherUser: {
        _id: otherUser._id,
        fullName: otherUser.fullName,
        photo: otherUser.photo,
        role: otherUser.role
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
    const count = await Message.countDocuments({
      receiver: req.user.userId,
      read: false
    });

    res.json({ unreadCount: count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

module.exports = router;
