export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User
        Insert: InsertUser
        Update: UpdateUser
        Relationships: []
      }
      jobs: {
        Row: Job
        Insert: InsertJob
        Update: UpdateJob
        Relationships: []
      }
      acceptances: {
        Row: Acceptance
        Insert: InsertAcceptance
        Update: UpdateAcceptance
        Relationships: []
      }
    }
    Views: {},
    Functions: {},
  }
}

export type UserRole = 'uploader' | 'searcher' | 'both'
export type WorkType = 'onsite' | 'remote' | 'hybrid'
export type JobStatus = 'open' | 'accepted' | 'completed' | 'cancelled'

export interface User {
  id: string
  display_name: string | null
  role: UserRole
  location: unknown | null
  city: string | null
  region: string | null
  phone: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface InsertUser {
  id: string
  display_name?: string | null
  role?: UserRole
  location?: unknown | null
  city?: string | null
  region?: string | null
  phone?: string | null
  avatar_url?: string | null
}

export interface UpdateUser {
  display_name?: string | null
  role?: UserRole
  location?: unknown | null
  city?: string | null
  region?: string | null
  phone?: string | null
  avatar_url?: string | null
}

export interface Job {
  id: string
  uploader_id: string
  title: string
  description: string | null
  work_type: WorkType
  location: unknown | null
  lat: number | null
  lng: number | null
  address: string | null
  city: string | null
  region: string | null
  status: JobStatus
  price: number | null
  image_urls: string[] | null
  created_at: string
  updated_at: string
}

export interface InsertJob {
  uploader_id: string
  title: string
  description?: string | null
  work_type?: WorkType
  location?: unknown | null
  lat?: number | null
  lng?: number | null
  address?: string | null
  city?: string | null
  region?: string | null
  price?: number | null
  image_urls?: string[] | null
}

export interface UpdateJob {
  title?: string
  description?: string | null
  work_type?: WorkType
  location?: unknown | null
  lat?: number | null
  lng?: number | null
  address?: string | null
  city?: string | null
  region?: string | null
  status?: JobStatus
  price?: number | null
  image_urls?: string[] | null
}

export interface Acceptance {
  id: string
  job_id: string
  searcher_id: string
  created_at: string
}

export interface InsertAcceptance {
  job_id: string
  searcher_id: string
}

export interface UpdateAcceptance {
  job_id?: string
  searcher_id?: string
}
