# 🧪 GUIA RÁPIDO DE TESTE - MULTI-TENANCY

## PASSO 1: INICIAR O SISTEMA

### Terminal 1 - Backend (Python):
```bash
cd back-end
python app.py
```
✅ Deve mostrar: `Running on http://127.0.0.1:5000`

### Terminal 2 - Frontend (React):
```bash
npm run dev
```
✅ Deve mostrar: `http://localhost:5173`

---

## PASSO 2: CRIAR OFICINA A

1. **Acesse:** http://localhost:5173
2. **Selecione:** Departamento "Administração"
3. **Clique:** "Cadastrar novo usuário"
4. **Preencha Oficina:**
   - Nome: `Oficina Auto Center`
   - (CNPJ, telefone, etc são opcionais)
5. **Clique:** "Criar Oficina e Continuar"
6. **Cadastrar Usuário:**
   - Nome: `João Silva`
   - Email: `joao@oficinaA.com`
   - Cargo: `Administrador`
   - Senha: `123456`
7. **Clique:** "Cadastrar e Entrar"

✅ Você está logado como João na Oficina Auto Center!

---

## PASSO 3: ADICIONAR DADOS DA OFICINA A

### Clientes:
1. Menu lateral → Clientes
2. Clique "+ Novo Cliente"
3. Adicione 2-3 clientes:
   - Cliente 1: Maria Silva
   - Cliente 2: Pedro Santos
   - Cliente 3: Ana Costa

### Veículos:
1. Menu lateral → Veículos
2. Adicione 2 veículos:
   - ABC-1234 (Honda Civic 2020)
   - XYZ-5678 (Toyota Corolla 2021)

### Serviços:
1. Menu lateral → Serviços
2. Verifique que existem serviços cadastrados

### Ordem de Serviço:
1. Menu lateral → Ordem de Serviço
2. Crie uma ordem para um dos clientes

---

## PASSO 4: CRIAR OFICINA B (TESTE DE ISOLAMENTO)

1. **Logout:** Clique em "Sair" no canto superior direito
2. **Selecione:** Departamento "Administração"
3. **Clique:** "Cadastrar novo usuário"
4. **Preencha Oficina:**
   - Nome: `Oficina do Pedro`
5. **Clique:** "Criar Oficina e Continuar"
6. **Cadastrar Usuário:**
   - Nome: `Pedro Santos`
   - Email: `pedro@oficinaB.com`
   - Cargo: `Gerente`
   - Senha: `123456`
7. **Clique:** "Cadastrar e Entrar"

✅ Você está logado como Pedro na Oficina do Pedro!

---

## PASSO 5: VERIFICAR ISOLAMENTO ✅

### ❌ O que NÃO deve aparecer na Oficina B:
- Clientes da Oficina A (Maria, Pedro Santos, Ana)
- Veículos da Oficina A (ABC-1234, XYZ-5678)
- Ordens de serviço da Oficina A

### ✅ O que deve aparecer:
- Lista vazia de clientes
- Lista vazia de veículos
- Lista vazia de ordens

**Se aparecer vazio = TESTE PASSOU! ✅**

---

## PASSO 6: ADICIONAR DADOS NA OFICINA B

### Clientes:
1. Adicione clientes diferentes:
   - Cliente 1: Carlos Lima
   - Cliente 2: Fernanda Rocha

### Veículos:
1. Adicione veículos diferentes:
   - DEF-9999 (Fiat Uno 2019)

---

## PASSO 7: ALTERNAR ENTRE OFICINAS

### Testar Oficina A:
1. **Logout** da Oficina B
2. **Login:**
   - Departamento: Administração
   - Email: `joao@oficinaA.com`
   - Senha: `123456`
3. **Verificar:**
   - ✅ Deve ver Maria, Pedro Santos, Ana (clientes)
   - ✅ Deve ver ABC-1234, XYZ-5678 (veículos)
   - ❌ NÃO deve ver Carlos Lima, Fernanda Rocha
   - ❌ NÃO deve ver DEF-9999

### Testar Oficina B:
1. **Logout** da Oficina A
2. **Login:**
   - Departamento: Administração
   - Email: `pedro@oficinaB.com`
   - Senha: `123456`
3. **Verificar:**
   - ✅ Deve ver Carlos Lima, Fernanda Rocha (clientes)
   - ✅ Deve ver DEF-9999 (veículo)
   - ❌ NÃO deve ver Maria, Pedro Santos, Ana
   - ❌ NÃO deve ver ABC-1234, XYZ-5678

---

## ✅ CHECKLIST DE VALIDAÇÃO

- [ ] Backend iniciou sem erros
- [ ] Frontend iniciou sem erros
- [ ] Consegui criar Oficina A
- [ ] Consegui criar usuário da Oficina A
- [ ] Consegui fazer login na Oficina A
- [ ] Consegui adicionar clientes/veículos na Oficina A
- [ ] Consegui criar Oficina B
- [ ] Consegui criar usuário da Oficina B
- [ ] Consegui fazer login na Oficina B
- [ ] Oficina B NÃO vê dados da Oficina A ✅
- [ ] Oficina A NÃO vê dados da Oficina B ✅
- [ ] Dashboard mostra apenas dados da oficina logada
- [ ] Financeiro mostra apenas dados da oficina logada

---

## 🐛 PROBLEMAS COMUNS

### "Cannot read property 'oficina_id' of null"
**Solução:** Faça logout e login novamente

### "oficina_id é obrigatório"
**Solução:** Verifique se o usuário tem oficina_id no banco:
```sql
SELECT id, nome, email, oficina_id FROM usuarios;
```

### Dados aparecem misturados entre oficinas
**Solução:** Execute novamente o script de migration:
```bash
python aplicar_migration.py
```

---

## 🎉 TESTE PASSOU?

Se conseguiu fazer todos os passos e os dados estão isolados:

**✅ PARABÉNS! Seu sistema multi-tenancy está funcionando perfeitamente!**

Agora você pode vender este sistema para múltiplas oficinas com segurança total de isolamento de dados! 🚀
