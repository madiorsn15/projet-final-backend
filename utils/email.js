const nodemailer = require('nodemailer');

// ─── CONFIGURATION DU TRANSPORTEUR ────────────────────
const createTransporter = () => {
  const provider = process.env.EMAIL_PROVIDER || 'ethereal';

  if (provider === 'resend') {
    return nodemailer.createTransport({
      host: 'smtp.resend.com',
      port: 587,
      secure: false,
      auth: {
        user: 'resend',
        pass: process.env.RESEND_API_KEY || process.env.EMAIL_PASS,
      },
    });
  }

  if (provider === 'gmail') {
    return nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  // Développement : utilise Ethereal.email pour tester (ne nécessite pas de compte)
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER || 'test@ethereal.email',
      pass: process.env.EMAIL_PASS || 'testpassword',
    },
  });
};

// ─── TEMPLATES HTML ────────────────────────────────
const templates = {
  welcome: (user) => `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bienvenue sur SunuMarché</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'DM Sans', system-ui, sans-serif; 
          background: #0B1B14; 
          color: #ffffff; 
          line-height: 1.6;
        }
        .email-container {
          max-width: 600px;
          margin: 0 auto;
          background: #132B21;
          border-radius: 16px;
          overflow: hidden;
        }
        .email-header {
          background: #E8621A;
          padding: 1.5rem;
          text-align: center;
        }
        .email-logo {
          font-size: 1.75rem;
          font-weight: 900;
          color: #fff;
          font-family: 'Playfair Display', serif;
        }
        .email-content {
          padding: 2rem;
        }
        .email-title {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 1rem;
          color: #fff;
        }
        .email-text {
          color: #7A9A82;
          margin-bottom: 1.5rem;
          font-size: 1rem;
        }
        .highlight {
          color: #fff;
          font-weight: 700;
        }
        .email-button {
          display: inline-block;
          background: linear-gradient(135deg, #E8621A 0%, #B84D10 100%);
          color: #fff;
          padding: 0.9rem 2rem;
          border-radius: 12px;
          text-decoration: none;
          font-weight: 700;
          margin-bottom: 1.5rem;
        }
        .email-footer {
          padding: 1.5rem;
          text-align: center;
          border-top: 1px solid rgba(255,255,255,0.08);
          color: #7A9A82;
          font-size: 0.85rem;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="email-header">
          <div class="email-logo">SunuMarché</div>
        </div>
        <div class="email-content">
          <h1 class="email-title">Bienvenue ${user.name} ! 🎉</h1>
          <p class="email-text">
            Merci de vous être inscrit sur <span class="highlight">SunuMarché</span>, 
            la marketplace moderne pour acheter et vendre partout au Sénégal.
          </p>
          <p class="email-text">
            Vous êtes prêt à :
            <ul style="margin: 0.75rem 0 0.75rem 1.25rem; color: #7A9A82;">
              <li>Acheter des produits locaux</li>
              <li>Vendre vos propres produits</li>
              <li>Communiquer via WhatsApp</li>
            </ul>
          </p>
          <a href="${process.env.CLIENT_URL}" class="email-button">
            Accéder à SunuMarché
          </a>
        </div>
        <div class="email-footer">
          © ${new Date().getFullYear()} SunuMarché — Tous droits réservés<br>
          Dakar, Sénégal
        </div>
      </div>
    </body>
    </html>
  `,

  orderConfirmation: (order) => `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Confirmation de commande</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'DM Sans', system-ui, sans-serif; 
          background: #0B1B14; 
          color: #ffffff; 
          line-height: 1.6;
        }
        .email-container {
          max-width: 600px;
          margin: 0 auto;
          background: #132B21;
          border-radius: 16px;
          overflow: hidden;
        }
        .email-header {
          background: #E8621A;
          padding: 1.5rem;
          text-align: center;
        }
        .email-logo {
          font-size: 1.75rem;
          font-weight: 900;
          color: #fff;
          font-family: 'Playfair Display', serif;
        }
        .email-content {
          padding: 2rem;
        }
        .email-title {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 1rem;
          color: #fff;
        }
        .email-text {
          color: #7A9A82;
          margin-bottom: 1.5rem;
          font-size: 1rem;
        }
        .order-details {
          background: rgba(0,0,0,0.25);
          padding: 1.25rem;
          border-radius: 12px;
          margin: 1.5rem 0;
        }
        .order-item {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem 0;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .order-item:last-child { border-bottom: none; }
        .order-total {
          font-size: 1.25rem;
          font-weight: 800;
          color: #E8621A;
          margin-top: 1rem;
        }
        .email-footer {
          padding: 1.5rem;
          text-align: center;
          border-top: 1px solid rgba(255,255,255,0.08);
          color: #7A9A82;
          font-size: 0.85rem;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="email-header">
          <div class="email-logo">SunuMarché</div>
        </div>
        <div class="email-content">
          <h1 class="email-title">Commande confirmée ! ✅</h1>
          <p class="email-text">
            Merci pour votre commande n°${order._id.slice(-8)} !
          </p>
          <div class="order-details">
            <p style="color: #fff; font-weight: 700; margin-bottom: 0.75rem;">Détails de la commande :</p>
            <div class="order-item">
              <span style="color: #7A9A82;">Statut</span>
              <span style="color: #fff; font-weight: 700;">${order.status}</span>
            </div>
            <div class="order-item">
              <span style="color: #7A9A82;">Date</span>
              <span style="color: #fff;">${new Date(order.createdAt).toLocaleDateString('fr-FR')}</span>
            </div>
            <div class="order-total">
              Total : ${order.totalPrice.toLocaleString('fr-FR')} FCFA
            </div>
          </div>
        </div>
        <div class="email-footer">
          © ${new Date().getFullYear()} SunuMarché — Tous droits réservés<br>
          Dakar, Sénégal
        </div>
      </div>
    </body>
    </html>
  `,

  resetPassword: (resetUrl) => `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Réinitialisation de mot de passe</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'DM Sans', system-ui, sans-serif; 
          background: #0B1B14; 
          color: #ffffff; 
          line-height: 1.6;
        }
        .email-container {
          max-width: 600px;
          margin: 0 auto;
          background: #132B21;
          border-radius: 16px;
          overflow: hidden;
        }
        .email-header {
          background: #E8621A;
          padding: 1.5rem;
          text-align: center;
        }
        .email-logo {
          font-size: 1.75rem;
          font-weight: 900;
          color: #fff;
          font-family: 'Playfair Display', serif;
        }
        .email-content {
          padding: 2rem;
        }
        .email-title {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 1rem;
          color: #fff;
        }
        .email-text {
          color: #7A9A82;
          margin-bottom: 1.5rem;
          font-size: 1rem;
        }
        .email-button {
          display: inline-block;
          background: linear-gradient(135deg, #E8621A 0%, #B84D10 100%);
          color: #fff;
          padding: 0.9rem 2rem;
          border-radius: 12px;
          text-decoration: none;
          font-weight: 700;
          margin-bottom: 1.5rem;
        }
        .warning-text {
          color: rgba(255,255,255,0.6);
          font-size: 0.85rem;
        }
        .email-footer {
          padding: 1.5rem;
          text-align: center;
          border-top: 1px solid rgba(255,255,255,0.08);
          color: #7A9A82;
          font-size: 0.85rem;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="email-header">
          <div class="email-logo">SunuMarché</div>
        </div>
        <div class="email-content">
          <h1 class="email-title">Réinitialisez votre mot de passe</h1>
          <p class="email-text">
            Vous avez demandé la réinitialisation de votre mot de passe sur SunuMarché.
          </p>
          <a href="${resetUrl}" class="email-button">
            Réinitialiser le mot de passe
          </a>
          <p class="warning-text">
            Ce lien expire dans 1 heure. Si vous n'avez pas demandé cette réinitialisation, ignorez simplement cet email.
          </p>
        </div>
        <div class="email-footer">
          © ${new Date().getFullYear()} SunuMarché — Tous droits réservés<br>
          Dakar, Sénégal
        </div>
      </div>
    </body>
    </html>
  `,

  orderToSeller: (order) => `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Nouvelle commande</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'DM Sans', system-ui, sans-serif; 
          background: #0B1B14; 
          color: #ffffff; 
          line-height: 1.6;
        }
        .email-container {
          max-width: 600px;
          margin: 0 auto;
          background: #132B21;
          border-radius: 16px;
          overflow: hidden;
        }
        .email-header {
          background: #E8621A;
          padding: 1.5rem;
          text-align: center;
        }
        .email-logo {
          font-size: 1.75rem;
          font-weight: 900;
          color: #fff;
          font-family: 'Playfair Display', serif;
        }
        .email-content {
          padding: 2rem;
        }
        .email-title {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 1rem;
          color: #fff;
        }
        .email-text {
          color: #7A9A82;
          margin-bottom: 1.5rem;
          font-size: 1rem;
        }
        .order-details {
          background: rgba(0,0,0,0.25);
          padding: 1.25rem;
          border-radius: 12px;
          margin: 1.5rem 0;
        }
        .order-total {
          font-size: 1.25rem;
          font-weight: 800;
          color: #E8621A;
          margin-top: 1rem;
        }
        .email-footer {
          padding: 1.5rem;
          text-align: center;
          border-top: 1px solid rgba(255,255,255,0.08);
          color: #7A9A82;
          font-size: 0.85rem;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="email-header">
          <div class="email-logo">SunuMarché</div>
        </div>
        <div class="email-content">
          <h1 class="email-title">Nouvelle commande ! 🎉</h1>
          <p class="email-text">
            Vous avez reçu une nouvelle commande sur SunuMarché !
          </p>
          <div class="order-details">
            <p style="color: #fff; font-weight: 700; margin-bottom: 0.75rem;">Commande n°${order._id.slice(-8)} :</p>
            <div class="order-total">
              Montant : ${order.totalPrice.toLocaleString('fr-FR')} FCFA
            </div>
          </div>
        </div>
        <div class="email-footer">
          © ${new Date().getFullYear()} SunuMarché — Tous droits réservés<br>
          Dakar, Sénégal
        </div>
      </div>
    </body>
    </html>
  `,
};

