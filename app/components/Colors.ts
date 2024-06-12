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