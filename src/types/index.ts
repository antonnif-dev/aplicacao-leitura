export interface Tarefa {
  id: number;
  titulo: string;
  descricao?: string | null;
  prazo?: string | null;
  status: 'pendente' | 'em andamento' | 'concluida';
  materiaId: number;
  user_id: string;
  created_at: string;
}

export interface Materia {
  id: number;
  titulo: string;
  descricao?: string | null;
  tipo?: string | null;
  prazo?: string | null;
  user_id: string;
  status: 'em andamento' | 'finalizado';
  created_at: string;
}