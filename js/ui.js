/* ui.js - DOM interaction and rendering service */
import { AppState } from './state.js';
import { GeminiService } from './gemini.js';

class UIManagerController {
  constructor() {
    this.selectedFile = null;
  }

  /**
   * Initializes the current date/time widget in the header.
   */
  initCalendar() {
    const dayEl = document.getElementById('widget-day');
    const dateEl = document.getElementById('widget-date');
    if (!dayEl || !dateEl) return;

    const now = new Date();
    
    // Day of the week (e.g., "Saturday")
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    dayEl.textContent = days[now.getDay()];
    
    // Formatted date (e.g., "July 11, 2026")
    const options = { month: 'long', day: 'numeric', year: 'numeric' };
    dateEl.textContent = now.toLocaleDateString('en-US', options);
  }

  /**
   * Initializes event handlers for the API Settings Modal.
   */
  initSettingsModal() {
    const modal = document.getElementById('settings-modal');
    const toggleBtn = document.getElementById('settings-toggle-btn');
    const closeBtn = document.getElementById('close-modal-btn');
    const form = document.getElementById('settings-form');
    const keyInput = document.getElementById('gemini-key-input');

    if (!modal || !toggleBtn || !closeBtn || !form || !keyInput) return;

    // Show modal
    toggleBtn.addEventListener('click', () => {
      keyInput.value = AppState.getApiKey();
      modal.classList.remove('hidden');
      keyInput.focus();
    });

    // Hide modal
    const hideModal = () => modal.classList.add('hidden');
    closeBtn.addEventListener('click', hideModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) hideModal();
    });

    // Form Submit (Save settings)
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const newKey = keyInput.value.trim();
      AppState.setApiKey(newKey);
      hideModal();
    });

    // Handle initial banner state
    this.updateApiStatusIndicator(AppState.getApiKey());
    
    // Listen for API key updates
    AppState.addListener((key, value) => {
      if (key === 'apiKey') {
        this.updateApiStatusIndicator(value);
      }
    });
  }

  /**
   * Updates the API Status banner indicator in the input panel.
   */
  updateApiStatusIndicator(apiKey) {
    const banner = document.getElementById('api-status-banner');
    const text = document.getElementById('api-status-text');
    if (!banner || !text) return;

    if (apiKey) {
      banner.className = 'api-status-banner status-success';
      text.textContent = 'Gemini API Key is active';
    } else {
      banner.className = 'api-status-banner status-error';
      text.textContent = 'Gemini API Key is missing. Click settings to add it.';
    }
  }

  /**
   * Initializes Drag and Drop zone listeners.
   */
  initFileDropzone() {
    const dropzone = document.getElementById('file-dropzone');
    const fileInput = document.getElementById('report-file-input');
    const browseBtn = document.getElementById('browse-btn');
    const fileDetails = document.getElementById('selected-file-details');
    const fileNameText = document.getElementById('selected-file-name');
    const removeFileBtn = document.getElementById('remove-file-btn');

    if (!dropzone || !fileInput || !browseBtn || !fileDetails || !fileNameText || !removeFileBtn) return;

    // Click triggers input file selection
    const triggerFileSelect = () => fileInput.click();
    browseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      triggerFileSelect();
    });
    dropzone.addEventListener('click', () => {
      if (!this.selectedFile) triggerFileSelect();
    });

    // Drag-over styling
    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('is-dragover');
    });

    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('is-dragover');
    });

    // Handle file drops
    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('is-dragover');
      
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        this.handleFileSelection(files[0]);
      }
    });

    // File input change listener
    fileInput.addEventListener('change', () => {
      if (fileInput.files && fileInput.files.length > 0) {
        this.handleFileSelection(fileInput.files[0]);
      }
    });

    // Remove selected file click
    removeFileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.clearSelectedFile();
    });
  }

  /**
   * Validates and displays the selected file in the dropzone.
   */
  async handleFileSelection(file) {
    const dropzone = document.getElementById('file-dropzone');
    const fileDetails = document.getElementById('selected-file-details');
    const fileNameText = document.getElementById('selected-file-name');

    if (!dropzone || !fileDetails || !fileNameText) return;

    // Validate size (10MB)
    const LIMIT = 10 * 1024 * 1024;
    if (file.size > LIMIT) {
      this.showError('File size exceeds the 10MB limit');
      dropzone.classList.add('is-error');
      setTimeout(() => dropzone.classList.remove('is-error'), 3000);
      return;
    }

    this.selectedFile = file;
    fileNameText.textContent = `${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`;
    fileDetails.classList.remove('hidden');
    dropzone.classList.add('is-success');
    
    // Read and save as Base64 in state
    try {
      const base64Data = await GeminiService.getBase64(file);
      AppState.setMedicalReportText(base64Data);
    } catch (err) {
      this.showError(err.message);
      this.clearSelectedFile();
    }
  }

  /**
   * Resets the dropzone upload inputs.
   */
  clearSelectedFile() {
    const dropzone = document.getElementById('file-dropzone');
    const fileInput = document.getElementById('report-file-input');
    const fileDetails = document.getElementById('selected-file-details');

    if (fileInput) fileInput.value = '';
    if (fileDetails) fileDetails.classList.add('hidden');
    if (dropzone) {
      dropzone.classList.remove('is-success');
      dropzone.classList.remove('is-error');
    }
    this.selectedFile = null;
    AppState.setMedicalReportText('');
  }

  /**
   * Returns currently selected file object.
   */
  getSelectedFile() {
    return this.selectedFile;
  }

  /**
   * Renders the meal plan cards (Breakfast, Lunch, Dinner).
   * @param {Object} plan 
   */
  renderMeals(plan) {
    const container = document.getElementById('meal-cards-container');
    if (!container || !plan.meals) return;

    container.innerHTML = '';
    
    const mealKeys = ['breakfast', 'lunch', 'dinner'];
    mealKeys.forEach(key => {
      const meal = plan.meals[key];
      if (!meal) return;

      const card = document.createElement('div');
      card.className = 'meal-card glass-card';
      
      // Select appropriate theme borders
      if (key === 'breakfast') card.style.borderLeftColor = 'var(--google-blue-500)';
      if (key === 'lunch') card.style.borderLeftColor = 'var(--google-green-500)';
      if (key === 'dinner') card.style.borderLeftColor = 'var(--google-yellow-500)';

      const instructionsHtml = meal.instructions.map(step => `<li>${step}</li>`).join('');
      const ingredientsHtml = meal.ingredients.map(ing => `<li>${ing}</li>`).join('');

      card.innerHTML = `
        <div class="meal-card-header">
          <h4 class="meal-card-title">${key.charAt(0).toUpperCase() + key.slice(1)}</h4>
          <span class="prep-time">${meal.preparationTime}</span>
        </div>
        <h5 class="meal-recipe-name">${meal.name}</h5>
        <div class="meal-rationale">${meal.medicalRationale}</div>
        
        <div class="meal-details-split">
          <div>
            <div class="detail-column-title">Ingredients</div>
            <ul class="meal-list">${ingredientsHtml}</ul>
          </div>
          <div>
            <div class="detail-column-title">Instructions</div>
            <ol class="meal-list" style="list-style-type: decimal; padding-left: var(--spacing-md);">${instructionsHtml}</ol>
          </div>
        </div>
      `;
      container.appendChild(card);
    });
  }

  /**
   * Renders the grocery checklist and budget details.
   * @param {Object} plan 
   */
  renderGrocery(plan) {
    const groceryContainer = document.getElementById('grocery-checklist-container');
    const totalCostEl = document.getElementById('total-cost-amount');
    const budgetTierEl = document.getElementById('budget-tier-pill');
    const tipsContainer = document.getElementById('saving-tips-list');
    const budgetCard = document.querySelector('.budget-card');

    if (!groceryContainer || !totalCostEl || !budgetTierEl || !tipsContainer) return;

    // Render Checklist
    groceryContainer.innerHTML = '';
    if (plan.groceryList) {
      // Group groceries by category
      const categories = {};
      plan.groceryList.forEach(item => {
        const cat = item.category || 'Pantry';
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(item);
      });

      Object.keys(categories).forEach(cat => {
        const group = document.createElement('div');
        group.className = 'grocery-category-group';
        group.innerHTML = `<span class="grocery-category-title">${cat}</span>`;

        categories[cat].forEach((item, index) => {
          const itemEl = document.createElement('label');
          itemEl.className = 'grocery-item';
          
          const uniqueId = `grocery-${cat}-${index}`.replace(/\s+/g, '-').toLowerCase();
          
          const substitutionsText = item.substitutions && item.substitutions.length > 0
            ? `<span class="grocery-substitutions">Alt: ${item.substitutions.join(', ')}</span>`
            : '';

          itemEl.innerHTML = `
            <input type="checkbox" id="${uniqueId}" class="grocery-checkbox">
            <div class="grocery-item-details">
              <span class="grocery-item-name">${item.item}</span>
              ${substitutionsText}
              <span class="grocery-item-cost">Est. Cost: $${(item.estimatedCostUsd || 0).toFixed(2)}</span>
            </div>
          `;

          // Checkbox toggle listener
          const checkbox = itemEl.querySelector('input');
          checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
              itemEl.classList.add('is-checked');
            } else {
              itemEl.classList.remove('is-checked');
            }
          });

          group.appendChild(itemEl);
        });

        groceryContainer.appendChild(group);
      });
    }

    // Render Budget details
    if (plan.budgetSummary) {
      const summary = plan.budgetSummary;
      totalCostEl.textContent = `$${(summary.totalEstimatedCostUsd || 0).toFixed(2)}`;
      budgetTierEl.textContent = summary.budgetTier || 'Medium';

      // Set budget tier style class
      budgetTierEl.className = 'tier-pill';
      if (summary.budgetTier === 'High') {
        budgetTierEl.style.backgroundColor = 'var(--google-red-100)';
        budgetTierEl.style.color = 'var(--google-red-500)';
        if (budgetCard) budgetCard.classList.add('is-expensive');
      } else {
        budgetTierEl.style.backgroundColor = 'var(--google-blue-100)';
        budgetTierEl.style.color = 'var(--google-blue-600)';
        if (budgetCard) budgetCard.classList.remove('is-expensive');
      }

      // Render saving tips
      tipsContainer.innerHTML = '';
      if (summary.savingTips) {
        summary.savingTips.forEach(tip => {
          const li = document.createElement('li');
          li.textContent = tip;
          tipsContainer.appendChild(li);
        });
      }
    }
  }

  /**
   * Controls loading views during calculations.
   */
  setLoading(isLoading) {
    const welcome = document.getElementById('welcome-screen');
    const skeleton = document.getElementById('loading-skeleton');
    const results = document.getElementById('plan-results');
    const generateBtn = document.getElementById('generate-plan-btn');
    const spinner = generateBtn?.querySelector('.spinner');
    const btnText = generateBtn?.querySelector('.btn-text');

    if (isLoading) {
      if (welcome) welcome.classList.add('hidden');
      if (results) results.classList.add('hidden');
      if (skeleton) skeleton.classList.remove('hidden');
      if (generateBtn) generateBtn.disabled = true;
      if (spinner) spinner.classList.remove('hidden');
      if (btnText) btnText.textContent = 'Generating Plan...';
    } else {
      if (skeleton) skeleton.classList.add('hidden');
      if (generateBtn) generateBtn.disabled = false;
      if (spinner) spinner.classList.add('hidden');
      if (btnText) btnText.textContent = 'Generate Daily Diet Plan';
    }
  }

  /**
   * Renders error messages in state.
   */
  showError(message) {
    AppState.setError(message);
    // Dynamic overlay alert logic (toast or inline alert box)
    const errorAlert = document.createElement('div');
    errorAlert.style.position = 'fixed';
    errorAlert.style.bottom = '24px';
    errorAlert.style.right = '24px';
    errorAlert.style.backgroundColor = 'var(--google-red-500)';
    errorAlert.style.color = '#ffffff';
    errorAlert.style.padding = '12px 24px';
    errorAlert.style.borderRadius = 'var(--border-radius-md)';
    errorAlert.style.boxShadow = 'var(--shadow-lg)';
    errorAlert.style.fontSize = '14px';
    errorAlert.style.fontWeight = '500';
    errorAlert.style.zIndex = '9999';
    errorAlert.textContent = `Error: ${message}`;

    document.body.appendChild(errorAlert);
    setTimeout(() => {
      errorAlert.remove();
    }, 4000);
  }

  /**
   * Applies appropriate interactive status tokens on click.
   */
  updateInteractiveState(element, state) {
    if (!element) return;
    element.setAttribute('data-state', state);
    
    // Normalise class list states
    const states = ['is-hover', 'is-focus', 'is-active', 'is-disabled', 'is-loading', 'is-error', 'is-success'];
    states.forEach(s => element.classList.remove(s));
    
    if (state !== 'default') {
      element.classList.add(`is-${state}`);
    }
  }
}

export const UIManager = new UIManagerController();
