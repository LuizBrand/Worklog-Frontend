# Deploy do WorkLog na VPS (frontend + backend)

Guia passo a passo, pensado para **primeira vez**. No final você terá:

```
https://app.seu-dominio.com   → frontend (este projeto Next.js)
https://api.seu-dominio.com   → backend  (Spring Boot)
```

Os dois rodam na **mesma VPS**, atrás do **Caddy**, que cuida do HTTPS
automaticamente (certificado Let's Encrypt, renovação sozinho).

> **Por que dois subdomínios do mesmo domínio?**
> A autenticação é por **cookie HttpOnly** com `SameSite=Strict`. Esse cookie
> só é enviado entre `app.` e `api.` porque ambos são *same-site* (mesmo
> `seu-dominio.com`). Se você usar domínios diferentes, o login não funciona.

---

## Visão geral do que já está pronto no código

Você **não precisa mexer no código** — já foi ajustado e commitado:

- `withCredentials: true` no axios (`src/lib/api.ts`) → envia/recebe os cookies.
- Sem `localStorage`/`Bearer`/CSRF. A sessão vive só no cookie.
- Login espera **204** (sem token no corpo) e usa `GET /users/me` pra saber se
  está logado.
- Interceptor renova a sessão no **403** (não só no 401), como o backend exige.
- `next.config.ts` com `output: "standalone"` → imagem Docker enxuta.
- `Dockerfile`, `.dockerignore` e a pasta `deploy/` (compose + Caddy).

A **única** configuração que muda entre ambientes é a variável
`NEXT_PUBLIC_API_URL`, que é injetada **no momento do build** (o compose já faz
isso a partir do `API_DOMAIN`).

---

## Pré-requisitos

1. Um **domínio** que você controla (ex.: `seu-dominio.com`).
2. Uma **VPS** com Ubuntu 22.04/24.04 (ou similar) e acesso `root`/sudo via SSH.
3. A **imagem/artefato do backend** pronta para rodar (veja o Passo 5).

---

## Passo 1 — Apontar o DNS

No painel do seu provedor de domínio, crie **dois registros A** apontando para
o **IP público da VPS**:

| Tipo | Nome  | Valor (IP da VPS) |
|------|-------|-------------------|
| A    | `app` | `SEU.IP.DA.VPS`   |
| A    | `api` | `SEU.IP.DA.VPS`   |

Espere propagar (alguns minutos). Teste do seu computador:

```bash
ping app.seu-dominio.com   # deve responder com o IP da VPS
ping api.seu-dominio.com
```

> Se não resolver ainda, **não continue** — o Caddy vai falhar ao emitir o
> certificado HTTPS se o DNS não estiver apontando pra cá.

---

## Passo 2 — Preparar a VPS

Conecte via SSH:

```bash
ssh root@SEU.IP.DA.VPS
```

Atualize e instale o Docker (script oficial):

```bash
apt update && apt upgrade -y
curl -fsSL https://get.docker.com | sh
```

Confirme:

```bash
docker --version
docker compose version
```

Libere o firewall (só SSH + web). Se usar `ufw`:

```bash
ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw enable
```

> Portas **80 e 443 precisam estar abertas**: 80 é usada pelo Let's Encrypt
> para validar o domínio, 443 é o HTTPS de verdade.

---

## Passo 3 — Trazer o código para a VPS

```bash
cd /opt
git clone SEU_REPOSITORIO_GIT worklog-frontend
cd worklog-frontend
```

(Se o repositório for privado, configure uma deploy key / token antes.)

---

## Passo 4 — Configurar as variáveis do deploy

```bash
cp deploy/.env.example deploy/.env
nano deploy/.env
```

Preencha com **seu domínio real**:

```env
APP_DOMAIN=app.seu-dominio.com
API_DOMAIN=api.seu-dominio.com
```

Salve (`Ctrl+O`, `Enter`, `Ctrl+X`).

> O compose usa esses valores para (a) montar o `NEXT_PUBLIC_API_URL` do
> frontend, (b) configurar o CORS do backend e (c) dizer ao Caddy quais
> domínios servir. **Sem barra no final, com `https://` implícito.**

---

## Passo 5 — Encaixar o backend no compose

Abra `deploy/docker-compose.yml` e ajuste o serviço `backend` para **como você
realmente roda o back**. Duas opções comuns:

**A) Você já tem uma imagem publicada:**
```yaml
  backend:
    image: seu-registry/worklog-backend:latest
```

**B) O código do back está na VPS e você quer buildar:**
```yaml
  backend:
    build:
      context: ../worklog-backend   # caminho do projeto do backend
```

