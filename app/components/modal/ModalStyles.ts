import { StyleSheet } from 'react-native';

export const modalStyles = StyleSheet.create({
    modalContent: {
        height: "auto",
        minHeight: 400,
        width: '100%',
        backgroundColor: '#f1f1f1',
        borderTopRightRadius: 18,
        borderTopLeftRadius: 18,
        position: 'absolute',
        bottom: 0,
    },
    titleContainer: {
        height: 'auto',
        backgroundColor: '#e1e1e1',
        borderTopRightRadius: 10,
        borderTopLeftRadius: 10,
        paddingLeft: 20,
        paddingRight: 10,
        flexDirection: 'row',
        alignItems: 'center',
        // justifyContent: 'space-between',
        justifyContent: 'flex-end',
    },
    title: {
        color: '#000',
        width: '100%',
        fontSize: 16,
        textAlign: 'center',
    },
    input: {
        height: 40,
        margin: 12,
        borderWidth: 1,
        padding: 10,
        borderRadius: 10,
    },
    materialInput: {
        margin: 12,
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
        padding: 10
    }
});