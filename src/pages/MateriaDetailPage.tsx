import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
//import { useAuth } from '../hooks/useAuth';

interface Materia {
  id: number;
  titulo: string;
  descricao?: string | null;
  tipo?: string | null;
  prazo?: string | null;
  user_id: string;
  status: 'em andamento' | 'finalizado';
  created_at: string;
}

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

import { Button } from '@/components/ui/button';
//import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
//import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuGroup, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Para status
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, MoreVertical, Loader2, CalendarIcon, X, ArrowLeft, Check, Play, Square } from 'lucide-react'; // Ícones adicionados

// Função auxiliar para formatar datas (a mesma do Dashboard)
const formatarData = (isoString: string | null | undefined): string => {
  if (!isoString) return 'Sem prazo';
  try {
    const data = new Date(isoString);
    return data.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch (e) { return 'Data inválida'; }
};

// Mapeamento de status para ícone e cor (Tailwind)
const statusConfig: { [key: string]: { icon: React.ElementType, color: string, label: string } } = {
  'pendente': { icon: Square, color: 'text-gray-500', label: 'Pendente' },
  'em andamento': { icon: Play, color: 'text-blue-500 animate-pulse', label: 'Em Andamento' },
  'concluida': { icon: Check, color: 'text-green-500', label: 'Concluída' },
  'default': { icon: Square, color: 'text-gray-500', label: 'Pendente' }
};

export function MateriaDetailPage() {
  const { id: materiaIdParam } = useParams<{ id: string }>(); // Pega ID da URL
  const materiaId = Number(materiaIdParam); // Converte para número
  //const { user } = useAuth(); // Apenas para segurança extra, se necessário

  // Estados
  const [materia, setMateria] = useState<Materia | null>(null);
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados dos Modais de Tarefa
  const [isTarefaDialogOpen, setIsTarefaDialogOpen] = useState(false);
  const [currentTarefa, setCurrentTarefa] = useState<Tarefa | null>(null); // Para edição
  // Inputs controlados do formulário de Tarefa
  const [tarefaTitulo, setTarefaTitulo] = useState('');
  const [tarefaDescricao, setTarefaDescricao] = useState('');
  const [tarefaPrazo, setTarefaPrazo] = useState('');
  const [tarefaStatus, setTarefaStatus] = useState<'pendente' | 'em andamento' | 'concluida'>('pendente');


  // Função para buscar dados da Matéria e Tarefas
  const fetchData = async () => {
    if (!materiaId) {
      setError("ID da matéria inválido.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      // Busca a matéria específica
      const materiaResponse = await api.get<Materia>(`/materias/${materiaId}`);
      setMateria(materiaResponse.data);

      // Busca as tarefas daquela matéria
      const tarefasResponse = await api.get<Tarefa[]>(`/tarefas/materia/${materiaId}`);
      // Opcional: Ordenar tarefas por prazo ou status
      tarefasResponse.data.sort((a, b) => {
        // Exemplo: pendente primeiro, depois em andamento, depois concluída
        const statusOrder = { 'pendente': 1, 'em andamento': 2, 'concluida': 3 };
        return (statusOrder[a.status] || 4) - (statusOrder[b.status] || 4);
      });
      setTarefas(tarefasResponse.data);

    } catch (err: any) {
      console.error("Erro ao buscar dados:", err);
      setError('Falha ao carregar dados da matéria ou tarefas.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [materiaId]); // Rebusca se o ID mudar (embora improvável nesta página)

  // Limpa os inputs do formulário de Tarefa
  const resetTarefaForm = () => {
    setTarefaTitulo('');
    setTarefaDescricao('');
    setTarefaPrazo('');
    setTarefaStatus('pendente');
    setCurrentTarefa(null); // Limpa a tarefa em edição
  };

  // Funções CRUD de Tarefa
  const handleTarefaSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const tarefaData = {
      titulo: tarefaTitulo,
      descricao: tarefaDescricao || null,
      prazo: tarefaPrazo ? new Date(tarefaPrazo).toISOString() : null,
      status: tarefaStatus,
      materiaId: materiaId // Essencial: associa à matéria atual
    };

    try {
      if (currentTarefa) { // Atualização
        await api.put(`/tarefas/${currentTarefa.id}`, tarefaData);
      } else { // Criação
        await api.post('/tarefas', tarefaData);
      }
      fetchData(); // Rebusca tudo para atualizar a lista
      setIsTarefaDialogOpen(false);
      resetTarefaForm();
    } catch (err: any) {
      console.error("Erro ao salvar tarefa:", err);
      alert('Erro ao salvar tarefa: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleTarefaDelete = async (id: number) => {
    try {
      await api.delete(`/tarefas/${id}`);
      setTarefas(tarefas.filter((t) => t.id !== id)); // Atualização otimista
    } catch (err: any) {
      console.error("Erro ao deletar tarefa:", err);
      alert('Erro ao deletar tarefa: ' + (err.response?.data?.error || err.message));
    }
  };

  // Função para mudar apenas o status via API PATCH
  const handleTarefaStatusChange = async (tarefaId: number, novoStatus: Tarefa['status']) => {
     try {
      await api.patch(`/tarefas/${tarefaId}/status`, { status: novoStatus });
       // Atualização otimista local
       setTarefas(prev => prev.map(t => t.id === tarefaId ? { ...t, status: novoStatus } : t)
                             .sort((a, b) => { // Reordena localmente
                                const statusOrder = { 'pendente': 1, 'em andamento': 2, 'concluida': 3 };
                                return (statusOrder[a.status] || 4) - (statusOrder[b.status] || 4);
                              }));
      // fetchData(); // Ou rebuscar tudo se a ordenação local for complexa
    } catch (err: any) {
       console.error(`Erro ao mudar status da tarefa ${tarefaId}:`, err);
       alert('Falha ao atualizar status da tarefa: ' + (err.response?.data?.error || err.message));
    }
  };


  // Funções de UI para Modal de Tarefa
  const openCreateTarefaDialog = () => {
    resetTarefaForm();
    setIsTarefaDialogOpen(true);
  };

  const openEditTarefaDialog = (tarefa: Tarefa) => {
    setCurrentTarefa(tarefa);
    setTarefaTitulo(tarefa.titulo);
    setTarefaDescricao(tarefa.descricao || '');
    setTarefaStatus(tarefa.status);
    // Formata prazo para input datetime-local
    if (tarefa.prazo) {
      try {
        const date = new Date(tarefa.prazo);
        date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
        setTarefaPrazo(date.toISOString().slice(0, 16));
      } catch { setTarefaPrazo(''); }
    } else {
      setTarefaPrazo('');
    }
    setIsTarefaDialogOpen(true);
  };

  // Renderização
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !materia) { // Se deu erro ou a matéria não foi encontrada
    return (
      <div className="container mx-auto p-4 md:p-8 text-center">
        <p className="text-destructive mb-4">{error || 'Matéria não encontrada.'}</p>
        <Link to="/dashboard" className="text-primary hover:underline">
          <ArrowLeft className="inline-block h-4 w-4 mr-1"/> Voltar para o Dashboard
        </Link>
      </div>
    );
  }

  // Renderiza a página principal
  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      {/* --- Cabeçalho da Matéria --- */}
      <div className="mb-8 border-b pb-4">
        <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-primary mb-2 inline-block">
          <ArrowLeft className="inline-block h-4 w-4 mr-1"/> Voltar
        </Link>
        <h1 className="text-3xl font-bold">{materia.titulo}</h1>
        <p className="text-muted-foreground">{materia.descricao || 'Sem descrição.'}</p>
        <div className="text-sm text-muted-foreground mt-2 space-x-4">
          <span>Tipo: {materia.tipo || 'N/A'}</span>
          <span>Status: {materia.status === 'em andamento' ? 'Em Andamento' : 'Finalizada'}</span>
          <span>
             <CalendarIcon className="inline-block h-4 w-4 mr-1"/>
             Prazo: {formatarData(materia.prazo)}
          </span>
        </div>
      </div>

      {/* --- Seção de Tarefas --- */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">Tarefas</h2>
          <Dialog open={isTarefaDialogOpen} onOpenChange={setIsTarefaDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateTarefaDialog}>
                <PlusCircle className="mr-2 h-4 w-4" /> Nova Tarefa
              </Button>
            </DialogTrigger>
            {/* O conteúdo do Dialog é renderizado mais abaixo */}
          </Dialog>
        </div>

        {/* --- Lista de Tarefas --- */}
        <div className="grid grid-cols-1 gap-4 md:gap-6">
          {tarefas.length === 0 ? (
            <p className="text-muted-foreground">Nenhuma tarefa adicionada a esta matéria ainda.</p>
          ) : (
            tarefas.map((tarefa) => {
              const StatusIcon = statusConfig[tarefa.status]?.icon || statusConfig.default.icon;
              const statusColor = statusConfig[tarefa.status]?.color || statusConfig.default.color;
              const statusLabel = statusConfig[tarefa.status]?.label || statusConfig.default.label;

              return (
                <Card key={tarefa.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-4">
                  <div className="flex-1 min-w-0"> {/* Conteúdo principal */}
                    <div className="flex items-center gap-2 mb-1">
                       <StatusIcon className={`h-4 w-4 flex-shrink-0 ${statusColor}`} />
                       <span className={`text-sm font-medium ${statusColor}`}>{statusLabel}</span>
                    </div>
                    <p className="font-semibold truncate">{tarefa.titulo}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2">{tarefa.descricao || 'Sem descrição.'}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                       <CalendarIcon className="inline-block h-3 w-3 mr-1"/>
                       Prazo: {formatarData(tarefa.prazo)}
                    </p>
                  </div>
                  <div className="flex-shrink-0 flex items-center gap-2 self-end sm:self-center"> {/* Botões de ação */}
                     {/* Dropdown para mudar status rápido */}
                     <Select
                        value={tarefa.status}
                        onValueChange={(newStatus: Tarefa['status']) => handleTarefaStatusChange(tarefa.id, newStatus)}
                     >
                        <SelectTrigger className="w-[150px] h-9 text-xs">
                           <SelectValue placeholder="Mudar status" />
                        </SelectTrigger>
                        <SelectContent>
                           <SelectItem value="pendente">Pendente</SelectItem>
                           <SelectItem value="em andamento">Em Andamento</SelectItem>
                           <SelectItem value="concluida">Concluída</SelectItem>
                        </SelectContent>
                     </Select>

                     {/* Dropdown para Editar/Deletar */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditTarefaDialog(tarefa)}>
                          Editar Tarefa
                        </DropdownMenuItem>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600 focus:text-red-700 focus:bg-red-100">
                              Deletar Tarefa
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                           <AlertDialogContent>
                             <AlertDialogHeader>
                               <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                               <AlertDialogDescription>
                                 Tem certeza que deseja deletar esta tarefa? Esta ação não pode ser desfeita.
                               </AlertDialogDescription>
                             </AlertDialogHeader>
                             <AlertDialogFooter>
                               <AlertDialogCancel>Cancelar</AlertDialogCancel>
                               <AlertDialogAction onClick={() => handleTarefaDelete(tarefa.id)} className="bg-destructive hover:bg-destructive/90">Deletar</AlertDialogAction>
                             </AlertDialogFooter>
                           </AlertDialogContent>
                        </AlertDialog>
                         {/* Futuro: Item para Ver/Adicionar Progresso */}
                         {/* <DropdownMenuSeparator />
                         <DropdownMenuItem onClick={() => alert(`Ver progresso da tarefa ${tarefa.id}`)}>
                            Ver Histórico
                         </DropdownMenuItem> */}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </section>

      {/* --- Modal (Dialog) para Criar/Editar Tarefa --- */}
      {/* Renderiza fora da lista para evitar problemas de re-renderização */}
      <Dialog open={isTarefaDialogOpen} onOpenChange={(isOpen) => { setIsTarefaDialogOpen(isOpen); if (!isOpen) resetTarefaForm(); }}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{currentTarefa ? 'Editar Tarefa' : 'Criar Nova Tarefa'}</DialogTitle>
            <DialogDescription>
              {currentTarefa ? 'Modifique os dados da tarefa.' : `Adicione uma nova tarefa para a matéria "${materia.titulo}".`}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleTarefaSubmit} className="grid gap-4 py-4">
             {/* Inputs controlados */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tarefa-titulo" className="text-right">Título*</Label>
              <Input id="tarefa-titulo" value={tarefaTitulo} onChange={(e) => setTarefaTitulo(e.target.value)} required className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-start gap-4"> {/* Use items-start para Textarea */}
              <Label htmlFor="tarefa-descricao" className="text-right pt-2">Descrição</Label>
              <Textarea id="tarefa-descricao" value={tarefaDescricao} onChange={(e) => setTarefaDescricao(e.target.value)} className="col-span-3 min-h-[80px]" />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tarefa-status" className="text-right">Status*</Label>
               <Select value={tarefaStatus} onValueChange={(value: Tarefa['status']) => setTarefaStatus(value)}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="em andamento">Em Andamento</SelectItem>
                    <SelectItem value="concluida">Concluída</SelectItem>
                  </SelectContent>
                </Select>
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tarefa-prazo" className="text-right">Prazo</Label>
              <div className="col-span-3 flex items-center gap-2">
                 <Input id="tarefa-prazo" type="datetime-local" value={tarefaPrazo} onChange={(e) => setTarefaPrazo(e.target.value)} className="flex-1" />
                 {tarefaPrazo && <Button type="button" variant="ghost" size="icon" onClick={() => setTarefaPrazo('')}><X className="h-4 w-4"/></Button>}
              </div>
            </div>
            <DialogFooter>
               <DialogClose asChild><Button type="button" variant="ghost">Cancelar</Button></DialogClose>
              <Button type="submit">{currentTarefa ? 'Salvar Alterações' : 'Criar Tarefa'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}