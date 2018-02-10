export interface IRules {
    GetModifierFromScore: (attribute: number) => number;
    AbilityCheck: (...mods: number[]) => number;
    EnemyHPTransparency: string;
}

export class RollResult {
    constructor(public Rolls: number[], public Modifier: number) { }
    get Total(): number { return this.Rolls.reduce((p, c) => c + p, 0) + this.Modifier; }
    get String(): string {
        let output = `[${this.Rolls}]`;
        if (this.Modifier > 0) {
            output += ` + ${this.Modifier}`;
        }
        if (this.Modifier < 0) {
            output += ` - ${-this.Modifier}`;
        }
        return output + ` = ${this.Total}`;
    }
}

export class Dice {
    public static readonly ValidDicePattern = /(\d+)d(\d+)[\s]*([+-][\s]*\d+)?|([+-][\s]*\d+)/;
    public static readonly GlobalDicePattern = /(\d+)d(\d+)[\s]*([+-][\s]*\d+)?|([+-][\s]*\d+)/g;
    public static readonly RollDiceExpression = (expression: string) => {
        //Taken from http://codereview.stackexchange.com/a/40996
        const match = Dice.ValidDicePattern.exec(expression);
        if (!match) {
            throw "Invalid dice notation: " + expression;
        }

        const isLooseModifier = typeof match[4] == "string";
        if (match[4]) {
            const modifier = parseInt(match[4].replace(/[\s]*/g, ""));
            const d20Roll = Math.ceil(Math.random() * 20);
            return new RollResult([d20Roll], modifier);
        }

        const howMany = (typeof match[1] == "undefined") ? 1 : parseInt(match[1]);
        const dieSize = parseInt(match[2]);

        const rolls = [];
        for (let i = 0; i < howMany; i++) {
            rolls[i] = Math.ceil(Math.random() * dieSize);
        }
        const modifier = (typeof match[3] == "undefined") ? 0 : parseInt(match[3].replace(/[\s]*/g, ""));
        return new RollResult(rolls, modifier);
    }
}

export class DefaultRules implements IRules {
    public GetModifierFromScore = (abilityScore: number) => {
        return Math.floor((abilityScore - 10) / 2);
    }
    public AbilityCheck = (...mods: number[]) => {
        return Math.ceil(Math.random() * 20) + (mods.length ? mods.reduce((p, c) => p + c) : 0);
    }
    public EnemyHPTransparency = "whenBloodied";
}
