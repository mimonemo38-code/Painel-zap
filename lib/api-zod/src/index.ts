import { z } from 'zod'

export const MessageSchema = z.object({
  id: z.number(),
  text: z.string(),
  timestamp: z.string().datetime()
})

export const CreateMessageSchema = z.object({
  text: z.string().min(1)
})

export const StatusSchema = z.object({
  api: z.string(),
  version: z.string(),
  uptime: z.number(),
  dashboard: z.string().url()
})

export type Message = z.infer<typeof MessageSchema>
export type CreateMessage = z.infer<typeof CreateMessageSchema>
export type Status = z.infer<typeof StatusSchema>
