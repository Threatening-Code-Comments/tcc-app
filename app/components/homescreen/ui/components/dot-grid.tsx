import React from 'react';
import {StyleSheet, View} from 'react-native';
import {useTheme} from 'react-native-paper';
import Svg, {Circle, Defs, Pattern, Rect} from 'react-native-svg';
import {GRID_UNIT} from "@homescreen/move_algo";
import {HomescreenState} from "@homescreen/types";

export const DotGridBackground = ({mode}: { mode: HomescreenState }) => {
    const {colors} = useTheme();

    if (mode !== "edit") return null

    return (
        <View style={StyleSheet.absoluteFillObject}>
            <Svg width="100%" height="100%">
                <Defs>
                    <Pattern
                        id="dotGrid"
                        x="0"
                        y="0"
                        width={`${GRID_UNIT}px`}  // Abstand zwischen den Punkten (X)
                        height={`${GRID_UNIT}px`} // Abstand zwischen den Punkten (Y)
                        patternUnits="userSpaceOnUse"
                    >
                        {/* r="1.5" ist die Größe des Punktes */}
                        <Circle cx="2" cy="2" r="2" fill={colors.onBackground} fillOpacity={0.4}/>
                    </Pattern>
                </Defs>
                <Rect width="100%" height="100%" fill="url(#dotGrid)"/>
            </Svg>
        </View>
    )
};