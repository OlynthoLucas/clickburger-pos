# Especificações do Projeto

<span style="color:red">Pré-requisitos: <a href="1-Documentação de Contexto.md"> Documentação de Contexto</a></span>

Definição do problema e ideia de solução a partir da perspectiva do usuário. É composta pela definição do  diagrama de personas, histórias de usuários, requisitos funcionais e não funcionais além das restrições do projeto.

Apresente uma visão geral do que será abordado nesta parte do documento, enumerando as técnicas e/ou ferramentas utilizadas para realizar a especificações do projeto

## Personas

**Ricardo Oliveira** tem 42 anos e é **proprietário de uma hamburgueria** de médio porte em expansão. **Ricardo quer profissionalizar a gestão**. Ele precisa de dados para saber qual hambúrguer vende mais e quer reduzir o prejuízo causado por erros de anotação de pedidos que geram desperdício de insumos. Sente que perde o controle do caixa nos dias de movimento intenso e fica frustrado por não ter relatórios claros sobre o desempenho da equipe e das vendas no final do mês.

**Juliana Costa** tem 22 anos, é estudante de pedagogia e **garçonete/atendente part-time**. **Juliana busca agilidade**. Ela quer que o pedido chegue à cozinha sem que ela precise atravessar o salão toda hora, permitindo que ela foque em organizar as mesas e atender bem os clientes. Sofre com a pressão dos clientes quando a cozinha demora ou quando o pedido sai errado por letra ilegível no papel. Sente-se sobrecarregada ao ter que fechar contas complexas manualmente no final da noite.

**Bruno Mendes** tem 28 anos, **desenvolvedor de software**, prefere ambientes modernos e tecnológicos. **Bruno quer autonomia**. Ele gosta de chegar, sentar, ler o cardápio detalhadamente (ver fotos e ingredientes) e fazer o pedido sem ter que esperar o garçom estar disponível. Detesta ter que "caçar" um garçom com o olhar para pedir uma bebida extra ou para solicitar o fechamento da conta. Sente-se inseguro quando não sabe se o seu pedido já entrou em produção.

## Histórias de Usuários

Com base na análise das personas foram identificadas as seguintes histórias de usuários:

|EU COMO...|QUERO/PRECISO...|PARA...|
|--------------------|------------------------------------|----------------------------------------|
|Dono do Negócio|Cadastrar e editar produtos no cardápio digital|Manter os preços atualizados e gerir a disponibilidade de itens.|
|Dono do Negócio|Acessar relatórios de vendas diários e mensais|Tomar decisões baseadas em dados e controlar o faturamento.|
|Dono do Negócio|Definir permissões de acesso ao sistema|Garantir que apenas funcionários autorizados vejam dados financeiros.|
|Atendente|Receber notificações de novos pedidos em tempo real|Iniciar a produção ou conferência sem atrasos comunicativos.|
|Atendente|Alterar o status do pedido (Preparando, Pronto, Entregue)|Manter o cliente informado e organizar o fluxo da cozinha.|
|Atendente|Realizar o fechamento da comanda no sistema|Evitar erros de cálculo e agilizar a liberação da mesa.|
|Cliente|Visualizar o cardápio digital via Tablet|Escolher meus itens com calma e ver imagens reais dos produtos.|
|Cliente|Personalizar meu pedido (ex: remover cebola)|Garantir que o lanche venha exatamente do jeito que eu gosto.|
|Cliente|Acompanhar o status do meu pedido em tempo real|Diminuir a ansiedade da espera e saber quando o pedido está chegando.|
|Cliente|Realizar o pagamento diretamente pela interface digital|Ter mais agilidade na hora de ir embora sem depender de terceiros.|

## Requisitos

As tabelas que se seguem apresentam os requisitos funcionais e não funcionais que detalham o escopo do projeto. Para determinar a prioridade de requisitos, aplicar uma técnica de priorização de requisitos e detalhar como a técnica foi aplicada.

<strong>Crie no mínimo 12 Requisitos funcionais, 6 não funcionais e 3 restrições</strong>
<strong>Cada aluno será responsável pela execução completa (back, web e mobile) de pelo menos 2 requisitos que será acompanhado pelo professor</strong>
### Requisitos Funcionais

