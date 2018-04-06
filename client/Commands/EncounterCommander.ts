import { probablyUniqueString } from "../../common/Toolbox";
import { AccountClient } from "../Account/AccountClient";
import { SavedCombatant, SavedEncounter } from "../Encounter/SavedEncounter";
import { UpdateLegacySavedEncounter } from "../Encounter/UpdateLegacySavedEncounter";
import { Libraries } from "../Library/Libraries";
import { Listing } from "../Library/Listing";
import { CurrentSettings } from "../Settings/Settings";
import { Spell } from "../Spell/Spell";
import { StatBlock } from "../StatBlock/StatBlock";
import { TrackerViewModel } from "../TrackerViewModel";
import { TutorialSpy } from "../Tutorial/TutorialViewModel";
import { ComponentLoader } from "../Utility/Components";
import { Store } from "../Utility/Store";
import { BuildEncounterCommandList, Command } from "./Command";
import { DefaultPrompt } from "./Prompts/Prompt";
import { QuickAddPromptWrapper } from "./Prompts/QuickAddPrompt";
import { SpellPrompt } from "./Prompts/SpellPrompt";

export class EncounterCommander {
    public Commands: Command[];
    private libraries: Libraries;
    private accountClient = new AccountClient();

    constructor(private tracker: TrackerViewModel) {
        this.Commands = BuildEncounterCommandList(this);
        this.libraries = tracker.Libraries;
    }

    public AddStatBlockFromListing = (listing: Listing<StatBlock>, hideOnAdd: boolean) => {
        listing.GetAsyncWithUpdatedId(statBlock => {
            this.tracker.Encounter.AddCombatantFromStatBlock(statBlock, hideOnAdd);
            this.tracker.EventLog.AddEvent(`${statBlock.Name} added to combat.`);
        });
    }

    public QuickAddStatBlock = () => {
        const prompt = new QuickAddPromptWrapper(this.tracker.Encounter.AddCombatantFromStatBlock);
        this.tracker.PromptQueue.Add(prompt);
    }

    private deleteSavedStatBlock = (library: string, statBlockId: string) => () => {
        if (library == Store.PlayerCharacters) {
            this.libraries.PCs.DeleteListing(statBlockId);
        }
        if (library == Store.StatBlocks) {
            this.libraries.NPCs.DeleteListing(statBlockId);
        }
    }

    private createSaveNewStatBlockCallback = (store: string, statBlockId: string) => (newStatBlock: StatBlock) => {
        const listing = new Listing<StatBlock>(statBlockId, newStatBlock.Name, newStatBlock.Path, newStatBlock.Type, store, "localStorage", newStatBlock);
        Store.Save<StatBlock>(store, statBlockId, newStatBlock);
        if (store == Store.PlayerCharacters) {
            this.libraries.PCs.StatBlocks.push(listing);
            this.accountClient.SavePlayerCharacter(newStatBlock)
                .then(r => {
                    if (!r) return;
                    const accountListing = new Listing<StatBlock>(statBlockId, newStatBlock.Name, newStatBlock.Path, newStatBlock.Type, `/my/playercharacters/${statBlockId}`, "account", newStatBlock);
                    this.libraries.PCs.StatBlocks.push(accountListing);
                });
        } else {
            this.libraries.NPCs.StatBlocks.push(listing);
            this.accountClient.SaveStatBlock(newStatBlock)
                .then(r => {
                    if (!r) return;
                    const accountListing = new Listing<StatBlock>(statBlockId, newStatBlock.Name, newStatBlock.Path, newStatBlock.Type, `/my/statblocks/${statBlockId}`, "account", newStatBlock);
                    this.libraries.NPCs.StatBlocks.push(accountListing);
                });
        }
    }

