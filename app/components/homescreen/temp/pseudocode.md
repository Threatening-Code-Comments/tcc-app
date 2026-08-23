# Dragging
## Start
const startPos, //currentPos->event
const threshold // ist neuer square von previewItem -> eher eine isSticky
vibrieren()

## Update
## End

# util
## bei lösen
{useEffect, [isSticky, previewItem]}
with(Spring..? ist langsam und sanft, wie das ende eines soft close drawers) zu pos:
    {mitte des squares ist der cursor}

## onNewSpace
setPreviewItem(none)
500ms
updatePreviewItem/general movement ding

## updatePreviewItem // general movement on update etc..? => handler
state spaceIsFree, cursorInFolderZone

cursorInFolderZone = //TODO
isCreateFolder = !spaceIsFree && cursorInFolderZone

if(!isCreateFolder)
    moveBlockingItem
    updatePreviewItem(newPos)
else
    setFolderItem = item from spaceIsFree