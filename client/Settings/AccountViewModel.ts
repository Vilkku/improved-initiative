import { Libraries } from "../Library/Libraries";
import { env } from "../Environment";
import { Store } from "../Utility/Store";
import { AccountClient } from "../Account/AccountClient";
import { Listable, Listing } from "../Library/Listing";

function getCounts<T extends Listable>(items: Listing<T>[]) {
    const localCount = items.filter(c => c.Origin === "localStorage").length;
    const accountCount = items.filter(c => c.Origin === "account").length;
    return `${localCount} local, ${accountCount} synced`;
}

export class AccountViewModel {
    constructor(private libraries: Libraries) { }

    IsLoggedIn = env.IsLoggedIn;
    HasStorage = env.HasStorage;
    PatreonLoginUrl = env.PatreonLoginUrl;

    SyncedCreatures = ko.computed(() => getCounts(this.libraries.NPCs.StatBlocks()));
    SyncedPlayers = ko.computed(() => getCounts(this.libraries.PCs.StatBlocks()));
    SyncedSpells = ko.computed(() => getCounts(this.libraries.Spells.Spells()));
    SyncedEncounters = ko.computed(() => getCounts(this.libraries.Encounters.Encounters()));

    SyncAll() {
        this.SyncMessage("");
        var blob = Store.ExportAll();
        saveAs(blob, 'improved-initiative.json');
        new AccountClient().SaveAll(this.libraries, err => {
            this.SyncMessage(this.SyncMessage() + "\n" + JSON.stringify(err));
        });
    };

    SyncMessage = ko.observable("");
}
