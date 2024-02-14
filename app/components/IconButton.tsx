import FontAwesome from '@expo/vector-icons/FontAwesome'

type IconButtonProps = {    
    iconName: string,
    text?: string,
    onPress?: ()=>void
}
export const IconButton = (props: IconButtonProps) => {
    const iconSize = 32
    const padding = 5
    const wH = iconSize + padding * 2
    const text = props.text

    return (
        // <View style={{  width: wH, height: wH}}>
        <FontAwesome.Button
            style={{ alignSelf: 'center', margin: 5, }}
            color='white'
            borderRadius={10}
            name={props.iconName}
            onPress={props.onPress}
            size={iconSize}>
            {(text) ? text : null}
        </FontAwesome.Button>

    )
}