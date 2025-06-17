import React, { useEffect, useState } from "react";
import { GridPlacementList, HomescreenItem, PixelPoint } from "./types";
import { PlacementGrid } from "./placementGrid";
import {
  GRID_COLUMNS,
  GRID_ROWS,
  GRID_UNIT,
  makeSpaceForItem,
  pixelToGrid,
} from "./move_algo";
import Item2 from "./item2";
import { View } from "react-native";
import { IconButton } from "../IconButton";
import { useRouter } from "expo-router";
import { id } from "react-native-paper-dates";

const homescreenHandlerNew = (props: { items: HomescreenItem[] }) => {
  const [placementGrid, setPlacementGrid] = useState<GridPlacementList>(
    new PlacementGrid(GRID_COLUMNS, GRID_ROWS)
  );
  const router = useRouter();
  const [items, setItems] = useState<HomescreenItem[]>(props.items);
  const [movedItems, setMovedItems] = useState<HomescreenItem[]>([]);
  const [previewItem, setPreviewItem] = useState<HomescreenItem | null>(null);
  const [lastCheckedCoordinate, setLastCheckedCoordinate] = useState<{
    x: number;
    y: number;
  }>({ x: 0, y: 0 });

  useEffect(() => {
    setItems(props.items);
  }, [props.items]);

  const updatePreviewItem = (item: HomescreenItem) => {
    setPreviewItem(item);
  };

  const onDragUpdate = (
    item: HomescreenItem,
    pixel: { x: number; y: number }
  ) => {
    const gridCoordinate = pixelToGrid(pixel);

    if (gridCoordinate === lastCheckedCoordinate) {
      return;
    }
    setLastCheckedCoordinate(gridCoordinate);
    console.log("onDragUpdate", item.id, gridCoordinate);

    setPreviewItem(null);

    const itemsToBeMoved = makeSpaceForItem(
      item,
      gridCoordinate,
      placementGrid
    );
    if (itemsToBeMoved.length > 0) {
      setMovedItems(itemsToBeMoved);
    }

    setPreviewItem({ ...item, x: gridCoordinate.x, y: gridCoordinate.y });

    // hier wird preview item bewegt
    // if(lastCoordinate != currentPos){
    //     setPreviewItem(null)
    //     const itemsToMoveToPlacePreviewItem =
    //         makeSpaceforItem(...)
    //     if(itemsToMoveToPlacePreviewItem.length > 0){
    //         setTempItems(itemsToMoveToPlacePreviewItem)
    //     }
    //     setPreviewItem({...oldPreviewItem, x: currentX, y: currentY})
    // }
  };

  const onDragEnd = (item: HomescreenItem, pixel: PixelPoint) => {
    const newCoordinate = pixelToGrid(pixel);
    //if folder create state exists, HHHHHHHHHH

    const newItem = { ...items.findLast((i) => i.id === item.id) };

    setItems((prevItems) =>
      prevItems.map((i) => (i.id !== item.id ? i : newItem))
    );

    
  };

  const itemComponent = (
    itemList: HomescreenItem[],
    predicate: (
      value: HomescreenItem,
      index: number,
      array: HomescreenItem[]
    ) => value is HomescreenItem
  ) =>
    itemList
      .filter(predicate)
      .map((item) => (
        <Item2
          key={item.id}
          id={item.id}
          x={item.x * GRID_UNIT}
          y={item.y * GRID_UNIT}
          width={item.width * GRID_UNIT}
          height={item.height * GRID_UNIT}
          updatePreviewItem={updatePreviewItem}
          onDragUpdate={onDragUpdate.bind(null, item)}
        />
      ));

  return (
    <>
      <View
        style={{ height: 50, marginTop: -100, justifyContent: "flex-start" }}
      >
        <IconButton
          iconName="refresh"
          text="Refresh"
          onPress={() => {
            router.navigate(`/pages/0`);
          }}
        />
      </View>

      {items
        .filter((item) => !movedItems.some((mI) => mI.id === item.id))
        .map((item) => (
          <Item2
            key={item.id}
            id={item.id}
            x={item.x * GRID_UNIT}
            y={item.y * GRID_UNIT}
            width={item.width * GRID_UNIT}
            height={item.height * GRID_UNIT}
            updatePreviewItem={updatePreviewItem}
            onDragUpdate={onDragUpdate.bind(null, item)}
          />
        ))}
    </>
  );
};

export default homescreenHandlerNew;
