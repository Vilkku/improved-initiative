import { Prompt } from "./Prompt";
import { CombatantViewModel } from "../../Combatant/CombatantViewModel";
import { TrackerViewModel } from "../../TrackerViewModel";

export class AcceptInitiativePrompt implements Prompt {
    InputSelector = '.acceptfull';
    ComponentName = 'acceptinitiativeprompt';
    Prompt: string;

    public Resolve = (form: HTMLFormElement) => {
    }
    public Accept: () => void;

    constructor(suggestedCombatants: CombatantViewModel[], initiative: number, suggester: string, tracker: TrackerViewModel) {
        const combatantNames = suggestedCombatants.map(c => c.Name()).join(', ');
        this.Prompt = `Accept initiative ${initiative} to ${combatantNames} from ${suggester}?`;

        this.Accept = () => {
            suggestedCombatants.forEach(c => c.ApplyInitiative(initiative.toString()));
            tracker.Encounter.QueueEmitEncounter();
            return true;
        }
    }
}
