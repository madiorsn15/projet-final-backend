const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const dotenv = require('dotenv');
const path = require('path');
const cookieParser = require('cookie-parser');

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

// 2. Configuration CORS (DEBUG - ULTRA PERMISSIVE)
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['*'],
}));
app.options('*', cors({ origin: true, credentials: true }));

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { message: 'Trop de requêtes depuis cette IP. Réessayez dans 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
}));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { message: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.' },
  skipSuccessfulRequests: true,
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 100,
  message: { message: "Limite d'uploads atteinte. Réessayez dans 1 heure." },
});

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

app.use(mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`[SÉCURITÉ] Injection NoSQL — IP: ${req.ip} | Champ: ${key}`);
  },
}));

app.use(hpp({ whitelist: ['category', 'page', 'limit', 'search'] }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  index: false,
  maxAge: '7d',
}));

app.use('/api/auth',     authLimiter,   require('./routes/auth'));
app.use('/api/products', uploadLimiter, require('./routes/products'));
app.use('/api/orders',                  require('./routes/orders'));
app.use('/api/users',                   require('./routes/users'));
app.use('/api/stats',                   require('./routes/stats'));
app.use('/api/reviews',                 require('./routes/reviews'));

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(), 
    cors: 'ULTRA PERMISSIVE (DEBUG)',
    env: process.env.NODE_ENV
  });
});

app.use((err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.path} | ${err.message}`);
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: 'Données invalides.', errors: Object.values(err.errors).map(e => e.message) });
  }
  if (err.code === 11000) {
    return res.status(400).json({ message: `Ce ${Object.keys(err.keyValue)[0]} est déjà utilisé.` });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Identifiant invalide.' });
  }
  const message = process.env.NODE_ENV === 'production' ? 'Une erreur interne est survenue.' : err.message;
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
    console.log(`Origines autorisées : ${allowedOrigins.join(', ')}`);
  });
  return serverInstance;
};

const shutdown = (signal) => {
  if (!serverInstance) { process.exit(0); }
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
process.on('SIGINT',  () => shutdown('SIGINT'));
process.on('uncaughtException',  (err) => { console.error('uncaughtException:', err.message); process.exit(1); });
process.on('unhandledRejection', (reason) => { console.error('unhandledRejection:', reason); process.exit(1); });

if (require.main === module) {
  startServer().catch((error) => {
    console.error('MongoDB :', error.message);
    process.exit(1);
  });
}

module.exports = { app, startServer, connectDatabase };
