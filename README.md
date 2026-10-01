# MeuRepertório

Aplicativo de cifras e repertórios com uso offline. Os dados são salvos no navegador. Ao entrar por e-mail, o aplicativo sincroniza a biblioteca com o Supabase.

## Desenvolvimento local

Requer Node.js 22.13 ou superior.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Preencha `.env.local` com as variáveis abaixo. Sem elas, o aplicativo funciona localmente no navegador, sem login ou sincronização.

| Variável | Uso |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Chave publicável para login no navegador |
| `SUPABASE_SECRET_KEY` | Chave secreta **somente do servidor** para ler e salvar a biblioteca |

Execute o SQL de [supabase/schema.sql](supabase/schema.sql) no SQL Editor do Supabase. A sincronização usa `public.workspaces`. Configure o provedor de e-mail no Supabase Auth e inclua `http://localhost:3000/auth/callback` nas URLs de redirecionamento permitidas para testar o login local. Nos modelos de e-mail **Confirm signup** e **Magic Link**, substitua o destino do link por `{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=email`. Assim o callback valida o token no servidor e grava a sessão em cookies.

## Implantar na Vercel

1. Importe este repositório como projeto na Vercel e selecione o framework **Next.js**. Diretório raiz: a raiz deste projeto. Os comandos padrão usam `npm ci` e `npm run build`; a saída é gerenciada pelo adaptador Next.js da Vercel.
2. Adicione as três variáveis acima nas configurações do projeto para os ambientes desejados. A chave secreta nunca deve ter prefixo `NEXT_PUBLIC_`.
3. No Supabase Auth, configure a **Site URL** com o domínio de produção e adicione `https://SEU-DOMINIO/auth/callback` às URLs de redirecionamento permitidas. Adicione também URLs dos domínios de preview se o login precisar funcionar neles.
4. Faça o deploy. Confira o login por link enviado por e-mail, a sincronização em outro dispositivo e a leitura offline antes de divulgar o endereço.

`vercel.json` fixa o preset Next.js para deploys pela CLI. `.vercelignore` evita enviar credenciais locais, caches e artefatos gerados. `npm run build` gera o mesmo tipo de build usado na implantação. `npm start` executa esse build localmente.

O aplicativo salva músicas no dispositivo mesmo sem login ou rede. A sincronização associa a biblioteca ao ID da conta Supabase Auth; bibliotecas antigas associadas ao ID de usuário do Sites/ChatGPT não são migradas automaticamente. Os dados locais são preservados no navegador existente e podem ser sincronizados após a entrada na conta.

## Segurança e limites

`/api/workspace` valida a sessão Supabase no servidor antes de usar a chave secreta. A tabela `workspaces` tem RLS ativada e nega acesso direto a `anon` e `authenticated`; somente o serviço no servidor a acessa. A sincronização aceita até 4 MB de JSON por biblioteca. Imagens inseridas nas cifras contam nesse limite; os dados locais continuam disponíveis se a biblioteca excedê-lo.

As antigas rotas `/api/songs`, `/api/setlists` e `/api/supabase/health` foram removidas. Eram rotas de um protótipo anterior e não eram usadas pela interface. O cache offline está em `public/sw.js`.

## Verificação

```bash
npm run build
npm run lint
```

Os scripts `dev:sites`, `build:sites` e `start:sites` foram mantidos apenas para quem ainda precisa executar o projeto com o runtime anterior.
