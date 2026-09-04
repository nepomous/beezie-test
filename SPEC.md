## 1. Especificação funcional detalhada (extraída dos seus prints, para você conferir antes de rodar os prompts)

| Tela | Desktop | Mobile |
| -------------------- | | |
| **Hero / Claw Page** | Header com nav (Marketplace, Claw, Leaderboard, Resources, More), saldo e avatar no topo direito. Grade 2 colunas: máquina à esquerda, painel de compra à direita (nome, descrição, preço + pontos, stepper, promo code, tabela de odds, "More Claw Machines"). Abaixo, 2 colunas: "Top Items" (grade 3xN) e "Recent Pulls" (lista). | Empilhado verticalmente: hexágono/logo, imagem da máquina, card de compra (nome, preço, promo code, odds, stepper + Start Now). |
| **Payment** | Modal centralizado "Review & pay": coluna esquerda = métodos de pagamento (radio: Beezie wallet com saldo, External wallet com saldo, Credit/Debit); coluna direita = resumo do item + quantidade + total; botão "Confirm". | Modal ancorado embaixo: tabs "Wallet" / "Credit/Debit", resumo do item, "Choose Wallet" (radio Beezie/External), botão "Confirm". |
| **Reveal (1 item)** | Modal fullscreen: imagem grande à esquerda, nome do item + "Swap Value" (valor em destaque) + botões "Swap Now" (primário) / "Keep Item" (secundário) à direita. | Mesmo conteúdo empilhado verticalmente. |
| **Reveal (N itens)** | Modal fullscreen com grade (4 colunas desktop / 2 colunas mobile) de cards: imagem, ícone "+" no canto (seleção), nome, botão "Swap for $X" individual. Rodapé fixo: "Expires in mm:ss", "Select all", botão "Swap" em lote. | Igual, grade 2 colunas, mesmo rodapé fixo. |

Pontos de atenção que os prints deixam claros:

- O timer de expiração ("Expires in 14 min 29 sec") é compartilhado por todos os itens revelados no mesmo pull — não é por item.
- O botão "Swap" no rodapé provavelmente soma os itens selecionados (via "+"/checkbox ou "Select all") e faz o swap em lote; os botões "Swap for $X" individuais dentro de cada card permitem swap avulso.
- No mobile, o resumo do pagamento some o valor total explícito na tela que você enviou — considere manter consistência com a versão desktop (mostrar total) mesmo no mobile.

---

## 2. Modelos de dados sugeridos (TypeScript)

```ts
export type Rarity = "ultra-rare" | "rare" | "uncommon" | "common" | "base";

export interface OddsTier {
  rarity: Rarity;
  label: string; // "Ultra-Rare"
  chancePercent: number; // 0.72
  valueRangeMin: number;
  valueRangeMax: number | null; // null = "8001+"
}

export interface ClawItem {
  id: string;
  name: string;
  imageUrl: string;
  fairMarketValue: number; // usado como "Swap Value"
  rarity: Rarity;
}

export interface ClawMachine {
  id: string;
  name: string; // "Pokémon Gold Claw"
  description: string;
  heroImageUrl: string;
  videoOpeningUrl: string; // asset local ou remoto
  pricePerPull: number;
  pointsPerPull: number;
  averageValue: number;
  odds: OddsTier[];
  itemPool: ClawItem[]; // usado para sortear + para "Top Items"
}

export interface RecentPull {
  id: string;
  item: ClawItem;
  userDisplayName: string;
  paidValue: number; // "$100" mostrado na lista
  timestamp: string;
}

export interface Wallet {
  beezieBalance: number;
  externalBalance: number;
}

export interface PullResult {
  pullId: string;
  items: ClawItem[]; // 1 ou N
  expiresAt: number; // epoch ms — usado no countdown
}
```