|ID    | Descrição do Requisito  | Prioridade | Responsável |
|------|-----------------------------------------|----|----|
|RF-001| O sistema deve permitir cadastrar novos produtos no cardápio digital. | ALTA | Lucas |
|RF-002| O sistema deve permitir editar informações de produtos existentes no cardápio digital (nome, preço, disponibilidade e descrição). | ALTA | Caio |
|RF-003| O sistema deve permitir visualizar relatórios de vendas diários. | ALTA | Daniel |
|RF-004| O sistema deve permitir visualizar relatórios de vendas mensais. | BAIXA | Marco |
|RF-005| O sistema deve permitir definir níveis de permissão de acesso para usuários do sistema. | BAIXA | Emanuel |
|RF-006| O sistema deve permitir receber notificações de novos pedidos em tempo real para os atendentes. | MÉDIA | Matheus |
|RF-007| O sistema deve permitir alterar o status do pedido para “Preparando”. | BAIXA | Lucas |
|RF-008| O sistema deve permitir alterar o status do pedido para “Pronto”. | BAIXA | Caio |
|RF-009| O sistema deve permitir alterar o status do pedido para “Entregue”. | BAIXA | Marco |
|RF-010| O sistema deve permitir realizar o fechamento da comanda no sistema. | MÉDIA | Daniel |
|RF-011| O sistema deve permitir visualizar o cardápio digital no tablet da mesa. | MÉDIA | Lucas |
|RF-012| O sistema deve permitir visualizar imagens dos produtos no cardápio digital. | BAIXA | Emanuel |
|RF-013| O sistema deve permitir personalizar pedidos (ex.: remover ingredientes). | ALTA | Lucas |
|RF-014| O sistema deve permitir visualizar o status do pedido em tempo real pelo cliente. | ALTA | Caio |
|RF-015| O sistema deve permitir realizar pagamento diretamente pela interface digital. | ALTA | Matheus |

### Requisitos não Funcionais

|ID     | Descrição do Requisito  |Prioridade |
|-------|-------------------------|----|
|RNF-001| O sistema deve possuir intuitiva e de fácil uso. | ALTA |
|RNF-002| As paginas devem carregar em 3 segundos | MÉDIA |
|RNF-003| O sistema deve garantir segurança com criptografia e autenticação segura | BAIXA |
|RNF-004| O sistema deve possuir disponibilidade mínima de 99% | MÉDIA |
|RNF-005| A aplicação deve ser responsiva para desktop, tablet e celular | ALTA |
|RNF-006| O sistema deve suportar crescimento de número de usuários | MÉDIA |
|RNF-007| O código deve ser organizado e documentado para facilitar manutenção. | MÉDIA |
|RNF-008| O sistema deve ser compatível com navegadores modernos (Chrome, Edge, Firefox e Opera) | ALTA |
|RNF-009| O sistema deve realizar backup periódico dos dados | MÉDIA |
|RNF-010| A interface deve seguir boas práticas de acessibilidade | BAIXA |

## Restrições

O projeto está restrito pelos itens apresentados na tabela a seguir.

|ID| Restrição                                             |
|--|-------------------------------------------------------|
|01| O projeto deverá ser entregue até o final do semestre |
|02| O sistema deverá possuir três camadas de desenvolvimento: frontend, backend e aplicação mobile. |
|03| A aplicação deverá ser executada em navegadores web modernos, sem necessidade de instalação de software adicional. |
|04| A aplicação mobile deverá ser compatível com tablets utilizados nas mesas dos clientes. |
|05| O backend deverá ser responsável pelo processamento das regras de negócio, armazenamento e gerenciamento de dados. |
|06| O sistema deverá permitir comunicação em tempo real entre frontend, backend e aplicação mobile para atualização de pedidos. |
|07| A equipe de desenvolvimento será composta apenas pelos integrantes Lucas, Caio, Daniel, Marco, Emanuel e Matheus. |
|08| O sistema deverá ser desenvolvido utilizando tecnologias compatíveis com integração entre web, mobile e servidor. |
|09| O projeto deverá seguir as diretrizes acadêmicas da disciplina, incluindo documentação de requisitos, testes e prototipação. |
|10| O sistema deverá funcionar sem integração com sistemas externos de pagamento reais, podendo apenas simular o processo de pagamento.|

