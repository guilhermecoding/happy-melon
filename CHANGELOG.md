# Changelog

Todas as mudanças notáveis deste projeto serão documentadas neste arquivo.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [1.4.0] - 2026-09-17

### Added

- Competição com **rodadas** (ex.: Aquecimento e Prova), cada uma com início, término e, se quiser, congelamento do placar.
- **Chefes de sala**: cadastro por nome e e-mail, login no mesmo fluxo do administrador, com acesso a colaboradores e tarefas em todas as rodadas.
- Aviso de **Placar Congelado** nos últimos minutos da rodada, para administradores, chefes e colaboradores.
- Cronômetro no intervalo entre rodadas, indicando qual encerrou e quando a próxima começa.
- Exclusão de rodada, com confirmação pela senha do administrador.
- Entrega no lobby por **deslize para confirmar**, com tempo restante (MM:SS) quando há timeout e fechamento automático ao esgotar.

### Changed

- Prova e Tarefas passam a ser por rodada. Confirmar balões e encaminhar impressões só vale durante o horário da rodada.
- A confirmação de entrega saiu do card do lobby e foi para os detalhes do time.
- O selo Habilitada / Desabilitada saiu da lista e do cadastro da competição. O interruptor **Acesso dos colaboradores** continua no QR e no código.
- README atualizado: como a maratona funciona (rodadas e chefes) e o passo a passo de instalação, inclusive HTTPS.

### Fixed

- Tela de espera e de rodada em andamento não se sobrepõem mais no countdown da competição.

## [1.3.0] - 2026-08-29

### Added

- Cor de balão Marrom (`#A3794D`) na paleta da API e do web, inclusive no select de criar e editar questão.
- Arrastar para baixo para fechar o Dialog no mobile (alça no topo do sheet).
- Toast informativo em tempo real quando outro colaborador pega uma tarefa, com o primeiro nome de quem reivindicou.

### Changed

- Duração da sessão passou de 1 dia para 7 dias, com renovação a cada 1 hora de uso.

### Fixed

- Logout intermitente ao voltar para o app ou trocar de tela: falha transitória de `get-session` deixa de ser tratada como sessão encerrada.

## [1.2.0] - 2026-08-21

### Added

- Componente QRCode reutilizável, com logo, estilo de pontos e cantos configuráveis.

### Changed

- QR Code de acesso dos colaboradores passou a usar o novo componente estilizado e se ajusta à largura da tela.
- Versão do aplicativo (`APP_VERSION`) passou a ser lida de forma centralizada em `@repo/shared`, a partir do `package.json` da raiz.
- Toast ao pegar uma tarefa no lobby do colaborador passou a ser informativo, em vez de sucesso.

## [1.1.0] - 2026-08-15

### Added

- Mensagens de toast aleatórias ao pegar e ao entregar tarefas no lobby do colaborador.
- Coluna de índice na listagem de colaboradores, para facilitar a navegação na tabela.

### Changed

- Sessão de login passa a durar 1 dia (antes o padrão do Better Auth era 7 dias).
- Listagem de colaboradores exibe 6 itens por página, em vez de 5.
- Cor padrão do balão na criação de questão alterada para amarelo.
- Ícones de entrar (botão do login) e de sair (menu do usuário) atualizados.

## [1.0.2] - 2026-08-15

### Added

- Aba Score na página de colaboradores, com ranking por entregas e tempo total de entrega.
- Paginação na listagem de pontuações dos colaboradores.
- Painel geral de colaboradores reorganizado: lista, controle de acesso e ajustes da competição.
- Barra de progresso no topo da página durante a navegação (`nextjs-toploader`).
- Animações de entrada na fila, no lobby e no histórico de tarefas, com respeito a `prefers-reduced-motion`.
- Componentes Accordion, Tabs e Collapsible no Pouf UI.

### Changed

- Página de colaboradores passou a usar abas (Geral e Score), com a aba ativa alinhada à rota ao trocar de competição.
- Dependências de animação (`motion` / `framer-motion`) atualizadas.

## [1.0.1] - 2026-08-14

### Added

- Schema de login (`login-schema.ts`) com validação Zod por modo (colaborador, administrador e primeiro acesso).
- Exibição da versão do aplicativo no rodapé da tela de entrar.

### Changed

- Formulário de login passou a usar TanStack Form, no mesmo padrão dos demais formulários do sistema.
- Mensagens de validação e de falha de autenticação passam a aparecer no badge laranja de campo (`Field`), em vez de texto vermelho genérico.
- Título do README atualizado para incluir o emoji da melancia.

### Fixed

- Erros de validação do login agora são associados a cada campo (e-mail, senha, código da competição e nome), em vez de falhar em silêncio no envio.

## [1.0.0] - 2026-08-13

### Added

- Lançamento inicial do Happy Melon: operação de maratonas no estilo ICPC, com painel de administradores, fila e lobby de colaboradores, gestão de competições, prova, times, balões e impressões.

[1.4.0]: https://github.com/guilhermecoding/happy-melon/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/guilhermecoding/happy-melon/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/guilhermecoding/happy-melon/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/guilhermecoding/happy-melon/compare/v1.0.2...v1.1.0
[1.0.2]: https://github.com/guilhermecoding/happy-melon/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/guilhermecoding/happy-melon/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/guilhermecoding/happy-melon/releases/tag/v1.0.0
