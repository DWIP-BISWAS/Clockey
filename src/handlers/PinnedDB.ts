import { openDB, IDBPDatabase, DBSchema } from 'idb';
import randomColor from "randomcolor";

export interface Pinned {
    title: string;
    done: boolean;
    doneAt?: number;
    color?: string;
    top?: number;
    left?: number;
}

export interface StoredPinned extends Pinned {
    id?: number;
    createdAt: number;
}

export interface PinnedDB extends DBSchema {
    pinned: {
        key: number;
        value: StoredPinned;
        indexes: {
            createdAt: number
        }
    }
}

export class PinnedDB {
    static db: IDBPDatabase<PinnedDB>;

    static async initDB() {
        const db = await openDB<PinnedDB>('Pinned', 1, {
            upgrade(db) {
                const store = db.createObjectStore('pinned', {
                    keyPath: 'id', 
                    autoIncrement: true,
                });

                store.createIndex('createdAt', 'at');
            },
        });

        if (!db) {
            throw 'connection to db terminated';
        }

        this.db = db;
    }

    static async create(pinned: Pinned) {
        return PinnedDB.db.add('pinned', { ...pinned, createdAt: ~~(Date.now() / 1000), color: randomColor({'luminosity': 'bright'})});
    }

    static async setCoord(key: number, top: number, left: number) {
        const pinned = await PinnedDB.db.get('pinned', key);
        PinnedDB.db.put('pinned', { ...pinned, top, left });
    }

    static async get(key: number) {
        return await PinnedDB.db.get('pinned', key);
    }

    static async getAllActive() {
        return (await PinnedDB.db.getAll('pinned')).filter(p => {
            return !p.done;
        }).sort((a, b) => { return a.id < b.id ? -1 : 1});
    }

    static async remove(key: number) {
        return await PinnedDB.db.delete('pinned', key);
    }

    static async setDone(key: number) {
        const pinned = await PinnedDB.db.get('pinned', key);
        PinnedDB.db.put('pinned', { ...pinned, done: true, doneAt: (~~Date.now() / 1000) });
    }
}