    private createSaveEditedStatBlockCallback = (store: string, listing: Listing<StatBlock>) => (newStatBlock: StatBlock) => {
        const statBlockId = listing.Id;
        Store.Save<StatBlock>(store, statBlockId, newStatBlock);
        listing.SetValue(newStatBlock);
        if (store == Store.PlayerCharacters) {
            this.accountClient.SavePlayerCharacter(newStatBlock)
                .then(r => {
                    if (!r || listing.Origin === "account") {
                        return;
                    }
                    const accountListing = new Listing<StatBlock>(statBlockId, newStatBlock.Name, newStatBlock.Path, newStatBlock.Type, `/my/playercharacters/${statBlockId}`, "account", newStatBlock);
                    this.libraries.PCs.StatBlocks.push(accountListing);
                });
        } else {
            this.accountClient.SaveStatBlock(newStatBlock)
                .then(r => {
                    if (!r || listing.Origin === "account") {
                        return;
                    }
                    const accountListing = new Listing<StatBlock>(statBlockId, newStatBlock.Name, newStatBlock.Path, newStatBlock.Type, `/my/statblocks/${statBlockId}`, "account", newStatBlock);
                    this.libraries.NPCs.StatBlocks.push(accountListing);
                });
        }
    }


    public CreateAndEditStatBlock = (isPlayerCharacter: boolean) => {
        let statBlock = StatBlock.Default();
        let newId = probablyUniqueString();

        if (isPlayerCharacter) {
            statBlock.Name = "New Player Character";
            statBlock.Player = "player";
            this.tracker.StatBlockEditor.EditStatBlock(newId, statBlock, this.createSaveNewStatBlockCallback(Store.PlayerCharacters, newId), () => { }, "global");
        } else {
            statBlock.Name = "New Creature";
            this.tracker.StatBlockEditor.EditStatBlock(newId, statBlock, this.createSaveNewStatBlockCallback(Store.StatBlocks, newId), () => { }, "global");
        }
    }

    public EditStatBlock = (listing: Listing<StatBlock>, isPlayerCharacter: boolean) => {
        const store = isPlayerCharacter ? Store.PlayerCharacters : Store.StatBlocks;
        listing.GetAsyncWithUpdatedId(statBlock => {
            if (listing.Origin === "server") {
                let newId = probablyUniqueString();
                this.tracker.StatBlockEditor.EditStatBlock(newId, statBlock, this.createSaveNewStatBlockCallback(store, newId), () => { }, "global");
            } else {
                this.tracker.StatBlockEditor.EditStatBlock(listing.Id, statBlock, this.createSaveEditedStatBlockCallback(store, listing), this.deleteSavedStatBlock(store, listing.Id), "global");
            }
        });
    }

    public CreateAndEditSpell = () => {
        const newSpell = { ...Spell.Default(), Name: "New Spell", Source: "Custom", Id: probablyUniqueString() };
        this.tracker.SpellEditor.EditSpell(
            newSpell,
            this.libraries.Spells.AddOrUpdateSpell,
            this.libraries.Spells.DeleteSpellById
        );
    }

    public EditSpell = (listing: Listing<Spell>) => {
        listing.GetAsyncWithUpdatedId(spell => {
            this.tracker.SpellEditor.EditSpell(
                spell,
                this.libraries.Spells.AddOrUpdateSpell,
                this.libraries.Spells.DeleteSpellById
            );
        });
    }

    public ShowLibraries = () => this.tracker.LibrariesVisible(true);
    public HideLibraries = () => this.tracker.LibrariesVisible(false);

    public LaunchPlayerWindow = () => {
        window.open(`/p/${this.tracker.Encounter.EncounterId}`, "Player View");
    }

    public ShowSettings = () => {
        TutorialSpy("ShowSettings");
        this.tracker.SettingsVisible(true);
    }

    public ToggleToolbarWidth = () => {
        this.tracker.ToolbarWide(!this.tracker.ToolbarWide());
    }

    public ReferenceSpell = (spellListing: Listing<Spell>) => {
        const prompt = new SpellPrompt(spellListing);
        this.tracker.PromptQueue.Add(prompt);
    }

