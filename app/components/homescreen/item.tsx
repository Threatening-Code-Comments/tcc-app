import React, { useEffect, useState } from 'react';
import { NativeMouseEvent, NativeSyntheticEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector, GestureUpdateEvent, PanGestureHandlerEventPayload } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { pixelToGrid, pxToGrid } from './move_algo';
import { HomescreenItem, PixelPoint } from './types';

const SHAKE_OFFSET = 5;

export type ItemProps = HomescreenItem & {
   updatePreviewItem: (item: HomescreenItem) => void
   handleDragUpdate?: (item: HomescreenItem, pixel: PixelPoint) => void
   handleDragEnd: (id: number, pixel: PixelPoint) => void
   snapToNearestGridPoint: (value: number) => number
   makeSpaceForItem: (item: HomescreenItem, contactPoint: PixelPoint) => void
   isShaking?: boolean
   isPreview?: boolean
   createFolderPreview?: number
   onCreateFolderHover?: (isHovering: boolean) => void
}
const Item = ({ id, x, y, width, height, updatePreviewItem, handleDragUpdate, handleDragEnd, snapToNearestGridPoint, makeSpaceForItem, isShaking = false, isPreview = false, createFolderPreview = null, onCreateFolderHover }: ItemProps) => {
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
   const isCreateFolder = useSharedValue<boolean>(createFolderPreview === id);
   const isCreateFolderHover = useSharedValue<boolean>(false);

   useEffect(() => { itemX.value = x }, [x])
   useEffect(() => { itemY.value = y }, [y])
   useEffect(() => {
      isCreateFolder.value = createFolderPreview === id
      isCreateFolder.value && console.log('create folder', id)
   }, [createFolderPreview])

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
      // "worklet"
      // const coordinate = {
      //    x: snapToNearestGridPoint(item.x),
      //    y: snapToNearestGridPoint(item.y)
      // };

      // if (coordinate.x === lastCheckedCoordinate.value.x && coordinate.y === lastCheckedCoordinate.value.y) {
      //    return;
      // }

      // lastCheckedCoordinate.value = coordinate;

      /*       runOnJS(updatePreviewItem)({ ...item, ...pixelToGrid(coordinate), width: pxToGrid(item.width), height: pxToGrid(item.height) }) */

      // updateTimeout.value = null;

      // makes space for item after a delay
      // if this works for folders will be revisited<
      // if (!updateTimeout.value) {
      //    updateTimeout.value = setTimeout(() => {
      //       updateTimeout.value = null;
      //       // runOnJS(updatePreviewItem)({ ...item, ...pixelToGrid(coordinate), width: pxToGrid(item.width), height: pxToGrid(item.height) })
      //       runOnJS(makeSpaceForItem)(item, point);
      //    }, 300);
      // }

      /*          runOnJS(makeSpaceForItem)(item, point);                                                                                           */
      handleDragUpdate && runOnJS(handleDragUpdate)(item, point);
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

      // if (event.velocityX < 1 && event.velocityY < 1) {
      //    console.log('slow enough')
      // }

      runOnJS(checkCoordinate)({ id, x: x + newTranslateX, y: y + newTranslateY, width, height, }, { x: x + event.translationX, y: y + event.translationY });
   }
   const onDragEnd = () => {
      const newX = snapToNearestGridPoint(x + translateX.value);
      const newY = snapToNearestGridPoint(y + translateY.value);

      runOnJS(handleDragEnd)(id, { x: newX, y: newY });
      runOnJS(checkCoordinate)({ id, x: newX, y: newY, width, height }, { x: x + translateX.value, y: y + translateY.value });

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
               // runOnJS(updatePreviewItem)({ id, x: itemX.value, y: itemY.value, width, height });
            })
            .onUpdate((event) => {
               runOnJS(onDragUpdate)(event)
            })
            .onEnd(() => {
               runOnJS(onDragEnd)()
            });

   // Stile
   const animatedStyle = useAnimatedStyle(() => ({
      opacity: isDragging ? 0.5 : 1,
      width: itemWidth.value,
      height: itemHeight.value,
      transform: [
         { translateX: translateX.value },
         { translateY: translateY.value + translationYShakeOffset.value },
      ] as any,
      left: itemX.value,
      top: itemY.value,
      borderColor: isCreateFolder.value ? 'yellow' : (isDragging ? 'red' : 'transparent'),
      borderWidth: 2,
      pointerEvents: isDragging ? 'none' : 'auto',
   }));

   const onHoverOnCreateFolder = (event: NativeSyntheticEvent<NativeMouseEvent>) => {
      console.log('ISHOVERQQQ');
      onCreateFolderHover && onCreateFolderHover(true)
      runOnJS(console.log)('onHoverOnCreateFolder', event)
   }

   if (isPreview)
      return (
         <Animated.View style={[styles.previewItem, animatedStyle]} >
            <Text>TEEXT FWEH</Text>
            <Text>{JSON.stringify({ x: Math.floor(x), y: Math.floor(y) })}</Text>
         </Animated.View>
      )

   return (
      <GestureDetector gesture={dragGesture}>
         <Animated.View style={[styles.item, animatedStyle]} >

            {isCreateFolder.value && (
               <Pressable style={{
                  position: 'absolute', // Ensures it overlays the rest of the layout
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  justifyContent: 'center',
                  alignItems: 'center',
                  zIndex: 10, // Ensures it appears above other elements
                  // pointerEvents: 'none', // Prevents it from interfering with gestures
                  backgroundColor: 'rgba(0, 0, 0, 0.2)', // Semi-transparent overlay
                  margin: '26%'
               }}


                  onHoverIn={(event) => onHoverOnCreateFolder(event)}
                  onHoverOut={(event) => onHoverOnCreateFolder(event)}
                  onPointerEnter={(event) => onHoverOnCreateFolder(event)}

               // onPointerDown={() => { console.log('ISHOVERQQQ'); onCreateFolderHover(true) }}
               // onPointerUp={() => { console.log('ISHOVERQQQ'); onCreateFolderHover(false) }}
               >

                  {/* 
                              war unter style des ersten Pressable
                  >
                     <Pressable
                        style={{
                           width: itemWidth.value * 0.5, // Slightly smaller than the item
                           height: itemHeight.value * 0.5,
                           backgroundColor: 'rgba(0, 0, 0, 0.2)', // Semi-transparent overlay
                           borderRadius: 8,
                           justifyContent: 'center',
                           alignItems: 'center',
                           pointerEvents: 'auto'
                        }} */}

                  <Text style={{ color: 'white', fontSize: 12 }}>Add folder</Text>
                  {/* </Pressable> */}
               </Pressable>
            )}


            <View>
               <Text>ID: {id}</Text>
               <Text>x:{Math.floor(x)} y:{Math.floor(y)}</Text>
               <Text>w:{Math.floor(width)} h:{Math.floor(height)}</Text>
               <Text>hover {isCreateFolder.value ? 'true' : 'false'}</Text>
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
      backgroundColor: '#4A90E233',
      position: 'absolute',
      borderColor: '#4A90E2',
      borderWidth: 2,
      elevation: 1,
   }
});
