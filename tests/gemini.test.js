import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GeminiService } from '../js/gemini.js';

describe('GeminiService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('getBase64', () => {
    it('should throw an error if file size exceeds 10MB', async () => {
      const largeFile = {
        name: 'large_report.pdf',
        size: 11 * 1024 * 1024, // 11MB
        type: 'application/pdf',
      };

      await expect(GeminiService.getBase64(largeFile)).rejects.toThrow(
        'File size exceeds the 10MB limit'
      );
    });

    it('should read file content and return base64 string', async () => {
      // Mock FileReader
      const dummyBase64 = 'dGVzdCBkYXRh'; // "test data" in base64
      const dummyResult = `data:application/pdf;base64,${dummyBase64}`;
      
      const mockFileReader = {
        readAsDataURL: function() {
          this.result = dummyResult;
          setTimeout(() => {
            if (this.onload) {
              this.onload();
            }
          }, 0);
        },
        onload: null,
        onerror: null,
        result: null,
      };

      vi.spyOn(global, 'FileReader').mockImplementation(() => mockFileReader);

      const smallFile = {
        name: 'report.pdf',
        size: 1024, // 1KB
        type: 'application/pdf',
      };

      const result = await GeminiService.getBase64(smallFile);
      expect(result).toBe(dummyBase64);
    });
  });

  describe('generateDietPlan', () => {
    it('should build request body and invoke fetch', async () => {
      const mockResponse = {
        candidates: [{
          content: {
            parts: [{
              text: '{"summary": "Plan details"}'
            }]
          }
        }]
      };

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });
      global.fetch = fetchMock;

      const apiKey = 'test-key';
      const base64Pdf = 'dGVzdCBkYXRh';
      const dailyContext = 'Going to the gym';
      const dateInfo = 'Saturday, July 11, 2026';

      const result = await GeminiService.generateDietPlan(apiKey, base64Pdf, dailyContext, dateInfo);

      expect(fetchMock).toHaveBeenCalled();
      
      // Verify request endpoint contains the apiKey
      const firstCallArgs = fetchMock.mock.calls[0];
      expect(firstCallArgs[0]).toContain(apiKey);

      // Verify request payload holds contents
      const requestOptions = firstCallArgs[1];
      const parsedBody = JSON.parse(requestOptions.body);
      
      expect(parsedBody.contents[0].parts[0].text).toContain(dailyContext);
      expect(parsedBody.contents[0].parts[0].text).toContain(dateInfo);
      
      expect(result).toEqual({ summary: 'Plan details' });
    });

    it('should throw an error on API failure', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });
      global.fetch = fetchMock;

      await expect(
        GeminiService.generateDietPlan('key', 'pdf', 'context', 'date')
      ).rejects.toThrow('Gemini API request failed');
    });
  });
});
