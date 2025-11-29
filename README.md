# SWE363-Assignment3-Atheer
Advanced functionality and API integration for the personal portfolio web application

## 🚀 Live Deployment

**No setup required!** The portfolio is fully deployed and live at: **[AtheerHani.dev](https://atheerdev.com)**

Simply visit the URL to access the portfolio with all features working.

---

## Project Description

This assignment builds on Assignments 1 and 2 by adding advanced features demonstrating real-world web development practices. The portfolio now includes:
- **GitHub API Integration** – Fetches and displays public repositories with error handling and retry functionality
- **Skill Filtering System** – Interactive category filters (All, UI/Design, Front-End, Back-End) with localStorage persistence
- **Complex Form Validation** – Contact form with multi-step validation (empty checks, email format verification)
- **State Management** – User filter selections persist across page reloads using localStorage
- **Responsive UI** – Glass-morphism design with smooth animations and theme-aware styling

The portfolio demonstrates practical API integration, client-side state management, and complex conditional logic while maintaining clean, organized code structure.

---

## How to Run Locally

1. Clone or download this repository to your device  
2. Open the project folder  
3. Open `index.html` in your preferred browser  
4. No server setup required (portfolio works entirely client-side)

---

## Key Features

### API Integration
- **GitHub Repositories Section** – Dynamically fetches public repos from GitHub API
- **Error Handling** – Graceful error messages with retry button if API fails
- **Loading State** – "Loading repositories..." feedback while fetching data

### Complex Logic & State Management
- **Skill Filtering** – Filter skills by category (UI/Design, Front-End, Back-End)
- **Persistent Filters** – Selected filter category saved to localStorage and restored on page reload
- **Form Validation** – Multi-step validation: empty field check → email format verification → submission

### Performance & UX
- **Smooth Animations** – Filter transitions with fade-in effects
- **Theme-Aware Design** – Consistent styling across light/dark modes
- **Responsive Layout** – Mobile-optimized interface

---

## AI Usage

AI tools supported this assignment by:
- Guiding **GitHub API integration** with fetch logic, error handling, and retry patterns
- Assisting with **state management** implementation (localStorage structure and retrieval)
- Helping structure **complex filtering logic** with conditions and card animations
- Improving **documentation clarity** and code organization
- General **debugging** and UX suggestions

Tools like GitHub Copilot, ChatGPT, and Claude supported faster prototyping and problem-solving.

---

## Extensions Used

- **GitHub Copilot** – Code completion and logic suggestions
- **ChatGPT/Claude** – Debugging and logic explanation
- **Prettier** – Code formatting (HTML/CSS/JS)
- **Live Server** – Instant browser preview during development
- **Browser DevTools** – Testing API calls and localStorage

---

## Benefits & Challenges

**Benefits:**
- AI accelerated API integration and state management implementation
- Clear explanations helped understand fetch logic and localStorage patterns
- Faster iteration when refining filter animations and error handling

**Challenges:**
- Ensuring API error handling was robust and user-friendly
- Balancing localStorage state with real-time filtering updates
- Keeping code clean while adding multiple advanced features

---

## Learning Outcomes

Through this assignment, I learned how to:
- **Fetch external APIs** with error handling and user feedback
- **Manage application state** using localStorage for persistence
- **Implement complex conditional logic** with multi-step filtering
- **Handle asynchronous operations** (loading states, error retries)
- **Combine multiple advanced features** while keeping code maintainable
- Build real-world functionality that demonstrates professional web development practices

---

## Responsible Adaptation

AI-generated code was reviewed, tested, and adapted to ensure:
- Full understanding of each implementation
- Alignment with assignment requirements
- Clean, maintainable code structure
- Proper error handling and user experience
