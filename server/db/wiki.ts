import { getFirestore, doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import app from ".";
import { WIKI_COLLECTION } from "./constants";
import { Wiki, WIKI_SCHEMA } from "./schema";
import { v4 } from "uuid";
import type { DbResult } from "../type";

export async function getWiki(id: string): Promise<DbResult<Wiki>> {
    const db = getFirestore(app);
    const docRef = doc(db, WIKI_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        const result = WIKI_SCHEMA.safeParse(docSnap.data());
        if (result.success) {
            return { success: true, data: result.data };
        } else {
            return { success: false, error: result.error };
        }
    } else {
        return {
            success: false,
            error: { message: "Wiki not found" },
        };
    }
}

export async function setWiki(data: Omit<Wiki, 'id'>): Promise<DbResult<Wiki>> {
    const db = getFirestore(app);
    const wikiId = v4(); // Generate a new UUID for the wiki
    const docRef = doc(db, WIKI_COLLECTION, wikiId);
    const wikiData: Wiki = {
        id: wikiId,
        ...data,
    };

    await setDoc(docRef, wikiData);
    return { success: true, data: wikiData as Wiki };
}

export async function updateWiki(id: string, data: Partial<Omit<Wiki, 'id'>>): Promise<DbResult<Wiki>> {
    const db = getFirestore(app);
    const docRef = doc(db, WIKI_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
        return {
            success: false,
            error: { message: "Wiki not found" },
        };
    }

    const currentData = docSnap.data();
    const updatedData = { ...currentData, ...data, updatedAt: Date.now() };

    const parseResult = WIKI_SCHEMA.safeParse(updatedData);
    if (!parseResult.success) {
        return {
            success: false,
            error: { message: "Invalid wiki data format" },
        };
    }

    await setDoc(docRef, parseResult.data);
    return { success: true, data: parseResult.data as Wiki };
}

export async function deleteWiki(id: string): Promise<DbResult<void>> {
    const db = getFirestore(app);
    const docRef = doc(db, WIKI_COLLECTION, id);
    await deleteDoc(docRef);
    return { success: true, data: undefined };
}

