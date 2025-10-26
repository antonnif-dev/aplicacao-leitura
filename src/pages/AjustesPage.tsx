import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase'; // Para chamar as funções de update

// Componentes UI e Ícones
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Loader2, ArrowLeft } from 'lucide-react';

export function AjustesPage() {
  const { user, session } = useAuth(); // Pega o usuário e a sessão
  const navigate = useNavigate();

  // Estados para o formulário de perfil
  const [nome, setNome] = useState(user?.user_metadata?.nome_completo || '');
  const [email, setEmail] = useState(user?.email || '');
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [errorProfile, setErrorProfile] = useState<string | null>(null);
  const [successProfile, setSuccessProfile] = useState<string | null>(null);

  // Estados para o formulário de senha
  const [currentPassword, setCurrentPassword] = useState(''); // Não vamos usar a senha atual para updateUser
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
      setCurrentPassword('');
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
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 pb-20 sm:pb-24">
      <header className="mb-8">
         <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-primary mb-2 inline-block">
          <ArrowLeft className="inline-block h-4 w-4 mr-1"/> Voltar
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold">Ajustes do Perfil</h1>
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
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loadingProfile}
                />
                 <p className="text-xs text-muted-foreground">
                   Alterar o e-mail exigirá confirmação no novo endereço.
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
                  A senha deve ter no mínimo 7 caracteres, incluindo maiúscula, número e símbolo.
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