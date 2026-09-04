# Contexto do Projeto — Beezie Claw (desafio técnico)

## Negócio (para o agente entender o domínio, não é para copiar textos da Beezie)

A Beezie é um marketplace de colecionáveis físicos (cards Pokémon, One Piece, sneakers,
memorabilia) que guarda os itens custodiados fisicamente e permite compra, venda e troca
digital desses ativos. A feature principal deste desafio é o "Claw" (máquina de garra):

- O usuário paga um valor fixo por "pull" (ex: $30 a $500) para ter a chance de ganhar um
  item físico de valor variável.
- Cada máquina tem probabilidades (odds) visíveis por faixa de raridade: Ultra-Rare, Rare,
  Uncommon, Common, Base — cada faixa com % de chance e faixa de valor em dólar.
- Após o pull, o item é revelado. O usuário pode:
  - **Keep Item**: manter o item (vai para a "coleção"/vault do usuário).
  - **Swap Now**: trocar o item por valor em créditos/saldo (fair market value),
    dentro de uma janela de tempo limitada (contagem regressiva visível na tela).
- Quando a quantidade (QTY) do pull é maior que 1, a revelação mostra todos os itens
  ganhos em grade, com opção de selecionar individualmente ou "Select all" e fazer swap
  em lote antes do timer expirar.
- Pagamento pode ser feito via saldo interno ("Beezie wallet"), carteira externa ou
  cartão de crédito/débito.

Este é o mesmo padrão de "gacha"/loot box usado em mobile games: pagar → animação de
abertura → revelação → decisão de manter ou converter em moeda.

## Stack

- React Native + Expo (Expo Router para navegação)
- Deve rodar de forma responsiva em iOS, Android e Web (via react-native-web, já
  incluso no Expo)
- TypeScript
- Gerenciamento de estado: [DEFINIR — ex: Zustand] para carrinho/qty, wallet, sessão de reveal
- Dados mockados localmente (sem backend real) simulando uma API assíncrona
  (usar Promises com delay artificial para simular latência de rede)
- Vídeos de abertura da caixa/garra: `expo-video` (ou `expo-av`, dependendo da versão
  do Expo SDK do template), assets em `/assets/videos/`

## Convenções

- Todo texto visível ao usuário em português (ajustar se o desafio pedir inglês)
- Cores/tema: seguir o dark theme visto nos prints (fundo quase preto, destaque em
  amarelo/dourado #F5C518-ish, texto branco/cinza)
- Nomear componentes por tela: `ClawHeroScreen`, `PaymentModal`, `RevealSingleModal`,
  `RevealMultipleModal`
- Breakpoint responsivo sugerido: `< 768px` = layout mobile (stack vertical),
  `>= 768px` = layout desktop (duas colunas)

## Fluxo de referência (ordem de telas)

1. Hero screen: metade superior = visual da máquina de garra + nome do prêmio +
   preço + stepper de quantidade + botão "Start Now"; metade inferior (mesmo viewport,
   sem exigir scroll pra ver algo) = "Top Items" e "Recent Pulls"
2. Usuário ajusta QTY e toca "Start Now" → abre modal de pagamento
3. Modal de pagamento: overlay modal, usuário escolhe método de pagamento
   (Beezie wallet / carteira externa / cartão) e confirma. Resumo mostra item,
   preço unitário, pontos ganhos, quantidade e total.
4. Após confirmar pagamento, roda animação de vídeo (abertura da garra/caixa)
   5a. Se QTY = 1: modal fullscreen de revelação com 1 item — imagem, nome, "Swap Value",
   botões "Swap Now" e "Keep Item"
   5b. Se QTY > 1: modal fullscreen de revelação em grade com N itens — cada card com
   imagem, nome, botão individual "Swap for $X", checkbox/seleção (ícone "+"),
   rodapé fixo com contagem regressiva ("Expires in mm:ss"), "Select all" e botão
   "Swap" em lote

## Dados mockados necessários

- Lista de "claw machines" (id, nome, imagem, preço, pontos, odds por raridade,
  valor médio, lista de itens possíveis no pool)
- Lista de "Top Items" (itens de maior valor da máquina)
- Lista de "Recent Pulls" (feed de pulls recentes de outros usuários — item, nome
  do usuário/apelido, valor)
- Saldo da wallet do usuário (Beezie wallet, carteira externa)
- Resultado de um "pull" (1 ou N itens sorteados conforme odds, com valor de swap)

## 2. Especificação funcional detalhada (extraída dos seus prints, para você conferir antes de rodar os prompts)

| Tela                 | Desktop                                                                                                                                                                                                                                                                                                                              | Mobile                                                                                                                            |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| **Hero / Claw Page** | Header com nav (Marketplace, Claw, Leaderboard, Resources, More), saldo e avatar no topo direito. Grade 2 colunas: máquina à esquerda, painel de compra à direita (nome, descrição, preço + pontos, stepper, promo code, tabela de odds, "More Claw Machines"). Abaixo, 2 colunas: "Top Items" (grade 3xN) e "Recent Pulls" (lista). | Empilhado verticalmente: hexágono/logo, imagem da máquina, card de compra (nome, preço, promo code, odds, stepper + Start Now).   |
| **Payment**          | Modal centralizado "Review & pay": coluna esquerda = métodos de pagamento (radio: Beezie wallet com saldo, External wallet com saldo, Credit/Debit); coluna direita = resumo do item + quantidade + total; botão "Confirm".                                                                                                          | Modal ancorado embaixo: tabs "Wallet" / "Credit/Debit", resumo do item, "Choose Wallet" (radio Beezie/External), botão "Confirm". |
| **Reveal (1 item)**  | Modal fullscreen: imagem grande à esquerda, nome do item + "Swap Value" (valor em destaque) + botões "Swap Now" (primário) / "Keep Item" (secundário) à direita.                                                                                                                                                                     | Mesmo conteúdo empilhado verticalmente.                                                                                           |
| **Reveal (N itens)** | Modal fullscreen com grade (4 colunas desktop / 2 colunas mobile) de cards: imagem, ícone "+" no canto (seleção), nome, botão "Swap for $X" individual. Rodapé fixo: "Expires in mm:ss", "Select all", botão "Swap" em lote.                                                                                                         | Igual, grade 2 colunas, mesmo rodapé fixo.                                                                                        |

Pontos de atenção que os prints deixam claros:

- O timer de expiração ("Expires in 14 min 29 sec") é compartilhado por todos os itens revelados no mesmo pull — não é por item.
- O botão "Swap" no rodapé provavelmente soma os itens selecionados (via "+"/checkbox ou "Select all") e faz o swap em lote; os botões "Swap for $X" individuais dentro de cada card permitem swap avulso.
- No mobile, o resumo do pagamento some o valor total explícito na tela que você enviou — considere manter consistência com a versão desktop (mostrar total) mesmo no mobile.

---

## 3. Modelos de dados sugeridos (TypeScript)

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
