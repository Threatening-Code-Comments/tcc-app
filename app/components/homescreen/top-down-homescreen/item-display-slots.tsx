import {View} from "react-native";
import {Text} from "react-native-paper";
import React, {useEffect, useState} from "react";
import {Icon} from "@components/Icon";
import {getDurationFromSecond} from "@components/tiles/TileTile";
import {utilStyles} from "@components/tiles/styles";
import {IconName} from "@app/constants/iconNames";
import {getContrastColor} from "@components/Colors";

export type ConcreteItemSlot = {
    type: ItemDisplaySlotType
    index: number
    valueCallback: (item: any) => ItemDisplaySlotValue;
}

type SlotOrientation = "left" | "right" | "center"
type ItemDisplaySlotType = "debug" | "name" | "taps_total" | "time_since_last"
type ItemDisplaySlotValue = string | number | Date

function ItemDisplaySlotName({value, orientation, contrastColor}: {
    value: string,
    orientation: SlotOrientation,
    contrastColor: string
}) {
    return (<View style={{...utilStyles.full, ...utilStyles.centerColumn}}>
        <Text
            variant={(value.length > 9) ? "labelMedium" : "labelLarge"}
            style={{textAlign: orientation, color: contrastColor}}>
            {value}
        </Text>
    </View>);
}

function IconWithText({iconName, text, orientation, textOffset = 0, contrastColor}: {
    iconName: IconName,
    orientation: SlotOrientation,
    text: string,
    contrastColor: string,
    textOffset?: number,
}) {
    if (orientation !== "right") {
        return (<>
            <Icon iconName={iconName} color={contrastColor} iconSize={15}/>
            <Text style={{marginLeft: textOffset, color: contrastColor}} variant={"bodySmall"}>{text}</Text>
        </>)
    } else {
        return (<>
            <Text variant={"bodySmall"} style={{color: contrastColor,}}>{text}</Text>
            <Icon iconName={iconName} color={contrastColor} iconSize={15}/>
        </>)
    }
}

function ItemDisplaySlotTotalTaps({value, orientation, contrastColor}: {
    value: number | string,
    orientation: SlotOrientation,
    contrastColor: string
}) {

    return (<View style={{
        ...utilStyles.full, ...utilStyles.column,
        justifyContent: 'flex-start', alignItems: getFlexAlignForSlotAlignment(orientation)
    }}>

        <View style={{...utilStyles.centerRow}}>
            <IconWithText contrastColor={contrastColor}
                          iconName={"tap"} orientation={orientation}
                          text={"Total"} textOffset={-4}
            />
        </View>

        <View style={{width: '100%', alignItems: 'center'}}>
            <Text style={{color: contrastColor}} variant={"bodyMedium"}>
                {value}
            </Text>
        </View>
    </View>);
}

const getFlexAlignForSlotAlignment = (alignment: SlotOrientation) => {
    switch (alignment) {
        case "center":
            return "center";
        case "right":
            return "flex-end";
        case "left":
            return "flex-start";
    }
}

const ItemDisplaySlotTimeSinceLast: React.FC<{ value: Date, orientation: SlotOrientation, contrastColor: string }> =
    ({value, orientation, contrastColor}) => {
        const getDurationText = (value: Date) => {
            const duration = (Date.now() - value.getTime())
            return getDurationFromSecond(duration / 1000)
        }

        const [, setTime] = useState(Date.now());

        useEffect(() => {
            const interval = setInterval(() => setTime(Date.now()), 1000);
            return () => {
                clearInterval(interval);
            };
        }, []);

        return (
            <View style={{
                ...utilStyles.full, ...utilStyles.column,
                alignContent: 'flex-start',
            }}>
                <View style={{
                    width: '100%', ...utilStyles.row,
                    justifyContent: getFlexAlignForSlotAlignment(orientation)
                }}>
                    <IconWithText iconName={"clockOutline"}
                                  contrastColor={contrastColor}
                                  orientation={orientation} text={"Last"}/>
                </View>

                <View style={{width: '100%', alignItems: 'center'}}>
                    <Text style={{
                        fontSize: 11,
                        textAlign: orientation, color: contrastColor,
                    }}>
                        {!!value ? getDurationText(value) : "no events"}
                    </Text>
                </View>
            </View>
        )
    }
type ItemDisplaySlotProps = {
    type: ItemDisplaySlotType,
    value: ItemDisplaySlotValue,
    orientation: SlotOrientation,
    color: string
}
export const ItemDisplaySlot = ({type, value, orientation, color}: ItemDisplaySlotProps) => {
    const contrastColor = getContrastColor(color)

    switch (type) {
        case "debug":
            return (<Text>Debug</Text>)
        case "name":
            return <ItemDisplaySlotName value={value as string} contrastColor={contrastColor}
                                        orientation={orientation}/>
        case "taps_total":
            return <ItemDisplaySlotTotalTaps value={value as number | string} contrastColor={contrastColor}
                                             orientation={orientation}/>
        case "time_since_last":
            return <ItemDisplaySlotTimeSinceLast value={value as Date} contrastColor={contrastColor}
                                                 orientation={orientation}/>
        default:
            throw new Error(`Unknown type "${type}" for ItemDisplaySlotType in Switch-Statement`)
    }
}