    public DisplayRoundCounter = ko.computed(() => CurrentSettings().TrackerView.DisplayRoundCounter);
    public DisplayTurnTimer = ko.computed(() => CurrentSettings().TrackerView.DisplayTurnTimer);
    public DisplayDifficulty = ko.computed(() => CurrentSettings().TrackerView.DisplayDifficulty);

    public StartEncounter = () => {
        if (this.tracker.PromptQueue.HasPrompt()) {
            this.tracker.PromptQueue.AnimatePrompt();
            return;
        }

        if (this.tracker.Encounter.State() == "inactive") {
            this.tracker.Encounter.RollInitiative(this.tracker.PromptQueue);

            ComponentLoader.AfterComponentLoaded(() => TutorialSpy("ShowInitiativeDialog"));
        }

        this.HideLibraries();

        this.tracker.EventLog.AddEvent("Encounter started.");

        return false;
    }

    public EndEncounter = () => {
        this.tracker.Encounter.EndEncounter();
        this.tracker.EventLog.AddEvent("Encounter ended.");

        return false;
    }

    public RerollInitiative = () => {
        this.tracker.Encounter.RollInitiative(this.tracker.PromptQueue);

        return false;
    }

    public ClearEncounter = () => {
        if (confirm("Remove all creatures and end encounter?")) {
            this.tracker.Encounter.ClearEncounter();
            this.tracker.CombatantViewModels([]);
            this.tracker.CombatantCommander.SelectedCombatants([]);
            this.tracker.EventLog.AddEvent("All combatants removed from encounter.");
        }

        return false;
    }

    public SaveEncounter = () => {
        const prompt = new DefaultPrompt(`Save Encounter As: <input id='encounterName' class='response' type='text' />`,
            response => {
                const encounterName = response["encounterName"];
                const path = ""; //TODO
                if (encounterName) {
                    const savedEncounter = this.tracker.Encounter.Save(encounterName, path);
                    this.libraries.Encounters.Save(savedEncounter);
                    this.tracker.EventLog.AddEvent(`Encounter saved as ${encounterName}.`);
                }
            });
        this.tracker.PromptQueue.Add(prompt);
    }

    public MoveEncounter = (legacySavedEncounter: { Name?: string }) => {
        const name = legacySavedEncounter.Name || "";
        const prompt = new DefaultPrompt(`Move encounter ${legacySavedEncounter.Name} to Folder: <input id='folderName' class='response' type='text' />`,
            response => {
                const folderName = response["folderName"] || "";
                const savedEncounter = UpdateLegacySavedEncounter(legacySavedEncounter);
                const oldId = savedEncounter.Id;
                savedEncounter.Path = folderName;
                savedEncounter.Id = AccountClient.MakeId(savedEncounter.Name, savedEncounter.Path);
                this.libraries.Encounters.Move(savedEncounter, oldId);
            });
        this.tracker.PromptQueue.Add(prompt);
    }

    public LoadEncounter = (legacySavedEncounter: {}) => {
        this.tracker.Encounter.LoadSavedEncounter(UpdateLegacySavedEncounter(legacySavedEncounter));
    }

    public NextTurn = () => {
        this.tracker.Encounter.NextTurn();
        let currentCombatant = this.tracker.Encounter.ActiveCombatant();
        this.tracker.EventLog.AddEvent(`Start of turn for ${currentCombatant.DisplayName()}.`);

        return false;
    }

    public PreviousTurn = () => {
        if (!this.tracker.Encounter.ActiveCombatant()) {
            return;
        }
        this.tracker.Encounter.PreviousTurn();
        let currentCombatant = this.tracker.Encounter.ActiveCombatant();
        this.tracker.EventLog.AddEvent(`Initiative rewound to ${currentCombatant.DisplayName()}.`);

        return false;
    }
}
