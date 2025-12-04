# Balanze - Personal Finance Management

A modern, multi-user SaaS finance application built with React, TypeScript, Zustand, Supabase, Vite, and Tailwind CSS.

---

## 🚀 Setup

1. **Clone the repo**
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Configure Supabase**
   - Set your Supabase URL and Anon Key in `.env` or `vite.config.ts`.
   - Run the provided SQL migrations to set up the database schema (see below).
4. **Start the app**
   ```bash
   npm run dev
   ```

---

## ✨ Main Features

- **Authentication**: Register, login, and secure multi-user support (Supabase Auth)
- **Accounts & Transactions**: CRUD for accounts and transactions, persistent in Supabase
- **Multi-currency**: Track balances and analytics in multiple currencies (USD, BDT, etc.)
- **Dashboard**: Modern dashboard with grouped stats, analytics, and charts
- **To-Do List**: Dynamic, animated, and persistent to-do list (Supabase-backed)
- **Global Search**: Tabbed, responsive search dropdown for accounts, transactions, and categories
- **Donation & Saving Tracking**: For each income, track how much to save and donate; analytics in sidebar
- **Plans Page**: SaaS plan management UI
- **Responsive UI**: Beautiful, mobile-friendly, and accessible

---

## 🗃️ Database Schema (Supabase SQL)

```sql
-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- Accounts
alter table accounts add column if not exists donation_preference numeric;

-- Transactions
alter table transactions add column if not exists saving_amount numeric;
alter table transactions add column if not exists donation_amount numeric;
```

---

## 📝 Changelog

### [Current]
- Added donation_preference to accounts and saving_amount, donation_amount to transactions
- To-Do List is now Supabase-backed and persistent
- Sidebar card shows donation stats (total due, last donation)
- Transaction form supports saving and donation fields for income
- Global search with tabs and modern dropdown
- Multi-currency analytics and dashboard
- All CRUD operations are async and persistent
- UI/UX polish: animations, responsive, modern design

---

## 📌 How to Update This Documentation
- **Every time you add a new feature or make a significant change, update this README.**
- Add a bullet to the changelog and update the features list if needed.

---

For any questions or contributions, open an issue or PR!
