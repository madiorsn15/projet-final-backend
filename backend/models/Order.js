const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  clientName: {
    type: String,
    required: [true, 'Le nom du client est requis']
  },
  clientPhone: {
    type: String,
    required: [true, 'Le téléphone est requis']
  },
  buyerEmail: {
    type: String,
    default: null,
  },
  sellerEmail: {
    type: String,
    default: null,
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  address: {
    type: String,
    required: [true, 'L\'adresse est requise']
  },
  phone: {
    type: String,
    required: [true, 'Le numéro de téléphone est requis']
  },
  quantity: {
    type: Number,
    default: 1,
    min: 1
  },
  totalPrice: {
    type: Number,
    required: true
  },
  notes: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['en_attente', 'confirmée', 'en_livraison', 'livrée', 'annulée'],
    default: 'en_attente'
  }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
