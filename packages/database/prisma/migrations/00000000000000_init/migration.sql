-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "role" AS ENUM ('user', 'admin');

-- CreateEnum
CREATE TYPE "office_status" AS ENUM ('pending', 'active', 'deactivate');

-- CreateEnum
CREATE TYPE "plan_type" AS ENUM ('unique', 'recurrence');

-- CreateEnum
CREATE TYPE "signature_type" AS ENUM ('unique', 'recurrence');

-- CreateEnum
CREATE TYPE "signature_status" AS ENUM ('pending', 'active', 'cancelled');

-- CreateEnum
CREATE TYPE "payment_gateway" AS ENUM ('iopay');

-- CreateEnum
CREATE TYPE "recurrence_status" AS ENUM ('pending', 'active', 'cancelled');

-- CreateEnum
CREATE TYPE "payment_type" AS ENUM ('pix', 'credit_card');

-- CreateEnum
CREATE TYPE "lead_status" AS ENUM ('new', 'in_contact', 'converted');

-- CreateEnum
CREATE TYPE "process_type" AS ENUM ('CIVIL', 'PENAL', 'TRABALHISTA', 'TRIBUTARIO', 'ADMINISTRATIVO', 'CONSTITUCIONAL', 'ELEITORAL', 'MILITAR', 'AMBIENTAL', 'CONSUMIDOR', 'EMPRESARIAL', 'PREVIDENCIARIO');

-- CreateEnum
CREATE TYPE "process_status" AS ENUM ('pending', 'active', 'archived', 'concluded', 'finished');

-- CreateEnum
CREATE TYPE "process_update_status" AS ENUM ('PENDING', 'PROCESSING', 'DONE', 'ERROR', 'CANCELLED');

-- CreateEnum
CREATE TYPE "whatsapp_provider" AS ENUM ('oficial', 'evolution', 'waha');

-- CreateEnum
CREATE TYPE "connection_type" AS ENUM ('whatsapp');

-- CreateEnum
CREATE TYPE "connection_status" AS ENUM ('pending', 'connected', 'disconnected');

-- CreateEnum
CREATE TYPE "evolution_state" AS ENUM ('connected', 'disconnected', 'connecting', 'waiting_qr', 'failed');

-- CreateEnum
CREATE TYPE "waha_session_status" AS ENUM ('STOPPED', 'STARTING', 'SCAN_QR_CODE', 'WORKING', 'FAILED');

-- CreateEnum
CREATE TYPE "proxy_scope" AS ENUM ('city', 'state', 'country');

-- CreateEnum
CREATE TYPE "agent_type" AS ENUM ('support', 'personal');

-- CreateEnum
CREATE TYPE "agent_gender" AS ENUM ('woman', 'man', 'neutral');

-- CreateEnum
CREATE TYPE "agent_style" AS ENUM ('Formal Jurídico', 'Claro e Objetivo', 'Assertivo e Persuasivo', 'Empático e Acolhedor', 'Informal Profissional');

-- CreateEnum
CREATE TYPE "chat_type" AS ENUM ('user', 'lead', 'customer');

