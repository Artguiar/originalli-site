# Contexto do projeto Originalli

Atualizado em 02/10/2026.

## Objetivo

Manter o site institucional e o portal Vida em Grupo, com desenvolvimento a partir de diferentes máquinas. Código e documentação serão sincronizados pelo GitHub.

## Estado confirmado

- O código-fonte está nesta pasta, incluindo site, servidor Node.js, portal, modelo de dados, migrações, scripts e testes.
- O banco atual usa SQLite (`server/database.mjs` e `db/schema.ts`).
- Documentos são armazenados localmente em `.data/documents/`.
- O README descreve login, permissões por empresa, apólices, documentos, relatórios, cotações, fila para CRM e consulta FIPE.
- A existência de código e testes não comprova funcionamento em produção. Os testes não foram executados nesta retomada.
- A hospedagem de produção ainda não foi escolhida.

## Decisões e sequência

1. Preparar e enviar o código a um repositório privado do GitHub.
2. Avaliar a migração do SQLite para PostgreSQL do Supabase e dos documentos para Storage privado. O usuário já utiliza Supabase em outros projetos; nenhuma migração foi realizada.
3. Definir hospedagem do site e servidor e validar os fluxos antes de publicar.

## Etapa GitHub

- Acrescentadas exclusões de arquivos locais, bancos, backups, configuração original de hospedagem e chaves privadas.
- Criado `AGENTS.md` para instruir futuras sessões a ler este contexto.
- Repositório escolhido: https://github.com/Artguiar/originalli-site.git. Git local inicializado na branch main e remoto origin configurado. Primeiro commit e envio ainda pendentes.
- Git instalado nesta máquina. A consulta ao repositório remoto foi concluída sem erro e sem referências retornadas (repositório vazio). Autor dos commits configurado como Artguiar; e-mail informado pelo usuário em 02/10/2026.

## Retomar em outra máquina

Clone o repositório, instale os requisitos do README e abra esta pasta no Codex. Peça: "Leia AGENTS.md e docs/CONTEXTO.md e retome a etapa pendente".

Antes de começar, baixe as alterações do GitHub. Ao terminar, registre e envie as alterações. Arquivos excluídos pelo Git, credenciais e banco local não acompanham o código e precisam de configuração separada.


