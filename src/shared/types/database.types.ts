// Tipos generados manualmente. Cuando se agreguen más tablas (activities,
// progress, etc.), regenerar con:
// npx supabase gen types typescript --project-id TU-PROYECTO > src/shared/types/database.types.ts

export type UserRole = "admin" | "instructor" | "alumno";
export type ProfileStatus = "activo" | "suspendido";
export type CourseStatus = "borrador" | "en_revision" | "publicado" | "rechazado";
export type GradeCategory = "primaria" | "secundaria" | "tecnico" | "avanzado";
export type EnrollmentRequestStatus = "pendiente" | "aprobado" | "rechazado";
export type TopicContentType = "video" | "word" | "powerpoint";
export type ConversionStatus = "pendiente" | "procesando" | "listo" | "error" | "no_aplica";

export type Profile = {
  id: string;
  full_name: string;
  role: UserRole;
  status: ProfileStatus;
  created_at: string;
};

export type Course = {
  id: string;
  title: string;
  description: string | null;
  subject: string;
  level: string | null;
  grade_category: GradeCategory | null;
  grade_number: number | null;
  instructor_id: string | null;
  status: CourseStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CourseTopic = {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  order_index: number;
  created_at: string;
};

// NUEVO: vinculación con el Sistema Académico del colegio
export type CursoVinculacion = {
  virtual_course_id: string;
  colegio_curso_id: string;
  colegio_curso_nombre: string;
  colegio_paralelo_id: string | null;
  colegio_paralelo_nombre: string;
  colegio_materia_id: string | null;
  colegio_materia_nombre: string;
  created_at: string;
  updated_at: string;
};

// NUEVO: módulo 4 (vista del alumno)
export type CourseEnrollment = {
  id: string;
  course_id: string;
  student_id: string;
  enrolled_at: string;
  is_active: boolean;
};

// NUEVO: módulo 6 (solicitudes de acceso con link/QR)
export type EnrollmentRequest = {
  id: string;
  course_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  status: EnrollmentRequestStatus;
  created_at: string;
  reviewed_at: string | null;
};

// NUEVO: módulo 3
export type TopicContent = {
  id: string;
  topic_id: string;
  content_type: TopicContentType;
  file_name: string;
  original_file_url: string;
  pdf_file_url: string | null;
  conversion_status: ConversionStatus;
  error_message: string | null;
  created_at: string;
  updated_at: string;
};

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at"> & { created_at?: string };
        Update: Partial<Omit<Profile, "id">>;
        Relationships: [];
      };
      courses: {
        Row: Course;
        Insert: Omit<Course, "id" | "created_at" | "updated_at" | "status" | "published_at"> & {
          id?: string;
          status?: CourseStatus;
          published_at?: string | null;
        };
        Update: Partial<Omit<Course, "id">>;
        Relationships: [];
      };
      course_topics: {
        Row: CourseTopic;
        Insert: Omit<CourseTopic, "id" | "created_at"> & { id?: string };
        Update: Partial<Omit<CourseTopic, "id" | "course_id">>;
        Relationships: [];
      };
      // NUEVO: módulo 4 (vista del alumno)
      course_enrollments: {
        Row: CourseEnrollment;
        Insert: Omit<CourseEnrollment, "id" | "enrolled_at"> & {
          id?: string;
          enrolled_at?: string;
        };
        Update: Partial<Omit<CourseEnrollment, "id">>;
        Relationships: [];
      };
      // NUEVO: módulo 6 (solicitudes de acceso con link/QR)
      enrollment_requests: {
        Row: EnrollmentRequest;
        Insert: Omit<EnrollmentRequest, "id" | "created_at" | "reviewed_at" | "status"> & {
          id?: string;
          created_at?: string;
          reviewed_at?: string | null;
          status?: EnrollmentRequestStatus;
        };
        Update: Partial<Omit<EnrollmentRequest, "id" | "course_id">>;
        Relationships: [];
      };
      // NUEVO: módulo 3
      topic_content: {
        Row: TopicContent;
        Insert: Omit<
          TopicContent,
          "id" | "created_at" | "updated_at" | "pdf_file_url" | "conversion_status" | "error_message"
        > & {
          id?: string;
          pdf_file_url?: string | null;
          conversion_status?: ConversionStatus;
          error_message?: string | null;
        };
        Update: Partial<Omit<TopicContent, "id" | "topic_id">>;
        Relationships: [];
      };
      // NUEVO: vinculación con el colegio
      curso_vinculaciones: {
        Row: CursoVinculacion;
        Insert: Omit<CursoVinculacion, "created_at" | "updated_at"> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<CursoVinculacion, "virtual_course_id">>;
        Relationships: [];
      };
    };
    // Requerido por @supabase/supabase-js >= 2.46 (igual que lo genera el CLI).
    // Sin esto, createClient<Database> no infiere las tablas y todo es `never`.
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
  };
}
