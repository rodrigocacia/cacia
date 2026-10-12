import { SWRConfig } from "swr"

import { getSetting } from "@/http/setting/get-setting"

import { AdministratorDetail } from "./detail"

export default async function Administrator() {
  const setting = await getSetting({ page: 1 })

  return (
    <SWRConfig
      value={{
        fallback: {
          setting: setting,
        },
        revalidateOnFocus: false,
        revalidateIfStale: false,
        revalidateOnReconnect: false,
        refreshInterval: 0,
      }}
    >
      <AdministratorDetail />
    </SWRConfig>
  )
}
