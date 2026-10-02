# Arquitetura e decisões

## Fluxo

```text
Navegador
  ├─ site institucional em public/
  ├─ portal Vida em Grupo
  └─ formulários / consulta FIPE
           │ mesma origem
           ▼
Servidor HTTP Node
  └─ API portável em portal/ e integrations/
       ├─ SQLite: usuários, sessões, empresas, apólices e auditoria
       ├─ arquivos privados: documentos do portal
       ├─ solicitações comerciais + fila de integração
       └─ consulta FIPE: serviço externo, cache e timeout
```

O núcleo do portal conserva o contrato de banco D1 e armazenamento R2 do projeto original. O ambiente local implementa esse contrato com SQLite nativo do Node e arquivos em disco. Isso permite trabalhar no Windows sem instalar serviços como administrador e mantém uma opção de publicação Worker.

## Decisões

1. Preservar o site e sua identidade visual enquanto a infraestrutura é organizada.
2. Separar `public/` de `dist/`, tornando o build descartável.
3. Aproveitar autenticação e permissões do portal existente.
4. Inicializar banco sem registros empresariais específicos do projeto original.
5. Integrar o CRM que já existe, sem duplicar sua gestão comercial.
6. Registrar a solicitação e o trabalho de envio na mesma transação. Falha de integração não perde a solicitação.
7. Evitar envio automático a URLs presumidas. A API real precisa ser confirmada.
8. Preservar sessões isoladas: estar logado no site não autentica automaticamente o CRM.

## Limites

SQLite e arquivos locais atendem ao desenvolvimento e a um servidor com volume persistente. A aplicação não está configurada para múltiplas instâncias compartilhando o mesmo volume. Os adaptadores precisam ser substituídos ou ajustados conforme a plataforma escolhida.

As migrações locais são aplicadas em ordem pelo nome e guardam hash no banco. Nunca editar uma migração já aplicada: criar outra. Os metadados originais do Drizzle são históricos; o comando de migração da aplicação usa diretamente os arquivos SQL, não o journal. Sincronizar snapshots antes de adotar novamente geração automática pelo Drizzle.

O proxy Node não confia em cabeçalhos de IP enviados pelo cliente. Se for publicado atrás de proxy, o tratamento de IP deve ser ajustado para confiar apenas nos proxies efetivamente usados; sem isso, o limite agrupa os clientes pelo IP do proxy.

## Próximas decisões

- Localizar o repositório do CRM e seu endpoint para solicitações.
- Escolher hospedagem, banco e armazenamento de produção juntos.
- Definir provisionamento e recuperação de acesso, retenção de dados e backups.
- Validar integrações com seguradoras conforme disponibilidade contratual de cada API.
- Automatizar o processamento da fila no agendador da hospedagem escolhida.

Implementação de APIs nativas baseada na [documentação do Node SQLite](https://nodejs.org/docs/latest-v24.x/api/sqlite.html) e [HTTP](https://nodejs.org/docs/latest-v24.x/api/http.html).
