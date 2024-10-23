import { StyleSheet } from 'react-native'

export const newTileStyles = StyleSheet.create({
    pageTile: {
        aspectRatio: 1,
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        flex: 1, flexGrow: 1,
        zIndex: 1, shadowOpacity: 0.8,
        elevation: 8,
        height: '100%'
    },

    linkOrPressable: {
        height: '100%', width: '100%', justifyContent: 'center'
    }
})

export const tileStyles = StyleSheet.create({
    card: {
        aspectRatio: 1,
        zIndex: 0,
        minHeight: 100,
        borderRadius: 15,
        backgroundColor: '#333333',
        color: 'white',
        justifyContent: 'center',
    },
    centerContainer: {
        height: '100%',
        width: '100%',
        display: 'flex',
        gap: 5,
        padding: 5,
        alignSelf: 'center',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
    },
    name: {
        fontSize: 20,
        fontWeight: '500',
        color: 'white',
        textAlign: 'center',
    },
    info: {
        fontSize: 15,
        fontWeight: 'condensed',
        color: 'white',
        textAlign: 'center',
    },
    info2: {
        display: 'flex',
        flexDirection: 'row',
        alignContent: 'center',
        justifyContent: 'center',
        fontSize: 10,
        fontWeight: '400',
        color: 'white',
        textAlign: 'right',
    },
    infoIcon: {
        alignSelf: 'center',
        justifyContent: 'center',
    },
    infoContainer: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'flex-end',
        gap: 5,
        width: '100%',
    }
})