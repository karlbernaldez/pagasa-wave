import bcrypt from 'bcryptjs';

import User from '../../models/User.js';
import { normalizeEmail, normalizeUsername, validateRegistrationPayload } from '#controllers/auth/utils/validators';

export const registerUser = async (req, res) => {
  try {
    const validation = validateRegistrationPayload(req.body);
    if (!validation.ok) {
      return res.status(400).json({ message: validation.message });
    }

    const {
      firstName, lastName, username, email, contact,
      password, address, agency, position, birthday,
    } = req.body;

    const emailNorm    = normalizeEmail(email);
    const usernameNorm = normalizeUsername(username);

    // Parallel uniqueness checks
    const [existingUsername, existingEmail] = await Promise.all([
      User.findOne({ username: usernameNorm }).lean(),
      User.findOne({ email: emailNorm }).lean(),
    ]);

    if (existingUsername) return res.status(409).json({ message: 'Username already exists.' });
    if (existingEmail)    return res.status(409).json({ message: 'Email already registered.' });

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      firstName:           firstName.trim(),
      lastName:            lastName.trim(),
      username:            usernameNorm,
      email:               emailNorm,
      contact:             contact.trim(),
      password:            hashedPassword,
      address:             address.trim(),
      agency:              agency.trim(),
      position:            position.trim(),
      birthday:            new Date(birthday),
      status:              'Pending Approval',
      role:                'user',
      failedLoginAttempts: 0,
      lockUntil:           null,
      lastLogin:           null,
    });

    return res.status(201).json({
      message: 'Account created successfully. Awaiting approval.',
    });

  } catch (err) {
    console.error('[registerUser]', err);
    return res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};