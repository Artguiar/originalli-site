# Integração com o CRM existente

Aplicação informada: https://crmoriginalli.vercel.app/.

Esse endereço identifica o CRM; não confirma a existência de webhook ou API. Não apontar `CRM_WEBHOOK_URL` para a página inicial. Nenhum envio ao CRM real foi executado nesta reestruturação.

## Contrato proposto

O adaptador atual está em `integrations/crm.mjs`. É um contrato para validar com o código do CRM, não uma descrição da API existente.

```http
POST <endpoint-confirmado-do-CRM>
Content-Type: application/json
Authorization: Bearer <token-configurado>
Idempotency-Key: <id-estavel-do-evento>
```

```json
{
  "event": "lead.created",
  "version": 1,
  "id": "uuid-do-evento",
  "lead": {
    "id": "uuid-da-solicitacao",
    "name": "Nome informado",
    "phone": "Telefone informado",
    "profile": "Empresa",
    "interest": "Seguro patrimonial empresarial",
    "city": "Londrina/PR",
    "page": "/contato/",
    "attribution": {"utm_source": "campanha"},
    "consent_version": "contact-v1",
    "created": "2026-10-02T00:00:00.000Z"
  }
}
```

O CRM deverá confirmar persistência com resposta HTTP 2xx e deduplicar por `Idempotency-Key`. Se a API existente usar outro formato, alterar o adaptador para respeitá-la. Redirecionamentos são recusados para não transmitir o token a outro endereço.

## Fila

Cada solicitação gera um registro em `site_leads` e outro em `site_outbox`, dentro de uma transação. Envios têm timeout de 10 segundos, reserva temporária e até cinco tentativas. Falhas recebem atraso crescente; depois da quinta ficam como `failed` para revisão. Uma falha depois da entrega pode causar nova tentativa com o mesmo identificador, por isso o CRM precisa deduplicar.

Para ativar, configure `CRM_WEBHOOK_URL` e, se exigido, `CRM_WEBHOOK_TOKEN` somente em `.env` ou no gerenciador de segredos da hospedagem. Sem endpoint, o comando não envia nada:

```powershell
npm.cmd run integrations:dispatch
```

Por enquanto o processamento é manual. O agendamento e alertas serão definidos junto com a hospedagem. O servidor não encaminha automaticamente a fila a cada formulário.

## Informações necessárias

- Código-fonte ou documentação da API do CRM.
- Autenticação aceita para integração servidor a servidor.
- Campos obrigatórios e regra de deduplicação.
- Identificação de responsável, carteira ou pipeline, se exigida.
- Política para solicitações inválidas e reenviadas.

Não configurar login compartilhado ou expor tokens no navegador para resolver a integração comercial.
