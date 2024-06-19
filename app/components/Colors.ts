export type ColorWithContrast = { color: string, contrastColor: string }

export function getRandomColorWithContrast(): ColorWithContrast {
    const color = getRandomColor();
    return { color, contrastColor: getContrastColor(color) };
}

export function getColorWithContrast(color?: string): ColorWithContrast {
    const color2 = color ? color : "#ffffff"//getRandomColor();        
    return { color: color2, contrastColor: getContrastColor(color2) };
}

function getContrastColor(hexColor: string): string {
    const r = parseInt(hexColor.substr(1, 2), 16);
    const g = parseInt(hexColor.substr(3, 2), 16);
    const b = parseInt(hexColor.substr(5, 2), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 180) ? '#000000' : '#ffffff'; // 128 is the threshold
}

export function getRandomColor(): string {
    const goldenRatioConjugate = 0.618033988749895;
    let h = Math.random();
    h += goldenRatioConjugate;
    h %= 1;
    return hsvToHex(h, 0.5, 0.95);
}

export function hexToHue(hex: string): number {
    // Remove the hash symbol if it is present
    hex = hex.replace(/^#/, '');

    // Parse the hex string to get the RGB values
    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;

    // Normalize the RGB values to the range [0, 1]
    const rNormalized = r / 255;
    const gNormalized = g / 255;
    const bNormalized = b / 255;

    // Calculate the maximum and minimum values of r, g, and b
    const max = Math.max(rNormalized, gNormalized, bNormalized);
    const min = Math.min(rNormalized, gNormalized, bNormalized);

    // Calculate the difference between the max and min values
    const delta = max - min;

    let hue: number;

    // Calculate the hue
    if (delta === 0) {
        hue = 0; // If max and min are equal, the color is a shade of gray
    } else if (max === rNormalized) {
        hue = ((gNormalized - bNormalized) / delta) % 6;
    } else if (max === gNormalized) {
        hue = (bNormalized - rNormalized) / delta + 2;
    } else {
        hue = (rNormalized - gNormalized) / delta + 4;
    }

    // Convert the hue to degrees
    hue = hue * 60;

    // Make sure the hue is non-negative
    if (hue < 0) {
        hue += 360;
    }

    return hue;
}

export function hsvToHex(h: number, s: number, v: number): string {
    // Convert HSV to RGB
    let r, g, b;
    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);

    switch (i % 6) {
        case 0:
            r = v;
            g = t;
            b = p;
            break;
        case 1:
            r = q;
            g = v;
            b = p;
            break;
        case 2:
            r = p;
            g = v;
            b = t;
            break;
        case 3:
            r = p;
            g = q;
            b = v;
            break;
        case 4:
            r = t;
            g = p;
            b = v;
            break;
        case 5:
            r = v;
            g = p;
            b = q;
            break;
    }

    // Convert RGB to hex string
    const hexR = Math.floor(r * 255).toString(16).padStart(2, '0');
    const hexG = Math.floor(g * 255).toString(16).padStart(2, '0');
    const hexB = Math.floor(b * 255).toString(16).padStart(2, '0');

    return `#${hexR}${hexG}${hexB}`;
}