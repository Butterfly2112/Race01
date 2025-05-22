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

    getCards(n) {
        const cards = [];

        for (let i = 0; i < n; i++) {
            if (this.cards.length === 0) break;

            const index = Math.floor(Math.random() * this.size);
            const [card] = this.cards.splice(index, 1);
            cards.push(new Card(card.name, card.atk, card.def, card.cost));
            this.size--;
        }

        return cards;
    }

    async resetDeck() {
        this.cards = await Card.loadCards();
        this.size = this.cards.length;
    }
}