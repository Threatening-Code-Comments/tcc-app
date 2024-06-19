import { MD3DarkTheme as DefaultTheme } from "react-native-paper"
import { colors } from "./global"
import { ThemeProp } from "react-native-paper/lib/typescript/types"

export const theme = {
    ...DefaultTheme,
    "colors": {
        "primary": "rgb(207, 189, 255)",
        "onPrimary": "rgb(58, 0, 147)",
        "primaryContainer": "rgb(83, 0, 205)",
        "onPrimaryContainer": "rgb(232, 221, 255)",
        "secondary": "rgb(23, 222, 201)",
        "onSecondary": "rgb(0, 55, 49)",
        "secondaryContainer": "rgb(0, 80, 72)",
        "onSecondaryContainer": "rgb(79, 251, 229)",
        "tertiary": "rgb(239, 184, 200)",
        "onTertiary": "rgb(74, 37, 50)",
        "tertiaryContainer": "rgb(99, 59, 73)",
        "onTertiaryContainer": "rgb(255, 217, 227)",
        "error": "rgb(255, 180, 171)",
        "onError": "rgb(105, 0, 5)",
        "errorContainer": "rgb(147, 0, 10)",
        "onErrorContainer": "rgb(255, 180, 171)",
        "background": "rgb(28, 27, 30)",
        "onBackground": "rgb(230, 225, 230)",
        "surface": "rgb(28, 27, 30)",
        "onSurface": "rgb(230, 225, 230)",
        "surfaceVariant": "rgb(73, 69, 78)",
        "onSurfaceVariant": "rgb(202, 196, 207)",
        "outline": "rgb(148, 143, 153)",
        "outlineVariant": "rgb(73, 69, 78)",
        "shadow": "rgb(0, 0, 0)",
        "scrim": "rgb(0, 0, 0)",
        "inverseSurface": "rgb(230, 225, 230)",
        "inverseOnSurface": "rgb(49, 48, 51)",
        "inversePrimary": "rgb(109, 35, 249)",
        "elevation": {
            "level0": "transparent",
            "level1": "rgb(37, 35, 41)",
            "level2": "rgb(42, 40, 48)",
            "level3": "rgb(48, 45, 55)",
            "level4": "rgb(50, 46, 57)",
            "level5": "rgb(53, 50, 62)"
        },
        "surfaceDisabled": "rgba(230, 225, 230, 0.12)",
        "onSurfaceDisabled": "rgba(230, 225, 230, 0.38)",
        "backdrop": "rgba(50, 47, 56, 0.4)"
    }
}