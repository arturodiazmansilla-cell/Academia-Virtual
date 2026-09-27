// Tipos generados manualmente. Cuando se agreguen más tablas (activities,
// progress, etc.), regenerar con:
// npx supabase gen types typescript --project-id TU-PROYECTO > src/shared/types/database.types.ts

export type UserRole = "admin" | "instructor" | "alumno";
export type ProfileStatus = "activo" | "suspendido";
export type CourseStatus = "borrador" | "en_revision" | "publicado" | "rechazado";

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  status: ProfileStatus;
  created_at: string;
}

export interface Course {
  id: string;
  title: string;
  description: string | null;
  subject: string;
  level: string | null;
  instructor_id: string | null;
  status: CourseStatus;
  created_at: string;
  updated_at: string;
}

export interface CourseTopic {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  order_index: number;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at"> & { created_at?: string };
        Update: Partial<Omit<Profile, "id">>;
      };
      courses: {
        Row: Course;
        Insert: Omit<Course, "id" | "created_at" | "updated_at" | "status"> & {
          id?: string;
          status?: CourseStatus;
        };
        Update: Partial<Omit<Course, "id">>;
      };
      course_topics: {
        Row: CourseTopic;
        Insert: Omit<CourseTopic, "id" | "created_at"> & { id?: string };
        Update: Partial<Omit<CourseTopic, "id" | "course_id">>;
      };
    };
  };
}
