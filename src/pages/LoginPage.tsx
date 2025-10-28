import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// Importações para o Modal (Dialog)
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose, // Para fechar o modal
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react"; // Ícone de loading

// Importa o cliente Supabase para o login
import { supabase } from "../services/supabase";
// Importa a instância do Axios para o registro (chamada ao backend)
import api from "../services/api";

export function LoginPage() {
  const navigate = useNavigate();

  // --- Estados para Login ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [errorLogin, setErrorLogin] = useState<string | null>(null);

  // --- Estados para o Modal de Registro ---
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [regNome, setRegNome] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regSenha, setRegSenha] = useState('');
  const [loadingRegister, setLoadingRegister] = useState(false);
  const [errorRegister, setErrorRegister] = useState<string | null>(null);
  const [successRegister, setSuccessRegister] = useState<string | null>(null);

  // --- Função de Login ---
  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    setLoadingLogin(true);
    setErrorLogin(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      navigate('/dashboard'); // Redireciona após login bem-sucedido
    } catch (err: any) {
      setErrorLogin(err.message || 'Ocorreu um erro ao fazer login.');
    } finally {
      setLoadingLogin(false);
    }
  }

  // --- Função de Registro (Cadastro) ---
  async function handleRegister(event: React.FormEvent) {
    event.preventDefault();
    setLoadingRegister(true);
    setErrorRegister(null);
    setSuccessRegister(null);

    // Suas validações (pode refinar depois com Zod, se quiser)
    if (!regNome || !regEmail || !regSenha) {
      setErrorRegister("Preencha todos os campos.");
      setLoadingRegister(false);
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(regEmail)) {
      setErrorRegister("E-mail inválido.");
      setLoadingRegister(false);
      return;
    }
    const senhaRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\-]).{7,}$/;
    if (!senhaRegex.test(regSenha)) {
      setErrorRegister("Senha inválida (mín. 7 chars, 1 maiúscula, 1 número, 1 símbolo).");
      setLoadingRegister(false);
      return;
    }

    try {
      // Chama a rota POST /usuarios do seu backend
      await api.post('/usuarios', {
        nome: regNome,
        email: regEmail,
        senha: regSenha, // O backend cuidará do hash
      });

      // Se a requisição for bem-sucedida (status 201)
      setSuccessRegister('Cadastro realizado com sucesso! Você já pode fazer login.');
      // Limpa o formulário e fecha o modal após um tempo
      setTimeout(() => {
        setIsRegisterOpen(false);
        setRegNome('');
        setRegEmail('');
        setRegSenha('');
        setSuccessRegister(null);
      }, 3000); // Fecha após 3 segundos

    } catch (err: any) {
      // Pega o erro retornado pelo backend
      setErrorRegister(err.response?.data?.error || err.message || 'Ocorreu um erro ao cadastrar.');
    } finally {
      setLoadingRegister(false);
    }
  }

  return (
    <main className="container mx-auto flex flex-col min-h-screen items-center justify-center  bg-purple-400 dark:bg-gray-950 p-4">
      <h1 className="mb-5 flex-wrap text-center font-bold">Organizador de Estudos</h1>
      {/* --- Card de Login --- */}
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Acesse sua conta</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            <div className="flex flex-col gap-4"> {/* Ajustado espaçamento */}
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loadingLogin}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Senha</Label>
                  <a href="#" className="ml-auto inline-block text-sm underline hover:text-primary">
                    Esqueceu a senha?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loadingLogin}
                />
              </div>
              {errorLogin && <p className="text-sm text-red-500">{errorLogin}</p>}
              <Button type="submit" className="w-full" disabled={loadingLogin}>
                {loadingLogin && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loadingLogin ? 'Entrando...' : 'Login'}
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex-col gap-4 pt-4"> {/* Ajustado espaçamento */}
          <p className="text-xs text-center text-gray-500">Ainda não tem uma conta?</p>

          {/* --- Botão que Abre o Modal de Registro --- */}
          <Dialog open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                Criar conta
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Criar nova conta</DialogTitle>
                <DialogDescription>
                  Preencha seus dados para começar a organizar seus estudos.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleRegister}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="regNome" className="text-right">
                      Nome
                    </Label>
                    <Input
                      id="regNome"
                      value={regNome}
                      onChange={(e) => setRegNome(e.target.value)}
                      className="col-span-3"
                      required
                      disabled={loadingRegister}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="regEmail" className="text-right">
                      Email
                    </Label>
                    <Input
                      id="regEmail"
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="col-span-3"
                      required
                      disabled={loadingRegister}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="regSenha" className="text-right">
                      Senha
                    </Label>
                    <Input
                      id="regSenha"
                      type="password"
                      value={regSenha}
                      onChange={(e) => setRegSenha(e.target.value)}
                      className="col-span-3"
                      required
                      disabled={loadingRegister}
                    />
                  </div>
                  {/* Mensagens de erro ou sucesso */}
                  {errorRegister && <p className="col-span-4 text-sm text-red-500 text-center">{errorRegister}</p>}
                  {successRegister && <p className="col-span-4 text-sm text-green-500 text-center">{successRegister}</p>}
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="ghost" disabled={loadingRegister}>Cancelar</Button>
                  </DialogClose>
                  <Button type="submit" disabled={loadingRegister}>
                    {loadingRegister && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {loadingRegister ? 'Criando...' : 'Criar conta'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

        </CardFooter>
      </Card>
    </main>
  );
}

export default LoginPage;
