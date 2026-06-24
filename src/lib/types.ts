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
      applications: {
        Row: Application
        Insert: InsertApplication
        Update: UpdateApplication
        Relationships: []
      }
      reviews: {
        Row: Review
        Insert: InsertReview
        Update: UpdateReview
        Relationships: []
      }
    }
    Views: {},
    Functions: {},
  }
}

export type UserRole = 'uploader' | 'searcher' | 'both'
export type WorkType = 'onsite' | 'remote' | 'hybrid'
export type JobStatus = 'open' | 'full' | 'accepted' | 'completed' | 'cancelled'
export type ApplicationStatus = 'pending' | 'accepted' | 'rejected'
export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'permanent' | 'freelance' | 'internship' | 'temporary'
export type SalaryPeriod = 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly'

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
  vacancies: number
  created_at: string
  updated_at: string
  employment_type: EmploymentType | null
  salary_min: number | null
  salary_max: number | null
  salary_period: SalaryPeriod | null
  deleted: boolean
  category: string | null
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
  vacancies?: number
  employment_type?: EmploymentType | null
  salary_min?: number | null
  salary_max?: number | null
  salary_period?: SalaryPeriod | null
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
  vacancies?: number
  employment_type?: EmploymentType | null
  salary_min?: number | null
  salary_max?: number | null
  salary_period?: SalaryPeriod | null
}

export interface Application {
  id: string
  job_id: string
  searcher_id: string
  status: ApplicationStatus
  created_at: string
}

export interface InsertApplication {
  job_id: string
  searcher_id: string
  status?: ApplicationStatus
}

export interface UpdateApplication {
  status?: ApplicationStatus
}

export interface Review {
  id: string
  job_id: string
  reviewer_id: string
  reviewee_id: string
  rating: number
  comment: string | null
  created_at: string
}

export interface InsertReview {
  job_id: string
  reviewer_id: string
  reviewee_id: string
  rating: number
  comment?: string | null
}

export interface UpdateReview {
  rating?: number
  comment?: string | null
}
