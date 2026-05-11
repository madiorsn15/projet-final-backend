# 🌍 SunuMarché - Plateforme de Marché Sénégalaise

Une marketplace moderne et intuitive conçue pour connecter les vendeurs et acheteurs au Sénégal. Facilitez vos transactions en ligne avec une interface élégante et des fonctionnalités puissantes.

## 📋 Table des Matières

- [🌟 Fonctionnalités Principales](#-fonctionnalités-principales)
- [🏗️ Architecture du Projet](#️-architecture-du-projet)
- [🛠️ Technologies Utilisées](#️-technologies-utilisées)
- [📦 Structure du Projet](#-structure-du-projet)
- [🚀 Installation](#-installation)
- [⚙️ Configuration](#️-configuration)
- [🎯 Scripts Disponibles](#-scripts-disponibles)
- [🌐 Déploiement](#-déploiement)
- [🔧 API Documentation](#-api-documentation)
- [🤝 Contribuer](#-contribuer)
- [📄 Licence](#-licence)

---

## 🌟 Fonctionnalités Principales

### 👤 Pour les Utilisateurs
- **Authentification Sécurisée** : Inscription, connexion avec JWT
- **Navigation Intuitive** : Interface moderne et responsive
- **Recherche Avancée** : Filtrage par catégorie, prix, et recherche textuelle
- **Favoris** : Sauvegardez vos produits préférés
- **Commandes Simplifiées** : Processus de commande fluide
- **Contact WhatsApp** : Communication directe avec les vendeurs

### 🛍️ Pour les Vendeurs
- **Gestion des Produits** : Ajout, modification, suppression
- **Upload d'Images** : Gestion des visuels produits
- **Dashboard Personnel** : Statistiques de vente, vues, clics
- **Gestion des Commandes** : Suivi des commandes reçues
- **Profil Public** : Page vendeur personnalisée

### 🔧 Fonctionnalités Techniques
- **Design Moderne** : Interface avec thème SunuMarché
- **Responsive Design** : Compatible mobile, tablette, desktop
- **Notifications Toast** : Feedback utilisateur en temps réel
- **Gestion d'Erreurs** : Messages d'erreur conviviaux
- **Sécurité** : Protection contre les attaques web communes

---

## 🏗️ Architecture du Projet

### Frontend (React)
```
frontend/
├── src/
│   ├── components/          # Composants réutilisables
│   │   ├── Navbar.js      # Barre de navigation
│   │   ├── Footer.js      # Pied de page
│   │   └── ProductCard.js # Carte produit
│   ├── context/           # Contexte React
│   │   ├── AuthContext.js # Gestion authentification
│   │   └── FavoritesContext.js # Gestion favoris
│   ├── pages/             # Pages principales
│   │   ├── HomePage.js    # Page d'accueil
│   │   ├── ProductsPage.js # Liste des produits
│   │   ├── ProductDetailPage.js # Détail produit
│   │   ├── LoginPage.js   # Connexion
│   │   ├── RegisterPage.js # Inscription
│   │   ├── DashboardPage.js # Tableau de bord
│   │   └── ...
│   ├── utils/             # Utilitaires
│   │   └── api.js        # Configuration Axios
│   └── App.js            # Composant principal
├── public/               # Fichiers statiques
│   ├── index.html        # Template HTML
│   └── favicon.svg      # Favicon SunuMarché
└── package.json         # Dépendances frontend
```

### Backend (Node.js/Express)
```
backend/
├── controllers/          # Logique métier
│   ├── authController.js     # Authentification
│   ├── productController.js   # Gestion produits
│   ├── userController.js     # Gestion utilisateurs
│   └── orderController.js    # Gestion commandes
├── middleware/           # Middleware Express
│   ├── auth.js        # Vérification JWT
│   └── upload.js      # Gestion uploads
├── models/              # Schémas Mongoose
│   ├── User.js        # Modèle utilisateur
│   ├── Product.js     # Modèle produit
│   └── Order.js       # Modèle commande
├── routes/              # Routes API
│   ├── auth.js        # Routes authentification
│   ├── products.js    # Routes produits
│   ├── users.js       # Routes utilisateurs
│   └── orders.js      # Routes commandes
├── uploads/            # Fichiers uploadés
├── tests/              # Tests backend
├── server.js           # Serveur principal
├── seed.js            # Données de test
└── package.json       # Dépendances backend
```

---

## 🛠️ Technologies Utilisées

### Frontend
- **React 19.2.5** : Framework JavaScript moderne
- **React Router 7.14.1** : Routage client-side
- **Axios 1.15.0** : Client HTTP pour les appels API
- **React Hot Toast 2.6.0** : Notifications élégantes
- **CSS3** : Styles modernes avec animations
- **Google Fonts** : Typographie professionnelle

### Backend
- **Node.js** : Runtime JavaScript serveur
- **Express 4.18.2** : Framework web minimaliste
- **MongoDB 7.3.1** : Base de données NoSQL
- **Mongoose** : ODM MongoDB pour Node.js
- **JWT 9.0.0** : Tokens d'authentification
- **bcryptjs 2.4.3** : Hashage des mots de passe
- **Multer 2.0.0** : Gestion des uploads de fichiers

### Sécurité
- **Helmet 8.1.0** : Sécurisation des headers HTTP
- **CORS 2.8.6** : Gestion des requêtes cross-origin
- **Express Rate Limit 8.3.2** : Limitation des requêtes
- **Express Mongo Sanitize 2.2.0** : Protection contre injections NoSQL
- **HPP 0.2.3** : Protection contre pollution de paramètres

---

## 📦 Structure du Projet

```
marketplace/
├── backend/             # API REST Node.js/Express
├── frontend/            # Application React
├── .gitignore          # Fichiers ignorés par Git
├── package.json        # Scripts du projet racine
└── README.md          # Documentation du projet
│   ├── server.js
│   ├── package.json
│   └── .env.example
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.js
    │   │   ├── Footer.js
    │   │   └── ProductCard.js
    │   ├── context/
    │   │   └── AuthContext.js
    │   ├── pages/
    │   │   ├── HomePage.js
    │   │   ├── ProductsPage.js
    │   │   ├── ProductDetailPage.js
    │   │   ├── LoginPage.js
    │   │   ├── RegisterPage.js
    │   │   ├── DashboardPage.js
    │   │   ├── ProfilePage.js
    │   │   └── AdminPage.js
    │   ├── utils/
    │   │   └── api.js
    │   ├── App.js
    │   ├── index.js
    │   └── index.css
    └── package.json
```

---

## 🚀 Installation et lancement

### Prérequis
- Node.js v18+
- MongoDB (local ou MongoDB Atlas)
- npm ou yarn

---

### 1. Backend

```bash
cd backend

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env
# Éditez .env avec vos valeurs :
# MONGO_URI=mongodb://localhost:27017/marketplace
# JWT_SECRET=votre_secret_tres_securise
# CLIENT_URL=http://localhost:3000
# PORT=5000

# Lancer le serveur (développement)
npm run dev

# Lancer en production
npm start
```

Le backend tourne sur → **http://localhost:5000**

---

### 2. Frontend

```bash
cd frontend

# Installer les dépendances
npm install

# Créer le fichier .env (optionnel)
echo "REACT_APP_API_URL=http://localhost:5000/api" > .env
echo "REACT_APP_SERVER_URL=http://localhost:5000" >> .env

# Lancer l'application
npm start
```

Le frontend tourne sur → **http://localhost:3000**

---

## 👥 Rôles utilisateurs

| Rôle | Accès |
|------|-------|
| **Client** | Consulte les produits, passe des commandes, voir son profil |
| **Vendeur** | Gère ses produits, voit ses commandes reçues |
| **Admin** | Gère tous les utilisateurs et tous les produits |

---

## 🔑 API Endpoints

### Auth
| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/auth/register` | Inscription |
| POST | `/api/auth/login` | Connexion |
| GET | `/api/auth/me` | Profil connecté |

### Produits
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/products` | Liste (avec search, category, page) |
| GET | `/api/products/:id` | Détail produit |
| POST | `/api/products` | Créer (vendeur) |
| PUT | `/api/products/:id` | Modifier (vendeur) |
| DELETE | `/api/products/:id` | Supprimer (vendeur/admin) |
| GET | `/api/products/seller/me` | Mes produits |

### Commandes
| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/orders` | Créer une commande |
| GET | `/api/orders/me` | Mes commandes (client) |
| GET | `/api/orders/seller` | Commandes reçues (vendeur) |
| PATCH | `/api/orders/:id/status` | Mettre à jour le statut |

### Utilisateurs
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/users/profile` | Mon profil |
| PUT | `/api/users/profile` | Modifier mon profil |
| GET | `/api/users` | Tous les users (admin) |
| PATCH | `/api/users/:id/toggle` | Activer/désactiver (admin) |

---

## 📱 Intégration WhatsApp

Le lien WhatsApp est généré dynamiquement :

```
https://wa.me/{numero}?text=Bonjour ! Je suis intéressé(e) par votre produit *{nom}* au prix de *{prix} FCFA*...
```

---

## 🔒 Sécurité (MVP)

- Mots de passe hashés avec **bcryptjs** (salt rounds: 12)
- Authentification par **JWT** (expiration 7 jours)
- Routes protégées par middleware
- Contrôle des rôles (client / vendeur / admin)
- Validation des données côté backend
- Upload d'images limité à 5MB, formats images uniquement

---

## 🔮 Évolutions futures

- [ ] Paiement Wave / Orange Money
- [ ] Système d'avis et notation
- [ ] Vérification des vendeurs
- [ ] Application mobile React Native
- [ ] Notifications en temps réel (Socket.io)
- [ ] Tableau de bord analytics
- [ ] Rate limiting et protection anti-brute force
- [ ] HTTPS + Helmet.js en production

---

## 📄 Livrables

- ✅ Application web fonctionnelle
- ✅ Code source complet
- ✅ Documentation technique (ce fichier)
- ✅ Cahier des charges

---

*Projet réalisé dans le cadre d'un MVP de marketplace locale au Sénégal.*
