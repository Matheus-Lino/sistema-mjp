# 🚀 Guia de Deploy - MJP Oficina

## 📋 Índice
1. [Deploy do Banco de Dados (TiDB Cloud)](#1-deploy-do-banco-de-dados-tidb-cloud)
2. [Deploy do Back-end (Vercel/Render/Railway)](#2-deploy-do-back-end)
3. [Deploy do Front-end (Vercel)](#3-deploy-do-front-end-vercel)
4. [Configurações Finais](#4-configurações-finais)

---

## 1. Deploy do Banco de Dados (TiDB Cloud)

### Passo 1: Criar conta no TiDB Cloud
1. Acesse: https://tidbcloud.com/
2. Crie uma conta gratuita (Free Tier)
3. Crie um novo cluster:
   - Nome: `mjp-oficina-db`
   - Cloud Provider: AWS (ou sua preferência)
   - Region: Selecione a mais próxima (ex: us-east-1)
   - Cluster Tier: Developer Tier (Free)

### Passo 2: Configurar o cluster
1. Aguarde a criação do cluster (2-5 minutos)
2. Clique em "Connect"
3. Copie as informações de conexão:
   - Host: `gateway01.us-east-1.prod.aws.tidbcloud.com`
   - Port: `4000`
   - User: `<seu_usuario>`
   - Password: `<sua_senha>`

### Passo 3: Importar o banco de dados
1. Usando MySQL Workbench ou DBeaver:
   ```
   Host: <host_do_tidb>
   Port: 4000
   User: <seu_usuario>
   Password: <sua_senha>
   SSL: Enable
   ```

2. Execute o script de criação do banco:
   ```sql
   -- Executar o arquivo: back-end/MIGRATION_SIMPLES.sql ou migration.sql
   ```

3. Ou via terminal:
   ```bash
   cd back-end
   # Edite o arquivo .env com as credenciais do TiDB
   python aplicar_migration.py
   ```

### Passo 4: Anotar credenciais
Salve estas informações (você precisará no deploy do back-end):
```
DB_USER=<seu_usuario_tidb>
DB_PASSWORD=<sua_senha_tidb>
DB_HOST=<host_do_tidb>
DB_PORT=4000
DB_DATABASE=oficina_mjp
```

---

## 2. Deploy do Back-end

### Opção A: Vercel (Recomendado para este projeto)

#### Passo 1: Preparar repositório
```bash
# Commitar as mudanças
git add .
git commit -m "Preparar para deploy"
git push origin main
```

#### Passo 2: Deploy na Vercel
1. Acesse: https://vercel.com/
2. Faça login com GitHub
3. Clique em "Add New" → "Project"
4. Selecione o repositório `mjp-oficina`
5. Configure:
   - **Framework Preset**: Other
   - **Root Directory**: `back-end`
   - **Build Command**: Deixe vazio
   - **Output Directory**: Deixe vazio

#### Passo 3: Configurar variáveis de ambiente
No painel da Vercel, vá em "Settings" → "Environment Variables" e adicione:

```
DB_USER=<seu_usuario_tidb>
DB_PASSWORD=<sua_senha_tidb>
DB_HOST=<host_do_tidb>
DB_PORT=4000
DB_DATABASE=oficina_mjp
DB_AUTOCOMMIT=True
DB_SSL_VERIFY=True
DB_SSL_VERIFY_IDENTITY=True
FLASK_DEBUG=False
FLASK_ENV=production
FRONTEND_URL=https://seu-app.vercel.app
```

#### Passo 4: Deploy
1. Clique em "Deploy"
2. Aguarde o build
3. Copie a URL do backend: `https://seu-backend.vercel.app`

### Opção B: Render.com (Alternativa gratuita)

1. Acesse: https://render.com/
2. Crie uma conta
3. Clique em "New" → "Web Service"
4. Conecte seu repositório GitHub
5. Configure:
   - **Name**: `mjp-oficina-backend`
   - **Root Directory**: `back-end`
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app`
6. Adicione as mesmas variáveis de ambiente do TiDB
7. Clique em "Create Web Service"

### Opção C: Railway.app

1. Acesse: https://railway.app/
2. Crie uma conta
3. Clique em "New Project" → "Deploy from GitHub repo"
4. Selecione o repositório
5. Configure:
   - **Root Directory**: `/back-end`
   - Adicione as variáveis de ambiente do TiDB
6. Railway detectará automaticamente Python e fará o deploy

---

## 3. Deploy do Front-end (Vercel)

### Passo 1: Criar arquivo .env
Crie um arquivo `.env` na raiz do projeto:
```
VITE_API_URL=https://seu-backend.vercel.app
```

### Passo 2: Deploy na Vercel

#### Via GitHub (Recomendado)
1. Acesse: https://vercel.com/
2. Clique em "Add New" → "Project"
3. Selecione o repositório `mjp-oficina`
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (raiz do projeto)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

#### Passo 3: Configurar variáveis de ambiente
No painel da Vercel, adicione:
```
VITE_API_URL=https://seu-backend.vercel.app
```

#### Passo 4: Deploy
1. Clique em "Deploy"
2. Aguarde o build (2-3 minutos)
3. Copie a URL do front-end: `https://seu-app.vercel.app`

#### Via CLI (Alternativa)
```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Seguir as instruções no terminal
```

---

## 4. Configurações Finais

### Atualizar CORS no Back-end
1. Acesse o painel da Vercel do back-end
2. Vá em "Settings" → "Environment Variables"
3. Atualize `FRONTEND_URL` com a URL real do front-end:
   ```
   FRONTEND_URL=https://seu-app.vercel.app
   ```
4. Clique em "Redeploy" para aplicar as mudanças

### Testar a aplicação
1. Acesse o front-end: `https://seu-app.vercel.app`
2. Faça login com as credenciais configuradas no banco
3. Verifique se todas as funcionalidades estão funcionando

---

## 🔧 Troubleshooting

### Erro de conexão com o banco
- Verifique se as credenciais do TiDB estão corretas
- Confirme que `DB_PORT=4000`
- Verifique se `DB_SSL_VERIFY=True`

### Erro de CORS
- Verifique se `FRONTEND_URL` está configurado no back-end
- Confirme que a URL não tem `/` no final
- Faça um redeploy do back-end após alterar variáveis

### Erro 404 no front-end
- Verifique se o arquivo `vercel.json` está na raiz
- Confirme que a configuração de rotas está correta
- Tente fazer um redeploy

### Erro de build no Vercel
- Verifique se todas as dependências estão no `package.json`
- Confirme que o comando `npm run build` funciona localmente
- Verifique os logs de build no painel da Vercel

---

## 📝 Checklist de Deploy

### Banco de Dados
- [ ] Cluster TiDB Cloud criado
- [ ] Banco de dados importado
- [ ] Credenciais anotadas

### Back-end
- [ ] Código commitado no GitHub
- [ ] Deploy realizado (Vercel/Render/Railway)
- [ ] Variáveis de ambiente configuradas
- [ ] URL do back-end copiada
- [ ] Teste de API funcionando

### Front-end
- [ ] Variável `VITE_API_URL` configurada
- [ ] Deploy realizado na Vercel
- [ ] URL do front-end copiada
- [ ] Login funcionando
- [ ] Todas as funcionalidades testadas

### Configurações Finais
- [ ] CORS configurado com URL correta
- [ ] Aplicação testada em produção
- [ ] URLs salvas em local seguro

---

## 🎉 Deploy Completo!

Sua aplicação agora está online e acessível em:
- **Front-end**: https://seu-app.vercel.app
- **Back-end**: https://seu-backend.vercel.app
- **Banco de Dados**: TiDB Cloud

---

## 📚 Recursos Úteis

- [Documentação TiDB Cloud](https://docs.pingcap.com/tidbcloud/)
- [Documentação Vercel](https://vercel.com/docs)
- [Documentação Render](https://render.com/docs)
- [Documentação Railway](https://docs.railway.app/)

---

## 🔄 Atualizações Futuras

Para atualizar a aplicação após o deploy inicial:

1. **Faça as alterações no código localmente**
2. **Commit e push para o GitHub**:
   ```bash
   git add .
   git commit -m "Descrição da atualização"
   git push origin main
   ```
3. **A Vercel fará o deploy automático!**

Tanto o front-end quanto o back-end serão automaticamente reconstruídos e implantados quando você fizer push para o branch main.
