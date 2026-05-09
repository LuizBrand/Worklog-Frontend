# Backend Gaps

Funcionalidades que o frontend precisa mas o backend ainda não expõe.
Atualizar conforme novos gaps forem identificados durante o desenvolvimento.

---

## Tickets

### 1. Reatribuição de ticket (campo `userId` no update)

**Onde falta:** `PATCH /tickets/{publicId}` — `TicketUpdateRequest`  
**O que falta:** campo `userId` para trocar o autor/responsável do ticket  
**Impacto:** ADMINs não conseguem reatribuir um ticket a outro usuário pela tela de edição  
**Frontend:** campo "Autor" implementado e visível para ADMIN no dialog de criação (usa `TicketRequest.userId`), mas ausente no dialog de edição por falta de suporte no update

---

### 2. Status `CANCELLED`

**Onde falta:** `TicketRequest.status` / `TicketUpdateRequest.status` — enum não inclui `CANCELLED`  
**O que falta:** suporte ao estado "Cancelado" no backend (hoje só existem `PENDING`, `AWAITING_CUSTOMER`, `AWAITING_DEVELOPMENT`, `COMPLETED`)  
**Impacto:** botão "Cancelado" existe na UI mas está desabilitado; status é UI-only até o backend suportar  
**Frontend:** `UI_STATUS_WRITABLE` já exclui `CANCELLED`; botão desabilitado com `cursor-not-allowed`

---

### 3. Campo `priority` ausente em `TicketSummary`

**Onde falta:** `GET /tickets` — schema `TicketSummary`  
**O que falta:** campo `priority` (CRITICAL / HIGH / MEDIUM / LOW) na listagem de tickets  
**Impacto:** coluna PRIORIDADE na tabela sempre exibe "—"  
**Frontend:** coluna existe na tabela, aguardando campo no response

---

## A adicionar conforme desenvolvimento avança

<!-- Exemplo:
### N. <nome da feature>
**Onde falta:** `<MÉTODO> /endpoint`
**O que falta:** descrição
**Impacto:** impacto no frontend
**Frontend:** estado atual da UI
-->
