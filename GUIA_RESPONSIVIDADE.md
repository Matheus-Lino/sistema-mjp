# Guia de Responsividade - MJP Oficina

## 📱 Breakpoints Implementados

O projeto está configurado com os seguintes breakpoints:

### 1. **Mobile** (< 480px)
- Telas muito pequenas (celulares básicos)
- Layout vertical com sidebar em forma de abas horizontais
- Navbar compacta com altura reduzida

### 2. **Small Tablet** (480px - 767px)
- Tablets pequenos e celulares grandes
- Sidebar ainda em abas horizontais
- Elementos começam a se adaptar para dois em linha

### 3. **Tablet** (768px - 1023px)
- Tablets padrão
- Sidebar volta ao layout lateral (200px)
- Conteúdo começa a utilizar 2 colunas

### 4. **HD Desktop** (1024px - 1366px)
- Telas em resolução HD (1280x720, etc)
- Layout completo com sidebar de 220px
- Conteúdo em 3 colunas

### 5. **TV / Large Screen** (1367px+)
- TVs e monitores grandes
- Sidebar expandida (280px)
- Conteúdo em 4 colunas
- Fontes maiores para melhor leitura

## 🎯 Classes Utilitárias

### Classes de Visibilidade Responsiva

```jsx
// Esconde em mobile (< 768px)
<div className="hide-mobile">Conteúdo</div>

// Mostra apenas em mobile
<div className="show-mobile-only">Conteúdo Mobile</div>
```

### Classes Tailwind Já Configuradas

```jsx
// Esconder em breakpoints específicos
<div className="hidden sm:block">Visível em Small (≥640px)</div>
<div className="hidden md:block">Visível em Medium (≥768px)</div>
<div className="hidden lg:block">Visível em Large (≥1024px)</div>

// Mostrar em breakpoints específicos
<div className="block sm:hidden">Só Mobile</div>
<div className="block md:hidden">Só até Tablet Small</div>
```

## 📐 Variáveis CSS

A altura da navbar é dinâmica:

```css
:root {
  --navbar-height: 72px;  /* Muda conforme breakpoint */
}

/* Usar em elementos que precisam se adaptar */
max-height: calc(100vh - var(--navbar-height));
```

## 🎨 Componentes Responsivos Já Configurados

### Navbar
- ✅ Logo e título se adaptam
- ✅ Seletor de oficina se esconde em mobile
- ✅ Mensagem de boas-vindas responsiva
- ✅ Avatar redimensiona

### Sidebar
- ✅ Em mobile: horizontal (menu em abas)
- ✅ Em tablet+: vertical (menu lateral)
- ✅ Texto se adapta
- ✅ Ícones redimensionam

### Dashboard Cards
- ✅ Em mobile: 1 coluna, width 100%
- ✅ Em tablet: 2 colunas
- ✅ Em desktop: 3-4 colunas
- ✅ Tamanho das fontes se adapta

### Tabelas
- ✅ Overflow horizontal em mobile
- ✅ Fonts reduzem em telas pequenas
- ✅ Padding ajustado

### Forms
- ✅ Inputs com font-size 16px em mobile (previne zoom)
- ✅ Textarea se adapta
- ✅ Buttons com tamanho tátil (min 44px em touch)

## 🚀 Como Usar em Novos Componentes

### Exemplo 1: Grid Responsivo

```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <div>Card 1</div>
  <div>Card 2</div>
  <div>Card 3</div>
</div>
```

### Exemplo 2: Flex com Wrapping

```jsx
<div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
  <div>Esquerda</div>
  <div>Direita</div>
</div>
```

### Exemplo 3: Conteúdo Condicional

```jsx
// Use as classes hide-mobile e show-mobile-only
<div className="hide-mobile">Conteúdo Desktop</div>
<div className="show-mobile-only">Conteúdo Mobile</div>
```

### Exemplo 4: Padding/Margin Responsivo

```jsx
<div className="p-4 sm:p-6 md:p-8 lg:p-12">
  Padding se adapta ao tamanho da tela
</div>

<div className="mb-4 sm:mb-6 md:mb-8">
  Margin se adapta
</div>
```

## 🔍 Testando Responsividade

### No Navegador (DevTools)
1. Pressione `F12` para abrir DevTools
2. Clique no ícone de dispositivo (ou Ctrl+Shift+M)
3. Teste diferentes resoluções:
   - iPhone SE: 375x812
   - iPad: 768x1024
   - Desktop: 1920x1080
   - TV: 1920x1440

### Resoluções Recomendadas para Testar
- 375x667 - Mobile padrão
- 480x800 - Small Tablet
- 768x1024 - Tablet
- 1280x720 - HD/TV (como especificado)
- 1920x1080 - Full HD
- 2560x1440 - 4K

## 📝 Arquivos Modificados

- ✅ `src/App.css` - Layout base responsivo
- ✅ `src/responsive.css` - Media queries completas
- ✅ `src/main.jsx` - Importação do CSS responsivo
- ✅ `src/layout/Navbar.jsx` - Navbar responsiva
- ✅ `index.html` - Viewport meta tag (já estava)

## 💡 Dicas Importantes

1. **Mobile First**: Os estilos base são para mobile, media queries adicionam estilos para telas maiores
2. **Tailwind**: O projeto usa Tailwind CSS, então prefira classes `sm:`, `md:`, `lg:` quando possível
3. **Viewport**: Nunca remova a meta viewport do `index.html`
4. **Scroll**: Em mobile, o sidebar vira horizontal para não ocupar espaço vertical
5. **Touch**: Botões têm min-height de 44px em dispositivos touch para facilitar cliques

## 🐛 Troubleshooting

### Conteúdo aparecendo cortado
- Verifique `overflow-x: hidden` está aplicado
- Confirme `box-sizing: border-box` está definido

### Sidebar não aparecendo
- Em mobile, está configurado para ser horizontal
- Verifique classe `sidebar-fixed` em Sidebar.jsx

### Navbar muito grande/pequena
- A altura muda com breakpoints
- Verifique a variável `--navbar-height` em App.css

### Elementos não se adaptando
- Verifique se está usando classes Tailwind (`sm:`, `md:`, `lg:`)
- Ou adicione media queries específicas no `responsive.css`

## 📊 Estrutura de Pontos de Parada

```
Mobile      Small Tab   Tablet      HD          TV
|------|    |-------|   |-------|   |--------|  |----------|
< 480px    480-767px   768-1023px  1024-1366px  1367px+

480x854    600x800    768x1024    1280x720    1920x1080
iPhone    Android    iPad        1280x720    Smart TV
```
