import { StyleSheet } from 'react-native'

export const tileStyles = StyleSheet.create({
    card: {
        aspectRatio: 1,
        zIndex: 0,
        minHeight: 100,
        borderRadius: 15,
        backgroundColor: '#333',
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
        marginHorizontal: 10,
        fontWeight: '500',
        color: 'white',
        textAlign: 'center'
    },
    info: {
        fontSize: 10,
        fontWeight: '200',
        color: 'white',
        textAlign: 'center'
    }
})