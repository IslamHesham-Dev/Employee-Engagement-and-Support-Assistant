# HRHelpDesk Branding Guidelines
## Design System & Visual Identity

### 🎨 Brand Identity

#### **App Name & Tagline**
- **Primary Name**: HRHelpDesk
- **Tagline**: "Your AI-powered Employee Engagement & Support Assistant"
- **Font Weight**: Bold, clean sans-serif
- **Placement**: Top-left header (LTR), Top-right header (RTL)

#### **Brand Personality**
- **Professional & Corporate**: Financial/credit bureau platform aesthetic
- **Trustworthy**: Clean, reliable, and secure feeling
- **Modern & Clean**: Contemporary design with clear hierarchy
- **Approachable**: Employee-friendly while maintaining professionalism
- **Bilingual**: Seamless English LTR ↔ Arabic RTL experience

---

## 🎨 Color Palette

### **Primary Colors**
```css
/* Brand Main - Purple */
--color-primary: #5A2D82;
--color-primary-dark: #4A2470;
--color-primary-light: #6B3694;

/* Background Colors */
--color-white: #FFFFFF;
--color-light-gray: #F5F5F5;
--color-background: #FAFAFA;
```

### **Secondary/Accent Colors**
```css
/* Teal Green - CTAs & Highlights */
--color-accent: #00B59D;
--color-accent-dark: #009985;
--color-accent-light: #1AC3AD;

/* Text Colors */
--color-text-primary: #333333;
--color-text-secondary: #666666;
--color-text-muted: #999999;
```

### **Semantic Colors**
```css
/* Status Colors */
--color-success: #28A745;
--color-warning: #FFC107;
--color-error: #DC3545;
--color-info: #17A2B8;

/* Neutral Grays */
--color-gray-100: #F8F9FA;
--color-gray-200: #E9ECEF;
--color-gray-300: #DEE2E6;
--color-gray-400: #CED4DA;
--color-gray-500: #ADB5BD;
```

---

## 📝 Typography

### **Font Family**
```css
/* Primary Font Stack */
--font-family-primary: 'Inter', 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;

/* Arabic Font Support */
--font-family-arabic: 'Noto Sans Arabic', 'Tajawal', 'Cairo', sans-serif;

/* Combined Multi-language */
--font-family-system: 'Inter', 'Noto Sans Arabic', system-ui, sans-serif;
```

### **Typography Scale**
```css
/* Headings */
--font-size-h1: 2.5rem;    /* 40px */
--font-size-h2: 2rem;      /* 32px */
--font-size-h3: 1.75rem;   /* 28px */
--font-size-h4: 1.5rem;    /* 24px */
--font-size-h5: 1.25rem;   /* 20px */
--font-size-h6: 1rem;      /* 16px */

/* Body Text */
--font-size-base: 1rem;     /* 16px */
--font-size-sm: 0.875rem;   /* 14px */
--font-size-xs: 0.75rem;    /* 12px */

/* Font Weights */
--font-weight-light: 300;
--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
```

### **Typography Styles**
```css
/* Heading Styles */
.heading-primary {
  color: var(--color-primary);
  font-weight: var(--font-weight-bold);
}

.heading-secondary {
  color: var(--color-text-primary);
  font-weight: var(--font-weight-semibold);
}

/* Body Text */
.text-body {
  color: var(--color-text-primary);
  font-weight: var(--font-weight-normal);
  line-height: 1.6;
}

.text-muted {
  color: var(--color-text-muted);
}
```

---

## 🧩 Component Styles

