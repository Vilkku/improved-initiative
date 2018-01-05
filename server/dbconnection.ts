import mongo = require("mongodb");
const client = mongo.MongoClient;
const connectionString = process.env.DB_CONNECTION_STRING

import * as L from "./library";
import { User } from "./user";

export const initialize = () => {
    if (!connectionString) {
        console.error("No connection string found.");
        return;
    }

    client.connect(connectionString, function (err, db) {
        if (err) {
            console.log(err);
        }
    });
};

export function upsertUser(patreonId: string, accessKey: string, refreshKey: string, accountStatus: string) {
    if (!connectionString) {
        console.error("No connection string found.");
        return;
    }

    return client.connect(connectionString)
        .then((db: mongo.Db) => {
            const users = db.collection<User>("users");
            return users.findOneAndUpdate(
                {
                    patreonId
                },
                {
                    $set: {
                        patreonId,
                        accessKey,
                        refreshKey,
                        accountStatus,
                    },
                    $setOnInsert: {
                        statblocks: {},
                        playercharacters: {},
                        spells: {},
                        encounters: {},
                        settings: {},
                    }
                },
                {
                    upsert: true
                })
                .then(res => {
                    return users.findOne({
                        patreonId
                    });
                });
        });
}

export function getAccount(userId: string, callBack: (userWithListings: any) => void) {
    if (!connectionString) {
        console.error("No connection string found.");
        //return null;
    }

    return client.connect(connectionString)
        .then((db: mongo.Db) => {
            const users = db.collection<User>("users");
            return users.findOne({ _id: userId })
                .then((user: User) => {
                    const userWithListings = {
                        settings: user.settings,
                        statblocks: getStatBlockListings(user.statblocks),
                        playercharacters: getPlayerCharacterListings(user.playercharacters),
                        spells: getSpellListings(user.spells),
                        encounters: getEncounterListings(user.encounters)
                    }

                    callBack(userWithListings);
                });
        });
}

function getStatBlockListings(statBlocks: { [key: string]: L.StatBlock }): L.Listing [] {
    return Object.keys(statBlocks).map(key => {
        const c = statBlocks[key];
        return {
            Name: c.Name,
            Id: c.Id,
            SearchHint: L.GetStatBlockKeywords(c),
            Version: c.Version,
            Link: `/my/statblocks/${c.Id}`,
        }
    });
}

function getPlayerCharacterListings(playerCharacters: { [key: string]: L.StatBlock }): L.Listing [] {
    return Object.keys(playerCharacters).map(key => {
        const c = playerCharacters[key];
        return {
            Name: c.Name,
            Id: c.Id,
            SearchHint: L.GetStatBlockKeywords(c),
            Version: c.Version,
            Link: `/my/playercharacters/${c.Id}`,
        }
    });
}

function getSpellListings(spells: { [key: string]: L.Spell }): L.Listing [] {
    return Object.keys(spells).map(key => {
        const c = spells[key];
        return {
            Name: c.Name,
            Id: c.Id,
            SearchHint: L.GetSpellKeywords(c),//TODO
            Version: c.Version,
            Link: `/my/spells/${c.Id}`,
        }
    });
}

function getEncounterListings(encounters: { [key: string]: L.SavedEncounter }): L.Listing[] {
    return Object.keys(encounters).map(key => {
        const c = encounters[key];
        return {
            Name: c.Name,
            Id: c.Id,
            SearchHint: L.GetEncounterKeywords(c),//TODO
            Version: c.Version,
            Link: `/my/encounters/${c.Id}`,
        }
    });
}

export function setSettings(userId, settings) {
    if (!connectionString) {
        console.error("No connection string found.");
    }

    return client.connect(connectionString)
        .then((db: mongo.Db) => {
            const users = db.collection<User>("users");
            return users.updateOne(
                { _id: userId },
                { $set: { settings } }
            );
        });
}

export type EntityPath = "statblocks" | "playercharacters" | "spells" | "encounters";

export function getEntity<T>(entityPath: EntityPath, userId: string, entityId: string, callBack: (entity: T) => void) {
    if (!connectionString) {
        console.error("No connection string found.");
    }

    return client.connect(connectionString)
        .then((db: mongo.Db) => {
            const users = db.collection<User>("users");

            return users
                .findOne({ _id: userId },
                {
                    fields: {
                        [`${entityPath}.${entityId}`]: true
                    }
                })
                .then((user: User) => {
                    if (!user) {
                        throw "User not found";
                    }
                    callBack(user[entityPath][entityId]);
                });
        });
}

export function deleteEntity<T>(entityPath: EntityPath, userId: string, entityId: string, callBack: (result: number) => void) {
    if (!connectionString) {
        console.error("No connection string found.");
    }

    return client.connect(connectionString)
        .then((db: mongo.Db) => {
            const users = db.collection<User>("users");

            return users.updateOne(
                { _id: userId },
                {
                    $unset: {
                        [`${entityPath}.${entityId}`]: ""
                    }
                }
            ).then(result => {
                callBack(result.modifiedCount);
            });
        });
}

export function saveEntity<T extends L.LibraryItem>(entityPath: EntityPath, userId: string, entity: T, callBack: (result: number) => void) {
    if (!connectionString) {
        console.error("No connection string found.");
        //return null;
    }

    if (!entity.Id || !entity.Version) {
        throw "Entity missing Id or Version";
    }

    if (entity.Id.indexOf(".") > -1) {
        throw "Entity Id cannot contain .";
    }

    return client.connect(connectionString)
        .then((db: mongo.Db) => {
            const users = db.collection<User>("users");
            return users.updateOne(
                { _id: userId },
                {
                    $set: {
                        [`${entityPath}.${entity.Id}`]: entity
                    }
                }
            ).then(result => {
                callBack(result.modifiedCount);
            });
        });
}

export function saveEntitySet<T extends L.LibraryItem>(entityPath: EntityPath, userId: string, entities: T [], callBack: (result: number) => void) {
    if (!connectionString) {
        console.error("No connection string found.");
        //return null;
    }

    for (const entity of entities) {
        if (!entity.Id || !entity.Version) {
            throw "Entity missing Id or Version";
        }
    }
    

    return client.connect(connectionString)
        .then((db: mongo.Db) => {
            const users = db.collection<User>("users");
            return users.findOne({ _id: userId })
                .then(u => {
                    const updatedEntities = u[entityPath];
                    for (const entity of entities) {
                        updatedEntities[entity.Id] = entity;
                    }
                    return users.updateOne(
                        { _id: userId },
                        {
                            $set: {
                                [`${entityPath}`]: updatedEntities
                            }
                        });
            }).then(result => {
                callBack(result.modifiedCount);
            });
        });
}