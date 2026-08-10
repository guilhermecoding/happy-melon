# 🎈 Happy Melon

Aumente a eficiência na organização e entrega de tarefas durantes as compeitções de programação!

## Pré-requisitos

- Docker e Docker Compose
- Acesso ao servidor (VPS ou máquina local) com portas livres (ou proxy reverso)

## 1. Obter o código

```bash
git clone https://github.com/guilhermecoding/happy-melon.git
cd happy-melon
```

## 2. Configurar o ambiente

```bash
cp .env.example .env
```

Edite o `.env`. Valores mínimos:

| Variável | O que definir |
| --- | --- |
| `POSTGRES_PASSWORD` | Senha forte do banco |
| `DATABASE_URL` | Mesma senha; host `postgres` no Compose (`postgresql://postgres:SENHA@postgres:5432/hm-db`) |
| `BETTER_AUTH_SECRET` | Secret forte (`openssl rand -base64 32`) |
| `BETTER_AUTH_URL` | URL pública da API (`https://api.seudominio.com` ou `http://localhost:3000` em teste local) |
| `WEB_ORIGIN` | URL pública do frontend (`https://seudominio.com` ou `http://localhost:3001`) |
| `NEXT_PUBLIC_API_URL` | Mesma URL pública da API (usada pelo browser; entra no **build** da web) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Credenciais do primeiro admin (senha com 8+ caracteres) |
| `ADMIN_NAME` | Nome do admin (opcional; padrão `Admin`) |

Notas:

- Em produção use **HTTPS** nas três URLs (`BETTER_AUTH_URL`, `WEB_ORIGIN`, `NEXT_PUBLIC_API_URL`).
- `POSTGRES_PASSWORD` só é aplicada na **primeira** criação do volume. Para resetar o banco: `docker compose down -v`.
- O Compose já define `INTERNAL_API_URL=http://api:3000` para a web falar com a API dentro da rede Docker.

## 3. Subir a aplicação

```bash
docker compose up -d --build
```

Na primeira subida, se as imagens ainda não existirem, o Compose builda sozinho; `--build` força rebuild.

Aguarde a API ficar saudável (migrations rodam automaticamente no start):

```bash
docker compose ps
docker compose logs -f api
```

Acessos padrão (sem proxy):

- Frontend: `http://localhost:3001` (ou a porta de `WEB_PORT`) - o site do sistema que será interagido pelos os usuários;
- API: `http://localhost:3000` (ou a porta de `API_PORT`) - o backend do sistema, acessado somente pelo site.

## 4. Criar o primeiro administrador

Com a API no ar e `ADMIN_*` preenchidos no `.env`:

```bash
docker compose up -d api
docker compose exec api /app/apps/api/docker-seed-admin.sh
```

Se o script não existir na imagem (build antigo):

```bash
docker compose exec -u root api pnpm --filter api seed:admin
```

## 5. Entrar no sistema

1. Abra a URL do frontend.
2. Em **Sou Administrador**, use o e-mail e a senha do seed.
3. Você deve ser redirecionado para `/admin`.

## 6. Produção (VPS + HTTPS)

1. Complete os passos 1–4 no servidor com URLs HTTPS no `.env`.
2. Coloque um reverse proxy (Caddy ou Nginx) na frente das portas da API e da web, com TLS, apontando para `localhost:3000` (API) e `localhost:3001` (Web).
3. No firewall, exponha preferencialmente só `80`/`443`.
4. Faça backup periódico do volume Docker `pgdata`.

### Checklist

- [ ] Secrets e senhas fortes
- [ ] `DATABASE_URL` coerente com `POSTGRES_PASSWORD`
- [ ] URLs HTTPS alinhadas (`BETTER_AUTH_*`, `WEB_ORIGIN`, `NEXT_PUBLIC_API_URL`)
- [ ] Seed do admin executado
- [ ] Proxy reverso + backup do `pgdata`, cso necessário

## Operação do dia a dia

```bash
docker compose up -d          # subir
docker compose ps             # status
docker compose logs -f api web
docker compose down           # parar (mantém o banco)
docker compose down -v        # parar e apagar dados do Postgres
```

Se mudar `NEXT_PUBLIC_API_URL`, rebuild da web é obrigatório:

```bash
docker compose build --no-cache web
docker compose up -d web
```

Atualize também `BETTER_AUTH_URL` / `WEB_ORIGIN` e reinicie a API: `docker compose up -d api`.
