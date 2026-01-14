# GUIA DE IMPLEMENTAÇÃO: MULTI-TENANCY (MÚLTIPLAS OFICINAS)

## 📋 PASSOS PARA IMPLEMENTAR

### 1. EXECUTAR MIGRATION NO BANCO DE DADOS
```bash
# No MySQL Workbench ou terminal MySQL:
mysql -u root -p oficina_mjp < migration.sql

# OU execute manualmente o conteúdo do arquivo migration.sql
```

### 2. SUBSTITUIR database.py
```bash
# Faça backup do database.py atual:
cp database.py database_old.py

# Copie o novo arquivo:
cp database_new.py database.py
```

### 3. ATUALIZAR BACKEND - ADICIONAR ENDPOINTS RESTANTES

O arquivo database_new.py contém os primeiros endpoints atualizados.
Você precisa adicionar os seguintes endpoints com filtro de oficina_id:

#### SERVIÇOS (POST, PUT, DELETE)
- Adicionar `oficina_id` em INSERT
- Filtrar por `oficina_id` em UPDATE/DELETE

#### PEÇAS (GET, POST, PUT, DELETE)
- Adicionar `oficina_id` em todas as queries

#### ORDENS DE SERVIÇO (GET, POST, PUT, DELETE)
- Adicionar `oficina_id` em todas as queries
- Importante: juntar com outras tabelas sempre validando oficina_id

#### FINANCEIRO (GET, POST, PUT, DELETE)
- Adicionar `oficina_id` em todas as queries

#### USUÁRIOS (GET, POST, PUT, DELETE, LOGIN)
- **LOGIN**: retornar `oficina_id` do usuário
- **POST**: vincular novo usuário à oficina
- **GET**: filtrar usuários da mesma oficina

#### DASHBOARD
- Filtrar todos os dados por `oficina_id`

### 4. ATUALIZAR FRONTEND - AuthContext

Modificar `src/context/AuthContext.jsx`:
```jsx
const login = (name, departamento, email, oficina, oficina_id) => {
  const payload = { name, departamento, email, oficina, oficina_id };
  localStorage.setItem("auth-user", JSON.stringify(payload));
  setUser(payload);
};
```

### 5. ATUALIZAR FRONTEND - Componentes

Modificar TODOS os componentes para enviar `oficina_id`:

#### Clientes.jsx
```jsx
const { user } = useAuth();

// GET
fetch(`http://localhost:5000/clientes?oficina_id=${user.oficina_id}`)

// POST
fetch('http://localhost:5000/clientes', {
  method: 'POST',
  body: JSON.stringify({ ...data, oficina_id: user.oficina_id })
})

// PUT
fetch(`http://localhost:5000/clientes/${id}`, {
  method: 'PUT',
  body: JSON.stringify({ ...data, oficina_id: user.oficina_id })
})

// DELETE
fetch(`http://localhost:5000/clientes/${id}?oficina_id=${user.oficina_id}`, {
  method: 'DELETE'
})
```

Repetir o mesmo padrão para:
- Veiculos.jsx
- Servicos.jsx
- Pecas.jsx
- Ordem_Servico.jsx
- Financeiro.jsx
- Usuarios.jsx
- Dashboards.jsx

### 6. CRIAR FLUXO DE CADASTRO DE OFICINA

Modificar `Login.jsx` para adicionar um novo step:

```jsx
// Sequência: departamento → cadastrar_oficina → login/cadastro

// Se não tem oficina cadastrada, redireciona para criar oficina
// Após criar oficina, permite criar primeiro usuário admin
```

### 7. TESTAR O SISTEMA

1. **Limpar dados antigos** (opcional):
   ```sql
   TRUNCATE TABLE clientes;
   TRUNCATE TABLE veiculos;
   TRUNCATE TABLE ordens_servico;
   -- etc...
   ```

2. **Criar primeira oficina**:
   - Acessar tela de login
   - Criar nova oficina "Oficina A"
   - Criar usuário admin para Oficina A

3. **Criar segunda oficina**:
   - Fazer logout
   - Criar nova oficina "Oficina B"
   - Criar usuário admin para Oficina B

4. **Validar isolamento**:
   - Logar como Oficina A → adicionar clientes
   - Logar como Oficina B → verificar que NÃO vê clientes da Oficina A

## ⚠️ PONTOS DE ATENÇÃO

### SEGURANÇA
- **NUNCA** confie apenas no frontend
- Backend SEMPRE deve validar `oficina_id`
- Usuário da Oficina A **NÃO PODE** ver dados da Oficina B

### QUERIES CORRETAS
```python
# ❌ ERRADO - retorna todos os clientes
SELECT * FROM clientes WHERE id = ?

# ✅ CORRETO - retorna só da oficina do usuário
SELECT * FROM clientes WHERE id = ? AND oficina_id = ?
```

### JOINS COM VALIDAÇÃO
```python
# ❌ ERRADO
SELECT * FROM ordens_servico os
JOIN veiculos v ON v.id = os.veiculo_id

# ✅ CORRETO
SELECT * FROM ordens_servico os
JOIN veiculos v ON v.id = os.veiculo_id AND v.oficina_id = ?
WHERE os.oficina_id = ?
```

## 📊 ESTRUTURA FINAL

```
oficinas (1)
  └─── usuarios (N)
  └─── clientes (N)
  └─── veiculos (N)
  └─── servicos (N)
  └─── pecas (N)
  └─── ordens_servico (N)
  └─── financeiro (N)
```

## 🚀 PRÓXIMOS PASSOS (OPCIONAL)

1. **Planos/Assinaturas**: Diferentes oficinas pagam valores diferentes
2. **Limite de usuários**: Cada oficina tem um número máximo de usuários
3. **Backup individual**: Exportar dados de uma oficina específica
4. **Relatórios por oficina**: Analytics isolados por oficina
5. **Multi-domínio**: oficina-a.seusite.com, oficina-b.seusite.com

---

**IMPORTANTE**: Sempre teste em ambiente de desenvolvimento antes de aplicar em produção!
