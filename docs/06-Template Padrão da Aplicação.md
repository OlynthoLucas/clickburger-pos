# Template Padrão da Aplicação

Este documento estabelece o template padrão para as interfaces web (gestão) e mobile (cliente) do sistema ClickBurger, visando garantir uma experiência de usuário consistente, intuitiva e visualmente agradável. Ele abrange a identidade visual, o layout padrão, a responsividade e a iconografia.

## Identidade Visual e Especificações Técnicas

A identidade visual utiliza a família tipográfica **Poppins** para garantir uma leitura moderna e amigável, com uma paleta de cores que equilibra tons de urgência com áreas de descanso visual.

### 1.1 Paleta de Cores (Design System)

| Elemento | Hexadecimal | Aplicação Sugerida |
| :--- | :--- | :--- |
| **Escuro Principal** | `#3A3232` | Texto principal, títulos e ícones da sidebar. |
| **Vermelho Click** | `#D83018` | Logotipo, headers de modais e ações principais. |
| **Laranja Alerta** | `#F07848` | Status intermediários e botões secundários. |
| **Verde Lima** | `#D2EE5E` | Card de "Caixa Aberto" e botões de sucesso ("Pronto"). |
| **Creme Suave** | `#FDFCCE` | Fundos de cards de destaque ou áreas de atenção. |
| **Azul Acinzentado** | `#C0D8D8` | Bordas, divisores e estados desabilitados. |
| **Erro / Perigo** | `#FF4242` | Botões de cancelar, excluir ou mesas com erro. |
| **Amarelo Pastel** | `#FAF4D2` | Background de itens selecionados ou inputs. |
| **Verde Suave** | `#E1EDB9` | Background de confirmações e selos de status. |
| **Off-White** | `#F0F2EB` | Fundo geral da aplicação (Background Canvas). |

### 1.2 Tipografia

* **Fonte:** Poppins (Sans-serif)
* **Bold:** Títulos de seções, Logotipo, Valor total do pedido e números das mesas.
* **Semi Bold:** Subtítulos de modais, nomes de produtos nos cards e rótulos de botões.
* **Regular:** Descrições de produtos, textos de apoio e informações secundárias.

---

## Componentes de Interface (UI)

### 2.1 Botões e Ações
* **Sucesso/Concluir:** Utiliza o `#D2EE5E` (Verde Lima) com texto em `#3A3232` para máximo contraste e feedback positivo.
* **Abertura de Mesa:** Botões em tons de vermelho/laranja (`#D83018` ou `#F07848`) para guiar o fluxo inicial do garçom.
* **Cards de Produto:** Fundo branco puro ou `#F0F2EB` com sombras suaves, destacando a imagem do item.

### 2.2 Hierarquia Visual nos Modais
Os modais de **"Editar Pedido"** seguem uma estrutura lógica:
* **Cabeçalho:** Destaque em `#D83018` com logo em branco para rápida identificação do contexto.
* **Agrupadores:** Ícones circulares em `#D2EE5E` para categorias funcionais (Proteína, Ingredientes).
* **Campos de Seleção:** Checkboxes e inputs com bordas em `#C0D8D8`, mantendo a interface limpa e intuitiva.

---

## Comportamento do Layout

* **Sidebar Adaptativa:** Organização dos módulos de Cozinha, Relatórios e Configurações de forma icônica em tom `#3A3232`.
* **Dashboard de Fluxo:** O topo da tela atua como um "farol visual" em `#D2EE5E`, indicando instantaneamente o status operacional do sistema.
* **KDS (Kitchen Display System):** Exibição de pedidos em colunas claras, garantindo que a equipe de produção visualize cada ingrediente com precisão.

---

### Tecnologias Utilizadas
* React.js
* TypeScript
* Tailwind CSS (Tema Customizado)
* Lucide React (Iconografia)
