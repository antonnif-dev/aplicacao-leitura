import { useState } from 'react';
//import { Link, useNavigate } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/services/supabase';
import { LogOut, LayoutDashboard, CalendarDays, Settings } from 'lucide-react';

// Componentes UI e Ícones
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
//import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';

export function AjustesPage() {
  //const { user, session } = useAuth();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Estados para o formulário de perfil
  const [nome, setNome] = useState(user?.user_metadata?.nome_completo || '');
  const [email] = useState(user?.email || '');
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [errorProfile, setErrorProfile] = useState<string | null>(null);
  const [successProfile, setSuccessProfile] = useState<string | null>(null);

  // Estados para o formulário de senha
  //const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [errorPassword, setErrorPassword] = useState<string | null>(null);
  const [successPassword, setSuccessPassword] = useState<string | null>(null);


  // Função para atualizar perfil (nome/email)
  const handleProfileUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoadingProfile(true);
    setErrorProfile(null);
    setSuccessProfile(null);

    try {
      const updates = {
        email: email, // O Supabase enviará um link de confirmação se o email mudar
        data: { nome_completo: nome },
      };

      const { error } = await supabase.auth.updateUser(updates);

      if (error) throw error;
      setSuccessProfile('Perfil atualizado com sucesso!');
      // Limpar mensagem após alguns segundos
      setTimeout(() => setSuccessProfile(null), 3000);

    } catch (err: any) {
      console.error("Erro ao atualizar perfil:", err);
      setErrorProfile(err.message || 'Falha ao atualizar perfil.');
    } finally {
      setLoadingProfile(false);
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

  // Função para atualizar senha
  const handlePasswordUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoadingPassword(true);
    setErrorPassword(null);
    setSuccessPassword(null);

    if (newPassword !== confirmPassword) {
      setErrorPassword('As novas senhas não coincidem.');
      setLoadingPassword(false);
      return;
    }
    if (newPassword.length < 7) { // Adicione a validação de regex se quiser
      setErrorPassword('A nova senha deve ter no mínimo 7 caracteres.');
      setLoadingPassword(false);
      return;
    }

    try {
      // Para mudar a senha, o Supabase exige apenas a nova senha
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setSuccessPassword('Senha atualizada com sucesso!');
      // Limpa os campos de senha
      //setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      // Limpar mensagem após alguns segundos
      setTimeout(() => setSuccessPassword(null), 3000);

    } catch (err: any) {
      console.error("Erro ao atualizar senha:", err);
      setErrorPassword(err.message || 'Falha ao atualizar senha.');
    } finally {
      setLoadingPassword(false);
    }
  };

  return (
    <div className="container mx-auto">
      <header className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold">Ajustes do Perfil</h1>
        {/* Botão logout */}
        <Dialog>
          <Button variant="outline" size="icon" onClick={handleLogout} className="flex-shrink-0" aria-label="Sair"> {/* Adicionado aria-label */}
            <LogOut className="h-4 w-4 ml-1" />
          </Button>
        </Dialog>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* --- Card de Edição de Perfil --- */}
        <Card>
          <CardHeader>
            <CardTitle>Editar Informações</CardTitle>
            <CardDescription>Atualize seu nome e e-mail.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="nome">Nome Completo</Label>
                <Input
                  id="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                  disabled={loadingProfile}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  className="disabled:opacity-50 disabled:cursor-not-allowed" // Classes opcionais para estilo visual
                />
                <p className="text-xs text-muted-foreground">
                  O e-mail não pode ser alterado após o cadastro.
                </p>
              </div>
              {errorProfile && <p className="text-sm text-destructive">{errorProfile}</p>}
              {successProfile && <p className="text-sm text-green-600">{successProfile}</p>}
              <Button type="submit" className="w-full" disabled={loadingProfile}>
                {loadingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loadingProfile ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* --- Card de Mudança de Senha --- */}
        <Card>
          <CardHeader>
            <CardTitle>Alterar Senha</CardTitle>
            <CardDescription>Defina uma nova senha de acesso.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              {/* O Supabase não exige a senha atual para updateUser,
                  mas você poderia adicionar se quisesse uma camada extra via backend */}
              {/* <div className="grid gap-2">
                <Label htmlFor="currentPassword">Senha Atual</Label>
                <Input id="currentPassword" type="password" value={currentPassword} onChange={(e)=> setCurrentPassword(e.target.value)} required disabled={loadingPassword} />
              </div> */}
              <div className="grid gap-2">
                <Label htmlFor="newPassword">Nova Senha</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={7}
                  disabled={loadingPassword}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={7}
                  disabled={loadingPassword}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                A senha deve ter no mínimo 7 caracteres, incluindo letra maiúscula, número e símbolo.
              </p>
              {errorPassword && <p className="text-sm text-destructive">{errorPassword}</p>}
              {successPassword && <p className="text-sm text-green-600">{successPassword}</p>}
              <Button type="submit" className="w-full" disabled={loadingPassword}>
                {loadingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loadingPassword ? 'Alterando...' : 'Alterar Senha'}
              </Button>
            </form>
          </CardContent>
        </Card>

      </div>
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
    </div>
  );
}