import { ReactNode } from "react"
import { IconName } from "../IconButton"

export type UseModalInputType3 = "string" | "number" | "select" | "button"

export type UseModalInputType2 = {
    [key: string]: UseModalInputType3
}

export type UseModalStringType = {
    type: "string"
    value?: string
}
export type UseModalNumberType = {
    type: "number"
    value?: number
}
export type UseModalSelectType = {
    type: "select"
    options: readonly string[]
    value?: string
}
export type UseModalButtonType = {
    type: "button"
    icon: IconName
    onClick: () => void
}

export type UseModalInputType<TType extends UseModalInputType3> =
    TType extends "string" ? UseModalStringType :
    TType extends "number" ? UseModalNumberType :
    TType extends "select" ? UseModalSelectType :
    UseModalButtonType

export type UseModalOutputType<TType extends UseModalInputType3> =
    TType extends "string" ? string :
    TType extends "number" ? number :
    TType extends "select" ? string :
    never

export type UseModalPropsInputTypes<TTypes extends UseModalInputType2> = {
    [TKey in keyof TTypes]: UseModalInputType<TTypes[TKey]>
}

export type UseModalStateType<TTypes extends UseModalInputType2> = {
    [TKey in keyof TTypes]: UseModalOutputType<TTypes[TKey]>
}

export type UseModalProps<TTypes extends UseModalInputType2> = {
    title: string
    inputTypes: UseModalPropsInputTypes<TTypes>
    test?: TTypes
}

export type UseModalReturn<TTypes extends UseModalInputType2> = {
    visible: boolean
    setVisible: (visible: boolean) => void
    inputStates: UseModalStateType<TTypes>
    component: ReactNode
}

export type ModalInputChangeType<TType extends UseModalInputType3, TKey extends string = string, TValue extends UseModalOutputType<TType> = UseModalOutputType<TType>> = (key: TKey, value: TValue) => void