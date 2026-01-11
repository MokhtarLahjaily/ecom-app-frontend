# 🛍️ E-Commerce Frontend (Angular 19)

Application frontend Angular pour la plateforme e-commerce microservices.

---

## 🛠 Technologies

- **Angular** 19.2.6
- **Signals** (State management réactif)
- **Keycloak-js** 23.0.0 (OAuth2/OIDC)
- **RxJS** (Reactive programming)

---

## ✨ Features

- ✅ Authentification OAuth2 avec Keycloak
- ✅ Catalogue produits avec recherche
- ✅ Panier d'achat (localStorage)
- ✅ Gestion des commandes
- ✅ Interface Admin (CRUD produits)
- ✅ Toast notifications
- ✅ Skeleton loading
- ✅ Navigation responsive (hamburger)
- ✅ Gestion des rôles (USER/ADMIN)

---

## 📋 Prerequisites

| Outil | Version |
|-------|---------|
| Node.js | 18+ |
| npm | 10+ |
| Angular CLI | 19+ |

---

## 🚀 Getting Started

### Installation

```bash
# Installer les dépendances
npm install

# Démarrer en développement
ng serve
```

L'application sera accessible sur http://localhost:4200

### Build Production

```bash
ng build --configuration production
```

---

## 🔧 Configuration

La configuration Keycloak se trouve dans `src/app/app.config.ts` :

```typescript
export const keycloak = new Keycloak({
  url: 'http://localhost:8080',
  realm: 'ecom-realm',
  clientId: 'ecom-app-frontend'
});
```

---

## 📁 Structure du Projet

```
src/app/
├── components/
│   ├── products/          # Catalogue et CRUD produits
│   ├── product-detail/    # Page détail produit
│   ├── cart/              # Panier d'achat
│   ├── orders/            # Historique commandes
│   └── toast/             # Notifications
├── services/
│   ├── security.service   # Auth Keycloak
│   ├── product.service    # API Produits
│   ├── cart.service       # Gestion panier
│   └── customer.service   # API Clients
├── interceptors/
│   └── auth.interceptor   # JWT token
└── guards/
    └── auth.guard         # Protection routes
```

---

## 🔗 API Backend

L'application consomme l'API Gateway sur `http://localhost:8888`

---

## 👥 Utilisateurs de Test

| User | Password | Role |
|------|----------|------|
| user1 | 1234 | USER |
| admin1 | 1234 | ADMIN |
