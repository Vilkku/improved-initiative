import { EncounterCommander } from "../Commands/EncounterCommander";
import { TrackerViewModel } from "../TrackerViewModel";
import { TutorialSpy } from "../Tutorial/TutorialViewModel";
import { Libraries } from "./Libraries";

export class LibrariesViewModel {
    public LibraryTabs = [
        {
            Name: "Creatures",
            Component: "statblocklibrary",
            Library: this.Libraries.NPCs
        },
        {
            Name: "Players",
            Component: "statblocklibrary",
            Library: this.Libraries.PCs
        },
        {
            Name: "Encounters",
            Component: "encounterlibrary",
            Library: this.Libraries.Encounters
        },
        {
            Name: "Spells",
            Component: "spelllibrary",
            Library: this.Libraries.Spells
        }
    ];

    public SelectedTab = ko.observable(this.LibraryTabs[0]);

    public TabClassName = library => library === this.SelectedTab() ? "selected" : "";

    constructor(
        public Tracker: TrackerViewModel,
        public EncounterCommander: EncounterCommander,
        public Libraries: Libraries
    ) {
        this.SelectedTab.subscribe(t => {
            if (t.Name === "Players") {
                TutorialSpy("SelectPlayersTab");
            }
        });
    }
}
