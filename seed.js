/**
 * Script de seed pour créer des données de test
 * Usage : node seed.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Product = require('./models/Product');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/marketplace';

const users = [
  { name: 'Admin Système', email: 'admin@test.sn', password: '123456', role: 'admin', whatsapp: '+221771234567' },
  { name: 'Amadou Diop', email: 'vendeur@test.sn', password: '123456', role: 'vendeur', whatsapp: '+221771234568' },
  { name: 'Fatou Sall', email: 'vendeur2@test.sn', password: '123456', role: 'vendeur', whatsapp: '+221771234569' },
  { name: 'Moussa Kane', email: 'client@test.sn', password: '123456', role: 'client', whatsapp: '+221771234560' },
];

const getProducts = (sellerId1, sellerId2) => [
  { name: 'iPhone 13 Pro Max 256GB', price: 450000, description: 'iPhone 13 Pro Max en très bon état. Batterie à 92%. Vendu avec chargeur et boîte originale.', category: 'Électronique', seller: sellerId1 },
  { name: 'Samsung Galaxy A54', price: 195000, description: 'Téléphone Samsung neuf, déballé. Garantie 1 an. Couleur noire.', category: 'Électronique', seller: sellerId1 },
  { name: 'Boubou Brodé Grand Bazin', price: 35000, description: 'Magnifique boubou en grand bazin riche brodé main. Taille disponible : M, L, XL. Couleur bleue marine.', category: 'Vêtements', seller: sellerId1 },
  { name: 'Thiéboudienne Maison', price: 5000, description: 'Thiéboudienne au poisson frais, cuisine maison. Livraison disponible à Dakar Plateau. Minimum 2 portions.', category: 'Alimentation', seller: sellerId2 },
  { name: 'Canapé 3 places en cuir', price: 180000, description: 'Canapé en cuir véritable, couleur marron. Très bon état, déménagement oblige. À récupérer à Almadies.', category: 'Maison & Jardin', seller: sellerId2 },
  { name: 'Huile de coco artisanale 500ml', price: 3500, description: 'Huile de coco 100% naturelle, pressée à froid. Idéale cheveux et peau. Fabrication locale.', category: 'Beauté & Santé', seller: sellerId2 },
  { name: 'Vélo de route Trek 21 vitesses', price: 120000, description: 'Vélo de route en bon état. 21 vitesses, taille M. Utilisé 6 mois seulement.', category: 'Sports & Loisirs', seller: sellerId1 },
  { name: 'Pneus Michelin 205/55 R16 (x4)', price: 85000, description: 'Lot de 4 pneus Michelin, usure 70%. Taille 205/55 R16. Convient pour Citroën, Peugeot, VW.', category: 'Automobiles', seller: sellerId2 },
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB connecté');

    // Nettoyer les données existantes
    await User.deleteMany({});
    await Product.deleteMany({});
    console.log('🧹 Données existantes supprimées');

    // Créer les utilisateurs
    const createdUsers = await User.create(users);
    console.log(`👥 ${createdUsers.length} utilisateurs créés`);

    const seller1 = createdUsers.find(u => u.email === 'vendeur@test.sn');
    const seller2 = createdUsers.find(u => u.email === 'vendeur2@test.sn');

    // Créer les produits
    const products = getProducts(seller1._id, seller2._id);
    const createdProducts = await Product.create(products);
    console.log(`📦 ${createdProducts.length} produits créés`);

    console.log('\n🎉 Seed terminé avec succès !');
    console.log('\n📋 Comptes de test :');
    console.log('  Admin   : admin@test.sn   / 123456');
    console.log('  Vendeur : vendeur@test.sn  / 123456');
    console.log('  Client  : client@test.sn   / 123456');

    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur seed:', err);
    process.exit(1);
  }
}

seed();
