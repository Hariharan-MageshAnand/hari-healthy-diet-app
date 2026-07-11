/* state.js - Local state store and event emitter */

class AppStateController {
  constructor() {
    this.reset();
  }

  reset() {
    this.state = {
      apiKey: window.localStorage.getItem('gemini_api_key') || 
              (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) || '',
      medicalReportText: '',
      dailyContext: '',
      generatedPlan: null,
      isLoading: false,
      error: null,
    };
    this.listeners = [];
  }

  getApiKey() {
    return this.state.apiKey;
  }

  setApiKey(key) {
    this.state.apiKey = key;
    window.localStorage.setItem('gemini_api_key', key);
    this.notify('apiKey', key);
  }

  isLoading() {
    return this.state.isLoading;
  }

  setLoading(value) {
    this.state.isLoading = !!value;
    this.notify('isLoading', this.state.isLoading);
  }

  getError() {
    return this.state.error;
  }

  setError(message) {
    this.state.error = message;
    this.notify('error', message);
  }

  getDietPlan() {
    return this.state.generatedPlan;
  }

  setDietPlan(plan) {
    this.state.generatedPlan = plan;
    this.notify('generatedPlan', plan);
  }

  getMedicalReportText() {
    return this.state.medicalReportText;
  }

  setMedicalReportText(text) {
    this.state.medicalReportText = text;
    this.notify('medicalReportText', text);
  }

  getDailyContext() {
    return this.state.dailyContext;
  }

  setDailyContext(context) {
    this.state.dailyContext = context;
    this.notify('dailyContext', context);
  }

  addListener(callback) {
    if (typeof callback === 'function') {
      this.listeners.push(callback);
    }
  }

  notify(key, value) {
    for (const listener of this.listeners) {
      try {
        listener(key, value);
      } catch (e) {
        console.error('Error in state listener:', e);
      }
    }
  }
}

export const AppState = new AppStateController();
