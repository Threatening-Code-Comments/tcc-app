import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, runOnUI, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { GenericTile } from '../tiles/GenericTile';

export type ItemProps = {
   id: number
   x: number
   y: number
   width: number
   height: number
   handleDragEnd: (id: number, x: number, y: number) => void
   snapToNearestGridPoint: (value: number) => number
   makeSpaceForItem: (item: { id: number, x: number, y: number, width: number, height: number }) => void
   blockingItems: Set<number>
   pxToGrid: (value: number) => number
}
const Item = ({ id, x, y, width, height, handleDragEnd, snapToNearestGridPoint, makeSpaceForItem, blockingItems, pxToGrid }: ItemProps) => {
   const itemX = useSharedValue<number>(x);
   const itemY = useSharedValue<number>(y);
   const translateX = useSharedValue<number>(0);
   const translateY = useSharedValue<number>(0);
   const itemWidth = useSharedValue<number>(width);
   const itemHeight = useSharedValue<number>(height);
   const [isDragging, setIsDragging] = useState(false);

   // Drag-Gesture für Bewegung
   const dragGesture = Gesture.Pan()
      .onStart(() => {
         runOnJS(setIsDragging)(true);
      })
      .onUpdate((event) => {
         translateX.value = withSpring(snapToNearestGridPoint(event.translationX))
         translateY.value = withSpring(snapToNearestGridPoint(event.translationY))

         runOnJS(makeSpaceForItem)({ id, x: x + event.translationX, y: y + event.translationY, width, height });
      })
      .onEnd(() => {
         const newX = x + translateX.value;
         const newY = y + translateY.value;

         runOnJS(handleDragEnd)(id, newX, newY);
         runOnJS(makeSpaceForItem)({ id, x: newX, y: newY, width, height });
         translateX.value = 0
         translateY.value = 0
         itemX.value = snapToNearestGridPoint(newX);
         itemY.value = snapToNearestGridPoint(newY);
         runOnJS(setIsDragging)(false);
      });

   // Stile
   const animatedStyle = useAnimatedStyle(() => ({
      width: itemWidth.value,
      height: itemHeight.value,
      transform: [
         { translateX: translateX.value },
         { translateY: translateY.value },
      ] as any,
      left: itemX.value,
      top: itemY.value,
      borderColor: isDragging ? 'red' : 'transparent',
      borderWidth: 2
   }));

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
   }
});
