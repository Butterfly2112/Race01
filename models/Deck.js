import { Card } from "./Card.js";

export class Deck {
    constructor() {
        this.cards = [];
        this.size = this.cards.length;
    }

    shuffle() {
        for (let i = this.size - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    getCards(n, firstTurn = false) {
        const cards = [];

        for (let i = 0; i < n; i++) {
            if (this.cards.length === 0) break;

            const index = Math.floor(Math.random() * this.size);
            const [card] = this.cards.splice(index, 1);
            cards.push(new Card(card.name, card.atk, card.def, card.heal, card.ability, card.cost));
            this.size--;
        }

        if (firstTurn && !cards.some(card => card.cost === 1)) {
            const rarityOneIndex = this.cards.findIndex(card => card.cost === 1);
            if (rarityOneIndex !== -1) {
                const [rareCard] = this.cards.splice(rarityOneIndex, 1);
                this.size--;

                const removed = cards.pop();
                this.cards.push(removed);
                this.size++;

                cards.push(new Card(rareCard.name, rareCard.atk, rareCard.def, rareCard.cost, rareCard.cost));
            }
        }

        return cards;
    }

    async resetDeck() {
        this.cards = await Card.loadCards();
        this.size = this.cards.length;
    }
}