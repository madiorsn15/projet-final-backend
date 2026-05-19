const { body, param, query, validationResult } = require('express-validator');

// ─── HELPER : vérifier les erreurs ───────────────────────────
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Données invalides.',
      errors: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// ─── AUTH ─────────────────────────────────────────────────────
const validateRegister = [
  body('name')
    .trim()
    .notEmpty().withMessage('Le nom est requis.')
    .isLength({ min: 2, max: 50 }).withMessage('Le nom doit contenir entre 2 et 50 caractères.')
    .matches(/^[a-zA-ZÀ-ÿ\s'-]+$/).withMessage('Le nom ne peut contenir que des lettres.'),

  body('email')
    .trim()
    .notEmpty().withMessage('L\'email est requis.')
    .isEmail().withMessage('Format d\'email invalide.')
    .normalizeEmail()
    .isLength({ max: 100 }).withMessage('Email trop long.'),

  body('password')
    .notEmpty().withMessage('Le mot de passe est requis.')
    .isLength({ min: 6, max: 128 }).withMessage('Le mot de passe doit contenir entre 6 et 128 caractères.')
    .matches(/\d/).withMessage('Le mot de passe doit contenir au moins un chiffre.'),

  body('role')
    .optional()
    .isIn(['client', 'vendeur']).withMessage('Rôle invalide. Choisissez client ou vendeur.'),

  body('whatsapp')
    .optional()
    .trim()
    .matches(/^\+?[\d\s\-().]{7,20}$/).withMessage('Numéro WhatsApp invalide.'),

  validate,
];

const validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('L\'email est requis.')
    .isEmail().withMessage('Format d\'email invalide.')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Le mot de passe est requis.')
    .isLength({ max: 128 }).withMessage('Mot de passe trop long.'),

  validate,
];

// ─── PRODUITS ─────────────────────────────────────────────────
const validateProduct = [
  body('name')
    .trim()
    .notEmpty().withMessage('Le nom du produit est requis.')
    .isLength({ min: 2, max: 100 }).withMessage('Le nom doit contenir entre 2 et 100 caractères.'),

  body('price')
    .notEmpty().withMessage('Le prix est requis.')
    .isFloat({ min: 0, max: 100_000_000 }).withMessage('Prix invalide.'),

  body('description')
    .trim()
    .notEmpty().withMessage('La description est requise.')
    .isLength({ min: 10, max: 1000 }).withMessage('La description doit contenir entre 10 et 1000 caractères.'),

  body('category')
    .optional()
    .isIn([
      'Électronique',
      'Vêtements',
      'Maison & Jardin',
      'Sports & Loisirs',
      'Beauté & Santé',
      'Alimentation',
      'Livres',
      'Jeux & Jouets',
      'Automobiles',
      'Autres',
    ])
    .withMessage('Catégorie invalide.'),

  validate,
];

// ─── COMMANDES ────────────────────────────────────────────────
const validateOrder = [
  body('productId')
    .notEmpty().withMessage('L\'identifiant du produit est requis.')
    .isMongoId().withMessage('Identifiant produit invalide.'),

  body('clientName')
    .trim()
    .notEmpty().withMessage('Le nom du client est requis.')
    .isLength({ min: 2, max: 80 }).withMessage('Nom trop court ou trop long.'),

  body('phone')
    .trim()
    .notEmpty().withMessage('Le téléphone est requis.')
    .matches(/^\+?[\d\s\-().]{7,20}$/).withMessage('Numéro de téléphone invalide.'),

  body('address')
    .trim()
    .notEmpty().withMessage('L\'adresse est requise.')
    .isLength({ min: 5, max: 300 }).withMessage('Adresse trop courte ou trop longue.'),

  body('quantity')
    .optional()
    .isInt({ min: 1, max: 99 }).withMessage('Quantité invalide (1-99).'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Notes trop longues (max 500 caractères).'),

  validate,
];

// ─── STATUS COMMANDE ──────────────────────────────────────────
const validateOrderStatus = [
  body('status')
    .notEmpty().withMessage('Le statut est requis.')
    .isIn(['en_attente', 'confirmée', 'en_livraison', 'livrée', 'annulée'])
    .withMessage('Statut invalide.'),
  validate,
];

// ─── PARAMS MONGODB ID ────────────────────────────────────────
const validateMongoId = [
  param('id')
    .isMongoId().withMessage('Identifiant invalide.'),
  validate,
];

// ─── QUERY PARAMS (recherche produits) ────────────────────────
const validateProductQuery = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page invalide.'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limite invalide (1-50).'),
  query('search').optional().trim().isLength({ max: 100 }).withMessage('Recherche trop longue.'),
  query('category').optional().isIn([
    'Tous',
    'Électronique',
    'Vêtements',
    'Maison & Jardin',
    'Sports & Loisirs',
    'Beauté & Santé',
    'Alimentation',
    'Livres',
    'Jeux & Jouets',
    'Automobiles',
    'Autres',
  ]).withMessage('Catégorie invalide.'),
  query('seller').optional().isMongoId().withMessage('Vendeur invalide.'),
  query('minPrice').optional().isFloat({ min: 0 }).withMessage('Prix minimum invalide.'),
  query('maxPrice').optional().isFloat({ min: 0 }).withMessage('Prix maximum invalide.'),
  validate,
];

module.exports = {
  validateRegister,
  validateLogin,
  validateProduct,
  validateOrder,
  validateOrderStatus,
  validateMongoId,
  validateProductQuery,
  validate,
};
