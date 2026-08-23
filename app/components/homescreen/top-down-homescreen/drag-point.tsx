import React, {useMemo} from 'react';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import Animated, {runOnJS, useAnimatedStyle} from 'react-native-reanimated';

const DRAG_TARGET_SIZE = 24;

export type DragPointPosition = 'top' | 'bottom' | 'left' | 'right'

interface DragPointProps {
    position: DragPointPosition;
    onResizeEnd: (pos: DragPointPosition) => void;
    onResizeUpdate: (pos: DragPointPosition, deltaX: number, deltaY: number) => void;
}

export const DragPoint: React.FC<DragPointProps> = ({position, onResizeEnd, onResizeUpdate}) => {

    const pointGesture = useMemo(() =>
            Gesture.Pan()
                .onUpdate((event) => {
                    // Wir geben die reinen Translation-Werte an den Parent weiter
                    runOnJS(onResizeUpdate)(position, event.translationX, event.translationY);
                })
                .onEnd(() => {
                    runOnJS(onResizeEnd)(position)
                }),
        [onResizeUpdate]
    );

    const animatedStyle = useAnimatedStyle(() => {
        const isVertical = position === 'top' || position === 'bottom';

        return {
            width: DRAG_TARGET_SIZE,
            aspectRatio: 1,
            borderRadius: DRAG_TARGET_SIZE/3,
            backgroundColor: 'blue',
            position: 'absolute',
            borderColor: 'white',
            borderWidth: 1,
            opacity: 0.7,
            // Positionierungs-Logik
            left: position === 'left' ? '0%' : position === 'right' ? '100%' : '50%',
            top: position === 'top' ? '0%' : position === 'bottom' ? '100%' : '50%',
            marginLeft: -DRAG_TARGET_SIZE / 2,
            marginTop: -DRAG_TARGET_SIZE / 2,
            zIndex: 20,
        };
    });

    return (
        <GestureDetector gesture={pointGesture}>
            <Animated.View style={animatedStyle}/>
        </GestureDetector>
    );
};