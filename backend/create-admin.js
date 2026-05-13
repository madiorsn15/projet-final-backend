const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/marketplace';

async function createCustomAdmin() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB connecté');

    const existingUser = await User.findOne({ email: 'madiorsn15@gmail.com' });
    if (existingUser) {
      console.log('ℹ️  L\'utilisateur existe déjà');
      console.log('   Email : madiorsn15@gmail.com');
      console.log('   Rôle :', existingUser.role);
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash('773088470', 10);

    const adminUser = new User({
      name: 'Admin Madiorsn',
      email: 'madiorsn15@gmail.com',
      password: hashedPassword,
      role: 'admin',
      whatsapp: '+221773088470'
    });

    await adminUser.save();

    console.log('🎉 Compte admin créé avec succès !');
    console.log('\n📋 Vos identifiants :');
    console.log('   Email    : madiorsn15@gmail.com');
    console.log('   Mot de passe : 773088470');
    console.log('   Rôle     : admin');

    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur:', err);
    process.exit(1);
  }
}

createCustomAdmin();
