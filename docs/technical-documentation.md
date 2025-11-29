# Technical Documentation – Assignment 3

## Overview

This assignment demonstrates advanced web development functionality including external API integration, complex filtering logic, state management, and sophisticated component design. The portfolio fetches live GitHub repositories, provides interactive skill filtering with persistence, and implements multi-step form validation.

**Live Deployment:** [AtheerHani.dev](https://atheerdev.com) – No setup required, fully deployed and accessible online.

---

## Technologies Used

### HTML5
- Semantic sections and accessible labels
- Data attributes for categorization (`data-category`, `data-filter`)
- Form elements with validation attributes

### CSS3
- Glass-morphism design (backdrop-filter, rgba backgrounds)
- 3D flip card animations with perspective and transform
- Responsive grid layouts with auto-fit
- Smooth transitions and fade-in animations
- Theme-aware styling (light/dark mode variables)

### JavaScript (Advanced)
- **Fetch API** with error handling and async/await
- **localStorage** for state persistence
- **Event delegation** for dynamic filtering
- **DOM manipulation** with classList and animation timing
- **MutationObserver** for theme changes

### External Component Sources (CodePen & References)
- **Animated Background** – Gradient animation with keyframes
- **3D Flip Cards** – Project cards with perspective and rotateY transforms
- **Experience Carousel** – Touch-enabled carousel with viewport scrolling
- **Interactive Cube** – Three.js 3D rendering for skills visualization

---

## Features

### 1. GitHub API Integration
- **Endpoint:** `https://api.github.com/users/{username}/repos`
- **Functionality:** Fetches up to 6 most recently updated public repositories
- **Error Handling:** 
  - Loading state: "Loading repositories..."
  - Error messages with retry button
  - Graceful fallback if API unavailable
- **Displayed Data:** Repo name, description, language, GitHub link

### 2. Skill Filtering System
- **Categories:** All, UI/Design, Front-End, Back-End
- **State Persistence:** Saves selected filter to localStorage with key `skillsFilterSelection`
- **Animation:** Smooth fade-in when filtering cards
- **Active State:** Dark button highlighting for selected category
- **Responsive:** Button layout wraps on mobile

### 3. Complex Validation Logic
- **Contact Form:** Multi-step validation
  1. Empty field check (name, email, message)
  2. Email format verification (regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`)
  3. Form submission via FormSubmit.co API
- **Error Messages:** User-friendly popup feedback
- **Success Feedback:** Modal confirmation with animation

### 4. State Management
- **Filter Persistence:** localStorage stores user's skill category selection
- **Theme State:** `data-theme` attribute tracks light/dark mode
- **Logo Theme Switching:** MutationObserver detects theme changes and updates Hujrah logo
- **Carousel State:** Touch/mouse events manage carousel position

### 5. Advanced UI Components
- **3D Project Cards:** Parallax flip effect with rotateY animation
- **Glass Surface Styling:** Semi-transparent cards with blur backdrop
- **Responsive Grids:** Auto-fit columns that adapt to screen size
- **Smooth Scrolling:** Navigation links scroll to sections smoothly

---

## Project Structure

```
Assignment-3/
├── index.html
├── css/
│   └── styles.css
├── js/
│   └── script.js
├── assets/
│   └── images/
├── docs/
│   ├── ai-usage-report.md
│   ├── technical-documentation.md
│   └── (this file)
└── README.md
```

---

## Key Code Patterns

### GitHub API Fetch with Error Handling
```javascript
fetch(`https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=100`)
  .then(response => {
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  })
  .catch(error => {
    displayError(`Failed to load repositories. ${error.message}`);
  });
```

### localStorage State Persistence
```javascript
const STORAGE_KEY = 'skillsFilterSelection';
const savedFilter = localStorage.getItem(STORAGE_KEY) || 'all';
applyFilter(savedFilter); // Load on page load
localStorage.setItem(STORAGE_KEY, filterValue); // Save on change
```

### Multi-Step Form Validation
```javascript
if (!name.value.trim() || !email.value.trim() || !message.value.trim()) {
  errorMsg = 'Please fill the required fields';
} else if (!isEmail(email.value.trim())) {
  errorMsg = 'Please enter a valid Email';
}
```

---

## Deployment

**Website:** [AtheerHani.dev](https://atheerdev.com)

**Setup Required:** None – fully deployed and live. Simply visit the URL to access the portfolio.

All features work entirely client-side (no backend required for API calls, state, or filtering).

---

## Browser Compatibility

✅ Chrome/Edge (Latest)  
✅ Firefox (Latest)  
✅ Safari (Latest)  
✅ Mobile browsers (iOS Safari, Chrome Mobile)

---

## Performance Considerations

- **Lazy Loading:** Images use native lazy loading where possible
- **API Caching:** GitHub API calls cached in memory
- **CSS Optimization:** Minimal repaints with transform/opacity animations
- **localStorage:** Lightweight state persistence (< 1KB)

---

## Accessibility

- ✅ Semantic HTML structure
- ✅ ARIA labels for form fields
- ✅ Keyboard navigation support
- ✅ Color contrast compliance
- ✅ Responsive design for all screen sizes
