import { Dimensions, StyleSheet } from 'react-native';

export const modalStyles = StyleSheet.create({
    modalContent: {
        height: "auto",
        minHeight: 300,
        width: '100%',
        backgroundColor: '#222',
        borderTopRightRadius: 18,
        borderTopLeftRadius: 18,
        position: 'absolute',
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        // gap: 10,
    },
    titleContainer: {
        height: 'auto',
        backgroundColor: '#444',
        borderTopRightRadius: 10,
        borderTopLeftRadius: 10,
        padding: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    title: {
        color: '#fff',
        width: '100%',
        flex: 10,
        fontSize: 25,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    input: {
        height: 40,
        margin: 20,
        borderWidth: 1,
        padding: 10,
        borderRadius: 10,
    },
    materialInput: {
        // margin: 20,
        borderRadius: 20,
    },
    picker: {
        height: 40,
        margin: 12,
        borderWidth: 1,
        padding: 10,
        borderRadius: 10,
    },
    content: {
        // padding: 10
        paddingVertical: Dimensions.get('window').width * 0.05
    }
});