import React from "react";
import { Animated } from "react-native";
import { AnimateProps } from "react-native-reanimated";

export function withAnimated<T extends object>(
    WrappedComponent: React.ComponentType<T>
  ): React.ComponentClass<AnimateProps<T>, any> {
    const displayName =
      WrappedComponent.displayName || WrappedComponent.name || 'Component';
  
    class WithAnimated extends React.Component<T, any> {
      static displayName = `WithAnimated(${displayName})`;
  
      render(): React.ReactNode {
        return <WrappedComponent {...this.props} />;
      }
    }
    return Animated.createAnimatedComponent(WithAnimated) as unknown as React.ComponentClass<AnimateProps<T>, any>;
  }