import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';

// Tipagem Tarefa
interface Tarefa {
  id: number;
  titulo: string;
  descricao?: string | null;
  prazo?: string | null;
  status: 'pendente' | 'em andamento' | 'concluida';
  materiaId: number;
  user_id: string;
  created_at: string;
}

// Interface para agrupar tarefas (precisa estar fora ou antes de ser usada)
interface TarefasAgrupadas {
  [data: string]: Tarefa[];
}

// Componentes UI e Ícones
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CalendarX2, XCircle } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, CalendarDays, Settings } from 'lucide-react';

// Funções de formatação de data
const formatarApenasData = (isoString: string | null | undefined): string | null => {
  if (!isoString) return null;
  try {
    const data = new Date(isoString);
    if (isNaN(data.getTime())) return null;
    return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch (e) {
    console.error("Erro ao formatar data:", e);
    return null;
  }
};

// *** CORREÇÃO: Corpo da função formatarApenasHorario ***
const formatarApenasHorario = (isoString: string | null | undefined): string | null => {
  if (!isoString) return null;
  try {
    const data = new Date(isoString);
    if (isNaN(data.getTime())) return null;
    // *** CORREÇÃO: Usa toLocaleTimeString ***
    return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    console.error("Erro ao formatar horário:", e);
    return null;
  }
};

const formatarParaYYYYMMDD = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export function AgendaPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const {} = useAuth(); // Apenas para garantir que o usuário está logado via ProtectedRoute
  const [tarefasComPrazo, setTarefasComPrazo] = useState<Tarefa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [daysWithTasks, setDaysWithTasks] = useState<Date[]>([]);

  useEffect(() => {
    const fetchTarefas = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.get<Tarefa[]>('/tarefas');
        const filtradas = response.data.filter(t => t.prazo);

        const datesSet = new Set<string>();
        filtradas.forEach(t => {
            try {
                const taskDate = new Date(t.prazo!);
                taskDate.setHours(0, 0, 0, 0);
                datesSet.add(formatarParaYYYYMMDD(taskDate));
            } catch {}
        });
        setDaysWithTasks(Array.from(datesSet).map(dateStr => new Date(dateStr + 'T12:00:00.000Z')));

        filtradas.sort((a, b) => new Date(a.prazo!).getTime() - new Date(b.prazo!).getTime());
        setTarefasComPrazo(filtradas);

      } catch (err: any) {
        console.error("Erro ao buscar tarefas para agenda:", err);
        setError('Falha ao carregar a agenda.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchTarefas();
  }, []);

  // *** CORREÇÃO: Cálculos movidos para DENTRO do componente ***
  // Agrupa as tarefas por data formatada DD/MM/AAAA
  const tarefasAgrupadas = tarefasComPrazo.reduce((acc: TarefasAgrupadas, tarefa: Tarefa) => { // Tipos explícitos
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
  const datasOrdenadas = Object.keys(tarefasAgrupadas || {}).sort((a, b) => {
    const [dayA, monthA, yearA] = a.split('/');
    const [dayB, monthB, yearB] = b.split('/');
    const dateA = new Date(`${yearA}-${monthA}-${dayA}T12:00:00Z`);
    const dateB = new Date(`${yearB}-${monthB}-${dayB}T12:00:00Z`);
    // *** CORREÇÃO: Garante retorno numérico ***
    return dateA.getTime() - dateB.getTime();
  });

  // Filtra as datas/tarefas a serem exibidas na lista
  let datasParaExibir = datasOrdenadas;
  let tituloLista = "Próximas Tarefas";
  let mostrarBotaoLimpar = false;

  if (selectedDate) {
    const dataSelecionadaFormatada = selectedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    if (tarefasAgrupadas[dataSelecionadaFormatada]) {
      datasParaExibir = [dataSelecionadaFormatada];
      tituloLista = `Tarefas para ${dataSelecionadaFormatada}`;
      mostrarBotaoLimpar = true;
    } else {
      datasParaExibir = [];
      tituloLista = `Nenhuma tarefa para ${dataSelecionadaFormatada}`;
      mostrarBotaoLimpar = true;
    }
  }

  // Define as classes para marcar os dias no calendário
  const modifiers = { hasTasks: daysWithTasks };
  const modifiersClassNames = { hasTasks: 'day-with-tasks' };


  if (isLoading) { /* ... Loading ... */ }
  if (error) { /* ... Error ... */ }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 pb-20 sm:pb-24">
      <header className="mb-6 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold">Agenda</h1>
        <p className="text-muted-foreground">Visualize suas tarefas com prazo.</p>
      </header>

      {/* --- Calendário --- */}
      <div className="flex justify-center mb-8">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          className="rounded-md border shadow-sm w-full max-w-md"
          modifiers={modifiers}
          modifiersClassNames={modifiersClassNames}
        />
      </div>

       {/* --- Título Dinâmico da Lista e Botão Limpar --- */}
       <div className="flex items-center justify-between mb-4 border-b pb-2">
         <h2 className="text-lg font-semibold">{tituloLista}</h2>
         {mostrarBotaoLimpar && (
           <Button variant="ghost" size="sm" onClick={() => setSelectedDate(undefined)}>
             <XCircle className="h-4 w-4 mr-1 text-muted-foreground"/> Limpar Seleção
           </Button>
         )}
       </div>

      {/* --- Lista de Tarefas Filtrada --- */}
      {datasParaExibir.length === 0 && !isLoading ? (
         <div className="text-center text-muted-foreground mt-6">
            <CalendarX2 className="h-10 w-10 mx-auto mb-3"/>
             {selectedDate ? <p>Nenhuma tarefa agendada para este dia.</p> : <p>Nenhuma tarefa com prazo encontrada.</p>}
         </div>
      ) : (
        <div className="space-y-6">
          {/* *** CORREÇÃO: datasOrdenadas é usado aqui *** */}
          {datasParaExibir.map((data) => (
            <div key={data}>
              {!selectedDate && <h3 className="text-md font-medium mb-2">{data}</h3>}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                 {/* Adicionado '?' para segurança caso data seja inválida */}
                {tarefasAgrupadas[data]?.map((tarefa: Tarefa) => (
                  <Card key={tarefa.id} className="shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium truncate">{tarefa.titulo}</CardTitle>
                      <Badge variant="secondary" className="text-xs">
                        {formatarApenasHorario(tarefa.prazo)}
                      </Badge>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground line-clamp-3">
                        {tarefa.descricao || 'Sem descrição'}
                      </p>
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

      {/* --- Navegação Inferior --- */}
      <footer className="fixed bottom-0 left-0 right-0 bg-background border-t p-1 sm:p-2 z-50">
           <nav className="container mx-auto flex justify-around items-center h-14 sm:h-16">
               {/* Botão Dashboard */}
               <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className={`flex flex-col h-full justify-center px-2 py-1 ${location.pathname === '/dashboard' || location.pathname === '/' ? 'text-primary' : 'text-muted-foreground hover:text-foreground/80'}`} aria-current={location.pathname === '/dashboard' || location.pathname === '/' ? 'page' : undefined}>
                  <LayoutDashboard className="h-5 w-5 mb-0.5" />
                  <span className="text-[10px] sm:text-xs">Dashboard</span>
               </Button>
               {/* Botão Agenda */}
                <Button variant="ghost" size="sm" onClick={() => navigate('/agenda')} className={`flex flex-col h-full justify-center px-2 py-1 ${location.pathname.startsWith('/agenda') ? 'text-primary' : 'text-muted-foreground hover:text-foreground/80'}`} aria-current={location.pathname.startsWith('/agenda') ? 'page' : undefined}>
                  <CalendarDays className="h-5 w-5 mb-0.5" />
                  <span className="text-[10px] sm:text-xs">Agenda</span>
                </Button>
               {/* Botão Ajustes */}
               <Button variant="ghost" size="sm" onClick={() => navigate('/ajustes')} className={`flex flex-col h-full justify-center px-2 py-1 ${location.pathname.startsWith('/ajustes') ? 'text-primary' : 'text-muted-foreground hover:text-foreground/80'}`} aria-current={location.pathname.startsWith('/ajustes') ? 'page' : undefined}>
                  <Settings className="h-5 w-5 mb-0.5" />
                  <span className="text-[10px] sm:text-xs">Ajustes</span>
               </Button>
           </nav>
      </footer>
    </div>
  );
}