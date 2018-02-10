import { StaticCombatantViewModel } from "../Combatant/StaticCombatantViewModel";

export class InitiativeSuggestor {
    constructor(
        public Socket: SocketIOClient.Socket,
        public EncounterId: string
    ) { }

    SuggestionVisible = ko.observable(false);
    Combatant: KnockoutObservable<StaticCombatantViewModel> = ko.observable(null);

    Name = ko.pureComputed(() => {
        if (!this.Combatant()) {
            return "";
        } else {
            return this.Combatant().Name;
        }
    })

    Show = (combatant: StaticCombatantViewModel) => {
        this.Combatant(combatant);
        this.SuggestionVisible(true);
        $("input[name=suggestedInitiative]").first().focus();
    }

    Resolve = (form: HTMLFormElement) => {
        const element = $(form).find("[name=suggestedInitiative]").first();
        const value = parseInt(element.val().toString(), 10);
        if (!isNaN(value) && value > 0) {
            this.Socket.emit("suggest initiative", this.EncounterId, [this.Combatant().Id], value, "Player");
        }
        element.val("");
        this.Close();
    }

    Close = () => {
        this.SuggestionVisible(false);
    }
}