### **Buttons**
```css
/* Primary Button - Teal */
.btn-primary {
  background-color: var(--color-accent);
  border: 2px solid var(--color-accent);
  color: var(--color-white);
  border-radius: 8px;
  padding: 12px 24px;
  font-weight: var(--font-weight-medium);
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background-color: var(--color-accent-dark);
  border-color: var(--color-accent-dark);
  transform: translateY(-1px);
}

/* Secondary Button - Purple Outline */
.btn-secondary {
  background-color: transparent;
  border: 2px solid var(--color-primary);
  color: var(--color-primary);
  border-radius: 8px;
  padding: 12px 24px;
  font-weight: var(--font-weight-medium);
}

.btn-secondary:hover {
  background-color: var(--color-primary);
  color: var(--color-white);
}

/* Button Sizes */
.btn-sm { padding: 8px 16px; font-size: var(--font-size-sm); }
.btn-lg { padding: 16px 32px; font-size: 1.125rem; }
```

### **Cards**
```css
.card {
  background-color: var(--color-white);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(90, 45, 130, 0.1);
  border: 1px solid var(--color-gray-200);
  padding: 24px;
  transition: box-shadow 0.2s ease;
}

.card:hover {
  box-shadow: 0 4px 16px rgba(90, 45, 130, 0.15);
}

.card-header {
  background-color: var(--color-primary);
  color: var(--color-white);
  padding: 16px 24px;
  border-radius: 12px 12px 0 0;
  margin: -24px -24px 24px -24px;
}
```

### **Form Elements**
```css
.form-input {
  border: 2px solid var(--color-gray-300);
  border-radius: 8px;
  padding: 12px 16px;
  font-size: var(--font-size-base);
  transition: border-color 0.2s ease;
}

.form-input:focus {
  border-color: var(--color-accent);
  outline: none;
  box-shadow: 0 0 0 3px rgba(0, 181, 157, 0.1);
}

.form-label {
  color: var(--color-text-primary);
  font-weight: var(--font-weight-medium);
  margin-bottom: 8px;
  display: block;
}
```

---

## 🏗️ Layout Structure

### **Header Layout**
```css
/* Main Header */
.header {
  background-color: var(--color-white);
  border-bottom: 1px solid var(--color-gray-200);
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* Logo & Brand */
.brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-logo {
  height: 40px;
  width: auto;
}

.brand-name {
  font-size: 1.5rem;
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
}

/* Navigation */
.nav-main {
  background-color: var(--color-primary);
  padding: 0;
}

.nav-item {
  color: var(--color-white);
  padding: 16px 24px;
  text-decoration: none;
  transition: background-color 0.2s ease;
}

.nav-item:hover {
  background-color: var(--color-primary-dark);
}
```

### **Hero Section**
```css
.hero {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  color: var(--color-white);
  padding: 80px 0;
  text-align: center;
}

.hero-title {
  font-size: var(--font-size-h1);
  font-weight: var(--font-weight-bold);
  margin-bottom: 16px;
}

.hero-subtitle {
  font-size: 1.25rem;
  opacity: 0.9;
  margin-bottom: 32px;
}
```

---

## 🌐 Bilingual Support (LTR/RTL)

### **Directional Styles**
```css
/* LTR (English) Styles */
[dir="ltr"] .brand {
  margin-right: auto;
}

[dir="ltr"] .nav-items {
  margin-left: auto;
}

/* RTL (Arabic) Styles */
[dir="rtl"] .brand {
  margin-left: auto;
  flex-direction: row-reverse;
}

[dir="rtl"] .nav-items {
  margin-right: auto;
}

[dir="rtl"] .brand-name {
  font-family: var(--font-family-arabic);
}

/* Language Switcher */
.language-switcher {
  display: flex;
  background-color: var(--color-gray-100);
  border-radius: 20px;
  padding: 4px;
}

.language-option {
  padding: 8px 16px;
  border-radius: 16px;
  transition: all 0.2s ease;
  cursor: pointer;
}

.language-option.active {
  background-color: var(--color-accent);
  color: var(--color-white);
}
```

---

## 📱 Responsive Design