-- CreateEnum
CREATE TYPE "chat_status" AS ENUM ('pending', 'active', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "message_sender" AS ENUM ('lead', 'customer', 'user', 'agent', 'system');

-- CreateEnum
CREATE TYPE "message_type" AS ENUM ('text', 'image', 'audio', 'video', 'document', 'location', 'contact', 'calendar', 'meeting', 'task', 'note', 'sticker');

-- CreateEnum
CREATE TYPE "message_status" AS ENUM ('pending', 'sent', 'delivered', 'read', 'failed');

-- CreateEnum
CREATE TYPE "mark_type" AS ENUM ('LEAD', 'CUSTOMER', 'USER', 'SYSTEM');

-- CreateEnum
CREATE TYPE "mark_category" AS ENUM ('feedback', 'address', 'preference', 'other');

-- CreateEnum
CREATE TYPE "mark_author" AS ENUM ('USER', 'AGENT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "weekday" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateEnum
CREATE TYPE "event_type" AS ENUM ('meeting', 'hearing', 'inquiry', 'deadline', 'commitment', 'service');

-- CreateEnum
CREATE TYPE "event_status" AS ENUM ('pending', 'confirm', 'cancel', 'done');

-- CreateEnum
CREATE TYPE "consultation_mode" AS ENUM ('online', 'in_person');

-- CreateEnum
CREATE TYPE "reminder_type" AS ENUM ('event', 'task', 'appointment', 'deadline', 'custom');

-- CreateEnum
CREATE TYPE "reminder_status" AS ENUM ('pending', 'processing', 'sent', 'cancelled', 'failed');

-- CreateEnum
CREATE TYPE "document_vector_status" AS ENUM ('pending', 'processing', 'completed', 'failed', 'skipped');

-- CreateEnum
CREATE TYPE "document_type" AS ENUM ('upload', 'create', 'attachment');

-- CreateEnum
CREATE TYPE "document_category" AS ENUM ('budget', 'contract', 'power_of_attorney', 'petition');

-- CreateEnum
CREATE TYPE "document_status" AS ENUM ('draft', 'pending_review', 'approved', 'sent');

-- CreateEnum
CREATE TYPE "notification_type" AS ENUM ('process_update', 'progress_update', 'new_event', 'attachment_doc', 'confirm_doc', 'new_lead');

-- CreateEnum
CREATE TYPE "notification_status" AS ENUM ('delivery', 'open');

-- CreateEnum
CREATE TYPE "service_area" AS ENUM ('administrative', 'agrarian', 'bankruptcy', 'business', 'civil', 'consumer', 'contract', 'corporate', 'criminal', 'digital', 'electoral', 'environmental', 'family', 'health', 'human_rights', 'immigration', 'insurance', 'intellectual_property', 'international', 'labor', 'military', 'notarial', 'pension', 'real_estate', 'social_security', 'sports', 'tax', 'technology', 'traffic', 'tributary', 'youth', 'other');

-- CreateEnum
CREATE TYPE "service_value_type" AS ENUM ('fixed', 'float', 'personal');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "document" TEXT,
    "birthday" TEXT,
    "phone" TEXT,
    "avatar" TEXT,
    "thumb" TEXT,
    "country" TEXT,
    "state" TEXT,
    "city" TEXT,
    "role" "role" NOT NULL DEFAULT 'user',
    "verified" BOOLEAN NOT NULL DEFAULT true,
    "forgot_code" TEXT,
    "forgot_code_expire_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "office_members" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "office_id" UUID NOT NULL,
    "role" "role" NOT NULL DEFAULT 'user',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "office_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plans" (
    "id" UUID NOT NULL,
    "type" "plan_type" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(12,2) NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offices" (
    "id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "plan_id" UUID,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "document" TEXT NOT NULL,
    "legal_name" TEXT,
    "trade_name" TEXT,
    "remotejid" TEXT,
    "oab_number" TEXT NOT NULL,
    "oab_uf" TEXT NOT NULL,
    "status" "office_status" NOT NULL DEFAULT 'pending',
    "gateway_customer_id" TEXT,
    "onboarding" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "offices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "signatures" (
    "id" UUID NOT NULL,
    "office_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "type" "signature_type" NOT NULL,
    "status" "signature_status" NOT NULL DEFAULT 'pending',
    "next_recurrence_at" TIMESTAMP(3),
    "gateway" "payment_gateway" NOT NULL,
    "gateway_recurrence_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "signatures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recurrences" (
    "id" UUID NOT NULL,
    "office_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "signature_id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,
    "status" "recurrence_status" NOT NULL DEFAULT 'pending',
    "gateway" "payment_gateway" NOT NULL,
    "gateway_payment_id" TEXT,
    "payment_last_digits" TEXT,
    "payment_type" "payment_type" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "recurrences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "office_addresses" (
    "id" UUID NOT NULL,
    "office_id" UUID NOT NULL,
    "cep" TEXT,
    "street" TEXT,
    "number" TEXT,
    "complement" TEXT,
    "neighborhood" TEXT,
    "city" TEXT,
    "state" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "office_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_addresses" (
    "id" UUID NOT NULL,
    "office_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "cep" TEXT,
    "street" TEXT,
    "number" TEXT,
    "complement" TEXT,
    "neighborhood" TEXT,
    "city" TEXT,
    "state" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" UUID NOT NULL,
    "office_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "remotejid" TEXT NOT NULL,
    "email" TEXT,
    "briefing" TEXT,
    "document" TEXT NOT NULL,
    "legal_name" TEXT,
    "trade_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" UUID NOT NULL,
    "office_id" UUID NOT NULL,
    "customer_id" UUID,
    "name" TEXT NOT NULL,
    "remotejid" TEXT NOT NULL,
    "email" TEXT,
    "briefing" TEXT,
    "status" "lead_status" NOT NULL DEFAULT 'new',
    "last_activity_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "processes" (
    "id" UUID NOT NULL,
    "office_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "number" TEXT NOT NULL,
    "description" TEXT,
    "request_id" TEXT,
    "unit" TEXT,
    "type" "process_type",
    "status" "process_status" NOT NULL DEFAULT 'active',
    "update_status" "process_update_status" NOT NULL DEFAULT 'PENDING',
    "instance" INTEGER,
    "name" TEXT,
    "free_justice" BOOLEAN,
    "secrecy_level" INTEGER,
    "tribunal_acronym" TEXT,
    "county" TEXT,
    "state" TEXT,
    "city" TEXT,
    "judge" TEXT,
    "distribution_date" TEXT,
    "justice" TEXT,
    "tribunal" TEXT,
    "phase" TEXT,
    "area" TEXT,
    "justice_description" TEXT,
    "amount" DECIMAL(16,2),
    "currency" TEXT,
    "judit_status" TEXT,
    "courts" JSONB,
    "classifications" JSONB,
    "subjects" JSONB,
    "parties" JSONB,
    "last_activity_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "processes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "progresses" (
    "id" UUID NOT NULL,
    "office_id" UUID NOT NULL,
    "process_id" UUID NOT NULL,
    "title" TEXT,
    "description" TEXT NOT NULL,
    "step_id" TEXT NOT NULL DEFAULT '',
    "release_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "progresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agents" (
    "id" UUID NOT NULL,
    "office_id" UUID NOT NULL,
    "type" "agent_type" NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'CacIA',
    "gender" "agent_gender" NOT NULL DEFAULT 'woman',
    "style" "agent_style" NOT NULL,
    "greeting" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "agents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chats" (
    "id" UUID NOT NULL,
    "office_id" UUID NOT NULL,
    "agent_id" UUID NOT NULL,
    "type" "chat_type" NOT NULL,
    "user_id" UUID,
    "lead_id" UUID,
    "customer_id" UUID,
    "status" "chat_status" NOT NULL DEFAULT 'active',
    "user_name" TEXT,
    "audio_reply" BOOLEAN,
    "summary" TEXT,
    "summary_updated_at" TIMESTAMP(3),
    "summarized_message_count" INTEGER NOT NULL DEFAULT 0,
    "last_activity_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "chats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL,
    "office_id" UUID NOT NULL,
    "chat_id" UUID NOT NULL,
    "lead_id" UUID,
    "customer_id" UUID,
    "agent_id" UUID,
    "sender" "message_sender" NOT NULL,
    "type" "message_type" NOT NULL,
    "status" "message_status" NOT NULL DEFAULT 'pending',
    "message_text" TEXT,
    "message_caption" TEXT,
    "message_file_url" TEXT,
    "message_file_base64" TEXT,
    "message_file_attachment" BOOLEAN NOT NULL DEFAULT false,
    "message_file_extension" TEXT,
    "message_file_size_bytes" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marks" (
    "id" UUID NOT NULL,
    "office_id" UUID NOT NULL,
    "chat_id" UUID NOT NULL,
    "type" "mark_type" NOT NULL,
    "category" "mark_category" NOT NULL,
    "author" "mark_author" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "lead_id" UUID,
    "customer_id" UUID,
    "agent_id" UUID,
    "user_id" UUID,
    "vector_id" TEXT,
    "vector_indexed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "marks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendars" (
    "id" UUID NOT NULL,
    "office_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "google_id" TEXT,
    "general_roles" TEXT,
    "general_available" TEXT,
    "cancel_roles" TEXT,
    "notification" BOOLEAN NOT NULL DEFAULT true,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "calendars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_available_days" (
    "id" UUID NOT NULL,
    "calendar_id" UUID NOT NULL,
    "day" "weekday" NOT NULL,
    "available" BOOLEAN NOT NULL DEFAULT false,
    "start_time" TEXT,
    "end_time" TEXT,
    "online" BOOLEAN NOT NULL DEFAULT false,
    "inPerson" BOOLEAN NOT NULL DEFAULT false,
    "shift2_available" BOOLEAN NOT NULL DEFAULT false,
    "shift2_start_time" TEXT,
    "shift2_end_time" TEXT,
    "shift2_online" BOOLEAN NOT NULL DEFAULT false,
    "shift2_in_person" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "calendar_available_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" UUID NOT NULL,
    "office_id" UUID NOT NULL,
    "calendar_id" UUID NOT NULL,
    "lead_id" UUID,
    "customer_id" UUID,
    "process_id" UUID,
    "progress_id" UUID,
    "type" "event_type" NOT NULL DEFAULT 'hearing',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "status" "event_status" NOT NULL DEFAULT 'pending',
    "consultation_mode" "consultation_mode",
    "reminder_offsets" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reminders" (
    "id" UUID NOT NULL,
    "office_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "event_id" UUID,
    "lead_id" UUID,
    "customer_id" UUID,
    "process_id" UUID,
    "type" "reminder_type" NOT NULL DEFAULT 'custom',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "time_trigger" INTEGER NOT NULL,
    "trigger_at" TIMESTAMP(3) NOT NULL,
    "status" "reminder_status" NOT NULL DEFAULT 'pending',
    "sent_at" TIMESTAMP(3),
    "error_message" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "folders" (
    "id" UUID NOT NULL,
    "office_id" UUID NOT NULL,
    "customer_id" UUID,
    "title" TEXT NOT NULL,
    "system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "folders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" UUID NOT NULL,
    "office_id" UUID NOT NULL,
    "folder_id" UUID,
    "lead_id" UUID,
    "customer_id" UUID,
    "process_id" UUID,
    "progress_id" UUID,
    "chat_id" UUID,
    "message_id" UUID,
    "event_id" UUID,
    "type" "document_type" NOT NULL DEFAULT 'upload',
    "category" "document_category",
    "status" "document_status" NOT NULL DEFAULT 'draft',
    "title" TEXT NOT NULL,
    "content" TEXT,
    "extension" TEXT,
    "content_base64" TEXT,
    "content_url" TEXT,
    "size_bytes" INTEGER,
    "template_variables" JSONB,
    "vector_status" "document_vector_status" NOT NULL DEFAULT 'pending',
    "vector_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "vector_chunks_count" INTEGER NOT NULL DEFAULT 0,
    "vector_total_tokens" INTEGER,
    "vector_error_message" TEXT,
    "vector_processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" UUID NOT NULL,
    "office_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" UUID NOT NULL,
    "office_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "area" "service_area" NOT NULL,
    "value_type" "service_value_type" NOT NULL,
    "value_fixed" DECIMAL(12,2),
    "value_float" DECIMAL(12,2),
    "value_detail" TEXT,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consultations" (
    "id" UUID NOT NULL,
    "office_id" UUID NOT NULL,
    "is_charged" BOOLEAN NOT NULL DEFAULT false,
    "consultation_value" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "requires_payment_to_schedule" BOOLEAN NOT NULL DEFAULT false,
    "lawyer_pix_key" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "consultations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" UUID NOT NULL,
    "office_id" UUID NOT NULL,
    "n_w_c_new_event" BOOLEAN NOT NULL DEFAULT true,
    "n_w_c_update_process" BOOLEAN NOT NULL DEFAULT true,
    "n_w_a_new_lead" BOOLEAN NOT NULL DEFAULT true,
    "n_w_a_new_customer" BOOLEAN NOT NULL DEFAULT true,
    "n_w_a_new_mark_lead" BOOLEAN NOT NULL DEFAULT true,
    "n_w_a_new_mark_customer" BOOLEAN NOT NULL DEFAULT true,
    "n_w_a_new_document" BOOLEAN NOT NULL DEFAULT true,
    "n_w_a_new_event" BOOLEAN NOT NULL DEFAULT true,
    "n_w_a_update_process" BOOLEAN NOT NULL DEFAULT true,
    "n_w_a_update_system" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "office_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "notification_type" NOT NULL,
    "status" "notification_status" NOT NULL DEFAULT 'delivery',
    "type_id" TEXT NOT NULL,
    "type_title" TEXT NOT NULL,
    "type_detail" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "connections" (
    "id" UUID NOT NULL,
    "office_id" UUID NOT NULL,
    "type" "connection_type" NOT NULL DEFAULT 'whatsapp',
    "provider" "whatsapp_provider" NOT NULL,
    "status" "connection_status" NOT NULL DEFAULT 'pending',
    "fallback_enabled" BOOLEAN NOT NULL DEFAULT true,
    "whatsapp_api_key" TEXT,
    "evolution_api_host" TEXT,
    "evolution_api_instance" TEXT,
    "evolution_api_key" TEXT,
    "evolution_state" "evolution_state",
    "evolution_phone" TEXT,
    "evolution_profile_name" TEXT,
    "evolution_profile_picture_url" TEXT,
    "evolution_profile_status" TEXT,
    "waha_api_host" TEXT,
    "waha_api_key" TEXT,
    "waha_session" TEXT,
    "waha_state" "waha_session_status",
    "waha_phone" TEXT,
    "waha_profile_name" TEXT,
    "waha_profile_picture_url" TEXT,
    "proxy_country" TEXT DEFAULT 'BR',
    "proxy_state" TEXT,
    "proxy_city" TEXT,
    "proxy_scope" "proxy_scope",
    "proxy_applied_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "connections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_deleted_at_idx" ON "users"("deleted_at");

-- CreateIndex
CREATE INDEX "office_members_office_id_idx" ON "office_members"("office_id");

-- CreateIndex
CREATE UNIQUE INDEX "office_members_user_id_office_id_key" ON "office_members"("user_id", "office_id");

-- CreateIndex
CREATE INDEX "plans_deleted_at_idx" ON "plans"("deleted_at");

-- CreateIndex
CREATE INDEX "offices_owner_id_idx" ON "offices"("owner_id");

-- CreateIndex
CREATE INDEX "offices_document_idx" ON "offices"("document");

-- CreateIndex
CREATE INDEX "offices_deleted_at_idx" ON "offices"("deleted_at");

-- CreateIndex
CREATE INDEX "signatures_office_id_status_idx" ON "signatures"("office_id", "status");

-- CreateIndex
CREATE INDEX "signatures_office_id_deleted_at_idx" ON "signatures"("office_id", "deleted_at");

-- CreateIndex
CREATE INDEX "signatures_next_recurrence_at_idx" ON "signatures"("next_recurrence_at");

-- CreateIndex
CREATE UNIQUE INDEX "signatures_id_office_id_key" ON "signatures"("id", "office_id");

-- CreateIndex
CREATE INDEX "recurrences_office_id_status_idx" ON "recurrences"("office_id", "status");

-- CreateIndex
CREATE INDEX "recurrences_signature_id_idx" ON "recurrences"("signature_id");

-- CreateIndex
CREATE INDEX "office_addresses_office_id_idx" ON "office_addresses"("office_id");

-- CreateIndex
CREATE INDEX "customer_addresses_office_id_customer_id_idx" ON "customer_addresses"("office_id", "customer_id");

-- CreateIndex
CREATE INDEX "customers_office_id_deleted_at_idx" ON "customers"("office_id", "deleted_at");

-- CreateIndex
CREATE INDEX "customers_office_id_remotejid_idx" ON "customers"("office_id", "remotejid");

-- CreateIndex
CREATE INDEX "customers_office_id_name_idx" ON "customers"("office_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "customers_office_id_document_key" ON "customers"("office_id", "document");

-- CreateIndex
CREATE UNIQUE INDEX "customers_id_office_id_key" ON "customers"("id", "office_id");

-- CreateIndex
CREATE INDEX "leads_office_id_status_idx" ON "leads"("office_id", "status");

-- CreateIndex
CREATE INDEX "leads_office_id_remotejid_idx" ON "leads"("office_id", "remotejid");

-- CreateIndex
CREATE INDEX "leads_office_id_deleted_at_idx" ON "leads"("office_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "leads_id_office_id_key" ON "leads"("id", "office_id");

-- CreateIndex
CREATE INDEX "processes_office_id_status_idx" ON "processes"("office_id", "status");

-- CreateIndex
CREATE INDEX "processes_office_id_customer_id_idx" ON "processes"("office_id", "customer_id");

-- CreateIndex
CREATE INDEX "processes_office_id_deleted_at_idx" ON "processes"("office_id", "deleted_at");

-- CreateIndex
CREATE INDEX "processes_request_id_idx" ON "processes"("request_id");

-- CreateIndex
CREATE UNIQUE INDEX "processes_office_id_number_key" ON "processes"("office_id", "number");

-- CreateIndex
CREATE UNIQUE INDEX "processes_id_office_id_key" ON "processes"("id", "office_id");

-- CreateIndex
CREATE INDEX "progresses_office_id_process_id_idx" ON "progresses"("office_id", "process_id");

-- CreateIndex
CREATE INDEX "progresses_office_id_release_at_idx" ON "progresses"("office_id", "release_at");

-- CreateIndex
CREATE UNIQUE INDEX "progresses_process_id_step_id_key" ON "progresses"("process_id", "step_id");

-- CreateIndex
CREATE UNIQUE INDEX "progresses_id_office_id_key" ON "progresses"("id", "office_id");

-- CreateIndex
CREATE INDEX "agents_office_id_type_idx" ON "agents"("office_id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "agents_id_office_id_key" ON "agents"("id", "office_id");

-- CreateIndex
CREATE INDEX "chats_office_id_type_status_idx" ON "chats"("office_id", "type", "status");

-- CreateIndex
CREATE INDEX "chats_office_id_last_activity_at_idx" ON "chats"("office_id", "last_activity_at");

-- CreateIndex
CREATE INDEX "chats_office_id_customer_id_idx" ON "chats"("office_id", "customer_id");

-- CreateIndex
CREATE INDEX "chats_office_id_lead_id_idx" ON "chats"("office_id", "lead_id");

-- CreateIndex
CREATE INDEX "chats_office_id_user_id_idx" ON "chats"("office_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "chats_id_office_id_key" ON "chats"("id", "office_id");

-- CreateIndex
CREATE INDEX "messages_office_id_chat_id_created_at_idx" ON "messages"("office_id", "chat_id", "created_at");

-- CreateIndex
CREATE INDEX "messages_office_id_status_idx" ON "messages"("office_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "messages_id_office_id_key" ON "messages"("id", "office_id");

-- CreateIndex
CREATE INDEX "marks_office_id_chat_id_idx" ON "marks"("office_id", "chat_id");

-- CreateIndex
CREATE INDEX "marks_office_id_customer_id_category_idx" ON "marks"("office_id", "customer_id", "category");

-- CreateIndex
CREATE INDEX "marks_office_id_lead_id_category_idx" ON "marks"("office_id", "lead_id", "category");

-- CreateIndex
CREATE INDEX "calendars_office_id_status_idx" ON "calendars"("office_id", "status");

-- CreateIndex
CREATE INDEX "calendars_office_id_user_id_idx" ON "calendars"("office_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "calendars_id_office_id_key" ON "calendars"("id", "office_id");

-- CreateIndex
CREATE UNIQUE INDEX "calendar_available_days_calendar_id_day_key" ON "calendar_available_days"("calendar_id", "day");

-- CreateIndex
CREATE INDEX "events_office_id_start_time_idx" ON "events"("office_id", "start_time");

-- CreateIndex
CREATE INDEX "events_office_id_status_start_time_idx" ON "events"("office_id", "status", "start_time");

-- CreateIndex
CREATE INDEX "events_office_id_calendar_id_start_time_idx" ON "events"("office_id", "calendar_id", "start_time");

-- CreateIndex
CREATE INDEX "events_office_id_customer_id_idx" ON "events"("office_id", "customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "events_id_office_id_key" ON "events"("id", "office_id");

-- CreateIndex
CREATE INDEX "reminders_status_trigger_at_idx" ON "reminders"("status", "trigger_at");

-- CreateIndex
CREATE INDEX "reminders_office_id_trigger_at_idx" ON "reminders"("office_id", "trigger_at");

-- CreateIndex
CREATE INDEX "reminders_event_id_idx" ON "reminders"("event_id");

-- CreateIndex
CREATE INDEX "folders_office_id_customer_id_idx" ON "folders"("office_id", "customer_id");

-- CreateIndex
CREATE INDEX "folders_office_id_deleted_at_idx" ON "folders"("office_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "folders_id_office_id_key" ON "folders"("id", "office_id");

-- CreateIndex
CREATE INDEX "documents_office_id_folder_id_idx" ON "documents"("office_id", "folder_id");

-- CreateIndex
CREATE INDEX "documents_office_id_customer_id_idx" ON "documents"("office_id", "customer_id");

-- CreateIndex
CREATE INDEX "documents_office_id_process_id_idx" ON "documents"("office_id", "process_id");

-- CreateIndex
CREATE INDEX "documents_office_id_status_idx" ON "documents"("office_id", "status");

-- CreateIndex
CREATE INDEX "documents_office_id_deleted_at_idx" ON "documents"("office_id", "deleted_at");

-- CreateIndex
CREATE INDEX "questions_office_id_status_idx" ON "questions"("office_id", "status");

-- CreateIndex
CREATE INDEX "services_office_id_status_idx" ON "services"("office_id", "status");

-- CreateIndex
CREATE INDEX "services_office_id_area_idx" ON "services"("office_id", "area");

-- CreateIndex
CREATE UNIQUE INDEX "consultations_office_id_key" ON "consultations"("office_id");

-- CreateIndex
CREATE UNIQUE INDEX "settings_office_id_key" ON "settings"("office_id");

-- CreateIndex
CREATE INDEX "notifications_office_id_user_id_status_idx" ON "notifications"("office_id", "user_id", "status");

-- CreateIndex
CREATE INDEX "notifications_office_id_created_at_idx" ON "notifications"("office_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "connections_evolution_api_instance_key" ON "connections"("evolution_api_instance");

-- CreateIndex
CREATE UNIQUE INDEX "connections_waha_session_key" ON "connections"("waha_session");

-- CreateIndex
CREATE INDEX "connections_office_id_status_idx" ON "connections"("office_id", "status");

-- CreateIndex
CREATE INDEX "connections_waha_session_idx" ON "connections"("waha_session");

-- CreateIndex
CREATE INDEX "connections_evolution_api_instance_idx" ON "connections"("evolution_api_instance");

-- AddForeignKey
ALTER TABLE "office_members" ADD CONSTRAINT "office_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "office_members" ADD CONSTRAINT "office_members_office_id_fkey" FOREIGN KEY ("office_id") REFERENCES "offices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offices" ADD CONSTRAINT "offices_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offices" ADD CONSTRAINT "offices_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signatures" ADD CONSTRAINT "signatures_office_id_fkey" FOREIGN KEY ("office_id") REFERENCES "offices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signatures" ADD CONSTRAINT "signatures_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signatures" ADD CONSTRAINT "signatures_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurrences" ADD CONSTRAINT "recurrences_office_id_fkey" FOREIGN KEY ("office_id") REFERENCES "offices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurrences" ADD CONSTRAINT "recurrences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurrences" ADD CONSTRAINT "recurrences_signature_id_office_id_fkey" FOREIGN KEY ("signature_id", "office_id") REFERENCES "signatures"("id", "office_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurrences" ADD CONSTRAINT "recurrences_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "office_addresses" ADD CONSTRAINT "office_addresses_office_id_fkey" FOREIGN KEY ("office_id") REFERENCES "offices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_addresses" ADD CONSTRAINT "customer_addresses_customer_id_office_id_fkey" FOREIGN KEY ("customer_id", "office_id") REFERENCES "customers"("id", "office_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_office_id_fkey" FOREIGN KEY ("office_id") REFERENCES "offices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_office_id_fkey" FOREIGN KEY ("office_id") REFERENCES "offices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_customer_id_office_id_fkey" FOREIGN KEY ("customer_id", "office_id") REFERENCES "customers"("id", "office_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "processes" ADD CONSTRAINT "processes_office_id_fkey" FOREIGN KEY ("office_id") REFERENCES "offices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "processes" ADD CONSTRAINT "processes_customer_id_office_id_fkey" FOREIGN KEY ("customer_id", "office_id") REFERENCES "customers"("id", "office_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progresses" ADD CONSTRAINT "progresses_office_id_fkey" FOREIGN KEY ("office_id") REFERENCES "offices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progresses" ADD CONSTRAINT "progresses_process_id_office_id_fkey" FOREIGN KEY ("process_id", "office_id") REFERENCES "processes"("id", "office_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agents" ADD CONSTRAINT "agents_office_id_fkey" FOREIGN KEY ("office_id") REFERENCES "offices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chats" ADD CONSTRAINT "chats_office_id_fkey" FOREIGN KEY ("office_id") REFERENCES "offices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chats" ADD CONSTRAINT "chats_user_id_office_id_fkey" FOREIGN KEY ("user_id", "office_id") REFERENCES "office_members"("user_id", "office_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chats" ADD CONSTRAINT "chats_agent_id_office_id_fkey" FOREIGN KEY ("agent_id", "office_id") REFERENCES "agents"("id", "office_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chats" ADD CONSTRAINT "chats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chats" ADD CONSTRAINT "chats_lead_id_office_id_fkey" FOREIGN KEY ("lead_id", "office_id") REFERENCES "leads"("id", "office_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chats" ADD CONSTRAINT "chats_customer_id_office_id_fkey" FOREIGN KEY ("customer_id", "office_id") REFERENCES "customers"("id", "office_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_office_id_fkey" FOREIGN KEY ("office_id") REFERENCES "offices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_chat_id_office_id_fkey" FOREIGN KEY ("chat_id", "office_id") REFERENCES "chats"("id", "office_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_lead_id_office_id_fkey" FOREIGN KEY ("lead_id", "office_id") REFERENCES "leads"("id", "office_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_customer_id_office_id_fkey" FOREIGN KEY ("customer_id", "office_id") REFERENCES "customers"("id", "office_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_agent_id_office_id_fkey" FOREIGN KEY ("agent_id", "office_id") REFERENCES "agents"("id", "office_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marks" ADD CONSTRAINT "marks_office_id_fkey" FOREIGN KEY ("office_id") REFERENCES "offices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marks" ADD CONSTRAINT "marks_user_id_office_id_fkey" FOREIGN KEY ("user_id", "office_id") REFERENCES "office_members"("user_id", "office_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marks" ADD CONSTRAINT "marks_chat_id_office_id_fkey" FOREIGN KEY ("chat_id", "office_id") REFERENCES "chats"("id", "office_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marks" ADD CONSTRAINT "marks_lead_id_office_id_fkey" FOREIGN KEY ("lead_id", "office_id") REFERENCES "leads"("id", "office_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marks" ADD CONSTRAINT "marks_customer_id_office_id_fkey" FOREIGN KEY ("customer_id", "office_id") REFERENCES "customers"("id", "office_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marks" ADD CONSTRAINT "marks_agent_id_office_id_fkey" FOREIGN KEY ("agent_id", "office_id") REFERENCES "agents"("id", "office_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marks" ADD CONSTRAINT "marks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendars" ADD CONSTRAINT "calendars_office_id_fkey" FOREIGN KEY ("office_id") REFERENCES "offices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendars" ADD CONSTRAINT "calendars_user_id_office_id_fkey" FOREIGN KEY ("user_id", "office_id") REFERENCES "office_members"("user_id", "office_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendars" ADD CONSTRAINT "calendars_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_available_days" ADD CONSTRAINT "calendar_available_days_calendar_id_fkey" FOREIGN KEY ("calendar_id") REFERENCES "calendars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_office_id_fkey" FOREIGN KEY ("office_id") REFERENCES "offices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_calendar_id_office_id_fkey" FOREIGN KEY ("calendar_id", "office_id") REFERENCES "calendars"("id", "office_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_lead_id_office_id_fkey" FOREIGN KEY ("lead_id", "office_id") REFERENCES "leads"("id", "office_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_customer_id_office_id_fkey" FOREIGN KEY ("customer_id", "office_id") REFERENCES "customers"("id", "office_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_process_id_office_id_fkey" FOREIGN KEY ("process_id", "office_id") REFERENCES "processes"("id", "office_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_progress_id_office_id_fkey" FOREIGN KEY ("progress_id", "office_id") REFERENCES "progresses"("id", "office_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_office_id_fkey" FOREIGN KEY ("office_id") REFERENCES "offices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_user_id_office_id_fkey" FOREIGN KEY ("user_id", "office_id") REFERENCES "office_members"("user_id", "office_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_event_id_office_id_fkey" FOREIGN KEY ("event_id", "office_id") REFERENCES "events"("id", "office_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_lead_id_office_id_fkey" FOREIGN KEY ("lead_id", "office_id") REFERENCES "leads"("id", "office_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_customer_id_office_id_fkey" FOREIGN KEY ("customer_id", "office_id") REFERENCES "customers"("id", "office_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_process_id_office_id_fkey" FOREIGN KEY ("process_id", "office_id") REFERENCES "processes"("id", "office_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folders" ADD CONSTRAINT "folders_office_id_fkey" FOREIGN KEY ("office_id") REFERENCES "offices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folders" ADD CONSTRAINT "folders_customer_id_office_id_fkey" FOREIGN KEY ("customer_id", "office_id") REFERENCES "customers"("id", "office_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_office_id_fkey" FOREIGN KEY ("office_id") REFERENCES "offices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_folder_id_office_id_fkey" FOREIGN KEY ("folder_id", "office_id") REFERENCES "folders"("id", "office_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_lead_id_office_id_fkey" FOREIGN KEY ("lead_id", "office_id") REFERENCES "leads"("id", "office_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_customer_id_office_id_fkey" FOREIGN KEY ("customer_id", "office_id") REFERENCES "customers"("id", "office_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_process_id_office_id_fkey" FOREIGN KEY ("process_id", "office_id") REFERENCES "processes"("id", "office_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_progress_id_office_id_fkey" FOREIGN KEY ("progress_id", "office_id") REFERENCES "progresses"("id", "office_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_chat_id_office_id_fkey" FOREIGN KEY ("chat_id", "office_id") REFERENCES "chats"("id", "office_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_message_id_office_id_fkey" FOREIGN KEY ("message_id", "office_id") REFERENCES "messages"("id", "office_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_event_id_office_id_fkey" FOREIGN KEY ("event_id", "office_id") REFERENCES "events"("id", "office_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_office_id_fkey" FOREIGN KEY ("office_id") REFERENCES "offices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_office_id_fkey" FOREIGN KEY ("office_id") REFERENCES "offices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_office_id_fkey" FOREIGN KEY ("office_id") REFERENCES "offices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settings" ADD CONSTRAINT "settings_office_id_fkey" FOREIGN KEY ("office_id") REFERENCES "offices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_office_id_fkey" FOREIGN KEY ("office_id") REFERENCES "offices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_office_id_fkey" FOREIGN KEY ("user_id", "office_id") REFERENCES "office_members"("user_id", "office_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connections" ADD CONSTRAINT "connections_office_id_fkey" FOREIGN KEY ("office_id") REFERENCES "offices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

