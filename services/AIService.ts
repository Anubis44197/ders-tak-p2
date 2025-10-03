import { GoogleGenAI } from "@google/genai";

export interface APIError {
  type: 'network' | 'rate_limit' | 'invalid_key' | 'parse_error' | 'unknown';
  message: string;
  retryable: boolean;
}

export class AIService {
  private ai: GoogleGenAI;
  private retryCount = 3;
  private retryDelay = 1000; // ms

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Google AI API key is required');
    }
    this.ai = new GoogleGenAI({ apiKey });
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private parseError(error: any): APIError {
    const message = error?.message || String(error);
    
    if (message.includes('quota') || message.includes('rate')) {
      return {
        type: 'rate_limit',
        message: 'API rate limit exceeded. Please try again later.',
        retryable: true
      };
    }
    
    if (message.includes('key') || message.includes('authentication')) {
      return {
        type: 'invalid_key',
        message: 'Invalid API key. Please check your configuration.',
        retryable: false
      };
    }
    
    if (message.includes('network') || message.includes('fetch')) {
      return {
        type: 'network',
        message: 'Network error. Please check your connection.',
        retryable: true
      };
    }

    return {
      type: 'unknown',
      message: 'An unexpected error occurred.',
      retryable: false
    };
  }

  private async retryOperation<T>(
    operation: () => Promise<T>,
    attempt = 1
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      const apiError = this.parseError(error);
      
      if (!apiError.retryable || attempt >= this.retryCount) {
        throw apiError;
      }
      
      await this.delay(this.retryDelay * attempt);
      return this.retryOperation(operation, attempt + 1);
    }
  }

  async generateReport(data: any, period: string): Promise<any> {
    const prompt = `Bir ebeveyn için çocuğunun eğitim performansını analiz ediyorsun. Aşağıdaki JSON verilerini kullanarak Türkçe bir rapor oluştur.
    Veri: ${JSON.stringify(data)}
   
    Raporun şu alanları içermeli:
    - summary: Genel performansı özetleyen kısa, pozitif ve cesaretlendirici bir metin.
    - mostImprovedCourse: Başarı puanı ortalaması en yüksek veya son zamanlarda en çok artış gösteren dersin adı.
    - needsFocusCourse: Başarı veya odaklanma puanı ortalaması en düşük olan dersin adı.
    - suggestion: 'needsFocusCourse' olarak belirlenen ders için ebeveynin uygulayabileceği somut, pratik ve eğitici bir tavsiye.`;

    return this.retryOperation(async () => {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{
          role: "user",
          parts: [{ text: prompt }]
        }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "object" as const,
            properties: {
              summary: { type: "string" as const },
              mostImprovedCourse: { type: "string" as const },
              needsFocusCourse: { type: "string" as const },
              suggestion: { type: "string" as const },
            },
            required: ['summary', 'mostImprovedCourse', 'needsFocusCourse', 'suggestion'],
          },
        },
      });

      try {
        return JSON.parse(response.text);
      } catch (parseError) {
        throw {
          type: 'parse_error',
          message: 'Failed to parse AI response.',
          retryable: false
        };
      }
    });
  }

  async generateDailyBriefing(todaysTasks: number, completedYesterday: number, avgScore: number): Promise<any> {
    const prompt = `Bir ebeveyn için proaktif ve cesaretlendirici bir günlük özet hazırla.
    Bugünün bekleyen görevleri: ${todaysTasks} adet.
    Dün tamamlanan görevler: ${completedYesterday} adet.
    Dünkü görevlerin ortalama başarı puanı: ${avgScore || 'yok'}.
    
    Bu bilgilere dayanarak 'summary' ve 'suggestion' içeren bir JSON nesnesi oluştur.
    - summary: Bugünün durumunu pozitif bir dille özetle.
    - suggestion: Ebeveyne çocuğunu nasıl destekleyebileceğine dair kısa, eyleme geçirilebilir bir tavsiye ver.`;

    return this.retryOperation(async () => {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{
          role: "user",
          parts: [{ text: prompt }]
        }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "object" as const,
            properties: {
              summary: { type: "string" as const },
              suggestion: { type: "string" as const },
            },
            required: ['summary', 'suggestion'],
          },
        },
      });

      try {
        return JSON.parse(response.text);
      } catch (parseError) {
        throw {
          type: 'parse_error',
          message: 'Failed to parse AI response.',
          retryable: false
        };
      }
    });
  }
}