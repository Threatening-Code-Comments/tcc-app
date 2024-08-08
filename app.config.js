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
    "versionCode": 3,
  },
  "web": {
    "favicon": "./assets/favicon.png"
  },
  "plugins": [
    "expo-router",
    [
      "expo-build-properties",
      {
        "android": {
          "compileSdkVersion": 34,
          "targetSdkVersion": 34,
          "buildToolsVersion": "34.0.0"
        },
        "ios": {
          "deploymentTarget": "13.4"
        }
      }
    ]
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