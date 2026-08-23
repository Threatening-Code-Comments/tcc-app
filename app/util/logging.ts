import { GridPoint, HomescreenItem, PixelPoint, PixelTile } from "@app/components/homescreen/homescreenHandler";

export function ItemToString(item: HomescreenItem, precision: number = 0): string {
    const format = precision === 0
        ? (n: number) => Math.round(n)
        : (n: number) => n.toFixed(precision)

    return `{ id: ${item.id}, x: ${format(item.x)}, y: ${format(item.y)}, width: ${format(item.width)}, height: ${format(item.height)}`
}

export function PointToString(point: PixelPoint | GridPoint, precision: number = 0): string {
    const format = precision === 0
        ? (n: number) => Math.round(n)
        : (n: number) => n.toFixed(precision)

    return `{ x: ${format(point.x)}, y: ${format(point.y)}`
}