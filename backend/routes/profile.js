const express = require('express');
const User = require('../models/User');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

// Get all students (for browsing)
router.get('/all', async (req, res) => {
  try {
    const students = await User.find({}).select('-password');
    res.json(students);
  } catch (error) {
    console.error('Get all students error:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// Get user profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user profile
router.put('/me', authenticateToken, async (req, res) => {
  try {
    const { bio, hobbies, interests, major, year, location, country, languages, photo } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      {
        'profile.bio': bio,
        'profile.hobbies': hobbies,
        'profile.interests': interests,
        'profile.major': major,
        'profile.year': year,
        'profile.location': location,
        'profile.country': country,
        'profile.languages': languages,
        'profile.photo': photo,
      },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      user,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get suggested connections for current user
router.get('/suggestions/connections', authenticateToken, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.userId).select('-password');
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get all other users
    const allUsers = await User.find({ _id: { $ne: req.user.userId } }).select('-password');

    // Calculate match scores for each user
    const scoredUsers = allUsers.map(user => {
      let score = 0;
      let hasSharedInterests = false;
      
      // Match based on shared interests (HIGHEST PRIORITY)
      if (currentUser.profile.interests && user.profile.interests && 
          Array.isArray(currentUser.profile.interests) && Array.isArray(user.profile.interests)) {
        const currentInterests = currentUser.profile.interests.map(i => i.toLowerCase().trim());
        const userInterests = user.profile.interests.map(i => i.toLowerCase().trim());
        const sharedInterests = currentInterests.filter(interest => 
          userInterests.some(ui => ui.includes(interest) || interest.includes(ui))
        );
        if (sharedInterests.length > 0) {
          score += sharedInterests.length * 15; // Increased from 5 to 15
          hasSharedInterests = true;
        }
      }

      // Match based on shared hobbies (HIGH PRIORITY)
      if (currentUser.profile.hobbies && user.profile.hobbies &&
          Array.isArray(currentUser.profile.hobbies) && Array.isArray(user.profile.hobbies)) {
        const currentHobbies = currentUser.profile.hobbies.map(h => h.toLowerCase().trim());
        const userHobbies = user.profile.hobbies.map(h => h.toLowerCase().trim());
        const sharedHobbies = currentHobbies.filter(hobby => 
          userHobbies.some(uh => uh.includes(hobby) || hobby.includes(uh))
        );
        if (sharedHobbies.length > 0) {
          score += sharedHobbies.length * 15; // Increased from 5 to 15
          hasSharedInterests = true;
        }
      }

      // Match based on same major
      if (currentUser.profile.major && user.profile.major && 
          currentUser.profile.major.toLowerCase() === user.profile.major.toLowerCase()) {
        score += 12; // Increased from 8
        hasSharedInterests = true;
      }

      // Match based on shared languages
      if (currentUser.profile.languages && user.profile.languages &&
          Array.isArray(currentUser.profile.languages) && Array.isArray(user.profile.languages)) {
        const currentLangs = currentUser.profile.languages.map(l => l.toLowerCase().trim());
        const userLangs = user.profile.languages.map(l => l.toLowerCase().trim());
        const sharedLangs = currentLangs.filter(lang => userLangs.includes(lang));
        if (sharedLangs.length > 0) {
          score += sharedLangs.length * 8; // Increased from 4
          hasSharedInterests = true;
        }
      }

      // Match based on same year
      if (currentUser.profile.year && user.profile.year && 
          currentUser.profile.year === user.profile.year) {
        score += 5; // Increased from 3
      }

      // Bonus for opposite role (international <-> local) - BUT ONLY if they have shared interests
      if (currentUser.role !== user.role && hasSharedInterests) {
        score += 10;
      }

      // Bonus points if user has complete profile
      if (user.profile.bio && user.profile.interests?.length > 0 && user.profile.hobbies?.length > 0) {
        score += 3; // Increased from 2
      }

      return { user, score, hasSharedInterests };
    });

    // Sort by score (highest first) and get top 8
    // ONLY show users who have REAL shared interests/hobbies/major/languages
    // Minimum score of 15 means:
    // - 1 shared interest (15 pts), OR
    // - 1 shared hobby (15 pts), OR
    // - Same major (12 pts) + same year (5 pts), OR
    // - 2 shared languages (8 pts each = 16 pts)
    
    // DEBUG: Log all scores
    console.log(`\n=== SUGGESTIONS FOR ${currentUser.fullName} ===`);
    scoredUsers.forEach(item => {
      console.log(`${item.user.fullName}: Score ${item.score} | hasSharedInterests: ${item.hasSharedInterests}`);
    });
    
    const suggestions = scoredUsers
      .filter(item => item.score >= 15) // Real compatibility needed
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map(item => item.user);

    console.log(`Final suggestions count: ${suggestions.length}`);
    console.log(`=== END ===\n`);

    res.json({ suggestions });
  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({ error: 'Failed to fetch suggestions' });
  }
});

// Get user profile by ID (to view other students' profiles)
router.get('/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

module.exports = router;
