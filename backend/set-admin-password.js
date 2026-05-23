const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/marketplace';

async function setAdminPassword() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB connecté');

    const user = await User.findOne({ email: 'madiorsn15@gmail.com' });
    if (!user) {
      console.log('❌ Utilisateur non trouvé');
      process.exit(1);
    }

    const newPassword = 'Madior151199&';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = newPassword;
    await user.save();

    console.log('🎉 Mot de passe défini avec succès !');
    console.log('\n📋 Vos identifiants admin :');
    console.log('   Email         : madiorsn15@gmail.com');
    console.log('   Mot de passe  : Madior151199&');
    console.log('   Rôle          : admin');

    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur:', err);
    process.exit(1);
  }
}

setAdminPassword();
