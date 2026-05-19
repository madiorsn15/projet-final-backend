const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Le nom est requis.'],
    trim: true,
    minlength: [2, 'Le nom doit contenir au moins 2 caractères.'],
    maxlength: [50, 'Le nom ne peut pas dépasser 50 caractères.'],
  },
  email: {
    type: String,
    required: [true, 'L\'email est requis.'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email invalide.'],
    maxlength: [100, 'Email trop long.'],
    // Index pour les recherches rapides
    index: true,
  },
  password: {
    type: String,
    required: [true, 'Le mot de passe est requis.'],
    minlength: [6, 'Mot de passe trop court.'],
    maxlength: [128, 'Mot de passe trop long.'],
    select: false, // Jamais retourné par défaut dans les queries
  },
  role: {
    type: String,
    enum: {
      values: ['client', 'vendeur', 'admin'],
      message: 'Rôle invalide.',
    },
    default: 'client',
  },
  whatsapp: {
    type: String,
    trim: true,
    maxlength: [20, 'Numéro WhatsApp trop long.'],
    default: null,
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true, // Filtrage fréquent
  },
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  }],
  // Tracking des tentatives de connexion échouées
  loginAttempts: {
    type: Number,
    default: 0,
    select: false,
  },
  lockUntil: {
    type: Date,
    default: null,
    select: false,
  },
  // Champs pour réinitialisation de mot de passe
  resetPasswordToken: {
    type: String,
    default: null,
    select: false,
  },
  resetPasswordExpire: {
    type: Date,
    default: null,
    select: false,
  },
}, {
  timestamps: true,
  // Ne pas exposer __v dans les réponses
  versionKey: false,
});

// ─── INDEX COMPOSÉ ────────────────────────────────────────────
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ email: 1, isActive: 1 });

// ─── HASHING DU MOT DE PASSE ──────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  // Salt rounds 12 : bon équilibre sécurité/performance
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ─── COMPARER LE MOT DE PASSE ─────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ─── FILTRER LES CHAMPS SENSIBLES ─────────────────────────────
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.loginAttempts;
  delete obj.lockUntil;
  return obj;
};

// ─── VIRTUEL : compte verrouillé ? ────────────────────────────
userSchema.virtual('isLocked').get(function () {
  return this.lockUntil && this.lockUntil > Date.now();
});

module.exports = mongoose.model('User', userSchema);
