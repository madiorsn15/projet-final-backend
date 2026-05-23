const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/marketplace';

async function updateUserToAdmin() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB connecté');

    const user = await User.findOne({ email: 'madiorsn15@gmail.com' });
    if (!user) {
      console.log('❌ Utilisateur non trouvé');
      process.exit(1);
    }

    user.role = 'admin';
    await user.save();

    console.log('🎉 Rôle mis à jour avec succès !');
    console.log('\n📋 Vos identifiants admin :');
    console.log('   Email         : madiorsn15@gmail.com');
    console.log('   Mot de passe  : (celui que tu utilises déjà)');
    console.log('   Rôle          : admin');

    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur:', err);
    process.exit(1);
  }
}

updateUserToAdmin();
