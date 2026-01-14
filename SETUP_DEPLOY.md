# 🚀 SETUP DO PROJETO - INSTRUÇÕES DE DEPLOY

## ✅ Pré-requisitos

- Python 3.8+
- Node.js 16+
- MySQL 8.0+
- Git

## 📋 Passo 1: Clonar e Configurar Backend

```bash
cd back-end
pip install -r requirements.txt
```

## 🔐 Passo 2: Configurar Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar .env com suas credenciais
# Abrir e preencher:
# DB_USER=seu_usuario
# DB_PASSWORD=sua_senha
# DB_HOST=localhost
# DB_DATABASE=oficina_mjp
# FLASK_DEBUG=False
# FLASK_ENV=production
```

**IMPORTANTE**: Nunca faça commit do arquivo `.env`

## 🗄️ Passo 3: Criar Banco de Dados

```bash
# Executar migrações
python aplicar_migration.py

# Ou importar manualmente em MySQL:
mysql -u root -p oficina_mjp < MIGRATION_SIMPLES.sql
```

## 🔐 Passo 4: Migrar Senhas Antigas (Se houver usuários criados antes)

```bash
python migrate_passwords.py
```

Isso converterá todas as senhas em texto plano para hash bcrypt.

## 🎨 Passo 5: Configurar Frontend

```bash
npm install
```

## 🚀 Passo 6: Rodar em Desenvolvimento

### Terminal 1 - Backend
```bash
cd back-end
python app.py
# Backend rodando em http://localhost:5000
```

### Terminal 2 - Frontend
```bash
npm run dev
# Frontend rodando em http://localhost:5173
```

## 📦 Passo 7: Build para Produção

### Frontend
```bash
npm run build
# Gera pasta 'dist/' pronta para deploy
```

### Backend
```bash
# Usar um servidor WSGI como Gunicorn
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

## 🔍 Verificação de Segurança

Antes de fazer deploy, verifique:

- [ ] Arquivo `.env` foi criado com credenciais reais
- [ ] `.env` está no `.gitignore`
- [ ] Executou `python migrate_passwords.py`
- [ ] Testou login com senha hasheada
- [ ] Console do navegador está limpo (sem console.logs)
- [ ] `FLASK_DEBUG=False` no arquivo `.env`
- [ ] Senhas não aparecem em logs

## 📊 Estrutura do Banco de Dados

```
oficina_mjp
├── oficinas           (Multi-tenancy)
├── usuarios           (Hasheadas com bcrypt)
├── clientes
├── veiculos
├── ordens_servico
├── ordem_servico_servicos  (Relacionamento M:M)
├── servicos
├── pecas
└── financeiro
```

## 🆘 Troubleshooting

### "ModuleNotFoundError: No module named 'bcrypt'"
```bash
pip install bcrypt
```

### "Error loading .env file"
```bash
# Verifique se o arquivo .env existe
ls -la back-end/.env
```

### "Can't connect to MySQL server"
```bash
# Verificar credenciais em .env
# Verificar se MySQL está rodando
# No Windows: net start MySQL80
# No Linux: sudo systemctl start mysql
```

### Senhas antigas não funcionam
```bash
# Execute o script de migração
python back-end/migrate_passwords.py
```

---

**Última atualização**: 13/01/2026
**Versão**: 1.0.0
**Status**: Production Ready ✅
