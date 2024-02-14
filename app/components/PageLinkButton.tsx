import React from 'react'
import { Page } from '../constants/DbTypes'
import LinkButton from './LinkButton'

type PageLinkButtonProps = {
    page: Page
}

const PageLinkButton = (props: PageLinkButtonProps) => {
    return (
        <LinkButton link={`/pages/${props.page.id}`} text1={props.page.id} text2={props.page.name} />
    )
}

export default PageLinkButton