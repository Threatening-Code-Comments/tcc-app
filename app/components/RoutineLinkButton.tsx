import React from 'react'
import { Routine } from '../constants/DbTypes'
import LinkButton from './LinkButton'

type RoutineLinkButtonProps={
    routine: Routine
}
const RoutineLinkButton = (props: RoutineLinkButtonProps) => {
  return (
    <LinkButton link={`/routines/${props.routine.id}`} text1={props.routine.id} text2={props.routine.name} />
  )
}

export default RoutineLinkButton