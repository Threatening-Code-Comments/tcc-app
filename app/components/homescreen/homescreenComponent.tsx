import React from 'react';
import { StyleSheet, View } from 'react-native';
import { HomeScreenHandler } from './homescreenHandler';

export const HomescreenComponent = () => {
  const items = [
    { id: 2, x: 1, y: 0, width: 2, height: 1 },
    { id: 1, x: 0, y: 0, width: 1, height: 1 }, // width und height als Einheiten

    { id: 3, x: 2, y: 1, width: 1, height: 1 },
    // Weitere Widgets ...
  ]

  return (
    <View style={styles.grid}>
      <HomeScreenHandler items={items} />
    </View>
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