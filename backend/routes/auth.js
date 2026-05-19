const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { protect, optionalAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

const validateRegister = [
  body('name')
    .trim()
    .notEmpty().withMessage('Le nom est requis.')
    .isLength({ min: 2, max: 50 }).withMessage('Le nom doit contenir entre 2 et 50 caractères.'),
  body('email')
    .trim()
    .notEmpty().withMessage('L\'email est requis.')
    .isEmail().withMessage('Email invalide.'),
  body('password')
    .notEmpty().withMessage('Le mot de passe est requis.')
    .isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères.'),
  validate,
];

const validateLogin = [
  body('email').trim().notEmpty().withMessage('L\'email est requis.').isEmail().withMessage('Email invalide.'),
  body('password').notEmpty().withMessage('Le mot de passe est requis.'),
  validate,
];

router.post('/register', validateRegister, authController.register);
router.post('/login', validateLogin, authController.login);
router.post('/logout', protect, authController.logout);
router.get('/me', protect, authController.me);
router.post('/change-password', protect, [
  body('currentPassword').notEmpty().withMessage('Mot de passe actuel requis.'),
  body('newPassword').notEmpty().withMessage('Nouveau mot de passe requis.').isLength({ min: 6 }),
  validate,
], authController.changePassword);
router.post('/forgot-password', [body('email').trim().isEmail().withMessage('Email invalide.'), validate], authController.forgotPassword);
router.post('/reset-password/:token', [body('password').notEmpty().withMessage('Mot de passe requis.').isLength({ min: 6 }), validate], authController.resetPassword);

module.exports = router;
