const IS_DEV = process.env.APP_VARIANT === 'development';
const IS_PREVIEW = process.env.APP_VARIANT === 'preview';

const APP_NAME = "TCC-App";
const PACKAGE_NAME = "com.threateningcodecomments.tcc_app";

const APP_VERSION = "1.2.1";
const VERSION_NUMBER = 4

const getAppName = () => {
  if (IS_DEV) {
    return `${APP_NAME} (Dev)`;
  } else if (IS_PREVIEW) {
    return `${APP_NAME} (Preview)`;
  } else {
    return APP_NAME;
  }
}

const getPackageName = () => {
  if (IS_DEV) {
    return `${PACKAGE_NAME}.dev`;
  } else if (IS_PREVIEW) {
    return `${PACKAGE_NAME}.preview`;
  } else {
    return PACKAGE_NAME;
  }
}

export default {
  "name": getAppName(),
  "slug": "tcc_app_rn",
  "scheme": "tcc-app-scheme",
  "version": APP_VERSION,
  "orientation": "portrait",
  "icon": "./assets/icon.png",
  "userInterfaceStyle": "dark",
  "splash": {
    "image": "./assets/splash.png",
    "resizeMode": "contain",
    "backgroundColor": "#242424"
  },
  "assetBundlePatterns": [
    "**/*"
  ],
  // "ios": {
  //   "supportsTablet": true
  // },
  "android": {
    "adaptiveIcon": {
      "foregroundImage": "./assets/adaptive-icon.png",
      "backgroundColor": "#242424"
    },
    "package": getPackageName(),
    "versionCode": VERSION_NUMBER
  },
  // "web": {
  //   "favicon": "./assets/icon.png"
  // },
  "plugins": [
    "expo-router",
    [
      "expo-build-properties",
      {
        "android": {
          "compileSdkVersion": 34,
          "targetSdkVersion": 34,
          "buildToolsVersion": "34.0.0",
          "enableProguardInReleaseBuilds": true,
          "enableShrinkResourcesInReleaseBuilds": true

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
  },
  "updates": {
    "url": "https://u.expo.dev/ee880685-abce-4b8e-8fbe-0409c593ae63"
  },
  "runtimeVersion": {
    "policy": "appVersion"
  }
}