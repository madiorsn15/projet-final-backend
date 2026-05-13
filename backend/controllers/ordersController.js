const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const { sendOrderConfirmationEmail, sendOrderNotificationToSeller } = require('../utils/email');

const createOrder = async (req, res) => {
  try {
    const { productId, clientName, clientPhone, address, phone, quantity = 1, notes } = req.body;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Produit introuvable.' });
    if (!product.isAvailable) return res.status(400).json({ message: 'Ce produit n\'est plus disponible.' });
    if (product.seller.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Vous ne pouvez pas commander votre propre produit.' });
    }

    const qty = Math.min(99, Math.max(1, parseInt(quantity, 10)));

    const seller = await User.findById(product.seller);
    const buyerEmail = req.user.email;
    const sellerEmail = seller?.email || null;

    const order = await Order.create({
      client: req.user._id,
      clientName,
      clientPhone: clientPhone || phone,
      buyerEmail,
      sellerEmail,
      product: productId,
      address,
      phone,
      quantity: qty,
      totalPrice: product.price * qty,
      notes: notes || '',
    });

    await Product.findByIdAndUpdate(productId, { 
      $inc: { ordersCount: 1 } 
    });

    await order.populate('product', 'name price image seller');
    console.log(`[Orders] Créée — ID: ${order._id} | Produit: ${productId}`);

    sendOrderConfirmationEmail(order).catch(err => console.warn('[Email] Échec envoi confirmation commande:', err.message));
    sendOrderNotificationToSeller(order).catch(err => console.warn('[Email] Échec envoi notif vendeur:', err.message));

    return res.status(201).json({ message: 'Commande passée avec succès !', order });
  } catch (error) {
    console.error('[Orders] POST /:', error.message);
    return res.status(500).json({ message: 'Erreur lors de la commande.' });
  }
};

const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ client: req.user._id })
      .populate('product', 'name price image seller')
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ orders });
  } catch (error) {
    console.error('[Orders] GET /me:', error.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const getSellerOrders = async (req, res) => {
  try {
    const myProducts = await Product.find({ seller: req.user._id }).select('_id');
    const productIds = myProducts.map((product) => product._id);

    const orders = await Order.find({ product: { $in: productIds } })
      .populate('product', 'name price image')
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ orders });
  } catch (error) {
    console.error('[Orders] GET /seller:', error.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id).populate('product');
    if (!order) return res.status(404).json({ message: 'Commande introuvable.' });

    const isAdmin = req.user.role === 'admin';
    const isSeller = order.product?.seller?.toString() === req.user._id.toString();

    if (!isAdmin && !isSeller) {
      return res.status(403).json({ message: 'Non autorisé à modifier cette commande.' });
    }

    const transitions = {
      en_attente: ['confirmée', 'annulée'],
      'confirmée': ['en_livraison', 'annulée'],
      en_livraison: ['livrée', 'annulée'],
      'livrée': [],
      'annulée': [],
    };

    if (!transitions[order.status]?.includes(status) && !isAdmin) {
      return res.status(400).json({
        message: `Transition invalide : ${order.status} → ${status}`,
      });
    }

    order.status = status;
    await order.save();

    console.log(`[Orders] Statut — ID: ${order._id} | ${order.status} → ${status}`);
    return res.json({ message: 'Statut mis à jour.', order });
  } catch (error) {
    console.error('[Orders] PATCH status:', error.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate({
        path: 'product',
        select: 'name price seller',
        populate: { path: 'seller', select: 'name' },
      })
      .populate('client', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ orders });
  } catch (error) {
    console.error('[Orders] GET / (admin):', error.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getSellerOrders,
  updateOrderStatus,
  getAllOrders,
};
