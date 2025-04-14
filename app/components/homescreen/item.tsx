import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector, GestureUpdateEvent, PanGestureHandlerEventPayload } from 'react-native-gesture-handler';
import Animated, { runOnJS, runOnUI, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { GenericTile } from '../tiles/GenericTile';
import { HomescreenItem, PixelPoint } from './homescreenHandler';
import { PlacementGrid } from './placementGrid';

const SHAKE_OFFSET = 5;

export type ItemProps = HomescreenItem & {
   handleDragEnd: (id: number, pixel: PixelPoint) => void
   snapToNearestGridPoint: (value: number) => number
   makeSpaceForItem: (item: HomescreenItem, contactPoint: PixelPoint) => void
   isShaking?: boolean
   isPreview?: boolean
}
const Item = ({ id, x, y, width, height, handleDragEnd, snapToNearestGridPoint, makeSpaceForItem, isShaking = false, isPreview = false }: ItemProps) => {
   const itemX = useSharedValue<number>(x);
   const itemY = useSharedValue<number>(y);
   const translateX = useSharedValue<number>(0);
   const translateY = useSharedValue<number>(0);
   const itemWidth = useSharedValue<number>(width);
   const itemHeight = useSharedValue<number>(height);
   const [isDragging, setIsDragging] = useState(false);
   const translationYShakeOffset = useSharedValue<number>(0);
   const lastCheckedCoordinate = useSharedValue<PixelPoint>({ x: x, y: y });
   const updateTimeout = useSharedValue<NodeJS.Timeout | null>(null);

   const shakeEffect = () => {
      if (!isShaking || isPreview) {
         translationYShakeOffset.value = 0
         return
      };

      translationYShakeOffset.value = withRepeat(
         withSequence(
            withTiming(SHAKE_OFFSET, { duration: 500 }),
            withTiming(-SHAKE_OFFSET, { duration: 500 })
         ),
         -1,
         true
      );
   }

   const checkCoordinate = (item: HomescreenItem, point: PixelPoint) => {
      "worklet"
      const coordinate = {
         x: snapToNearestGridPoint(item.x),
         y: snapToNearestGridPoint(item.y)
      };

      if (coordinate.x === lastCheckedCoordinate.value.x && coordinate.y === lastCheckedCoordinate.value.y) {
         return;
      }

      lastCheckedCoordinate.value = coordinate;

      // makes space for item after a delay
      // if this works for folders will be revisited
      if (!updateTimeout.value) {
         updateTimeout.value = setTimeout(() => {
            updateTimeout.value = null;
            runOnJS(makeSpaceForItem)(item, point);
         }, 300);
      }
   }

   useEffect(() => {
      shakeEffect()
   }, [isShaking])

   const onDragUpdate = (event: GestureUpdateEvent<PanGestureHandlerEventPayload>) => {
      // const newTranslateX = snapToNearestGridPoint(event.translationX);
      // const newTranslateY = snapToNearestGridPoint(event.translationY);
      const newTranslateX = event.translationX;
      const newTranslateY = event.translationY;

      translateX.value = withSpring(newTranslateX)
      translateY.value = withSpring(newTranslateY)

      checkCoordinate({ id, x: x + newTranslateX, y: y + newTranslateY, width, height, }, { x: x + event.translationX, y: y + event.translationY });
   }
   const onDragEnd = () => {
      const newX = snapToNearestGridPoint(x + translateX.value);
      const newY = snapToNearestGridPoint(y + translateY.value);

      runOnJS(handleDragEnd)(id, { x: newX, y: newY });
      checkCoordinate({ id, x: newX, y: newY, width, height }, { x: x + translateX.value, y: y + translateY.value });

      translateX.value = 0
      translateY.value = 0
      itemX.value = newX;
      itemY.value = newY;
      runOnJS(setIsDragging)(false);
   }

   // Drag-Gesture für Bewegung
   const dragGesture =
      isShaking || isPreview
         ? Gesture.Tap()
         : Gesture.Pan()
            .onStart(() => {
               runOnJS(setIsDragging)(true);
            })
            .onUpdate((event) => {
               runOnJS(onDragUpdate)(event)
            })
            .onEnd(() => {
               runOnJS(onDragEnd)()
            });

   // Stile
   const animatedStyle = useAnimatedStyle(() => ({
      width: itemWidth.value,
      height: itemHeight.value,
      transform: [
         { translateX: translateX.value },
         { translateY: translateY.value + translationYShakeOffset.value },
      ] as any,
      left: itemX.value,
      top: itemY.value,
      borderColor: isDragging ? 'red' : 'transparent',
      borderWidth: 2
   }));

   if (isPreview)
      return (
         <Animated.View style={[styles.previewItem, animatedStyle]} >

         </Animated.View>
      )

   return (
      <GestureDetector gesture={dragGesture}>
         <Animated.View style={[styles.item, animatedStyle]} >
            <View>
               <Text>ID: {id}</Text>
               <Text>x:{Math.floor(x)} y:{Math.floor(y)}</Text>
               <Text>w:{Math.floor(width)} h:{Math.floor(height)}</Text>
            </View>
         </Animated.View>
      </GestureDetector>
   );
};

export default Item;

const styles = StyleSheet.create({
   item: {
      backgroundColor: '#4A90E2',
      position: 'absolute'
   },
   previewItem: {
      backgroundColor: '#00000000',
      position: 'absolute',
      borderColor: '#4A90E2',
      borderWidth: 2,
      elevation: 1,
   }
});
