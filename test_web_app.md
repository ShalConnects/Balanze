# 🧪 Balanze Web App Manual Test Checklist

## 🔐 Authentication Tests
- [ ] **Login with salauddin.kader405@gmail.com / New12###T**
- [ ] **Verify user profile loads correctly**
- [ ] **Test logout functionality**
- [ ] **Verify session persistence on page refresh**

## 🏠 Dashboard Tests
- [ ] **Dashboard loads without errors**
- [ ] **All widgets display correctly**
- [ ] **Account balances show accurate data**
- [ ] **Recent transactions display**
- [ ] **Analytics charts render properly**

## ⚙️ Settings Page Tests
- [ ] **Settings page loads correctly**
- [ ] **Tab navigation works (General, Income Category, Expense Category, etc.)**
- [ ] **URL parameters work: `/dashboard/settings?tab=income-category`**
- [ ] **URL parameters work: `/dashboard/settings?tab=expense-category`**
- [ ] **Page refresh maintains correct tab**

## 📂 Category Management Tests

### Income Categories
- [ ] **Income categories tab loads**
- [ ] **Add new income category**
- [ ] **Edit existing income category**
- [ ] **Delete income category (should show custom modal)**
- [ ] **Categories persist after page refresh**

### Expense Categories
- [ ] **Expense categories tab loads**
- [ ] **Add new expense category**
- [ ] **Edit existing expense category**
- [ ] **Delete expense category (should show custom modal)**
- [ ] **Categories persist after page refresh**
- [ ] **Sync Categories button works**

## 💰 Transaction Tests
- [ ] **Transactions page loads**
- [ ] **Add transaction button works**
- [ ] **If no categories exist, shows redirect toast**
- [ ] **Transaction form opens correctly**
- [ ] **Create new transaction**
- [ ] **Edit existing transaction**
- [ ] **Delete transaction (should show custom modal)**
- [ ] **Transaction list updates**

## 🛒 Purchase Tests
- [ ] **Purchases page loads**
- [ ] **Add purchase button works**
- [ ] **If no expense categories exist, shows redirect toast**
- [ ] **Purchase form opens correctly**
- [ ] **Create new purchase**
- [ ] **Edit existing purchase**
- [ ] **Delete purchase (should show custom modal)**
- [ ] **Purchase list updates**

## 🏦 Account Tests
- [ ] **Accounts page loads**
- [ ] **Add account button works**
- [ ] **Create new account**
- [ ] **Edit existing account**
- [ ] **Delete account (should show custom modal)**
- [ ] **Account balances update correctly**

## 🎯 Floating Action Button Tests
- [ ] **Floating button appears on dashboard**
- [ ] **Add Transaction - checks categories first**
- [ ] **Add Purchase - checks categories first**
- [ ] **Add Account - works directly**
- [ ] **Redirect toasts work correctly**

## 🔄 Recent Fixes Tests

### Category Checking
- [ ] **New user with no categories gets redirected to settings**
- [ ] **Transaction form shows category check toast**
- [ ] **Purchase form shows category check toast**
- [ ] **Toast "Go to Settings" button works**

### URL Navigation
- [ ] **Direct navigation to `/dashboard/settings?tab=income-category`**
- [ ] **Direct navigation to `/dashboard/settings?tab=expense-category`**
- [ ] **Page refresh maintains tab state**
- [ ] **Browser back/forward buttons work**

### Custom Delete Modals
- [ ] **Income category deletion shows custom modal**
- [ ] **Expense category deletion shows custom modal**
- [ ] **Account deletion shows custom modal**
- [ ] **Transaction deletion shows custom modal**
- [ ] **Purchase deletion shows custom modal**

## 📱 Responsive Design Tests
- [ ] **Mobile view works correctly**
- [ ] **Tablet view works correctly**
- [ ] **Desktop view works correctly**
- [ ] **Modals work on all screen sizes**

## 🌙 Dark Mode Tests
- [ ] **Dark mode toggle works**
- [ ] **All components support dark mode**
- [ ] **Modals work in dark mode**

## 🚀 Performance Tests
- [ ] **Page load times are reasonable**
- [ ] **No infinite re-render loops**
- [ ] **No console errors**
- [ ] **Smooth animations and transitions**

## 📊 Data Integrity Tests
- [ ] **All data persists after page refresh**
- [ ] **No orphaned records**
- [ ] **Category sync works correctly**
- [ ] **Account balances are accurate**

---

## 🎯 Test Results Summary

**Total Tests:** 50+
**Passed:** ___
**Failed:** ___
**Success Rate:** ___%

## 🔧 Issues Found
- [ ] Issue 1: ________________
- [ ] Issue 2: ________________
- [ ] Issue 3: ________________

## ✅ Recommendations
- [ ] All tests passed - app is working perfectly!
- [ ] Fix critical issues before deployment
- [ ] Address minor issues in next update

---

**Test Date:** _______________
**Tester:** _______________
**App Version:** Latest (Vercel deployment) 