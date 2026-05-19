const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');

const createReview = async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;
    const buyerId = req.user._id;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Produit introuvable.' });
    }

    const sellerId = product.seller;

    const hasDeliveredOrder = await Order.findOne({
      product: productId,
      buyer: buyerId,
      status: 'livrée',
    });

    if (!hasDeliveredOrder) {
      return res.status(403).json({
        message: 'Vous devez avoir reçu ce produit pour laisser un avis.'
      });
    }

    const existingReview = await Review.findOne({ productId, buyerId });
    if (existingReview) {
      return res.status(400).json({
        message: 'Vous avez déjà laissé un avis pour ce produit.'
      });
    }

    const review = await Review.create({
      productId,
      buyerId,
      sellerId,
      rating,
      comment,
    });

    await review.populate('buyerId', 'name');

    console.log(`[Reviews] Créé — ID: ${review._id} | Product: ${productId} | Buyer: ${buyerId}`);

    return res.status(201).json({
      message: 'Avis créé avec succès !',
      review,
    });
  } catch (error) {
    console.error('[Reviews] POST /:', error.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(20, Math.max(1, parseInt(req.query.limit, 10) || 10));

    const [total, reviews, stats] = await Promise.all([
      Review.countDocuments({ productId }),
      Review.find({ productId })
        .populate('buyerId', 'name')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Review.getAverageRating(productId),
    ]);

    return res.json({
      reviews,
      stats,
      total,
      pages: Math.ceil(total / limit),
      page,
    });
  } catch (error) {
    console.error('[Reviews] GET /product/:id:', error.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const getSellerReviews = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(20, Math.max(1, parseInt(req.query.limit, 10) || 10));

    const [total, reviews, stats] = await Promise.all([
      Review.countDocuments({ sellerId }),
      Review.find({ sellerId })
        .populate('buyerId', 'name')
        .populate('productId', 'name')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Review.getSellerAverageRating(sellerId),
    ]);

    return res.json({
      reviews,
      stats,
      total,
      pages: Math.ceil(total / limit),
      page,
    });
  } catch (error) {
    console.error('[Reviews] GET /seller/:id:', error.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({ message: 'Avis introuvable.' });
    }

    await review.deleteOne();

    console.log(`[Reviews] Supprimé — ID: ${id} | By: ${req.user._id}`);
    return res.json({ message: 'Avis supprimé avec succès.' });
  } catch (error) {
    console.error('[Reviews] DELETE /:id:', error.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

module.exports = {
  createReview,
  getProductReviews,
  getSellerReviews,
  deleteReview,
};
