export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            users: {
                Row: {
                    id: string
                    email: string
                    name: string
                    avatar_url: string | null
                    provider: 'kakao' | 'google'
                    is_premium: boolean
                    premium_plan: 'monthly' | 'yearly' | null
                    premium_started_at: string | null
                    premium_expires_at: string | null
                    google_calendar_connected: boolean
                    google_refresh_token: string | null
                    notification_email: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    email: string
                    name: string
                    avatar_url?: string | null
                    provider: 'kakao' | 'google'
                    is_premium?: boolean
                    premium_plan?: 'monthly' | 'yearly' | null
                    premium_started_at?: string | null
                    premium_expires_at?: string | null
                    google_calendar_connected?: boolean
                    google_refresh_token?: string | null
                    notification_email?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    email?: string
                    name?: string
                    avatar_url?: string | null
                    provider?: 'kakao' | 'google'
                    is_premium?: boolean
                    premium_plan?: 'monthly' | 'yearly' | null
                    premium_started_at?: string | null
                    premium_expires_at?: string | null
                    google_calendar_connected?: boolean
                    google_refresh_token?: string | null
                    notification_email?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
            campaigns: {
                Row: {
                    id: string
                    source: 'reviewnote' | 'revu' | 'dinnerqueen' | 'gangnam' | 'reviewplace'
                    source_id: string
                    source_url: string
                    title: string
                    description: string | null
                    thumbnail_url: string | null
                    category: string
                    region: string
                    type: 'visit' | 'delivery' | 'reporter'
                    reward: string
                    reward_value: number | null
                    capacity: number
                    application_deadline: string
                    review_deadline_days: number | null
                    is_active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    source: 'reviewnote' | 'revu' | 'dinnerqueen' | 'gangnam' | 'reviewplace'
                    source_id: string
                    source_url: string
                    title: string
                    description?: string | null
                    thumbnail_url?: string | null
                    category: string
                    region: string
                    type: 'visit' | 'delivery' | 'reporter'
                    reward: string
                    reward_value?: number | null
                    capacity: number
                    application_deadline: string
                    review_deadline_days?: number | null
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    source?: 'reviewnote' | 'revu' | 'dinnerqueen' | 'gangnam' | 'reviewplace'
                    source_id?: string
                    source_url?: string
                    title?: string
                    description?: string | null
                    thumbnail_url?: string | null
                    category?: string
                    region?: string
                    type?: 'visit' | 'delivery' | 'reporter'
                    reward?: string
                    reward_value?: number | null
                    capacity?: number
                    application_deadline?: string
                    review_deadline_days?: number | null
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
            applications: {
                Row: {
                    id: string
                    user_id: string
                    campaign_id: string
                    status: 'applied' | 'selected' | 'completed' | 'cancelled'
                    visit_date: string | null
                    review_deadline: string | null
                    calendar_visit_event_id: string | null
                    calendar_deadline_event_id: string | null
                    reminder_d3_sent: boolean
                    reminder_d1_sent: boolean
                    notes: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    campaign_id: string
                    status?: 'applied' | 'selected' | 'completed' | 'cancelled'
                    visit_date?: string | null
                    review_deadline?: string | null
                    calendar_visit_event_id?: string | null
                    calendar_deadline_event_id?: string | null
                    reminder_d3_sent?: boolean
                    reminder_d1_sent?: boolean
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    campaign_id?: string
                    status?: 'applied' | 'selected' | 'completed' | 'cancelled'
                    visit_date?: string | null
                    review_deadline?: string | null
                    calendar_visit_event_id?: string | null
                    calendar_deadline_event_id?: string | null
                    reminder_d3_sent?: boolean
                    reminder_d1_sent?: boolean
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            payments: {
                Row: {
                    id: string
                    user_id: string
                    plan: 'monthly' | 'yearly'
                    amount: number
                    payment_key: string
                    status: 'pending' | 'completed' | 'cancelled' | 'refunded'
                    paid_at: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    plan: 'monthly' | 'yearly'
                    amount: number
                    payment_key: string
                    status?: 'pending' | 'completed' | 'cancelled' | 'refunded'
                    paid_at?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    plan?: 'monthly' | 'yearly'
                    amount?: number
                    payment_key?: string
                    status?: 'pending' | 'completed' | 'cancelled' | 'refunded'
                    paid_at?: string | null
                    created_at?: string
                }
            }
            inquiries: {
                Row: {
                    id: string
                    user_id: string | null
                    name: string
                    email: string
                    phone: string | null
                    inquiry_type: 'general' | 'technical' | 'partnership' | 'program_request' | 'other'
                    subject: string
                    content: string
                    attachment_url: string | null
                    attachment_filename: string | null
                    status: 'pending' | 'in_progress' | 'completed'
                    admin_response: string | null
                    admin_response_at: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id?: string | null
                    name: string
                    email: string
                    phone?: string | null
                    inquiry_type: 'general' | 'technical' | 'partnership' | 'program_request' | 'other'
                    subject: string
                    content: string
                    attachment_url?: string | null
                    attachment_filename?: string | null
                    status?: 'pending' | 'in_progress' | 'completed'
                    admin_response?: string | null
                    admin_response_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string | null
                    name?: string
                    email?: string
                    phone?: string | null
                    inquiry_type?: 'general' | 'technical' | 'partnership' | 'program_request' | 'other'
                    subject?: string
                    content?: string
                    attachment_url?: string | null
                    attachment_filename?: string | null
                    status?: 'pending' | 'in_progress' | 'completed'
                    admin_response?: string | null
                    admin_response_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
        }
    }
}
