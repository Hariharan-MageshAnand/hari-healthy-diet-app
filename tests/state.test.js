import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AppState } from '../js/state.js';

describe('AppState', () => {
  beforeEach(() => {
    // Clear localStorage and reset AppState singleton values
    window.localStorage.clear();
    AppState.reset();
  });

  it('should load an empty API key by default', () => {
    expect(AppState.getApiKey()).toBe('');
  });

  it('should save the API key to localStorage', () => {
    AppState.setApiKey('test-api-key');
    expect(AppState.getApiKey()).toBe('test-api-key');
    expect(window.localStorage.getItem('gemini_api_key')).toBe('test-api-key');
  });

  it('should load the API key from localStorage on initialization', () => {
    window.localStorage.setItem('gemini_api_key', 'persisted-key');
    AppState.reset(); // Re-initialize
    expect(AppState.getApiKey()).toBe('persisted-key');
  });

  it('should manage loading state and trigger listeners', () => {
    const listener = vi.fn();
    AppState.addListener(listener);

    expect(AppState.isLoading()).toBe(false);
    
    AppState.setLoading(true);
    expect(AppState.isLoading()).toBe(true);
    expect(listener).toHaveBeenCalledWith('isLoading', true);
  });

  it('should manage error message state', () => {
    const listener = vi.fn();
    AppState.addListener(listener);

    expect(AppState.getError()).toBeNull();

    AppState.setError('Something went wrong');
    expect(AppState.getError()).toBe('Something went wrong');
    expect(listener).toHaveBeenCalledWith('error', 'Something went wrong');
  });

  it('should hold the diet plan output state', () => {
    const testPlan = { summary: 'Healthy diet plan' };
    AppState.setDietPlan(testPlan);
    expect(AppState.getDietPlan()).toEqual(testPlan);
  });
});
