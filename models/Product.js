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
      'Électronique',
      'Vêtements',
      'Maison & Jardin',
      'Sports & Loisirs',
      'Beauté & Santé',
      'Alimentation',
      'Livres',
      'Jeux & Jouets',
      'Automobiles',
      'Autres',
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
  // Statistiques du produit
  viewsCount: {
    type: Number,
    default: 0,
    min: 0
  },
  clicksCount: {
    type: Number,
    default: 0,
    min: 0
  },
  ordersCount: {
    type: Number,
    default: 0,
    min: 0
  },
  // Champ legacy pour compatibilité
  views: {
    type: Number,
    default: 0,
    min: 0
  }
}, { timestamps: true });

// Index for search
productSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Product', productSchema);
