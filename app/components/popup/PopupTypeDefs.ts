export type PopupElement = PopupTextfield | PopupNumberfield | PopupButton

type PopupTextfield = {
    type: 'textfield'
    label: string,
    value: string,
    onChange: (value: string) => void
}

type PopupNumberfield = {
    type: 'numberfield'
    label: string,
    value: number,
    onChange: (value: number) => void
}

type PopupButton = {
    type: 'button'
    label: string,
    onClick: () => void
}