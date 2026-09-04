export interface Connection {
  _id: string
  office: string
  type: string
  whatsapp_connection: string
  whatsapp_api_key: string
  evolution_api_host: string
  evolution_api_instance: string
  evolution_api_key: string
  evolution_state: "open" | "closed"
  evolution_profile_name: string
  evolution_profile_picture_url: string
  evolution_phone: string
  waha_api_host: string
  waha_session: string
  waha_api_key: string
  waha_state: "STOPPED" | "STARTING" | "SCAN_QR_CODE" | "WORKING" | "FAILED"
  waha_phone: string
  waha_profile_name: string
  waha_profile_picture_url: string
  fallback_enabled: boolean
  proxy_country: string
  proxy_state: string
  proxy_city: string
  proxy_scope: "city" | "state" | "country" | null
  deleted_at: string
  created_at: string
  updated_at: string
}
