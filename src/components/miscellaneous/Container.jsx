import React from 'react'
import clsx from 'clsx'

const Container = ({children, className}) => {
  return (
    <div className= {clsx("max-w-[95%] mx-auto md:py-2 py-1 flex items-center",className)}>
      {children}
    </div>
  )
}

export default Container
