import { getFirestore, doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import app from ".";
import { WIKI_COLLECTION } from "./constants";
import { Wiki, WIKI_SCHEMA } from "./schema";

export async function getWiki(id: string) {
    const db = getFirestore(app);
    const docRef = doc(db, WIKI_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return WIKI_SCHEMA.safeParse(docSnap.data());
    } else {
        return {
            success: false,
            error: "Wiki not found",
        };
    }
}

export async function setWiki(id: string, data: Wiki) {
    const db = getFirestore(app);
    const docRef = doc(db, WIKI_COLLECTION, id);
    await setDoc(docRef, WIKI_SCHEMA.safeParse(data));
}

export async function deleteWiki(id: string) {
    const db = getFirestore(app);
    const docRef = doc(db, WIKI_COLLECTION, id);
    await deleteDoc(docRef);
}