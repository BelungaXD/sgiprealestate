export type IntegrationCategory = 'crm' | 'messaging' | 'parsers' | 'ai' | 'email'

export type IntegrationFieldType = 'secret' | 'url' | 'text'

export type IntegrationDefinition = {
  key: string
  envVar: string
  category: IntegrationCategory
  labelKey: string
  descriptionKey: string
  fieldType: IntegrationFieldType
  optional?: boolean
}

export const INTEGRATION_DEFINITIONS: IntegrationDefinition[] = [
  {
    key: 'crm_api_url',
    envVar: 'CRM_API_URL',
    category: 'crm',
    labelKey: 'integrations.items.crm_api_url.label',
    descriptionKey: 'integrations.items.crm_api_url.description',
    fieldType: 'url',
  },
  {
    key: 'crm_api_key',
    envVar: 'CRM_API_KEY',
    category: 'crm',
    labelKey: 'integrations.items.crm_api_key.label',
    descriptionKey: 'integrations.items.crm_api_key.description',
    fieldType: 'secret',
  },
  {
    key: 'whatsapp_bot_token',
    envVar: 'WHATSAPP_BOT_TOKEN',
    category: 'messaging',
    labelKey: 'integrations.items.whatsapp_bot_token.label',
    descriptionKey: 'integrations.items.whatsapp_bot_token.description',
    fieldType: 'secret',
  },
  {
    key: 'whatsapp_phone_number_id',
    envVar: 'WHATSAPP_PHONE_NUMBER_ID',
    category: 'messaging',
    labelKey: 'integrations.items.whatsapp_phone_number_id.label',
    descriptionKey: 'integrations.items.whatsapp_phone_number_id.description',
    fieldType: 'text',
    optional: true,
  },
  {
    key: 'sms_gateway_url',
    envVar: 'SMS_GATEWAY_URL',
    category: 'messaging',
    labelKey: 'integrations.items.sms_gateway_url.label',
    descriptionKey: 'integrations.items.sms_gateway_url.description',
    fieldType: 'url',
    optional: true,
  },
  {
    key: 'sms_gateway_api_key',
    envVar: 'SMS_GATEWAY_API_KEY',
    category: 'messaging',
    labelKey: 'integrations.items.sms_gateway_api_key.label',
    descriptionKey: 'integrations.items.sms_gateway_api_key.description',
    fieldType: 'secret',
    optional: true,
  },
  {
    key: 'sms_lead_notify_enabled',
    envVar: 'SMS_LEAD_NOTIFY_ENABLED',
    category: 'messaging',
    labelKey: 'integrations.items.sms_lead_notify_enabled.label',
    descriptionKey: 'integrations.items.sms_lead_notify_enabled.description',
    fieldType: 'text',
    optional: true,
  },
  {
    key: 'property_parser_api_url',
    envVar: 'PROPERTY_PARSER_API_URL',
    category: 'parsers',
    labelKey: 'integrations.items.property_parser_api_url.label',
    descriptionKey: 'integrations.items.property_parser_api_url.description',
    fieldType: 'url',
    optional: true,
  },
  {
    key: 'property_parser_api_key',
    envVar: 'PROPERTY_PARSER_API_KEY',
    category: 'parsers',
    labelKey: 'integrations.items.property_parser_api_key.label',
    descriptionKey: 'integrations.items.property_parser_api_key.description',
    fieldType: 'secret',
    optional: true,
  },
  {
    key: 'gemini_api_key',
    envVar: 'GEMINI_API_KEY',
    category: 'ai',
    labelKey: 'integrations.items.gemini_api_key.label',
    descriptionKey: 'integrations.items.gemini_api_key.description',
    fieldType: 'secret',
    optional: true,
  },
  {
    key: 'resend_api_key',
    envVar: 'RESEND_API_KEY',
    category: 'email',
    labelKey: 'integrations.items.resend_api_key.label',
    descriptionKey: 'integrations.items.resend_api_key.description',
    fieldType: 'secret',
    optional: true,
  },
  {
    key: 'email_from',
    envVar: 'EMAIL_FROM',
    category: 'email',
    labelKey: 'integrations.items.email_from.label',
    descriptionKey: 'integrations.items.email_from.description',
    fieldType: 'text',
    optional: true,
  },
]

export const INTEGRATION_DEFINITION_BY_KEY = new Map(
  INTEGRATION_DEFINITIONS.map((d) => [d.key, d])
)

export const INTEGRATION_CATEGORIES: IntegrationCategory[] = [
  'crm',
  'messaging',
  'parsers',
  'ai',
  'email',
]
