# Balanze Logo Usage Guide

## 📁 Available Logo Assets

### 1. SVG Files (in `/public/` folder)
- **`logo-b.svg`** - Just the "B" icon with gradient background
- **`logo-text.svg`** - Just the "Balanze" text with gradient
- **`logo-full.svg`** - Complete logo (B icon + Balanze text)
- **`favicon.svg`** - Favicon version of the B icon

### 2. React Component
- **`BalanzeLogo.tsx`** - Reusable React component

## 🎨 How to Use

### Using SVG Files Directly
```html
<!-- B Icon only -->
<img src="/logo-b.svg" alt="Balanze Icon" />

<!-- Text only -->
<img src="/logo-text.svg" alt="Balanze" />

<!-- Full logo -->
<img src="/logo-full.svg" alt="Balanze Logo" />
```

### Using React Component
```tsx
import { BalanzeLogo } from './components/common/BalanzeLogo';

// Full logo (default)
<BalanzeLogo />

// Just the B icon
<BalanzeLogo variant="icon" />

// Just the text
<BalanzeLogo variant="text" />

// Different sizes
<BalanzeLogo size="sm" />
<BalanzeLogo size="md" />
<BalanzeLogo size="lg" />

// With custom classes
<BalanzeLogo className="my-custom-class" />
```

## 🎯 Usage Examples

### Navigation Bar
```tsx
<BalanzeLogo size="md" />
```

### Footer
```tsx
<BalanzeLogo variant="text" size="sm" />
```

### Loading Screen
```tsx
<BalanzeLogo size="lg" />
```

### Mobile App Icon
```tsx
<BalanzeLogo variant="icon" size="lg" />
```

## 🎨 Design Specifications

### Colors
- **Blue**: #2563eb
- **Purple**: #9333ea
- **White**: #ffffff (for B letter)

### Typography
- **Font**: Arial, sans-serif
- **Weight**: Bold
- **Gradient**: Blue to Purple (horizontal)

### Sizes
- **Small**: 24px (w-6 h-6)
- **Medium**: 32px (w-8 h-8) 
- **Large**: 48px (w-12 h-12)

## 📱 Responsive Usage

The React component automatically handles responsive sizing and maintains the gradient effects across all screen sizes.

## 🔧 Customization

You can customize the logo by:
1. Modifying the SVG files directly
2. Using the `className` prop to add custom styles
3. Creating new variants in the React component 