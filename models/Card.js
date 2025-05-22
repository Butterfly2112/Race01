import { readFile } from "fs/promises";
import { join } from "path";
import { __dirname } from "../utils.js";

export class Card {
    constructor(name, atk, def, cost) {
        this.name = name;
        this.atk = atk;
        this.def = def;
        this.cost = cost;
    }

    static async loadCards() {
        const data = await readFile(join(__dirname, `./cards.json`), 'utf-8');
        return JSON.parse(data);
    }
}