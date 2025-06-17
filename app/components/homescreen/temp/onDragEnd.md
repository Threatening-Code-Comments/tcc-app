# onDragEnd

## Alt
```ts
const newX = snapToNearestGridPoint(x + translateX.value);
const newY = snapToNearestGridPoint(y + translateY.value);

runOnJS(handleDragEnd)(id, { x: newX, y: newY });
runOnJS(checkCoordinate)({ id, x: newX, y: newY, width, height }, { x: x + translateX.value, y: y + translateY.value });

translateX.value = 0
translateY.value = 0
itemX.value = newX;
itemY.value = newY;
runOnJS(setIsDragging)(false);
```

## Was muss passieren?
- der dragging indicator muss entfernt werden
- hier sollte eig alles frei sein..?
    - trotzdem makeSpaceForItem?
- werte resetten:
    - x und y müssen neu gesetzt werden
    - translateX,Y = 0

## handleDragEnd() alt
- callback vom parent
im `homeScreenHandler`:
```ts
const newPosition = pixelToGrid(pixel);
folderCreateItem.value = null

setItems((prevItems) => prevItems.map((item) => {
    const tempItem = tempItems.find(i => i.id === item.id)

    if (item.id === id) {
        const updatedItem = { ...item, ...newPosition };
        return updatedItem;
    }

    return !!tempItem ? tempItem : item;
}))

setTempItems([])
setPreviewItem(null)
```
- newPosition erfassen
- folderCreate state zurücksetzen..?
- items ersetzen mit
    - {...items - newItem, newItem}
- temp & preview Item resetten

## checkCoordinate
- main logic of old
- schreibe das mal um glaube ich