O que **não pode faltar** no `environment` do backend (já vem preenchido no
arquivo, confira os valores):

```yaml
    environment:
      SPRING_PROFILES_ACTIVE: prod                    # cookies Secure (HTTPS)
      WORKLOG_CORS_ORIGINS: "https://${APP_DOMAIN}"   # idêntico ao front
      # + suas variáveis de banco / segredos
```

> **Cuidados críticos do backend:**
> - **Não** use o profile `dev` em produção. O dev deixa `cookies.secure=false`,
>   e o navegador **recusa** cookie não-Secure em HTTPS → login quebra.
> - `WORKLOG_CORS_ORIGINS` tem que ser **exatamente** `https://app.seu-dominio.com`
>   (mesmo esquema e host, sem barra final). Qualquer diferença → CORS bloqueia.
> - O backend expõe as rotas na **raiz** (`/worklog/auth/login`, `/users/me`, …),
>   sem context-path. É isso que o Caddy encaminha para `api.seu-dominio.com`.

Se o backend precisar de banco (Postgres etc.), descomente o serviço `db` e o
`depends_on` no compose e defina `DB_PASSWORD` no `deploy/.env`.

---

## Passo 6 — Subir tudo

Da pasta do projeto, na VPS:

```bash
docker compose -f deploy/docker-compose.yml up -d --build
```

A primeira vez demora (builda o frontend). Acompanhe os logs:

```bash
docker compose -f deploy/docker-compose.yml logs -f
```

O Caddy vai emitir os certificados automaticamente. Você verá algo como
`certificate obtained successfully` para os dois domínios.

Estado dos containers:

```bash
docker compose -f deploy/docker-compose.yml ps
```

---

## Passo 7 — Verificar

**1. HTTPS de pé:**
```bash
curl -I https://app.seu-dominio.com     # 200/307/308
curl -I https://api.seu-dominio.com     # responde (403 sem sessão é normal)
```

**2. Login pelo navegador:**
- Abra `https://app.seu-dominio.com`.
- Entre com um usuário válido.
- Abra o DevTools → aba **Network** → requisição de `login`: deve ser **204**
  e trazer `Set-Cookie: worklog_access…` e `worklog_refresh…`.
- Em **Application → Cookies**, os cookies devem aparecer com `Secure`,
  `HttpOnly` e `SameSite=Strict`.
- A tela deve redirecionar pro dashboard (isso confirma que `GET /users/me`
  voltou 200 usando o cookie).

Se isso tudo aconteceu, **está funcionando**.

---

## Passo 8 — Atualizações futuras

Quando houver mudança no frontend:

```bash
cd /opt/worklog-frontend
git pull
docker compose -f deploy/docker-compose.yml up -d --build frontend
```

> Como o `NEXT_PUBLIC_API_URL` é congelado no build, **trocar de domínio exige
> rebuild** do frontend — não basta reiniciar o container.

---

## Troubleshooting (os erros mais prováveis)

| Sintoma | Causa provável | O que fazer |
|---------|----------------|-------------|
| Caddy não emite certificado | DNS não aponta pra VPS, ou porta 80/443 fechada | Confirme os A records e o `ufw`. |
| Login retorna, mas continua deslogado | Cookie não foi setado | Está em **HTTPS**? Backend no profile **prod** (cookie `Secure`)? `app.` e `api.` são do **mesmo domínio**? |
| Erro de **CORS** no console | `WORKLOG_CORS_ORIGINS` diferente do front | Tem que ser **idêntico** a `https://app.seu-dominio.com`, sem barra final. |
| Preflight (OPTIONS) falha | Front mandou header custom | O back só permite `Content-Type` e `Accept`. Este frontend já respeita isso. |
| Fica pedindo login em loop | Sessão expira e refresh falha | Veja logs do backend; confirme que `/worklog/auth/refresh` responde 204 com o refresh cookie. |
| Chamadas vão pra `localhost:8080` | Frontend buildado sem `NEXT_PUBLIC_API_URL` | Rebuild do frontend com o `deploy/.env` correto. |

### Lembrete sobre 403 vs 401 (comportamento esperado)
O backend responde **403** (não 401) para rota protegida sem sessão válida. O
frontend já trata isso: tenta 1× o refresh no 403; se o `/refresh` vier 401,
faz logout. Um 403 que **sobrevive** a um refresh bem-sucedido é tratado como
**falta de permissão** (ex.: rota ADMIN), não como sessão expirada. Nada a fazer
aqui — só não se assuste ao ver 403 nos logs.

### Registro de usuários é ADMIN-only
Não existe mais auto-cadastro público. Novos usuários são criados por um admin
logado (o admin padrão é criado no boot do backend).
