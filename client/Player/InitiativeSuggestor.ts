import * as ko from "knockout";

import { StaticCombatantViewModel } from "../Combatant/StaticCombatantViewModel";

export class InitiativeSuggestor {
    constructor(
        public Socket: SocketIOClient.Socket,
        public EncounterId: string
    ) { }

    public SuggestionVisible = ko.observable(false);
    public Combatant: KnockoutObservable<StaticCombatantViewModel> = ko.observable(null);

    public Name = ko.pureComputed(() => {
        if (!this.Combatant()) {
            return "";
        } else {
            return this.Combatant().Name;
        }
    });

    public Show = (combatant: StaticCombatantViewModel) => {
        this.Combatant(combatant);
        this.SuggestionVisible(true);
        $("input[name=suggestedInitiative]").first().focus();
    };

    public Resolve = (form: HTMLFormElement) => {
        const element = $(form).find("[name=suggestedInitiative]").first();
        const value = parseInt(element.val().toString(), 10);
        if (!isNaN(value) && value > 0) {
            this.Socket.emit("suggest initiative", this.EncounterId, [this.Combatant().Id], value, "Player");
        }
        element.val("");
        this.Close();
    };

    public Close = () => {
        this.SuggestionVisible(false);
    }
}
