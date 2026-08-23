import React from "react";
import { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import Item from "./item";

type Folder = {
  id: number;
  name: string;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
  items: number[];
};

const FolderItem = ({ folder }: { folder: Folder }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <View style={styles.folder}>
      <Text>{folder.name}</Text>
      <View style={styles.folderItems}>
        {folder.items.map((item) => (
          <Item
            key={item}
            id={item}
            x={0}
            y={0}
            width={0}
            height={0}
            handleDragEnd={function (id: number, x: number, y: number): void {
              throw new Error("Function not implemented.");
            }}
            snapToNearestGridPoint={function (value: number): number {
              throw new Error("Function not implemented.");
            }}
            makeSpaceForItem={function (item: {
              id: number;
              x: number;
              y: number;
              width: number;
              height: number;
            }): void {
              throw new Error("Function not implemented.");
            }}
            blockingItems={undefined}
            pxToGrid={function (value: number): number {
              throw new Error("Function not implemented.");
            }}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  folder: {
    backgroundColor: "white",
    padding: 10,
    borderRadius: 10,
    margin: 10,
  },
  folderItems: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
});
