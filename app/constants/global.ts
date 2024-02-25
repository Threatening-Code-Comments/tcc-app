import { StyleSheet } from "react-native"

export const dbName = 'TCC_DB'

export type ButtonType = "primary" | "secondary" | "error"

export const colors = {
    background: '#222222',
    primary: '#6200ee',
    secondary: '#03dac5',
    error: '#D80404'
}

export const globalStyles = StyleSheet.create({
    text: {
        color: 'white'
    },
    title: {
        color: 'white',
        fontSize: 30,
        fontWeight: 'bold',
        textAlign: 'center'
    },
    secondaryTitle: {
        color: 'white',
        fontSize: 15,
        fontWeight: '400',
        textAlign: 'center'
    },
    iconButtonContainer: {
        display: 'flex',
        flexDirection: 'row',
        gap: 5
    }

})