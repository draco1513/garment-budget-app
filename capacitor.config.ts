import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'pe.garmentbudget.app',
  appName: 'Presupuesto Textil',
  webDir: 'dist/garment-budget-app',
  server: {
    // En desarrollo: apunta al servidor local
    // En producción: quitar androidScheme y url para usar bundle
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1a3a5c',
      androidSplashResourceName: 'splash',
      iosSpinnerStyle: 'small',
      spinnerColor: '#ffffff'
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#1a3a5c'
    },
    Preferences: {
      // Almacenamiento seguro para JWT token
      group: 'GarmentBudgetSecure'
    },
    Network: {
      // Detección de conectividad en tiempo real
    }
  },
  android: {
    // Soporte Android API 21+ (Android 5.0 en adelante — gama baja)
    minSdkVersion: 21,
    // WebView actualizado para gama baja
    allowMixedContent: false
  },
  ios: {
    // iOS 13+
    scheme: 'GarmentBudget'
  }
};

export default config;
