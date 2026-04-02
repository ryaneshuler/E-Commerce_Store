# Not Fake Store

A simple front-end e-commerce application built with `React`, `TypeScript`, and `Vite`. The app pulls live product data from the `DummyJSON` API, lets users filter the catalog, manage a cart with Redux, and complete a simulated checkout flow.

## ✨ Features

- Browse a product catalog fetched from `https://dummyjson.com`
- Filter by:
  - category
  - minimum and maximum price
  - minimum review rating
- Add custom quantities to the cart from each product card
- View a live cart count in the header
- Update item quantities or remove products from the cart
- Simulate checkout with a success message and cart reset
- Persist cart items in `sessionStorage` for the current browser session

## 🛠️ Tech Stack

- `React 19`
- `TypeScript`
- `Vite`
- `Redux Toolkit`
- `React Redux`
- `TanStack React Query`
- Plain `CSS`

## 🚀 Getting Started

### Prerequisites

Make sure you have installed:

- `Node.js` (recommended: v18 or newer)
- `npm`

### Installation

```bash
npm install
```

### Run the app locally

```bash
npm run dev
```

Then open the local URL shown in the terminal, usually:

```text
http://localhost:5173
```

## 📜 Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Starts the Vite development server |
| `npm run build` | Builds the app for production |
| `npm run preview` | Previews the production build locally |
| `npm run lint` | Runs ESLint across the project |

## 📁 Project Structure

```text
src/
├── components/
│   ├── Home.tsx       # Product listing, filters, and add-to-cart UI
│   ├── Cart.tsx       # Cart page and checkout flow
│   └── Cart.css       # Cart styling
├── redux/
│   ├── cartSlice.ts   # Cart state and reducers
│   └── store.ts       # Redux store configuration
├── App.tsx            # Top-level page switching
├── App.css            # Main storefront styling
├── main.tsx           # App entry with Redux and React Query providers
└── index.css          # Global styles
```

## ⚙️ How It Works

- `Home.tsx` uses `React Query` to fetch products and categories from the API.
- Filters are applied client-side for price range and review rating.
- `cartSlice.ts` manages cart actions such as add, remove, update quantity, and clear cart.
- Cart data is saved to `sessionStorage`, so it stays available until the browser session ends.
- `Cart.tsx` calculates totals and handles the demo checkout experience.

## ⚠️ Notes

- This project is a **front-end demo** and does not include a real backend, login system, or payment processing.
- Checkout is simulated for UI/UX practice.
- Product availability depends on the external `DummyJSON` API.

## 📚 Learning Goals

This project demonstrates:

- API data fetching with `React Query`
- global state management with `Redux Toolkit`
- cart logic in a React app
- filtering and rendering dynamic product data
- building a clean, responsive storefront UI
