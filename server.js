const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
let serverInstance = null;

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'blob:', 'http://localhost:5000'],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
}));

// Global : 1000 req / 15 min (augmenté pour le développement)
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { message: 'Trop de requêtes depuis cette IP. Réessayez dans 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
}));

// Auth : désactivé ou très élevé pour le développement
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // Augmenté pour éviter les blocages en dev
  message: { message: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.' },
  skipSuccessfulRequests: true,
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 100,
  message: { message: 'Limite d\'uploads atteinte. Réessayez dans 1 heure.' },
});

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:3000,http://localhost:3001').split(',');

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

app.use(mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`[SÉCURITÉ] Injection NoSQL détectée — IP: ${req.ip} | Champ: ${key}`);
  },
}));

app.use(hpp({
  whitelist: ['category', 'page', 'limit', 'search'],
}));

app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  index: false,
  maxAge: '7d',
}));

app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/products', uploadLimiter, require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/users', require('./routes/users'));
app.use('/api/stats', require('./routes/stats'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] ERROR | ${req.method} ${req.path} | IP: ${req.ip} | ${err.message}`);

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((error) => error.message);
    return res.status(400).json({ message: 'Données invalides.', errors });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({ message: `Ce ${field} est déjà utilisé.` });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Identifiant invalide.' });
  }

  if (err.message?.includes('CORS')) {
    return res.status(403).json({ message: 'Origine non autorisée.' });
  }

  const message = process.env.NODE_ENV === 'production'
    ? 'Une erreur interne est survenue.'
    : err.message;

  return res.status(err.status || 500).json({ message });
});

app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.path} introuvable.` });
});

const connectDatabase = async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/marketplace', {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });
  console.log('MongoDB connecté');
};

const startServer = async () => {
  await connectDatabase();

  const port = process.env.PORT || 5000;
  serverInstance = app.listen(port, () => {
    console.log(`Serveur SunuMarché → http://localhost:${port}`);
    console.log(`Mode : ${process.env.NODE_ENV || 'development'}`);
  });

  return serverInstance;
};

const shutdown = (signal) => {
  if (!serverInstance) {
    process.exit(0);
  }

  console.log(`\nSignal ${signal} reçu — arrêt propre...`);
  serverInstance.close(() => {
    mongoose.connection.close(false, () => {
      console.log('Serveur et MongoDB fermés proprement.');
      process.exit(0);
    });
  });

  setTimeout(() => process.exit(1), 10000).unref?.();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('uncaughtException', (err) => {
  console.error('uncaughtException:', err.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('unhandledRejection:', reason);
  process.exit(1);
});

if (require.main === module) {
  startServer().catch((error) => {
    console.error('MongoDB :', error.message);
    process.exit(1);
  });
}

module.exports = {
  app,
  startServer,
  connectDatabase,
};
