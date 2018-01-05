import { Listing, ServerListing, ListingOrigin } from "./Listing";
import { StatBlock } from "../StatBlock/StatBlock";
import { Store } from "../Utility/Store";
import { AccountClient } from "../Account/AccountClient";

export class NPCLibrary {
    StatBlocks = ko.observableArray<Listing<StatBlock>>([]);
    ContainsPlayerCharacters = false;

    constructor() {
        $.ajax("../statblocks/").done(s => this.AddStatBlockListings(s, "server"));

        const localStatBlocks = Store.List(Store.StatBlocks);
        localStatBlocks.forEach(id => {
            var statBlock = { ...StatBlock.Default(), ...Store.Load<StatBlock>(Store.StatBlocks, id) };
            this.StatBlocks.push(new Listing<StatBlock>(id, statBlock.Name, statBlock.Type, Store.StatBlocks, "localStorage"));
        });
    }

    AddStatBlockListings = (listings: ServerListing[], source: ListingOrigin) => {
        ko.utils.arrayPushAll<Listing<StatBlock>>(this.StatBlocks, listings.map(c => {
            return new Listing<StatBlock>(c.Id, c.Name, c.SearchHint, c.Link, source);
        }));
    }

    DeleteListing = (id: string) => {
        this.StatBlocks.remove(s => s.Id == id);
        new AccountClient().DeleteStatBlock(id);
    }
}