## Diagrama de Casos de Uso

O diagrama de casos de uso é o próximo passo após a elicitação de requisitos, que utiliza um modelo gráfico e uma tabela com as descrições sucintas dos casos de uso e dos atores. Ele contempla a fronteira do sistema e o detalhamento dos requisitos funcionais com a indicação dos atores, casos de uso e seus relacionamentos. 

As referências abaixo irão auxiliá-lo na geração do artefato “Diagrama de Casos de Uso”.

> **Links Úteis**:
> - [Criando Casos de Uso](https://www.ibm.com/docs/pt-br/elm/6.0?topic=requirements-creating-use-cases)
> - [Como Criar Diagrama de Caso de Uso: Tutorial Passo a Passo](https://gitmind.com/pt/fazer-diagrama-de-caso-uso.html/)
> - [Lucidchart](https://www.lucidchart.com/)
> - [Astah](https://astah.net/)
> - [Diagrams](https://app.diagrams.net/)


# Gerenciamento de Projeto

De acordo com o PMBoK v6 as dez áreas que constituem os pilares para gerenciar projetos, e que caracterizam a multidisciplinaridade envolvida, são: Integração, Escopo, Cronograma (Tempo), Custos, Qualidade, Recursos, Comunicações, Riscos, Aquisições, Partes Interessadas. Para desenvolver projetos um profissional deve se preocupar em gerenciar todas essas dez áreas. Elas se complementam e se relacionam, de tal forma que não se deve apenas examinar uma área de forma estanque. É preciso considerar, por exemplo, que as áreas de Escopo, Cronograma e Custos estão muito relacionadas. Assim, se eu amplio o escopo de um projeto eu posso afetar seu cronograma e seus custos.

## Gestão de Tempo

<img width="1200" height="600" alt="cronograma geral" src="https://github.com/user-attachments/assets/b1f72308-de76-4291-8b68-077513853f58" />


## Gestão de Equipe

A equipe foi organizada, conforme abaixo, da seguinte maneira:

- **Scrum Master:** Daniel Salinas de Souza
- **Product Owner:** Emanuel Antonio Mendonça Raimundo


  **Equipe de Desenvolvimento:**
  * Daniel Salinas de Souza
  * Emanuel Antonio Mendonça Raimundo
  * Lucas Olyntho Silva
  * Caio Augusto de Carvalho Rosa
  * Matheus Henrique Castiglieri Okamoto
  * Marco Aurélio Velozo Costa Sodré


## Gestão de Orçamento

O presente detalhamento visa consolidar os custos necessários para a digitalização do atendimento de uma operação com 10 unidades de consumo (mesas). O projeto divide-se em ativos imobilizados (CAPEX) e custos operacionais recorrentes (OPEX).

Investimento Inicial (CAPEX)
Compreende a aquisição de hardware, infraestrutura de rede local e licenciamento inicial do software.

Custos Operacionais Estimados (OPEX)
Valores mensais destinados à manutenção da licença de uso e fundo de reserva para depreciação de periféricos.


| Item de Investimento | Tipo de Gasto | Qtd | Valor Unitário (R$) | Valor Total (R$) |
| :--- | :--- | :---: | :---: | :---: |
| Tablets Android (Linha Intermediária) | Hardware (Único) | 10 | 1.100,00 | 11.000,00 |
| Suportes Articulados/Antifurto | Hardware (Único) | 10 | 250,00 | 2.500,00 |
| Roteadores Mesh (Infra de Rede) | Infra (Único) | 2 | 450,00 | 900,00 |
| Taxa de Implantação e Configuração | Software (Único) | 1 | 1.500,00 | 1.500,00 |
| **SUBTOTAL (Investimento Inicial)** | --- | --- | --- | **15.900,00** |
| Mensalidade do Software | Recorrente | 1 | 450,00 | 450,00 |
| Reserva de Manutenção (Cabos/Telas) | Recorrente | 1 | 100,00 | 100,00 |
| **CUSTO MENSAL ESTIMADO** | --- | --- | --- | **550,00** |

Visamos futuras adaptações para melhor performace do projeto.


