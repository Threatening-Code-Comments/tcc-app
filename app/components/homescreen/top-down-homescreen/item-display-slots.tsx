import {View} from "react-native";
import {Text} from "react-native-paper";
import React, {useEffect, useState} from "react";
import {Icon} from "@components/Icon";
import {getDurationFromSecond} from "@components/tiles/TileTile";

type ItemDisplaySlotType = "debug" | "name" | "taps_total" | "time_since_last"
type ItemDisplaySlotValue = string | number | Date

function ItemDisplaySlotName({value}: { value: string }) {
    return (<View style={{height: '100%', width: '100%', justifyContent: 'center', alignItems: 'center'}}>
        <Text
            variant={(value.length > 9) ? "labelMedium" : "labelLarge"}
            style={{textAlign: 'center',}}>
            {value}
        </Text>
    </View>);
}

function ItemDisplaySlotTotalTaps({value}: { value: number | string }) {
    return (<View style={{height: '100%', width: '100%', justifyContent: 'center', alignItems: 'center'}}>
        <View style={{display: 'flex', flexDirection: 'column', justifyContent: 'space-around', alignItems: 'center'}}>
            <Text
                variant={"bodySmall"}
                style={{textAlign: 'center',}}>
                Taps total:
            </Text>
            <Text
                variant={"bodyMedium"}
                style={{textAlign: 'center',}}>
                {value}
            </Text>

        </View>
    </View>);
}

const ItemDisplaySlotTimeSinceLast: React.FC<{ value: Date }> = ({value}) => {
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
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center'
        }}>
            <Icon styles={{
                alignSelf: 'center',
                justifyContent: 'center',
            }} iconName={"clockOutline"} iconSize={15}/>

            <Text style={{fontSize: 11}}>
                {!!value ? getDurationText(value) : "no events"}
            </Text>
        </View>
    )
}

export const ItemDisplaySlot = ({type, value}: { type: ItemDisplaySlotType, value: ItemDisplaySlotValue }) => {
    switch (type) {
        case "debug":
            return (<></>)
        case "name":
            return <ItemDisplaySlotName value={value as string}/>
        case "taps_total":
            return <ItemDisplaySlotTotalTaps value={value as number | string}/>
        case "time_since_last":
            return <ItemDisplaySlotTimeSinceLast value={value as Date}/>
        default:
            throw new Error(`Unknown type "${type}" for ItemDisplaySlotType in Switch-Statement`)
    }
}