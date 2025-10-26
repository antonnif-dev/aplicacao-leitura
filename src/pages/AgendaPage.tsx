import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';

// Tipagem Tarefa (ajuste conforme src/types)
interface Tarefa {
  id: number;
  titulo: string;
  descricao?: string | null;
  prazo?: string | null; // Essencial para a agenda
  status: 'pendente' | 'em andamento' | 'concluida';
  materiaId: number;
  user_id: string;
  created_at: string;
}

// Componentes UI e Ícones
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft, CalendarX2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge'; // Para status

// Função para formatar apenas a data (DD/MM/AAAA)
const formatarApenasData = (isoString: string | null | undefined): string | null => {
  if (!isoString) return null;
  try {
    const data = new Date(isoString);
    return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch (e) { return null; }
};

// Função para formatar apenas o horário (HH:MM)
const formatarApenasHorario = (isoString: string | null | undefined): string | null => {
  if (!isoString) return null;
  try {
    const data = new Date(isoString);
    return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch (e) { return null; }
};

// Agrupa tarefas por data
interface TarefasAgrupadas {
  [data: string]: Tarefa[];
}

export function AgendaPage() {
  const { user } = useAuth(); // Se precisar filtrar no frontend (mas o backend já faz)
  const [tarefasComPrazo, setTarefasComPrazo] = useState<Tarefa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTarefas = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.get<Tarefa[]>('/tarefas');
        // Filtra apenas tarefas que têm prazo e ordena por prazo
        const filtradasOrdenadas = response.data
          .filter(t => t.prazo) // Garante que há prazo
          .sort((a, b) => new Date(a.prazo!).getTime() - new Date(b.prazo!).getTime()); // Ordena pela data do prazo
        setTarefasComPrazo(filtradasOrdenadas);
      } catch (err: any) {
        console.error("Erro ao buscar tarefas para agenda:", err);
        setError('Falha ao carregar a agenda.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchTarefas();
  }, []);

  // Agrupa as tarefas por data formatada (DD/MM/AAAA)
  const tarefasAgrupadas = tarefasComPrazo.reduce((acc, tarefa) => {
    const dataFormatada = formatarApenasData(tarefa.prazo);
    if (dataFormatada) {
      if (!acc[dataFormatada]) {
        acc[dataFormatada] = [];
      }
      acc[dataFormatada].push(tarefa);
    }
    return acc;
  }, {} as TarefasAgrupadas);

  // Pega as datas ordenadas
  const datasOrdenadas = Object.keys(tarefasAgrupadas).sort((a, b) => {
      // Converte DD/MM/AAAA para AAAA-MM-DD para ordenar corretamente
      const [dayA, monthA, yearA] = a.split('/');
      const [dayB, monthB, yearB] = b.split('/');
      return new Date(`${yearA}-${monthA}-${dayA}`).getTime() - new Date(`${yearB}-${monthB}-${dayB}`).getTime();
  });


  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return <div className="text-destructive text-center mt-10 p-4">{error}</div>;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 pb-20 sm:pb-24"> {/* Padding inferior */}
      <header className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">Agenda de Tarefas</h1>
        <p className="text-muted-foreground">Tarefas com prazo definido.</p>
      </header>

      {datasOrdenadas.length === 0 ? (
         <div className="text-center text-muted-foreground mt-10">
            <CalendarX2 className="h-12 w-12 mx-auto mb-4"/>
            <p>Nenhuma tarefa com prazo encontrada.</p>
         </div>
      ) : (
        <div className="space-y-6">
          {datasOrdenadas.map((data) => (
            <div key={data}>
              <h2 className="text-lg font-semibold mb-3 border-b pb-1">{data}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {tarefasAgrupadas[data].map((tarefa) => (
                  <Card key={tarefa.id} className="shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium truncate">{tarefa.titulo}</CardTitle>
                      {/* Badge com o Horário */}
                      <Badge variant="secondary" className="text-xs">
                        {formatarApenasHorario(tarefa.prazo)}
                      </Badge>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground line-clamp-3">
                        {tarefa.descricao || 'Sem descrição'}
                      </p>
                      {/* Link para a matéria (opcional) */}
                       <Link
                          to={`/materias/${tarefa.materiaId}`}
                          className="text-xs text-blue-600 hover:underline mt-2 block"
                        >
                          Ver Matéria &rarr;
                        </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
        {/* Adiciona o footer de navegação aqui também */}
       <footer className="fixed bottom-0 left-0 right-0 bg-background border-t p-1 sm:p-2 z-50">
           <nav className="container mx-auto flex justify-around items-center h-14 sm:h-16">
               {/* (Cole os botões da barra de navegação aqui) */}
               <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className={`...`}>...</Button>
               <Button variant="ghost" size="sm" onClick={() => navigate('/agenda')} className={`...`}>...</Button>
               <Button variant="ghost" size="sm" onClick={() => navigate('/ajustes')} className={`...`}>...</Button>
           </nav>
       </footer>
    </div>
  );
}