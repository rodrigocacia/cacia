"use server"

import { updateTag } from "next/cache"

export async function revalidate(tag: string) {
  updateTag(tag)
}
