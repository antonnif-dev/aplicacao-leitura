import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';

import { useLocation } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { LogOut, LayoutDashboard, CalendarDays, Settings } from 'lucide-react';

// Tipagens (ajuste conforme src/types)
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
  materiaId: number; // Garanta que o nome bate com o backend/DB (materiaId vs materia_id)
  user_id: string;
  created_at: string;
}

// Componentes Shadcn/UI e Ícones
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { Badge } from "@/components/ui/badge";
import { PlusCircle, MoreHorizontal, Loader2, CheckCircle, RefreshCw, CalendarIcon, X, ListTodo } from 'lucide-react';

// Mapeamento de tipo para cor da borda (Tailwind)
const tipoCores: { [key: string]: string } = {
  'Revisão': 'border-blue-500',
  'Estudo': 'border-green-500',
  'Prática': 'border-yellow-500',
  'Leitura': 'border-purple-500',
  'Projeto': 'border-red-500',
  'default': 'border-gray-300'
};

// Função auxiliar para formatar datas
const formatarData = (isoString: string | null | undefined): string => {
  if (!isoString) return 'Sem prazo';
  try {
    const data = new Date(isoString);
    return data.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch (e) { return 'Data inválida'; }
};

// Mapeamento de status da TAREFA para estilo do Badge
const statusTarefaConfig: { [key: string]: { variant: "default" | "secondary" | "destructive" | "outline", label: string } } = {
  'pendente': { variant: 'outline', label: 'Pendente' },
  'em andamento': { variant: 'default', label: 'Em Andamento' },
  'concluida': { variant: 'secondary', label: 'Concluída' },
  'default': { variant: 'outline', label: 'Pendente' }
};


export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Estados
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados dos Modais
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentMateria, setCurrentMateria] = useState<Materia | null>(null);
  const [tituloInput, setTituloInput] = useState('');
  const [descricaoInput, setDescricaoInput] = useState('');
  const [tipoInput, setTipoInput] = useState('');
  const [prazoInput, setPrazoInput] = useState('');

  // Função de busca atualizada
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [materiasResponse, tarefasResponse] = await Promise.all([
        api.get<Materia[]>('/materias'),
        api.get<Tarefa[]>('/tarefas')
      ]);

      materiasResponse.data.sort((a, b) => {
        if (a.status === 'em andamento' && b.status === 'finalizado') return -1;
        if (a.status === 'finalizado' && b.status === 'em andamento') return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      setMaterias(materiasResponse.data);
      setTarefas(tarefasResponse.data);

    } catch (err: any) {
      console.error("Erro ao buscar dados:", err);
      setError('Falha ao carregar dados. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Limpa os inputs do formulário
  const resetFormInputs = () => {
    setTituloInput('');
    setDescricaoInput('');
    setTipoInput('');
    setPrazoInput('');
    setCurrentMateria(null);
  };

  // Funções CRUD + Status (chamando fetchData no final)
  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await api.post('/materias', {
        titulo: tituloInput,
        descricao: descricaoInput || null,
        tipo: tipoInput || null,
        prazo: prazoInput ? new Date(prazoInput).toISOString() : null
      });
      fetchData(); // Rebusca TUDO
      setIsCreateDialogOpen(false);
      resetFormInputs();
    } catch (err: any) {
      console.error("Erro ao criar matéria:", err);
      alert('Falha ao criar matéria: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentMateria) return;
    try {
      await api.put(`/materias/${currentMateria.id}`, {
        titulo: tituloInput,
        descricao: descricaoInput || null,
        tipo: tipoInput || null,
        prazo: prazoInput ? new Date(prazoInput).toISOString() : null,
        status: currentMateria.status
      });
      fetchData(); // Rebusca TUDO
      setIsEditDialogOpen(false);
      resetFormInputs();
    } catch (err: any) {
      console.error("Erro ao atualizar matéria:", err);
      alert('Falha ao atualizar matéria: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/materias/${id}`);
      fetchData(); // Rebusca TUDO
    } catch (err: any) {
      console.error("Erro ao deletar matéria:", err);
      alert('Falha ao deletar matéria: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleStatusChange = async (id: number, novoStatus: 'em andamento' | 'finalizado') => {
    try {
      await api.put(`/materias/${id}`, { status: novoStatus });
      fetchData(); // Rebusca TUDO
    } catch (err: any) {
      console.error(`Erro ao mudar status para ${novoStatus}:`, err);
      alert('Falha ao atualizar status: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/login', { replace: true });
    } catch (err: any) {
      console.error("Erro ao fazer logout:", err);
      alert('Erro ao fazer logout: ' + err.message);
    }
  };

  // Funções de UI para Modais
  const openCreateDialog = () => {
    resetFormInputs();
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (materia: Materia) => {
    setCurrentMateria(materia);
    setTituloInput(materia.titulo);
    setDescricaoInput(materia.descricao || '');
    setTipoInput(materia.tipo || '');
    if (materia.prazo) {
      try {
        const date = new Date(materia.prazo);
        date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
        setPrazoInput(date.toISOString().slice(0, 16));
      } catch { setPrazoInput(''); }
    } else {
      setPrazoInput('');
    }
    setIsEditDialogOpen(true);
  };

  // Filtra as matérias
  const materiasEmAndamento = materias.filter(m => m.status === 'em andamento');
  const materiasFinalizadas = materias.filter(m => m.status === 'finalizado');

  // Renderização
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
    <div className="container mx-auto">

      <header className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Organizador</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Olá, {user?.user_metadata.nome_completo || user?.email}!
          </p>
        </div>
        <Dialog>
          {/* Botão logout -- Apenas 3 linhas */}
          <Button variant="outline" size="icon" onClick={handleLogout} className="flex-shrink-0" aria-label="Sair"> {/* Adicionado aria-label */}
            <LogOut className="h-4 w-4" />
          </Button>
        </Dialog>
      </header>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogTrigger asChild>
          <Button onClick={openCreateDialog} className="w-full sm:w-auto">
            <PlusCircle className="mr-2 h-4 w-4" /> Nova Matéria
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Nova Matéria</DialogTitle>
            <DialogDescription>Preencha os dados da sua nova matéria de estudos.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="grid gap-4 py-4">
            {/* Inputs controlados */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="create-titulo" className="text-right">Título*</Label>
              <Input id="create-titulo" value={tituloInput} onChange={(e) => setTituloInput(e.target.value)} required className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="create-descricao" className="text-right">Descrição</Label>
              <Input id="create-descricao" value={descricaoInput} onChange={(e) => setDescricaoInput(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="create-tipo" className="text-right">Tipo</Label>
              <Input id="create-tipo" value={tipoInput} onChange={(e) => setTipoInput(e.target.value)} placeholder="Ex: Revisão" className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="create-prazo" className="text-right">Prazo</Label>
              <Input id="create-prazo" type="datetime-local" value={prazoInput} onChange={(e) => setPrazoInput(e.target.value)} className="col-span-3" />
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="ghost">Cancelar</Button></DialogClose>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* --- Seção Em Andamento --- */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4 pb-2 border-b">Em Andamento</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {materiasEmAndamento.length === 0 ? (
            <p className="text-muted-foreground col-span-full">Nenhuma matéria em andamento.</p>
          ) : (
            materiasEmAndamento.map((materia) => {
              const tarefasDaMateria = tarefas.filter(t => t.materiaId === materia.id); // Ajuste 'materiaId'

              return (
                <Card key={materia.id} className={`flex flex-col border-l-4 ${tipoCores[materia.tipo || 'default'] || tipoCores.default}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className='flex-1 min-w-0'>
                        <CardTitle className="text-lg truncate">{materia.titulo}</CardTitle>
                        <CardDescription>{materia.tipo || 'Sem tipo'}</CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 -mt-1 -mr-2">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/materias/${materia.id}`)}>
                            <ListTodo className="mr-2 h-4 w-4" /> Ver/Gerenciar Tarefas
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditDialog(materia)}>
                            Editar Matéria
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(materia.id, 'finalizado')}>
                            <CheckCircle className="mr-2 h-4 w-4 text-green-600" /> Marcar como Concluída
                          </DropdownMenuItem>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600 focus:text-red-700 focus:bg-red-100">
                                Deletar Matéria
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta ação não pode ser desfeita e irá deletar a matéria e suas tarefas.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(materia.id)} className="bg-destructive hover:bg-destructive/90">Deletar</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow pt-0 pb-3 space-y-3">
                    <p className="text-sm text-muted-foreground line-clamp-3">{materia.descricao || 'Sem descrição.'}</p>
                    {tarefasDaMateria.length > 0 && (
                      <div className="mt-3 border-t pt-3">
                        <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                          Tarefas ({tarefasDaMateria.filter(t => t.status !== 'concluida').length} pendentes/ativas):
                        </h4>
                        <ul className="space-y-1.5 max-h-40 overflow-y-auto pr-2">
                          {tarefasDaMateria
                            .filter(t => t.status !== 'concluida')
                            .slice(0, 5)
                            .map(tarefa => {
                              const TStatusBadge = statusTarefaConfig[tarefa.status] || statusTarefaConfig.default;
                              return (
                                <li key={tarefa.id} className="text-xs border rounded-md p-1.5 bg-background hover:bg-muted/50 transition-colors">
                                  <div className="flex justify-between items-center mb-0.5">
                                    <span className="font-medium truncate pr-2 flex-1">{tarefa.titulo}</span>
                                    <Badge variant={TStatusBadge.variant} className="text-[9px] px-1 py-0 leading-tight whitespace-nowrap">
                                      {TStatusBadge.label}
                                    </Badge>
                                  </div>
                                  <p className="text-muted-foreground/80 mt-0.5">
                                    <CalendarIcon className="inline-block h-3 w-3 mr-0.5" />
                                    {formatarData(tarefa.prazo)}
                                  </p>
                                </li>
                              );
                            })}
                          {tarefasDaMateria.filter(t => t.status !== 'concluida').length > 5 && ( // Corrigido para > 5
                            <li className="mt-1">
                              <Link to={`/materias/${materia.id}`} className="text-[11px] text-primary hover:underline">
                                Ver todas as {tarefasDaMateria.length} tarefas &rarr;
                              </Link>
                            </li>
                          )}
                        </ul>
                        {tarefasDaMateria.length === 0 && <p className='text-xs text-muted-foreground italic'>Nenhuma tarefa adicionada.</p>}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="pt-0 text-xs text-muted-foreground flex items-center justify-between">
                    <span>
                      <CalendarIcon className="inline-block h-3 w-3 mr-1" />
                      {formatarData(materia.prazo)}
                    </span>
                  </CardFooter>
                </Card>
              );
            })
          )}
        </div>
      </section>

      <Separator className="my-8" />

      {/* --- Seção Finalizadas --- */}
      <section>
        <h2 className="text-xl font-semibold mb-4 pb-2 border-b">Finalizadas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {materiasFinalizadas.length === 0 ? (
            <p className="text-muted-foreground col-span-full">Nenhuma matéria finalizada.</p>
          ) : (
            materiasFinalizadas.map((materia) => (
              <Card key={materia.id} className="bg-muted/50 border-dashed border-gray-400">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium text-muted-foreground line-clamp-1">{materia.titulo}</CardTitle>
                  <CardDescription className="text-xs">{materia.tipo || 'Sem tipo'}</CardDescription>
                </CardHeader>
                <CardContent className="pb-3 pt-0">
                  <p className="text-xs text-muted-foreground line-clamp-2">{materia.descricao || 'Sem descrição.'}</p>
                </CardContent>
                <CardFooter className="pt-0 flex items-center justify-between">
                  <Button variant="outline" size="sm" onClick={() => handleStatusChange(materia.id, 'em andamento')}>
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Reativar
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    <CalendarIcon className="inline-block h-3 w-3 mr-1" />
                    {formatarData(materia.prazo)}
                  </span>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      </section>

      {/* --- Modal de Edição (UPDATE) --- */}
      <Dialog open={isEditDialogOpen} onOpenChange={(isOpen) => { setIsEditDialogOpen(isOpen); if (!isOpen) resetFormInputs(); }}>
        {/* ... (código do Dialog Content de Editar Matéria - sem mudanças) ... */}
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Matéria</DialogTitle>
            <DialogDescription>Modifique os dados da matéria.</DialogDescription>
          </DialogHeader>
          {currentMateria && (
            <form onSubmit={handleUpdate} className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-titulo" className="text-right">Título*</Label>
                <Input id="edit-titulo" value={tituloInput} onChange={(e) => setTituloInput(e.target.value)} required className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-descricao" className="text-right">Descrição</Label>
                <Input id="edit-descricao" value={descricaoInput} onChange={(e) => setDescricaoInput(e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-tipo" className="text-right">Tipo</Label>
                <Input id="edit-tipo" value={tipoInput} onChange={(e) => setTipoInput(e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-prazo" className="text-right">Prazo</Label>
                <div className="col-span-3 flex items-center gap-2">
                  <Input id="edit-prazo" type="datetime-local" value={prazoInput} onChange={(e) => setPrazoInput(e.target.value)} className="flex-1" />
                  {prazoInput && <Button type="button" variant="ghost" size="icon" onClick={() => setPrazoInput('')}><X className="h-4 w-4" /></Button>}
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="ghost">Cancelar</Button></DialogClose>
                <Button type="submit">Salvar Alterações</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Footer com ícones de navegação */}
      <footer className="fixed bottom-0 left-0 right-0 bg-background border-t p-1 sm:p-2 z-50">
        <nav className="container mx-auto flex justify-around items-center h-14 sm:h-16">
          {/* Botão Dashboard */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
            // Destaca se o pathname for exatamente /dashboard ou /
            className={`flex flex-col h-full justify-center px-2 py-1 ${location.pathname === '/dashboard' || location.pathname === '/' ? 'text-primary' : 'text-muted-foreground hover:text-foreground/80'}`}
            aria-current={location.pathname === '/dashboard' || location.pathname === '/' ? 'page' : undefined}
          >
            <LayoutDashboard className="h-5 w-5 mb-0.5" />
            <span className="text-[10px] sm:text-xs">Dashboard</span>
          </Button>

          {/* Botão Agenda */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/agenda')} // Garante que a navegação está correta
            // Destaca se o pathname começar com /agenda
            className={`flex flex-col h-full justify-center px-2 py-1 ${location.pathname.startsWith('/agenda') ? 'text-primary' : 'text-muted-foreground hover:text-foreground/80'}`}
            aria-current={location.pathname.startsWith('/agenda') ? 'page' : undefined}
          >
            <CalendarDays className="h-5 w-5 mb-0.5" />
            <span className="text-[10px] sm:text-xs">Agenda</span>
          </Button>

          {/* Botão Ajustes */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/ajustes')} // Navega para a nova página
            // Destaca se o pathname começar com /ajustes
            className={`flex flex-col h-full justify-center px-2 py-1 ${location.pathname.startsWith('/ajustes') ? 'text-primary' : 'text-muted-foreground hover:text-foreground/80'}`}
            aria-current={location.pathname.startsWith('/ajustes') ? 'page' : undefined}
          >
            <Settings className="h-5 w-5 mb-0.5" />
            <span className="text-[10px] sm:text-xs">Ajustes</span>
          </Button>
        </nav>
      </footer>
      {/* Padding inferior no container principal para compensar a barra */}
      <div className="pb-20 sm:pb-24"></div>

    </div> // *** FIM DO CONTAINER PRINCIPAL ***
  );
}