// ─── FONCTION D'ENVOI D'EMAIL ────────────────────
const sendEmail = async ({ to, subject, html }) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'SunuMarché <noreply@sunumarket.sn>',
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Email] Envoyé à ${to} | Sujet: ${subject}`);
      console.log(`[Email] Ethereal preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[Email] Erreur envoi:', error.message);
    return { success: false, error: error.message };
  }
};

// ─── EXPORTS DES FONCTIONS SPECIFIQUES ────────────
const sendWelcomeEmail = async (user) => {
  return sendEmail({
    to: user.email,
    subject: `Bienvenue sur SunuMarché, ${user.name} !`,
    html: templates.welcome(user),
  });
};

const sendOrderConfirmationEmail = async (order) => {
  return sendEmail({
    to: order.buyerEmail,
    subject: `Confirmation de commande n°${order._id.slice(-8)}`,
    html: templates.orderConfirmation(order),
  });
};

const sendResetPasswordEmail = async (email, resetUrl) => {
  return sendEmail({
    to: email,
    subject: 'Réinitialisation de votre mot de passe SunuMarché',
    html: templates.resetPassword(resetUrl),
  });
};

const sendOrderNotificationToSeller = async (order) => {
  return sendEmail({
    to: order.sellerEmail,
    subject: `Nouvelle commande sur SunuMarché !`,
    html: templates.orderToSeller(order),
  });
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendOrderConfirmationEmail,
  sendResetPasswordEmail,
  sendOrderNotificationToSeller,
  templates,
};
