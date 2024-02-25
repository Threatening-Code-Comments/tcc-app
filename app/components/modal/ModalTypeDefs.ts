import { IconName } from "../IconButton"

export type UseModalInputType = {
    type: "string"
} | {
    type: "number"
} | {
    type: "select"
    options: readonly string[]
} | {
    type: "button"
    icon: IconName
    onClick: () => void
}

export type UseModalProps = {
    title: string
    inputTypes: Record<string, UseModalInputType>
}

export type InputStateType<TProps extends Record<string, UseModalInputType>> = {
    [key in keyof TProps]: TProps[key]["type"] extends "number" ? number : string
}
export type OnInputChangeType =
    <const TKey extends string,
        const TType extends UseModalInputType & { key: TKey; },
        const TValue extends TType["type"] extends "number" ? number : string>
        (key: TType, value: TValue) => void

export type InputTypesType = Record<string, UseModalInputType>