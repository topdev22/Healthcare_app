import googleTTS from 'google-tts-api';

interface TTSOptions {
  lang?: string;
  slow?: boolean;
  host?: string;
}

interface TTSConfig {
  enabled: boolean;
  language: string;
  speed: 'slow' | 'normal';
  host: string;
}

class TTSService {
  private config: TTSConfig;
  private audioCache: Map<string, HTMLAudioElement> = new Map();
  private currentAudio: HTMLAudioElement | null = null;

  constructor(initialConfig?: Partial<TTSConfig>) {
    this.config = {
      enabled: true,
      language: 'ja', // Japanese for HealthBuddy
      speed: 'normal',
      host: 'https://translate.google.com',
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
   * Generate TTS audio URL from text
   */
  private async getTTSUrl(text: string): Promise<string> {
    try {
      const options: TTSOptions = {
        lang: this.config.language,
        slow: this.config.speed === 'slow',
        host: this.config.host
      };

      const url = await googleTTS.getAudioUrl(text, options);
      return url;
    } catch (error) {
      console.error('Error generating TTS URL:', error);
      throw new Error('Failed to generate TTS audio URL');
    }
  }

  /**
   * Create audio element from URL with error handling
   */
  private createAudioElement(url: string): Promise<HTMLAudioElement> {
    return new Promise((resolve, reject) => {
      const audio = new Audio(url);
      
      audio.addEventListener('canplaythrough', () => resolve(audio), { once: true });
      audio.addEventListener('error', (e) => {
        console.error('Audio loading error:', e);
        reject(new Error('Failed to load audio'));
      }, { once: true });

      // Set audio properties for better UX
      audio.preload = 'auto';
      audio.volume = 0.8;
    });
  }

  /**
   * Speak the given text using Google TTS
   */
  async speak(text: string): Promise<void> {
    if (!this.config.enabled || !text.trim()) {
      return;
    }

    try {
      // Stop any currently playing audio
      this.stop();

      // Check cache first
      const cacheKey = `${text}_${this.config.language}_${this.config.speed}`;
      let audio = this.audioCache.get(cacheKey);

      if (!audio) {
        // Generate new audio
        const url = await this.getTTSUrl(text);
        audio = await this.createAudioElement(url);
        
        // Cache the audio element (limit cache size)
        if (this.audioCache.size >= 10) {
          const firstKey = this.audioCache.keys().next().value;
          this.audioCache.delete(firstKey);
        }
        this.audioCache.set(cacheKey, audio);
      }

      // Set current audio and play
      this.currentAudio = audio;
      
      return new Promise((resolve, reject) => {
        if (!audio) {
          reject(new Error('Audio element not available'));
          return;
        }

        const handleEnded = () => {
          this.currentAudio = null;
          audio.removeEventListener('ended', handleEnded);
          audio.removeEventListener('error', handleError);
          resolve();
        };

        const handleError = (e: Event) => {
          this.currentAudio = null;
          audio.removeEventListener('ended', handleEnded);
          audio.removeEventListener('error', handleError);
          console.error('Audio playback error:', e);
          reject(new Error('Audio playback failed'));
        };

        audio.addEventListener('ended', handleEnded, { once: true });
        audio.addEventListener('error', handleError, { once: true });

        // Reset audio to beginning and play
        audio.currentTime = 0;
        audio.play().catch(handleError);
      });

    } catch (error) {
      console.error('TTS speak error:', error);
      throw error;
    }
  }

  /**
   * Stop current audio playback
   */
  stop(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
  }

  /**
   * Check if audio is currently playing
   */
  isPlaying(): boolean {
    return this.currentAudio !== null && !this.currentAudio.paused;
  }

  /**
   * Clear audio cache
   */
  clearCache(): void {
    this.audioCache.clear();
  }

  /**
   * Set language for TTS
   */
  setLanguage(language: string): void {
    this.config.language = language;
    // Clear cache when language changes
    this.clearCache();
  }

  /**
   * Set speech speed
   */
  setSpeed(speed: 'slow' | 'normal'): void {
    this.config.speed = speed;
    // Clear cache when speed changes
    this.clearCache();
  }

  /**
   * Get available languages (common ones)
   */
  getAvailableLanguages(): Array<{ code: string; name: string }> {
    return [
      { code: 'ja', name: 'Japanese' },
      { code: 'en', name: 'English' },
      { code: 'zh', name: 'Chinese' },
      { code: 'ko', name: 'Korean' },
      { code: 'es', name: 'Spanish' },
      { code: 'fr', name: 'French' },
      { code: 'de', name: 'German' },
      { code: 'it', name: 'Italian' },
      { code: 'pt', name: 'Portuguese' },
      { code: 'ru', name: 'Russian' }
    ];
  }
}

// Create and export a singleton instance
export const ttsService = new TTSService({
  language: 'ja', // Default to Japanese for HealthBuddy
  speed: 'normal',
  enabled: true
});

export default TTSService;
