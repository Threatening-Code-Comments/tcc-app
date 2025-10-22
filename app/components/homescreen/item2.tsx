import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureUpdateEvent,
  PanGestureHandlerEventPayload,
} from "react-native-gesture-handler";
import Animated, {
  runOnJS, runOnRuntime, runOnUI,
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from "react-native-reanimated";
import { HomescreenItem, PixelPoint } from "./types";
import {runOnUIImmediately} from "react-native-reanimated/lib/typescript/reanimated2/threads";

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
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
        isSticky.value = false;
      }

      return;
    }

    // hier muss drag (preview) item aktualisiert werden weil flüssig
    translateX.value = withSpring(event.translationX);
    translateY.value = withSpring(event.translationY);


    runOnJS(onDragUpdateParam)({ x: itemX.value + translateX.value, y: itemY.value + translateY.value });
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
    left: itemX.value,
    top: itemY.value,
    backgroundColor: "#4A90E2",
  }));
  return (
    <GestureDetector gesture={dragGesture}>
      <Animated.View style={[styles.item, animatedStyle]}>

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
