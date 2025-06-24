import React, { useEffect, useState } from "react";
import { HomescreenItem, PixelPoint } from "./types";
import {
  Gesture,
  GestureDetector,
  GestureUpdateEvent,
  PanGestureHandlerEventPayload,
} from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withReanimatedTimer,
  withSpring,
} from "react-native-reanimated";
import { StyleSheet } from "react-native";
import { makeSpaceForItem, pixelToGrid } from "./move_algo";
import * as Haptics from 'expo-haptics';
import { Text } from "react-native-paper";

export type ItemProps = HomescreenItem & {
  updatePreviewItem: (item: HomescreenItem) => void;
  //    handleDragUpdate?: (item: HomescreenItem, pixel: PixelPoint) => void
  handleDragEnd: (id: number, pixel: PixelPoint) => void
  snapToNearestGridPoint: (value: number) => number
  //    makeSpaceForItem: (item: HomescreenItem, contactPoint: PixelPoint) => void
  //    isShaking?: boolean
  //    isPreview?: boolean
  //    createFolderPreview?: number
  //    onCreateFolderHover?: (isHovering: boolean) => void
  onDragUpdate?: (point: PixelPoint) => void;
};
const Item2 = ({
  id,
  x,
  y,
  width,
  height,
  updatePreviewItem,
  onDragUpdate: onDragUpdateParam,
  handleDragEnd: handleDragEndParam,
  snapToNearestGridPoint,
}: ItemProps) => {
  const itemX = useSharedValue<number>(x);
  const itemY = useSharedValue<number>(y);
  const translateX = useSharedValue<number>(0);
  const translateY = useSharedValue<number>(0);
  const itemWidth = useSharedValue<number>(width);
  const itemHeight = useSharedValue<number>(height);

  const isSticky = useSharedValue<boolean>(true);
  const initialDistance = useSharedValue<number>(0);

  const [isDragging, setIsDragging] = useState(false);
  // useEffect(() => {
  //   console.log("isdragging", isDragging);
  // }, [isDragging]);
  useEffect(() => {
    itemX.value = x;
    itemY.value = y;
  }, [x, y]);


  // useEffect(() => runOnJS(console.log)("isSticky:", isSticky), [isSticky.value]);


  const onDragStart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setIsDragging(true);
    isSticky.value = true; // Reset sticky state on drag start
  };
  const onDragUpdate = (
    event: GestureUpdateEvent<PanGestureHandlerEventPayload>
  ) => {
    if (isSticky.value) {
      initialDistance.value += (Math.abs(event.translationX) + Math.abs(event.translationY));

      if (initialDistance.value > 300) {
        // Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
        isSticky.value = false;
        // console.log("DEACTIVE");
      }

      return;
    }

    // hier muss drag (preview) item aktualisiert werden weil flüssig
    translateX.value = withSpring(event.translationX); //currentPos.x);
    translateY.value = withSpring(event.translationY); //currentPos.y);

    // const currentX = itemX.value + translateX.value;
    // const currentY = itemY.value + translateY.value;
    // const currentPos: PixelPoint = { x: currentX, y: currentY };

    // const isAddFolder = (point: PixelPoint) =>
    //   point.x > currentX + width / 2 &&
    //   point.x < currentX + width / 2 &&
    //   point.y > currentY + itemHeight.value / 2 &&
    //   point.y < currentY + itemHeight.value / 2;

    // isAddFolder
    // if (isAddFolder(currentPos, makeSpaceForItem ScreenStackHeaderCenterView.??????????)) {
    //   // create folder
    //   // output ll

    //   // stop furter processing..?
    //   return;
    // }

    // move threshold for checking positioning..?
    // const threshold = 10; // px ??????????
    // const isInRange = (number: number, from: number, to: number) =>
    //   from <= number && number <= to;
    // if (
    //   isInRange(currentPos.x, x - threshold, x + threshold) &&
    //   isInRange(currentPos.y, y - threshold, y + threshold)
    // ) {
    //   // stop further processing
    //   return;
    // }

    // onDragUpdateParam?.(currentPos);
  }; const onDragEnd = () => {
    setIsDragging(false);
    isSticky.value = true;
    initialDistance.value = 0;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)

    const currentX = itemX.value + translateX.value;
    const currentY = itemY.value + translateY.value;
    const newX = snapToNearestGridPoint(currentX);
    const newY = snapToNearestGridPoint(currentY);

    // Calculate the final translate values needed to reach the snapped position
    const oldX = itemX.value
    const oldY = itemY.value
    const finalTranslateX = newX - itemX.value;
    const finalTranslateY = newY - itemY.value;

    translateX.value = withSpring(finalTranslateX, { duration: 1 }, (finished) => {
      itemX.value = oldX + finalTranslateX
      if (finished) {
        itemX.value = newX;
        translateX.value = 0;
      }
    });

    translateY.value = withSpring(finalTranslateY, { duration: 1 }, (finished) => {
      itemY.value = oldY + finalTranslateY
      if (finished) {
        itemY.value = newY;
        translateY.value = 0;
      }
    });

    handleDragEndParam(id, ({ x: newX, y: newY }));
  };

  const dragGesture = Gesture.Pan()
    .onStart(() => runOnJS(onDragStart)())
    .onUpdate((event) => runOnJS(onDragUpdate)(event))
    .onEnd(() => runOnJS(onDragEnd)());

  const animatedStyle = useAnimatedStyle(() => ({
    width: itemWidth.value,
    height: itemHeight.value,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ] as any,
    // position: 'absolute',
    // left: itemX.value + translateX.value,
    // top: itemY.value + translateY.value,
    left: itemX.value,
    top: itemY.value,
    backgroundColor: "#4A90E2",
  }));
  return (
    <GestureDetector gesture={dragGesture}>
      <Animated.View style={[styles.item, animatedStyle]}>
        {/* <Text style={{ color: "white" }}>({itemX.value},{itemY.value})</Text>
        <Text style={{ color: "white" }}> + {translateX.value},{translateY.value}</Text> */}
      </Animated.View>
    </GestureDetector>
  );
};

export default Item2;

const styles = StyleSheet.create({
  item: {
    backgroundColor: "#4A90E2",
    position: "absolute",
  },
  previewItem: {
    backgroundColor: "#4A90E233",
    position: "absolute",
    borderColor: "#4A90E2",
    borderWidth: 2,
    elevation: 1,
  },
});
