const Product = require('../models/Product');

const listProducts = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 12));
    const { search, category, seller, minPrice, maxPrice } = req.query;
    const isAdmin = req.user?.role === 'admin';

    const query = isAdmin ? {} : { isAvailable: true };
    if (search) query.$text = { $search: search };
    if (category && category !== 'Tous') query.category = category;
    if (seller) query.seller = seller;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    const [total, products] = await Promise.all([
      Product.countDocuments(query),
      Product.find(query)
        .populate('seller', 'name whatsapp')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    return res.json({ products, total, pages: Math.ceil(total / limit), page });
  } catch (error) {
    console.error('[Products] GET /:', error.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const getMyProducts = async (req, res) => {
  try {
    const products = await Product.find({ seller: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ products });
  } catch (error) {
    console.error('[Products] GET seller/me:', error.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate({
        path: 'seller',
        select: 'name whatsapp email'
      });

    if (!product) return res.status(404).json({ message: 'Produit introuvable.' });

    // Debug - afficher les données du produit et vendeur
    console.log('[DEBUG] Produit trouvé:', JSON.stringify(product, null, 2));
    console.log('[DEBUG] Vendeur WhatsApp:', product.seller?.whatsapp);
    console.log('[DEBUG] Vendeur complet:', product.seller);

    // Incrémenter le compteur de vues (nouveau champ)
    Product.findByIdAndUpdate(req.params.id, { $inc: { viewsCount: 1, views: 1 } }).exec();
    return res.json({ product });
  } catch (error) {
    console.error('[Products] GET /:id:', error.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

/**
 * Incrémente le compteur de clics WhatsApp d'un produit
 * Utilisé lorsqu'un utilisateur clique sur le bouton WhatsApp
 */
const incrementClicks = async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: 'Produit introuvable.' });

    // Incrémenter le compteur de clics WhatsApp
    await Product.findByIdAndUpdate(id, { $inc: { clicksCount: 1 } });

    return res.json({ message: 'Clic WhatsApp comptabilisé.' });
  } catch (error) {
    console.error('[Products] POST /:id/clicks:', error.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const createProduct = async (req, res) => {
  try {
    const { name, price, description, category } = req.body;

    const product = await Product.create({
      name,
      price: parseFloat(price),
      description,
      category: category || 'Autres',
      image: req.file ? `/uploads/products/${req.file.filename}` : null,
      seller: req.user._id,
    });

    await product.populate('seller', 'name whatsapp');
    console.log(`[Products] Créé — ID: ${product._id} | Seller: ${req.user._id}`);
    return res.status(201).json({ message: 'Produit créé avec succès !', product });
  } catch (error) {
    console.error('[Products] POST /:', error.message);
    return res.status(500).json({ message: 'Erreur lors de la création du produit.' });
  }
};

const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Produit introuvable.' });

    const isOwner = product.seller.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Non autorisé à modifier ce produit.' });
    }

    const { name, price, description, category, isAvailable } = req.body;

    if (name) product.name = name;
    if (price) product.price = parseFloat(price);
    if (description) product.description = description;
    if (category) product.category = category;
    if (isAvailable !== undefined) {
      product.isAvailable = isAvailable === 'true' || isAvailable === true;
    }

    if (req.file) {
      product.image = `/uploads/products/${req.file.filename}`;
    }

    await product.save();
    await product.populate('seller', 'name whatsapp');

    console.log(`[Products] Modifié — ID: ${product._id}`);
    return res.json({ message: 'Produit mis à jour !', product });
  } catch (error) {
    console.error('[Products] PUT /:id:', error.message);
    return res.status(500).json({ message: 'Erreur lors de la modification.' });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Produit introuvable.' });

    const isOwner = product.seller.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Non autorisé à supprimer ce produit.' });
    }

    await product.deleteOne();

    console.log(`[Products] Supprimé — ID: ${req.params.id} | By: ${req.user._id}`);
    return res.json({ message: 'Produit supprimé avec succès.' });
  } catch (error) {
    console.error('[Products] DELETE /:id:', error.message);
    return res.status(500).json({ message: 'Erreur lors de la suppression.' });
  }
};

module.exports = {
  listProducts,
  getMyProducts,
  getProductById,
  incrementClicks,
  createProduct,
  updateProduct,
  deleteProduct,
};
