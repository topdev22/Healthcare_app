// Using Web Speech API instead of external TTS services

interface TTSOptions {
  lang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

interface TTSConfig {
  enabled: boolean;
  language: string;
  speed: 'slow' | 'normal';
  rate: number;
  pitch: number;
  volume: number;
}

class TTSService {
  private config: TTSConfig;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor(initialConfig?: Partial<TTSConfig>) {
    this.config = {
      enabled: true,
      language: 'ja-JP', // Japanese for HealthBuddy
      speed: 'normal',
      rate: 1.0,
      pitch: 1.0,
      volume: 0.8,
      ...initialConfig
    };
  }

  /**
   * Set TTS configuration
   */
  setConfig(config: Partial<TTSConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current TTS configuration
   */
  getConfig(): TTSConfig {
    return { ...this.config };
  }

  /**
   * Enable or disable TTS
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    if (!enabled) {
      this.stop();
    }
  }

  /**
   * Check if TTS is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Check if Web Speech API is supported
   */
  private isSpeechSynthesisSupported(): boolean {
    return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  }

  /**
   * Get available voices for the current language
   */
  private getVoiceForLanguage(language: string): SpeechSynthesisVoice | null {
    if (!this.isSpeechSynthesisSupported()) {
      return null;
    }

    const voices = speechSynthesis.getVoices();
    
    // First, try to find a voice that exactly matches the language
    let voice = voices.find(v => v.lang === language);
    
    // If not found, try to find a voice with the same language code (e.g., 'ja' from 'ja-JP')
    if (!voice) {
      const langCode = language.split('-')[0];
      voice = voices.find(v => v.lang.startsWith(langCode));
    }
    
    // If still not found, try to find any voice containing the language code
    if (!voice) {
      const langCode = language.split('-')[0];
      voice = voices.find(v => v.lang.includes(langCode));
    }

    return voice || null;
  }

  /**
   * Speak the given text using Web Speech API
   */
  async speak(text: string): Promise<void> {
    if (!this.config.enabled || !text.trim()) {
      return;
    }

    // Check if Speech Synthesis is supported
    if (!this.isSpeechSynthesisSupported()) {
      console.warn('Speech Synthesis not supported in this browser');
      throw new Error('Speech Synthesis not supported in this browser');
    }

    try {
      // Stop any currently speaking utterance with a small delay to prevent interruption
      this.stop();
      
      // Add a small delay to ensure the previous utterance is fully stopped
      await new Promise(resolve => setTimeout(resolve, 100));

      console.log('Speaking text with Web Speech API:', text);

      // Wait for voices to be loaded if they aren't already
      if (speechSynthesis.getVoices().length === 0) {
        await new Promise<void>((resolve) => {
          speechSynthesis.addEventListener('voiceschanged', () => resolve(), { once: true });
          // Fallback timeout in case voiceschanged never fires
          setTimeout(() => resolve(), 1000);
        });
      }

      // Create speech synthesis utterance
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Set voice properties
      utterance.lang = this.config.language;
      utterance.rate = this.config.speed === 'slow' ? 0.7 : this.config.rate;
      utterance.pitch = this.config.pitch;
      utterance.volume = this.config.volume;

      // Try to set a specific voice for the language
      const voice = this.getVoiceForLanguage(this.config.language);
      if (voice) {
        utterance.voice = voice;
        console.log('Using voice:', voice.name, 'for language:', voice.lang);
      } else {
        console.log('No specific voice found for language:', this.config.language);
      }

      // Set current utterance reference
      this.currentUtterance = utterance;

      // Return promise that resolves when speech finishes
      return new Promise((resolve, reject) => {
        let hasResolved = false;
        
        const cleanup = () => {
          if (this.currentUtterance === utterance) {
            this.currentUtterance = null;
          }
        };

        const safeResolve = () => {
          if (!hasResolved) {
            hasResolved = true;
            cleanup();
            resolve();
          }
        };

        const safeReject = (error: Error) => {
          if (!hasResolved) {
            hasResolved = true;
            cleanup();
            reject(error);
          }
        };

        utterance.onend = () => {
          console.log('Speech synthesis ended');
          safeResolve();
        };

        utterance.onerror = (event) => {
          console.error('Speech synthesis error:', event.error);
          
          // Handle interrupted errors more gracefully
          if (event.error === 'interrupted') {
            console.log('Speech was interrupted, treating as completed');
            safeResolve(); // Treat interruption as completion rather than error
          } else {
            safeReject(new Error(`Speech synthesis failed: ${event.error}`));
          }
        };

        utterance.onstart = () => {
          console.log('Speech synthesis started');
        };

        utterance.onpause = () => {
          console.log('Speech synthesis paused');
        };

        utterance.onresume = () => {
          console.log('Speech synthesis resumed');
        };

        // Ensure we're not already speaking before starting
        if (speechSynthesis.speaking) {
          console.log('Already speaking, canceling previous speech');
          speechSynthesis.cancel();
          // Add a small delay before starting new speech
          setTimeout(() => {
            speechSynthesis.speak(utterance);
          }, 100);
        } else {
          speechSynthesis.speak(utterance);
        }

        // Safety timeout to prevent hanging promises (30 seconds)
        setTimeout(() => {
          if (!hasResolved) {
            console.log('Speech synthesis timeout, resolving');
            safeResolve();
          }
        }, 30000);
      });

    } catch (error) {
      console.error('TTS speak error:', error);
      throw error;
    }
  }

  /**
   * Stop current speech synthesis
   */
  stop(): void {
    if (speechSynthesis.speaking || speechSynthesis.pending) {
      speechSynthesis.cancel();
      console.log('Speech synthesis stopped');
    }
    this.currentUtterance = null;
  }

  /**
   * Check if speech is currently playing
   */
  isPlaying(): boolean {
    return speechSynthesis.speaking;
  }

  /**
   * Set language for TTS
   */
  setLanguage(language: string): void {
    this.config.language = language;
  }

  /**
   * Set speech speed
   */
  setSpeed(speed: 'slow' | 'normal'): void {
    this.config.speed = speed;
    this.config.rate = speed === 'slow' ? 0.7 : 1.0;
  }

  /**
   * Set speech rate (0.1 to 10)
   */
  setRate(rate: number): void {
    this.config.rate = Math.max(0.1, Math.min(10, rate));
  }

  /**
   * Set speech pitch (0 to 2)
   */
  setPitch(pitch: number): void {
    this.config.pitch = Math.max(0, Math.min(2, pitch));
  }

  /**
   * Set speech volume (0 to 1)
   */
  setVolume(volume: number): void {
    this.config.volume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Get available languages from browser voices
   */
  getAvailableLanguages(): Array<{ code: string; name: string }> {
    if (!this.isSpeechSynthesisSupported()) {
      return [];
    }

    const voices = speechSynthesis.getVoices();
    const languages = new Set<string>();
    
    voices.forEach(voice => {
      languages.add(voice.lang);
    });

    // Convert to array and sort
    return Array.from(languages).map(lang => ({
      code: lang,
      name: this.getLanguageName(lang)
    })).sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Get available voices
   */
  getAvailableVoices(): SpeechSynthesisVoice[] {
    if (!this.isSpeechSynthesisSupported()) {
      return [];
    }
    return speechSynthesis.getVoices();
  }

  /**
   * Get human-readable language name from language code
   */
  private getLanguageName(langCode: string): string {
    const languageNames: { [key: string]: string } = {
      'ja-JP': 'Japanese',
      'ja': 'Japanese',
      'en-US': 'English (US)',
      'en-GB': 'English (UK)',
      'en': 'English',
      'zh-CN': 'Chinese (Simplified)',
      'zh-TW': 'Chinese (Traditional)',
      'zh': 'Chinese',
      'ko-KR': 'Korean',
      'ko': 'Korean',
      'es-ES': 'Spanish (Spain)',
      'es-MX': 'Spanish (Mexico)',
      'es': 'Spanish',
      'fr-FR': 'French',
      'fr': 'French',
      'de-DE': 'German',
      'de': 'German',
      'it-IT': 'Italian',
      'it': 'Italian',
      'pt-BR': 'Portuguese (Brazil)',
      'pt': 'Portuguese',
      'ru-RU': 'Russian',
      'ru': 'Russian'
    };

    return languageNames[langCode] || langCode;
  }
}

// Create and export a singleton instance
export const ttsService = new TTSService({
  language: 'ja-JP', // Default to Japanese for HealthBuddy
  speed: 'normal',
  enabled: true
});

export default TTSService;
