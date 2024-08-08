const IS_DEV = process.env.APP_VARIANT === 'development';

export default {
  "name": (IS_DEV) ? "TCC-App (Dev)" : "TCC-App",
  "slug": "tcc_app_rn",
  "scheme": "tcc-app-scheme",
  "version": "1.2.0",
  "orientation": "portrait",
  "icon": "./assets/icon.png",
  "userInterfaceStyle": "dark",
  "splash": {
    "image": "./assets/splash.png",
    "resizeMode": "contain",
    "backgroundColor": "#ffffff"
  },
  "assetBundlePatterns": [
    "**/*"
  ],
  "ios": {
    "supportsTablet": true
  },
  "android": {
    "adaptiveIcon": {
      "foregroundImage": "./assets/adaptive-icon.png",
      "backgroundColor": "#ffffff"
    },
    "package": "com.threateningcodecomments.tcc_app" + (IS_DEV ? ".dev" : ""),
    "versionCode": 2
  },
  "web": {
    "favicon": "./assets/favicon.png"
  },
  "plugins": [
    "expo-router"
  ],
  "extra": {
    "router": {
      "origin": false
    },
    "eas": {
      "projectId": "ee880685-abce-4b8e-8fbe-0409c593ae63"
    }
  }
}