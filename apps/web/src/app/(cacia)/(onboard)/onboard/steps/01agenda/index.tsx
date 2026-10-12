"use client"

import { useEffect } from "react"

import { Form } from "./form"

export function Agenda() {
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }, [])

  return <Form />
}
