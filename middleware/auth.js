const jwt  = require('jsonwebtoken');
const User = require('../models/User');

// ─── JWT SECRET ───────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('⛔ JWT_SECRET manquant en production !');
}
const SECRET = JWT_SECRET || 'dev_secret_marchebn_change_en_prod';

// ─── BLACKLIST EN MÉMOIRE (tokens révoqués après logout) ─────
// En production : remplacer par Redis
const tokenBlacklist = new Set();
const blacklistToken = (token) => tokenBlacklist.add(token);

// Nettoyage toutes les heures
const blacklistCleanupTimer = setInterval(() => {
  tokenBlacklist.clear();
}, 60 * 60 * 1000);
blacklistCleanupTimer.unref?.();

// ─── MIDDLEWARE PRINCIPAL ─────────────────────────────────────
const protect = async (req, res, next) => {
  try {
    // 1. Extraire le token du header
    let token;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
    if (!token) {
      return res.status(401).json({ message: 'Accès non autorisé. Veuillez vous connecter.' });
    }

    // 2. Vérifier si le token a été révoqué (logout)
    if (tokenBlacklist.has(token)) {
      return res.status(401).json({ message: 'Session expirée. Veuillez vous reconnecter.' });
    }

    // 3. Vérifier & décoder le JWT
    let decoded;
    try {
      decoded = jwt.verify(token, SECRET);
    } catch (jwtErr) {
      if (jwtErr.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Session expirée. Veuillez vous reconnecter.' });
      }
      return res.status(401).json({ message: 'Token invalide.' });
    }

    // 4. Vérifier que l'utilisateur existe toujours
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'Compte introuvable.' });
    }

    // 5. Vérifier que le compte est actif
    if (!user.isActive) {
      return res.status(403).json({ message: 'Votre compte a été désactivé. Contactez le support.' });
    }

    req.user  = user;
    req.token = token;
    next();

  } catch (error) {
    console.error('[Auth] protect error:', error.message);
    return res.status(500).json({ message: 'Erreur d\'authentification.' });
  }
};

// ─── CONTRÔLE DES RÔLES ──────────────────────────────────────
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Non authentifié.' });
  }
  if (!roles.includes(req.user.role)) {
    console.warn(`[Auth] Accès refusé — User ${req.user._id} (${req.user.role}) | Requis: [${roles.join(', ')}]`);
    return res.status(403).json({ message: 'Accès refusé. Permissions insuffisantes.' });
  }
  next();
};

// ─── AUTH OPTIONNELLE (routes publiques enrichies si connecté) ─
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return next();
    const token = authHeader.split(' ')[1];
    if (tokenBlacklist.has(token)) return next();
    const decoded = jwt.verify(token, SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (user?.isActive) req.user = user;
    next();
  } catch {
    next();
  }
};

// ─── GÉNÉRER UN TOKEN ─────────────────────────────────────────
const generateToken = (userId, expiresIn = '7d') => {
  return jwt.sign(
    { id: userId },
    SECRET,
    { expiresIn, algorithm: 'HS256' }
  );
};

module.exports = { protect, requireRole, optionalAuth, generateToken, blacklistToken };
