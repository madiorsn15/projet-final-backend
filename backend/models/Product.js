const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Le nom du produit est requis'],
    trim: true,
    minlength: 2,
    maxlength: 100
  },
  price: {
    type: Number,
    required: [true, 'Le prix est requis'],
    min: [0, 'Le prix ne peut pas être négatif']
  },
  description: {
    type: String,
    required: [true, 'La description est requise'],
    trim: true,
    maxlength: 1000
  },
  image: {
    type: String,
    default: null
  },
  category: {
    type: String,
    enum: [
      'Électronique', 'Vêtements', 'Maison & Jardin',
      'Sports & Loisirs', 'Beauté & Santé', 'Alimentation',
      'Livres', 'Jeux & Jouets', 'Automobiles', 'Autres',
    ],
    default: 'Autres'
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  viewsCount:  { type: Number, default: 0, min: 0 },
  clicksCount: { type: Number, default: 0, min: 0 },
  ordersCount: { type: Number, default: 0, min: 0 },
  views:       { type: Number, default: 0, min: 0 }, // legacy
}, { timestamps: true });

// ── INDEXES ──────────────────────────────────────────────────────
// Recherche texte full-text
productSchema.index({ name: 'text', description: 'text' });

// Catalogue : filtre category + dispo + tri date (requête la plus fréquente)
productSchema.index({ category: 1, isAvailable: 1, createdAt: -1 });

// Page "mes produits" vendeur
productSchema.index({ seller: 1, createdAt: -1 });

// Tri popularité homepage
productSchema.index({ viewsCount: -1, clicksCount: -1 });

// Produits disponibles triés par date (listing général)
productSchema.index({ isAvailable: 1, createdAt: -1 });

module.exports = mongoose.model('Product', productSchema);