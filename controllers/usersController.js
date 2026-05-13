const mongoose = require('mongoose');
const Product = require('../models/Product');
const User = require('../models/User');

const getProfile = (req, res) => {
  return res.json({ user: req.user });
};

const updateProfile = async (req, res) => {
  try {
    const { name, whatsapp } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (whatsapp) user.whatsapp = whatsapp;

    await user.save();
    return res.json({ message: 'Profil mis à jour !', user });
  } catch (error) {
    console.error('[Users] PUT /profile:', error.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const getSellerPublicProfile = async (req, res) => {
  try {
    const seller = await User.findOne({
      _id: req.params.id,
      role: 'vendeur',
      isActive: true,
    }).select('name email whatsapp createdAt');

    if (!seller) {
      return res.status(404).json({ message: 'Vendeur introuvable.' });
    }

    return res.json({ seller });
  } catch (error) {
    console.error('[Users] GET /seller/:id:', error.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const getFavorites = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: 'favorites',
        populate: { path: 'seller', select: 'name whatsapp' },
      })
      .lean();

    return res.json({ favorites: user?.favorites || [] });
  } catch (error) {
    console.error('[Users] GET /favorites:', error.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const addFavorite = async (req, res) => {
  try {
    const { productId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Identifiant produit invalide.' });
    }

    const product = await Product.findById(productId).select('_id isAvailable');
    if (!product || !product.isAvailable) {
      return res.status(404).json({ message: 'Produit introuvable.' });
    }

    await User.findByIdAndUpdate(req.user._id, { $addToSet: { favorites: productId } });
    return res.json({ message: 'Produit ajouté aux favoris.' });
  } catch (error) {
    console.error('[Users] POST /favorites/:productId:', error.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const removeFavorite = async (req, res) => {
  try {
    const { productId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Identifiant produit invalide.' });
    }

    await User.findByIdAndUpdate(req.user._id, { $pull: { favorites: productId } });
    return res.json({ message: 'Produit retiré des favoris.' });
  } catch (error) {
    console.error('[Users] DELETE /favorites/:productId:', error.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ users });
  } catch (error) {
    console.error('[Users] GET / (admin):', error.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const toggleUserStatus = async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: 'Vous ne pouvez pas désactiver votre propre compte.' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable.' });
    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Impossible de désactiver un administrateur.' });
    }

    user.isActive = !user.isActive;
    await user.save();

    console.log(`[Users] Toggle — User: ${user._id} | isActive: ${user.isActive} | By admin: ${req.user._id}`);
    return res.json({ message: `Utilisateur ${user.isActive ? 'activé' : 'désactivé'}.`, user });
  } catch (error) {
    console.error('[Users] PATCH toggle:', error.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const deleteUser = async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: 'Vous ne pouvez pas supprimer votre propre compte.' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable.' });
    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Impossible de supprimer un administrateur.' });
    }

    await user.deleteOne();
    console.log(`[Users] Supprimé — User: ${req.params.id} | By admin: ${req.user._id}`);
    return res.json({ message: 'Utilisateur supprimé.' });
  } catch (error) {
    console.error('[Users] DELETE /:id:', error.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getSellerPublicProfile,
  getFavorites,
  addFavorite,
  removeFavorite,
  getAllUsers,
  toggleUserStatus,
  deleteUser,
};
