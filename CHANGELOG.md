# Changelog

Todas as mudanças notáveis deste projeto serão documentadas neste arquivo.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

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

[1.0.1]: https://github.com/guilhermecoding/happy-melon/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/guilhermecoding/happy-melon/releases/tag/v1.0.0
