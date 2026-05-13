const Product = require('../models/Product');
const User    = require('../models/User');

/**
 * GET /api/stats
 * Retourne les stats globales en temps réel depuis MongoDB
 */
const getStats = async (req, res) => {
  try {
    const [totalProducts, totalSellers] = await Promise.all([
      // isAvailable: true  ← champ exact de ton Product.js
      Product.countDocuments({ isAvailable: true }),

      // role: 'vendeur'    ← valeur exacte de ton User.js (enum: client/vendeur/admin)
      User.countDocuments({ role: 'vendeur', isActive: true }),
    ]);

    res.json({ totalProducts, totalSellers });

  } catch (error) {
    console.error('Erreur stats:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = { getStats };
