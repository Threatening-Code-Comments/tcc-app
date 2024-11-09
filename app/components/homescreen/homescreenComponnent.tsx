import React from 'react';
import { StyleSheet, View } from 'react-native';
import { HomeScreenHandler } from './test';

export const HomescreenComponnent = () => {
  return (
    // <View style={styles.grid}>
      <HomeScreenHandler />
    // </View>
  )
}

const styles = StyleSheet.create({
  grid: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f2f2f2',
    alignItems: 'center',
    justifyContent: 'center'
  }
});