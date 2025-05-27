import { readFile } from "fs/promises";
import { join } from "path";
import { __dirname } from "../utils.js";

export class Card {
    constructor(name, atk, def, heal = 0, ability = null, cost) {
        this.name = name;
        this.atk = atk;
        this.def = def;
        this.heal = heal;
        this.ability = ability;
        this.cost = cost;
    }

    static async loadCards() {
        const data = await readFile(join(__dirname, `./cards.json`), 'utf-8');
        return JSON.parse(data);
    }
}