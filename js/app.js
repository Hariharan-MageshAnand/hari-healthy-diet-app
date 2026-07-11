/* app.js - Main application entrypoint and coordinator */
import { AppState } from './state.js';
import { GeminiService } from './gemini.js';
import { UIManager } from './ui.js';

class AppController {
  constructor() {
    this.initialized = false;
  }

  /**
   * Initializes application modules and event bindings.
   */
  init() {
    if (this.initialized) return;

    // 1. Initialize UI widgets and components
    UIManager.initCalendar();
    UIManager.initSettingsModal();
    UIManager.initFileDropzone();

    // 2. Bind action trigger buttons
    const generateBtn = document.getElementById('generate-plan-btn');
    if (generateBtn) {
      // Hover/active state visual triggers
      generateBtn.addEventListener('mouseenter', () => UIManager.updateInteractiveState(generateBtn, 'hover'));
      generateBtn.addEventListener('mouseleave', () => UIManager.updateInteractiveState(generateBtn, 'default'));
      generateBtn.addEventListener('mousedown', () => UIManager.updateInteractiveState(generateBtn, 'active'));
      generateBtn.addEventListener('mouseup', () => UIManager.updateInteractiveState(generateBtn, 'hover'));
      
      generateBtn.addEventListener('click', () => this.handleGenerateRequest());
    }

    this.initialized = true;
    console.log('Daily Diet Planner App initialized successfully.');
  }

  /**
   * Coordinates the generation loop.
   */
  async handleGenerateRequest() {
    const apiKey = AppState.getApiKey();
    if (!apiKey) {
      UIManager.showError('Gemini API Key is missing. Please click the settings icon to configure it.');
      // Open settings modal automatically
      const modal = document.getElementById('settings-modal');
      if (modal) modal.classList.remove('hidden');
      return;
    }

    // Get input context values
    const contextInput = document.getElementById('daily-context-input');
    const dailyContextText = contextInput ? contextInput.value.trim() : '';
    AppState.setDailyContext(dailyContextText);

    const base64Report = AppState.getMedicalReportText() || null;

    // Get temporal context details
    const now = new Date();
    const localTimeInfo = `Date: ${now.toLocaleDateString()}, Time: ${now.toLocaleTimeString()}, Day: ${now.toLocaleDateString('en-US', { weekday: 'long' })}`;

    // Set UI loading view
    UIManager.setLoading(true);

    try {
      // Call Gemini API
      const result = await GeminiService.generateDietPlan(
        apiKey,
        base64Report,
        dailyContextText,
        localTimeInfo
      );

      // Save plan to state
      AppState.setDietPlan(result);

      // Render plan outputs
      UIManager.renderMeals(result);
      UIManager.renderGrocery(result);

      // Render summary header details
      const summaryText = document.getElementById('plan-summary-text');
      if (summaryText) summaryText.textContent = result.summary || 'Diet plan prepared successfully.';

      const conditionsList = document.getElementById('detected-conditions-list');
      if (conditionsList) {
        conditionsList.innerHTML = '';
        if (result.detectedConditions) {
          result.detectedConditions.forEach(cond => {
            const pill = document.createElement('span');
            pill.className = 'condition-pill';
            pill.textContent = cond;
            conditionsList.appendChild(pill);
          });
        }
      }

      // Display plan results panel
      const resultsPanel = document.getElementById('plan-results');
      const welcome = document.getElementById('welcome-screen');
      if (resultsPanel) resultsPanel.classList.remove('hidden');
      if (welcome) welcome.classList.add('hidden');

    } catch (err) {
      UIManager.showError(err.message);
    } finally {
      // Clear UI loading views
      UIManager.setLoading(false);
    }
  }
}

// Instantiate and run on DOM content loaded
const app = new AppController();
document.addEventListener('DOMContentLoaded', () => app.init());

// Export for integration testing
export { app };
