import { Listable } from "../../common/Listable";
import { probablyUniqueString } from "../../common/Toolbox";
import { DurationTiming } from "../Combatant/DurationTiming";
import { StatBlock } from "../StatBlock/StatBlock";

export interface SavedCombatant {
    Id: string;
    StatBlock: StatBlock;
    MaxHP: number;
    CurrentHP: number;
    TemporaryHP: number;
    Initiative: number;
    InitiativeGroup?: string;
    Alias: string;
    IndexLabel: number;
    Tags: string[] | SavedTag[];
    Hidden: boolean;
    InterfaceVersion: string;
    NameHidden: boolean;
}
export interface SavedTag {
    Text: string;
    DurationRemaining: number;
    DurationTiming: DurationTiming;
    DurationCombatantId: string;
}

export interface SavedEncounter<T> extends Listable {
    ActiveCombatantId: string;
    RoundCounter?: number;
    Combatants: T[];
}

export function DefaultSavedEncounter(): SavedEncounter<SavedCombatant> {
    return {
        ActiveCombatantId: null,
        RoundCounter: 0,
        Combatants: [],
        Name: "DEFAULT_SAVED_ENCOUNTER",
        Id: probablyUniqueString(),
        Path: "",
        Version: process.env.VERSION,
    };
}
