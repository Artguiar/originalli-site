# Originalli — site e portal

Projeto independente do ambiente GPT Work, com site institucional, portal Vida em Grupo, banco SQLite persistente, documentos privados e preparação para integrar o CRM existente.

## Executar no Windows

Requisito: Node.js 24 LTS, versão 24.12 ou superior. Não precisa instalar banco, Docker nem alterar a política do PowerShell.

```powershell
cd C:\Users\diretor\Desktop\sistemas\site_originalli\originalli-novo-export
npm.cmd ci --cache .cache/npm
npm.cmd run doctor
npm.cmd run dev
```

Abra http://localhost:3000. O arquivo `../iniciar-site.cmd` também inicia o site com as dependências instaladas.

Em outro terminal, crie o primeiro administrador:

```powershell
npm.cmd run setup
```

O comando pede nome e e-mail e mostra uma senha temporária aleatória uma única vez. A troca é obrigatória no primeiro acesso a `/vida-grupo/`. Não cria empresas fictícias ou apólices de clientes. Rodar novamente preserva os acessos existentes.

## Onde editar

| Pasta | Uso |
| --- | --- |
| `public/` | HTML, CSS, JavaScript e imagens editáveis do site |
| `portal/` | Autenticação, permissões, documentos, apólices e relatórios |
| `server/` | Servidor HTTP Node, configuração, SQLite e arquivos privados |
| `integrations/` | Registro de solicitações, consulta FIPE e adaptador CRM |
| `db/` | Modelo das tabelas |
| `drizzle/` | Migrações SQL versionadas |
| `scripts/` | Build, diagnóstico, setup, backup e geração de páginas |
| `tests/` | Testes de fluxos e persistência |
| `source-assets/` | Originais das imagens |
| `.data/` | Banco e documentos locais; nunca publicar ou versionar |
| `.cache/` | Cache de ferramentas e arquivos temporários |
| `dist/` | Saída gerada do build; não editar |
| `.openai/` | Referência da hospedagem original; não reutilizada pelo build |

As páginas internas têm um gerador legado em `scripts/generate-pages.mjs`. Execute `npm.cmd run pages:generate` somente se quiser regenerá-las a partir desse código: o comando sobrescreve as páginas correspondentes em `public/`. Alterações nessas páginas devem ser refletidas no gerador quando ele continuar sendo usado. A página inicial e o portal são mantidos diretamente em `public/`.

O servidor lê as fontes a cada requisição. Recarregue o navegador após editar HTML/CSS/JS. `dev` reinicia automaticamente ao alterar módulos do servidor.

## Comandos

```powershell
npm.cmd run doctor                  # verifica ambiente e referências locais
npm.cmd test                        # testa portal, integrações e persistência
npm.cmd run db:migrate              # aplica apenas migrações novas
npm.cmd run db:backup               # copia banco e documentos; parar servidor antes
npm.cmd run build                   # recria dist a partir de public e portal
npm.cmd run integrations:dispatch   # envia fila ao CRM apenas se configurado
npm.cmd start                       # servidor sem modo watch
```

O banco é criado automaticamente em `.data/originalli.sqlite`. Documentos ficam em `.data/documents/` e só são disponibilizados pelas rotas autenticadas. Backup de dados fica em `../backups/data-*`. Para restaurar, pare o servidor e restaure o banco e a pasta `documents` juntos; preserve uma cópia do estado anterior.

Use `.env.example` como modelo de `.env` quando precisar alterar porta, origem ou integração. Não inclua senhas ou tokens em JavaScript do navegador.

## Funcionamento atual

- Login, troca de senha, perfis e escopo por empresa.
- Cadastro de empresas e apólices, envio e conferência de documentos.
- Relações mensais e exportação PDF/Excel, conforme permissões.
- Solicitações de cotação registradas com autorização de contato e identificador contra duplicação.
- Fila persistente para CRM, com novas tentativas e identificação estável por envio.
- Consulta FIPE por servidor, com timeout, cache e limite de consultas.
- Consulta das últimas solicitações na administração do portal.

O WhatsApp continua sendo iniciado pelo usuário ao escolher o link após o registro. Não há envio automático de mensagens, contratação automática nem integração implementada com seguradoras.

## Produção

O modo padrão é desenvolvimento e escuta apenas em `127.0.0.1`. O cookie de desenvolvimento tem nome separado; produção mantém cookie `__Host-`, `Secure`, `HttpOnly` e `SameSite=Strict`.

A hospedagem ainda não foi escolhida. O servidor Node precisa de disco persistente, proxy HTTPS, backup e execução única por banco local. **Não colocar SQLite nem documentos em disco efêmero de funções serverless.** Para essa infraestrutura, usar banco e armazenamento externos e adaptar os serviços correspondentes.

`dist/server/index.js` é um bundle Worker, acompanhado de `dist/client/` e `dist/migrations/`. Exige configuração explícita de `DB`, `BUCKET` e `ASSETS` na plataforma de destino; não representa publicação pronta. A configuração original do GPT Work não é incluída.

Veja [arquitetura](docs/ARQUITETURA.md), [contrato do CRM](docs/CRM.md) e [migração do domínio](docs/DOMINIO.md). Revise as informações de privacidade e as políticas de retenção conforme a operação e a infraestrutura escolhidas antes de publicar.
