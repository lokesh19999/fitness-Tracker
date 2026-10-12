export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type MeasurementSource = 'calculated' | 'manual'
export type SessionStatus = 'planned' | 'completed' | 'skipped'
export type RoadmapStatus = 'not_started' | 'in_progress' | 'completed'

export interface Database {
  public: {
    Tables: {
      fitness_settings: {
        Row: {
          id: string
          user_id: string
          programme_start_date: string
          starting_weight_kg: number | null
          starting_waist_cm: number | null
          target_calories: number
          target_protein_g: number
          target_carbs_g: number
          target_fat_g: number
          target_water_l: number
          target_steps: number
          target_sleep_hours: number
          goals: string | null
          units: 'metric' | 'imperial'
          theme: 'light' | 'dark' | 'system'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          programme_start_date?: string
          starting_weight_kg?: number | null
          starting_waist_cm?: number | null
          target_calories?: number
          target_protein_g?: number
          target_carbs_g?: number
          target_fat_g?: number
          target_water_l?: number
          target_steps?: number
          target_sleep_hours?: number
          goals?: string | null
          units?: 'metric' | 'imperial'
          theme?: 'light' | 'dark' | 'system'
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['fitness_settings']['Insert']>
        Relationships: []
      }
      daily_logs: {
        Row: {
          id: string
          user_id: string
          log_date: string
          day_name: string | null
          morning_weight_kg: number | null
          calories: number | null
          protein_g: number | null
          carbs_g: number | null
          fat_g: number | null
          steps: number | null
          workout_completed: boolean
          water_l: number | null
          sleep_hours: number | null
          energy_rating: number | null
          face_skin_rating: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          log_date: string
          day_name?: string | null
          morning_weight_kg?: number | null
          calories?: number | null
          protein_g?: number | null
          carbs_g?: number | null
          fat_g?: number | null
          steps?: number | null
          workout_completed?: boolean
          water_l?: number | null
          sleep_hours?: number | null
          energy_rating?: number | null
          face_skin_rating?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['daily_logs']['Insert']>
        Relationships: []
      }
      weekly_progress: {
        Row: {
          id: string
          user_id: string
          week_number: number
          week_start: string
          avg_weight_kg: number | null
          waist_cm: number | null
          hip_cm: number | null
          hip_thrust_kg: number | null
          core_benchmark: string | null
          avg_daily_steps: number | null
          workouts_completed: number | null
          workouts_planned: number | null
          nutrition_adherence_pct: number | null
          avg_sleep_hours: number | null
          energy_face_rating: number | null
          manual_fields: string[]
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          week_number: number
          week_start: string
          avg_weight_kg?: number | null
          waist_cm?: number | null
          hip_cm?: number | null
          hip_thrust_kg?: number | null
          core_benchmark?: string | null
          avg_daily_steps?: number | null
          workouts_completed?: number | null
          workouts_planned?: number | null
          nutrition_adherence_pct?: number | null
          avg_sleep_hours?: number | null
          energy_face_rating?: number | null
          manual_fields?: string[]
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['weekly_progress']['Insert']>
        Relationships: []
      }
      workout_templates: {
        Row: {
          id: string
          user_id: string
          name: string
          day_of_week: number
          session_label: string
          focus: string | null
          is_rest: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          day_of_week: number
          session_label: string
          focus?: string | null
          is_rest?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['workout_templates']['Insert']>
        Relationships: []
      }
      workout_template_exercises: {
        Row: {
          id: string
          user_id: string
          template_id: string
          exercise_name: string
          default_sets: number
          default_reps: string | null
          target_rir: number | null
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          template_id: string
          exercise_name: string
          default_sets?: number
          default_reps?: string | null
          target_rir?: number | null
          sort_order?: number
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['workout_template_exercises']['Insert']>
        Relationships: []
      }
      workout_sessions: {
        Row: {
          id: string
          user_id: string
          session_date: string
          week_number: number | null
          session_label: string
          focus: string | null
          status: SessionStatus
          technique_notes: string | null
          symptoms: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          session_date: string
          week_number?: number | null
          session_label: string
          focus?: string | null
          status?: SessionStatus
          technique_notes?: string | null
          symptoms?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['workout_sessions']['Insert']>
        Relationships: []
      }
      workout_exercises: {
        Row: {
          id: string
          user_id: string
          session_id: string
          exercise_name: string
          sort_order: number
          rir: number | null
          technique_notes: string | null
          symptoms: string | null
          completed: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          session_id: string
          exercise_name: string
          sort_order?: number
          rir?: number | null
          technique_notes?: string | null
          symptoms?: string | null
          completed?: boolean
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['workout_exercises']['Insert']>
        Relationships: []
      }
      workout_sets: {
        Row: {
          id: string
          user_id: string
          workout_exercise_id: string
          set_number: number
          weight_kg: number | null
          reps: number | null
          completed: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          workout_exercise_id: string
          set_number: number
          weight_kg?: number | null
          reps?: number | null
          completed?: boolean
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['workout_sets']['Insert']>
        Relationships: []
      }
      meal_entries: {
        Row: {
          id: string
          user_id: string
          log_date: string
          meal_type: string
          food: string
          portion: string | null
          calories: number | null
          protein_g: number | null
          carbs_g: number | null
          fat_g: number | null
          water_l: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          log_date: string
          meal_type: string
          food: string
          portion?: string | null
          calories?: number | null
          protein_g?: number | null
          carbs_g?: number | null
          fat_g?: number | null
          water_l?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['meal_entries']['Insert']>
        Relationships: []
      }
      body_measurements: {
        Row: {
          id: string
          user_id: string
          measured_on: string
          weight_kg: number | null
          waist_cm: number | null
          hip_cm: number | null
          chest_cm: number | null
          thigh_cm: number | null
          arm_cm: number | null
          notes: string | null
          photo_path: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          measured_on: string
          weight_kg?: number | null
          waist_cm?: number | null
          hip_cm?: number | null
          chest_cm?: number | null
          thigh_cm?: number | null
          arm_cm?: number | null
          notes?: string | null
          photo_path?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['body_measurements']['Insert']>
        Relationships: []
      }
      roadmap_weeks: {
        Row: {
          id: string
          user_id: string
          week_number: number
          focus: string | null
          training_goals: string | null
          nutrition_goals: string | null
          review_checkpoint: string | null
          status: RoadmapStatus
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          week_number: number
          focus?: string | null
          training_goals?: string | null
          nutrition_goals?: string | null
          review_checkpoint?: string | null
          status?: RoadmapStatus
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['roadmap_weeks']['Insert']>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

type PublicSchema = Database['public']
export type Tables<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Row']
export type TablesInsert<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Update']