### **Breakpoints**
```css
/* Mobile First Approach */
--breakpoint-sm: 576px;   /* Small devices */
--breakpoint-md: 768px;   /* Medium devices */
--breakpoint-lg: 992px;   /* Large devices */
--breakpoint-xl: 1200px;  /* Extra large devices */

/* Mobile Styles */
@media (max-width: 767px) {
  .header {
    padding: 12px 16px;
  }
  
  .brand-name {
    font-size: 1.25rem;
  }
  
  .nav-main {
    display: none; /* Mobile menu toggle */
  }
}
```

---

## 🎯 Component Examples

### **Dashboard Widget**
```css
.dashboard-widget {
  background-color: var(--color-white);
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(90, 45, 130, 0.1);
  border-left: 4px solid var(--color-accent);
}

.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.widget-title {
  color: var(--color-primary);
  font-weight: var(--font-weight-semibold);
  font-size: 1.125rem;
}

.widget-value {
  font-size: 2rem;
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

.widget-change {
  font-size: var(--font-size-sm);
  color: var(--color-success);
}
```

### **Chat Interface**
```css
.chat-container {
  background-color: var(--color-white);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(90, 45, 130, 0.1);
  overflow: hidden;
}

.chat-header {
  background-color: var(--color-primary);
  color: var(--color-white);
  padding: 16px 24px;
  font-weight: var(--font-weight-medium);
}

.chat-message-user {
  background-color: var(--color-accent);
  color: var(--color-white);
  border-radius: 18px 18px 4px 18px;
  padding: 12px 16px;
  margin: 8px 0;
  margin-left: auto;
  max-width: 70%;
}

.chat-message-bot {
  background-color: var(--color-gray-100);
  color: var(--color-text-primary);
  border-radius: 18px 18px 18px 4px;
  padding: 12px 16px;
  margin: 8px 0;
  max-width: 70%;
}
```

---

## 🎨 Design Tokens (CSS Custom Properties)

### **Complete Design System**
```css
:root {
  /* Colors */
  --color-primary: #5A2D82;
  --color-primary-dark: #4A2470;
  --color-primary-light: #6B3694;
  --color-accent: #00B59D;
  --color-accent-dark: #009985;
  --color-white: #FFFFFF;
  --color-light-gray: #F5F5F5;
  --color-text-primary: #333333;
  --color-text-secondary: #666666;
  
  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --spacing-2xl: 48px;
  
  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-round: 50%;
  
  /* Shadows */
  --shadow-sm: 0 2px 4px rgba(90, 45, 130, 0.1);
  --shadow-md: 0 2px 8px rgba(90, 45, 130, 0.1);
  --shadow-lg: 0 4px 16px rgba(90, 45, 130, 0.15);
  
  /* Transitions */
  --transition-fast: 0.15s ease;
  --transition-base: 0.2s ease;
  --transition-slow: 0.3s ease;
}
```

---

## ✅ Brand Guidelines Checklist

### **Design Consistency**
- [ ] Use purple (#5A2D82) for primary brand elements
- [ ] Use teal (#00B59D) for CTAs and interactive elements
- [ ] Maintain white backgrounds with light gray sections
- [ ] Apply consistent border radius (8px-12px)
- [ ] Use proper typography hierarchy

### **Bilingual Requirements**
- [ ] Support Arabic RTL layout switching
- [ ] Include Arabic font families
- [ ] Test all components in both directions
- [ ] Ensure proper text alignment
- [ ] Validate cultural appropriateness

### **Professional Appearance**
- [ ] Clean, corporate aesthetic
- [ ] Consistent spacing and alignment
- [ ] Subtle shadows and hover effects
- [ ] Clear visual hierarchy
- [ ] Accessible color contrast ratios

### **User Experience**
- [ ] Intuitive navigation structure
- [ ] Clear call-to-action buttons
- [ ] Responsive design across devices
- [ ] Fast loading and smooth animations
- [ ] Consistent interaction patterns

This branding guide ensures HRHelpDesk maintains a professional, trustworthy appearance while being approachable and user-friendly for all employees.
