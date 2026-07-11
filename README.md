# Daily Diet Planner 🥗

A lightweight, responsive, and privacy-first Single Page Application (SPA) designed to parse medical diagnostics reports, adapt to user daily schedules, and generate personalized daily nutrition plans tailored to Indian cuisine with budgeting in Indian Rupees (₹). 

Hosted easily on **Cloudflare Pages** with zero server costs.

---

## ✨ Features

- **📂 Privacy-First Diagnostics Parser**: Upload or drag-and-drop diagnostic PDFs or images. Text extraction is processed entirely client-side.
- **🇮🇳 Indian Diet Customization**: Diet plan recommendations are restricted to traditional Indian recipes (e.g., Idli, Dosa, Roti, Poha, Khichdi, Dal, Sabzi) and localized ingredients.
- **₹ Localized Budget Tracker**: Grocery lists itemize pricing estimates and track budget targets (Low, Medium, High tiers) directly in Indian Rupees (₹).
- **⏰ Temporal & Contextual Adaptability**: Features an interactive calendar date-time widget and adapts recipe portion sizes and cooking complexity to match the user's daily activity descriptions (e.g., busy days, active schedules).
- **🔒 Secure Key Storage**: Uses local storage to cache your Gemini API key securely in the browser. You can also configure a default key via local environment variables.

---

## 🛠️ Technology Stack

- **Bundler & Dev Server**: Vite 6.4.3
- **Language**: ES6+ JavaScript modules (Vanilla ESM)
- **Styling**: CSS3 using custom Google Material design variables (Blue, Red, Yellow, Green), responsive grid layouts, and glassmorphic overlays
- **Testing Runner**: Vitest 2.1.9 with `jsdom` environments
- **Deployment Platform**: Cloudflare Pages (compatible with Vite 6 automatic configuration)

---

## 🚀 Getting Started

### Prerequisites
- Node.js `v22.16.0` or higher
- npm `v10.9.2` or higher
- A Gemini API Key from [Google AI Studio](https://aistudio.google.com/)

### 1. Installation
Clone the repository and install the development dependencies:
```bash
git clone <repository-url>
cd hari-healthy-diet-app
npm install
```

### 2. Configuration
Copy the environment example file to configure your local credentials:
```bash
cp .env.example .env
```
Open `.env` and configure your API key:
```env
VITE_GEMINI_API_KEY=AIzaSy...your_gemini_key
```
*(Alternatively, you can paste and save your key directly in the app UI by clicking the settings gear icon in the top right).*

### 3. Local Development
Start the local development server:
```bash
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser to preview the app.

### 4. Running Unit Tests
Validate model request payloads, state machine handlers, and helper logic using Vitest:
```bash
npm run test
```

---

## 📁 Directory Structure

```
├── .kiro/               # Kiro-style specification documents and steering rules
├── css/
│   ├── google-theme.css # Material design variables, transitions, and loaders
│   └── main.css         # Grid layouts, typography resets, and widgets styling
├── js/
│   ├── app.js           # Main app entry point and event orchestrator
│   ├── gemini.js        # API service wrapper and JSON prompt schemas
│   ├── state.js         # Reactive in-memory state store synced to localStorage
│   └── ui.js            # Calendar widget, modal handlers, and HTML renderers
├── tests/
│   ├── gemini.test.js   # API request payload and schema unit tests
│   └── state.test.js    # State change emitter and local storage tests
├── index.html           # Main Single Page Application structure
├── package.json         # Scripts, Vite 6 and Vitest 2 dependencies
└── vitest.config.js     # Vitest environment configurations
```

---

## ☁️ Deployment on Cloudflare Pages

This application is ready for zero-configuration deployments on Cloudflare Pages:

1. Push your repository to GitHub or GitLab.
2. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/) and navigate to **Pages**.
3. Create a new project and link your repository.
4. Apply the following settings:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Build Output Directory**: `dist`
5. Click **Save and Deploy**. Cloudflare Pages will build and deploy the app automatically on every commit.
