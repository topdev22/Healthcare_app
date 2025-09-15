import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize, KeyboardStyle } from '@capacitor/keyboard';
import { Style } from '@capacitor/status-bar';

const config: CapacitorConfig = {
  appId: 'com.healthbuddy.app',
  appName: 'HealthBuddy',
  webDir: 'dist',
  server: {
    url: "https://hapiken.jp",
    androidScheme: 'https',
    cleartext: true,
    allowNavigation: [
      "https://hapiken.jp/*",
      "https://*.hapiken.jp/*"
    ]
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#78c896",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "small",
      spinnerColor: "#ffffff"
    },
    StatusBar: {
      style: Style.Light,
      backgroundColor: "#78c896"
    },
    Keyboard: {
      resize: KeyboardResize.Body,
      style: KeyboardStyle.Dark,
      resizeOnFullScreen: true
    },
    Motion: {
      interval: 100 // Update interval in milliseconds (10Hz for step detection)
    }
  }
};

export default config;
