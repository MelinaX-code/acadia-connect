const express = require('express');
const auth = require('../middleware/auth');
const Group = require('../models/Group');
const GroupMessage = require('../models/GroupMessage');
const User = require('../models/User');

const router = express.Router();

function normalizeName(name) {
  return String(name || '').trim();
}

// List groups for current user
router.get('/', auth, async (req, res) => {
  try {
    const rows = await Group.listForUser(req.user.userId);
    const groups = rows.map(Group.rowToGroup);
    res.json({ groups });
  } catch (error) {
    console.error('List groups error:', error);
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
});

// Create a group (and auto-join)
router.post('/', auth, async (req, res) => {
  try {
    const name = normalizeName(req.body?.name);
    if (!name) {
      return res.status(400).json({ error: 'Group name is required' });
    }

    const existing = await Group.findByName(name);
    if (existing) {
      return res.status(409).json({ error: 'A group with that name already exists' });
    }

    const groupId = await Group.createGroup({ name, createdBy: req.user.userId });
    await Group.addMember({ groupId, userId: req.user.userId });

    const created = await Group.findById(groupId);
    res.status(201).json({
      message: 'Group created',
      group: Group.rowToGroup(created),
    });
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ error: 'Failed to create group' });
  }
});

// Join a group by name
router.post('/join', auth, async (req, res) => {
  try {
    const name = normalizeName(req.body?.name);
    if (!name) {
      return res.status(400).json({ error: 'Group name is required' });
    }

    const group = await Group.findByName(name);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    await Group.addMember({ groupId: group.id, userId: req.user.userId });

    res.json({
      message: 'Joined group',
      group: Group.rowToGroup(group),
    });
  } catch (error) {
    console.error('Join group error:', error);
    res.status(500).json({ error: 'Failed to join group' });
  }
});

// Get group message history
router.get('/:groupId/messages', auth, async (req, res) => {
  try {
    const groupId = Number(req.params.groupId);
    if (!Number.isFinite(groupId)) {
      return res.status(400).json({ error: 'Invalid group id' });
    }

    const member = await Group.isMember({ groupId, userId: req.user.userId });
    if (!member) {
      return res.status(403).json({ error: 'You are not a member of this group' });
    }

    const groupRow = await Group.findById(groupId);
    if (!groupRow) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const messages = await GroupMessage.listGroupMessagesPopulated(groupId);

    res.json({
      group: Group.rowToGroup(groupRow),
      messages,
    });
  } catch (error) {
    console.error('Get group messages error:', error);
    res.status(500).json({ error: 'Failed to fetch group messages' });
  }
});

// Send a message to a group
router.post('/:groupId/messages', auth, async (req, res) => {
  try {
    const groupId = Number(req.params.groupId);
    const content = String(req.body?.content || '').trim();

    if (!Number.isFinite(groupId)) {
      return res.status(400).json({ error: 'Invalid group id' });
    }

    if (!content) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    const member = await Group.isMember({ groupId, userId: req.user.userId });
    if (!member) {
      return res.status(403).json({ error: 'You are not a member of this group' });
    }

    const messageId = await GroupMessage.createGroupMessage({
      groupId,
      senderId: req.user.userId,
      content,
    });

    const message = await GroupMessage.getGroupMessageByIdPopulated(messageId);

    res.status(201).json({
      message: 'Message sent',
      data: message,
    });
  } catch (error) {
    console.error('Send group message error:', error);
    res.status(500).json({ error: 'Failed to send group message' });
  }
});

// Add a user to a group (must be a current member)
router.post('/:groupId/members', auth, async (req, res) => {
  try {
    const groupId = Number(req.params.groupId);
    const userId = String(req.body?.userId || '').trim();

    if (!Number.isFinite(groupId)) {
      return res.status(400).json({ error: 'Invalid group id' });
    }

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const groupRow = await Group.findById(groupId);
    if (!groupRow) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const requesterIsMember = await Group.isMember({ groupId, userId: req.user.userId });
    if (!requesterIsMember) {
      return res.status(403).json({ error: 'You are not a member of this group' });
    }

    const userRow = await User.findById(userId);
    if (!userRow) {
      return res.status(404).json({ error: 'User not found' });
    }

    await Group.addMember({ groupId, userId });

    res.status(201).json({
      message: 'User added to group',
      group: Group.rowToGroup(groupRow),
      user: User.rowToPublicUser(userRow),
    });
  } catch (error) {
    console.error('Add group member error:', error);
    res.status(500).json({ error: 'Failed to add user to group' });
  }
});

module.exports = router;
