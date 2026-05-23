const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { blacklistToken, generateToken } = require('../middleware/auth');
const User = require('../models/User');
const { sendWelcomeEmail, sendResetPasswordEmail } = require('../utils/email');

// --- Fonction utilitaire pour générer un token de réinitialisation
const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

const register = async (req, res) => {
  try {
    const { name, email, password, whatsapp } = req.body;
    const role = req.body.role;
    const safeRole = ['client', 'vendeur'].includes(role) ? role : 'client';

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Cet email est déjà associé à un compte.' });
    }

    const user = await User.create({ name, email, password, role: safeRole, whatsapp });
    console.log(`[Auth] Inscription — User: ${user._id} | Role: ${safeRole} | IP: ${req.ip}`);

    sendWelcomeEmail(user).catch(err => {
      console.warn('[Email] Échec envoi bienvenue:', err.message);
    });

    return res.status(201).json({
      message: 'Inscription réussie !',
      token: generateToken(user._id),
      user,
    });
  } catch (error) {
    console.error('[Auth] Register:', error.message);
    return res.status(500).json({ message: 'Erreur lors de l\'inscription.' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');

    const fakeHash = '$2b$12$fakehashhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh';
    const passwordMatch = user
      ? await user.comparePassword(password)
      : await bcrypt.compare(password, fakeHash);

    if (!user || !passwordMatch) {
      console.warn(`[Auth] Échec login — Email: ${email} | IP: ${req.ip}`);
      return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Compte désactivé. Contactez le support.' });
    }

    console.log(`[Auth] Login OK — User: ${user._id} | IP: ${req.ip}`);
    return res.json({
      message: 'Connexion réussie !',
      token: generateToken(user._id),
      user: user.toJSON(),
    });
  } catch (error) {
    console.error('[Auth] Login:', error.message);
    return res.status(500).json({ message: 'Erreur lors de la connexion.' });
  }
};

const logout = (req, res) => {
  blacklistToken(req.token);
  console.log(`[Auth] Logout — User: ${req.user._id}`);
  return res.json({ message: 'Déconnexion réussie.' });
};

const me = (req, res) => {
  return res.json({ user: req.user });
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (!(await user.comparePassword(currentPassword))) {
      return res.status(400).json({ message: 'Mot de passe actuel incorrect.' });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({ message: 'Le nouveau mot de passe doit être différent.' });
    }

    user.password = newPassword;
    await user.save();
    blacklistToken(req.token);

    console.log(`[Auth] Password changed — User: ${req.user._id}`);
    return res.json({ message: 'Mot de passe modifié. Veuillez vous reconnecter.' });
  } catch (error) {
    console.error('[Auth] Change-password:', error.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'Aucun compte avec cet email.' });
    }

    const resetToken = generateResetToken();
    const resetTokenExpire = Date.now() + 3600000; // 1 heure

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = resetTokenExpire;
    await user.save();

    const resetUrl = `${(process.env.CLIENT_URL || 'http://localhost:3000').split(',')[0].trim()}/reset-password/${resetToken}`;
    console.log(`[Auth] Password reset requested for ${email} — Reset URL: ${resetUrl}`);

    sendResetPasswordEmail(email, resetUrl).catch(err => {
      console.warn('[Email] Échec envoi reset password:', err.message);
    });

    return res.json({
      message: 'Un email de réinitialisation a été envoyé. Vérifiez votre boîte mail.',
      resetToken, // Pour le développement
      resetUrl,
    });
  } catch (error) {
    console.error('[Auth] Forgot-password:', error.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() },
    }).select('+resetPasswordToken +resetPasswordExpire');

    if (!user) {
      return res.status(400).json({ message: 'Token invalide ou expiré.' });
    }

    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpire = null;
    await user.save();

    console.log(`[Auth] Password reset successfully — User: ${user._id}`);
    return res.json({ message: 'Mot de passe réinitialisé avec succès ! Vous pouvez maintenant vous connecter.' });
  } catch (error) {
    console.error('[Auth] Reset-password:', error.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

module.exports = {
  register,
  login,
  logout,
  me,
  changePassword,
  forgotPassword,
  resetPassword,
};