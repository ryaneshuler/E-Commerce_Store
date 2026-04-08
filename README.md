# E-Commerce Store

A Firebase-powered storefront built with `React`, `TypeScript`, and `Vite`. This project supports user authentication, Firestore-backed product management, profile editing, cart syncing, and order history in a single-page shopping experience.

## ✨ Features

### Shopper Experience
- Browse products stored in Firestore
- Filter products by category, price range, and rating
- Add items to the cart with adjustable quantities
- See a live cart count in the navigation bar
- Complete a simulated checkout flow that saves orders to Firestore
- View past orders and open a detailed order summary page

### Account Features
- Register and log in with **Firebase Authentication**
- Show a personalized `Hi, {name}` profile button when signed in
- Create, read, update, and delete user profile data
- Delete an account and remove nested Firestore user data

### Product Management
- Create new products from inside the app
- Open a product details page by clicking a product card
- Edit or delete products from the product details view

## 🛠️ Tech Stack

| Tool | Purpose |
| --- | --- |
| `React 19` | UI components |
| `TypeScript` | Type-safe development |
| `Vite` | Development server and build tooling |
| `Firebase Auth` | Registration, login, logout, account management |
| `Cloud Firestore` | Products, user profiles, carts, and orders |
| `Redux Toolkit` | Cart state management |
| `React Redux` | Redux bindings for React |
| `TanStack React Query` | Data fetching and cache invalidation |
| `CSS` | Styling and layout |

## 📄 Main Pages

- `Home` — product catalog, filters, and add-to-cart controls
- `Login` / `Register` — Firebase email/password authentication
- `Profile` — update personal info and view recent orders
- `Cart` — review items, change quantity, remove items, and checkout
- `Orders` — order history overview
- `Order Details` — full breakdown for a selected order
- `Add Product` — create a new product in Firestore
- `Product Details` — view, edit, or delete a product

## 🚀 Getting Started

### Prerequisites

Install the following first:

- `Node.js` (recommended: v18+)
- `npm`

### Installation

```bash
npm install
```

### Run the app locally

```bash
npm run dev
```

Then open the local Vite URL, usually:

```text
http://localhost:5173
```

## 🔥 Firebase Setup

This project depends on Firebase and Firestore being configured correctly.

### Firebase Console Checklist

1. Create a Firebase project.
2. Add a **Web App** to that project.
3. Enable **Authentication** and turn on the **Email/Password** sign-in provider.
4. Create a **Firestore Database**.
5. Confirm the app values in `src/firebaseConfig.ts` match your Firebase project.
6. Make sure your Firestore security rules allow the reads and writes needed for this app.

> A `.env.example` file is included as a reference, but the current app configuration is defined in `src/firebaseConfig.ts`.

### Suggested Firestore Collections

```text
products/
users/{uid}
users/{uid}/cart
users/{uid}/orders
```

## 📜 Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Build the app for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |

## 📁 Project Structure

```text
src/
├── components/
│   ├── Home.tsx
│   ├── Cart.tsx
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── Profile.tsx
│   ├── CreateProduct.tsx
│   ├── ProductDetails.tsx
│   ├── Orders.tsx
│   └── OrderDetails.tsx
├── redux/
│   ├── cartSlice.ts
│   └── store.ts
├── services/
│   ├── cartStorage.ts
│   └── userProfile.ts
├── firebaseConfig.ts
├── App.tsx
├── App.css
├── main.tsx
└── index.css
```

## ⚙️ App Behavior

- Product data is stored in **Firestore** instead of an external demo API.
- Signed-in users have cart items and orders saved under their Firebase user document.
- Redux manages the active cart in the UI, while Firestore provides longer-term persistence.
- Recent orders are surfaced on the profile page for quick access.
- Navigation updates automatically depending on whether the user is logged in.

## ⚠️ Notes

- Checkout is **simulated** and does not process real payments.
- Navigation is handled with component state in `App.tsx` rather than `React Router`.
- Some Firebase setup must still be completed manually in the Firebase Console.

## 📚 Learning Goals

This project demonstrates:

- Firebase Authentication in a React app
- Firestore CRUD for users, products, carts, and orders
- global state management with Redux Toolkit
- query-based data fetching with React Query
- building a polished single-page storefront UI
