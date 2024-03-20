import { ReactNode } from "react"
import { IconName } from "../IconButton"

export type UseModalInputType3 = "string" | "number" | "select" | "button" | "submit"

export type UseModalInputType2 = {
    [key: string]: UseModalInputType3
}

export type UseModalStringType = {
    type: "string"
    value?: string
    optional?: boolean
}
export type UseModalNumberType = {
    type: "number"
    value?: number
    optional?: boolean
}
export type UseModalSelectType = {
    type: "select"
    options: readonly string[]
    value?: string
    optional?: boolean
}
export type UseModalButtonType = {
    type: "button"
    icon: IconName
    onClick: () => void
}
export type UseModalSubmitType<TType extends UseModalInputType2> = {
    type: "submit"
    icon: IconName
    onClick: (data: UseModalStateType<TType>) => void
}

export type UseModalInputType<TType extends UseModalInputType3, TType2 extends UseModalInputType2> =
    TType extends "string" ? UseModalStringType :
    TType extends "number" ? UseModalNumberType :
    TType extends "select" ? UseModalSelectType :
    TType extends "button" ? UseModalButtonType :
    UseModalSubmitType<TType2>

export type UseModalOutputType<TType extends UseModalInputType3> =
    TType extends "string" ? string :
    TType extends "number" ? number :
    TType extends "select" ? string :
    never

export type UseModalPropsInputTypes<TTypes extends UseModalInputType2> = {
    [TKey in keyof TTypes]: UseModalInputType<TTypes[TKey], TTypes>
}

export type UseModalStateType<TTypes extends UseModalInputType2> = {
    [TKey in keyof TTypes as TTypes[TKey] extends ("string" | "number" | "select") ? TKey : never]: UseModalOutputType<TTypes[TKey]>
}

export type UseModalErrorType<TTypes extends UseModalInputType2> = {
    [TKey in keyof TTypes as TTypes[TKey] extends ("string" | "number" | "select") ? TKey : never]: boolean
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
    errors: UseModalErrorType<TTypes>
}

export type ModalInputChangeType<TType extends UseModalInputType3, TKey extends string = string, TValue extends UseModalOutputType<TType> = UseModalOutputType<TType>> = (key: TKey, value: TValue) => void