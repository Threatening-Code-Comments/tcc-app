```ts
function onDragUpdate(translateX, translateY){
   const currentX, currentY = x + translateX 
   const currentPos = {x: currentX, y: currentY}

   //auslagerm
   const isAddFolder = (point: PixelPoint) => (
      point.x > currentX + (width / 2) && point.x < currentX + width /2
         && point.y > currentY + (heigth / 2) && point.y < currentY + heigth / 2
   )

   // hier muss drag (preview) item aktualisiert werden weil flüssig
   translateX.value = withSpring(currentPos.x)
   translateY.value = withSpring(currentPos.y)

   // isAddFolder
   if(isAddFolder({currentPos})){
      // create folder
      // output lol

      // stop furter processing..?
      return
   }

   // move threshold for checking positioning..?
   if(isInRange(current.x, x-threshold..x+threshold) && isInRange(current.y, y-threshold..y+thresold)){
      // stop further processing
      return
   }

   // hier wird preview item bewegt
   if(lastCoordinate != currentPos){
      setPreviewItem(null)

      const itemsToMoveToPlacePreviewItem = 
         makeSpaceforItem(...)

      if(itemsToMoveToPlacePreviewItem.length > 0){
         setTempItems(itemsToMoveToPlacePreviewItem)
      }

      setPreviewItem({...oldPreviewItem, x: currentX, y: currentY})
   }
}
```




# Start
- bei drag start bleibt er pinned bis er sich löst
   if !sticky { calculateSticky ...}

# Dragging
- isDragging einbauen mit preview
- previewItem..?

# freie Bewegung
- Bedingung: distance moved > threshold
- onStart: vibration (super super kurz)
- Eigenschaften:
   - item centered auf tap point
   - lustigerweise KEINE Größenveränderung, ist aber damit der Cursor der pointer ist, ganz clever eig
- onDragUpdate:
   - dragPreviewItem..? => centered auf cursor... aktuell ist oben links mit event.translation... + item.x or y 
   - left: (event.translationX + itemX.value) - (itemWidth.value / 2)
   - right: (event.translationY + itemY.value) - (itemHeight.value / 2)

# preview item an neue stelle bewegen
- previewItem auflösen
- gucken ob frei
   - wenn nein, bewegen
- previewItem da hin placen
- onDragUpdate:
   - //bedingung weg, weil ich weiß gerade nicht TODO
   - setPreviewItem null
   - if(!!checkspaceForItem.result)
      - moveItemsForPreview checkspaceForItem.result
   - setPreviewItem {...oldPreviewItem, newPoint, }

# bei an neue Stelle bewegen, aber über einen folder...
- Bedingung: (Target hier App Icon) Center(moving) in bounds(target)
- further action suspenden (state var isAddFolder?)
- ich glaube honestly das rect vom folder ist {...left: item.x + transX + (item.width/2)}

# folder create(d)
- Bedingung: drag end +  isAddFolder
- beide icons werden in einen ordner gepackt und dieser öffnet sich sofort

# letztes item removen
- Bedingung: items.length==2 && center(movedItem) not in bounds(folderPopup/this)
- item wird auf normalem homescreen abgelegt/angezeigt
- ordner mit letztem item chillt da noch
- ende: not in bounds (neu!!!) && drop