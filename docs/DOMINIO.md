# Domínio e substituição do site atual

Referências informadas pelo responsável:

- Site atual: https://www.originalli.com.br/.
- CRM: https://crmoriginalli.vercel.app/.
- O site atual será substituído; o domínio Originalli continuará em uso.

## Organização proposta, ainda sem alterações externas

| Endereço | Destino pretendido |
| --- | --- |
| `www.originalli.com.br` | Novo site institucional |
| `originalli.com.br` | Novo site ou redirecionamento para a origem escolhida |
| `crm.originalli.com.br` | CRM existente, se aprovado e configurado na hospedagem |
| `/vida-grupo/` no domínio do site | Portal Vida em Grupo |

Um subdomínio não exige incorporar o CRM ao código do site. O site pode manter seus formulários e encaminhar solicitações ao CRM por API. O acesso interno ao CRM é diferente da área de cliente: não substituir o link atual de clientes por login interno do CRM sem validar os perfis e funcionalidades.

## Antes da troca

1. Inventariar rotas, formulários, área do cliente e conteúdos do site antigo. A pasta exportada não contém seu banco de dados.
2. Identificar DNS, hospedagem, certificados e serviços de e-mail atuais.
3. Definir hospedagem do novo site com banco e armazenamento persistentes.
4. Validar o novo site em endereço de homologação, incluindo login, uploads, backups e restauração.
5. Confirmar API do CRM e validar a entrada de uma solicitação de teste com deduplicação.
6. Mapear redirecionamentos permanentes para rotas antigas, inclusive o destino de `/tela-de-login`.
7. Configurar domínio e certificado no destino e preparar retorno ao site anterior.
8. Alterar apenas os registros necessários ao site/CRM, preservando os registros de e-mail.

Não foram alterados DNS, domínio, hospedagem, projeto Vercel, site antigo ou CRM. O domínio de produção não está configurado no ambiente local.
