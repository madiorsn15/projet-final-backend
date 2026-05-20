const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Le produit est requis.'],
    index: true,
  },
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'L\'acheteur est requis.'],
    index: true,
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Le vendeur est requis.'],
    index: true,
  },
  rating: {
    type: Number,
    required: [true, 'La note est requise.'],
    min: [1, 'La note minimum est 1.'],
    max: [5, 'La note maximum est 5.'],
  },
  comment: {
    type: String,
    required: [true, 'Le commentaire est requis.'],
    trim: true,
    minlength: [10, 'Le commentaire doit contenir au moins 10 caractères.'],
    maxlength: [500, 'Le commentaire ne peut pas dépasser 500 caractères.'],
  },
}, {
  timestamps: true,
  versionKey: false,
});

reviewSchema.index({ productId: 1, buyerId: 1 }, { unique: true });

reviewSchema.statics.getAverageRating = async function (productId) {
  const result = await this.aggregate([
    { $match: { productId: new mongoose.Types.ObjectId(productId) } },
    { $group: { _id: null, averageRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  return result[0]
    ? { averageRating: Math.round(result[0].averageRating * 10) / 10, count: result[0].count }
    : { averageRating: 0, count: 0 };
};

reviewSchema.statics.getSellerAverageRating = async function (sellerId) {
  const result = await this.aggregate([
    { $match: { sellerId: new mongoose.Types.ObjectId(sellerId) } },
    { $group: { _id: null, averageRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  return result[0]
    ? { averageRating: Math.round(result[0].averageRating * 10) / 10, count: result[0].count }
    : { averageRating: 0, count: 0 };
};

module.exports = mongoose.model('Review', reviewSchema);
