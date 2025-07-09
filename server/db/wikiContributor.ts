import { collection, deleteDoc, doc, getDoc, getDocs, getFirestore, query, setDoc, where, writeBatch } from "firebase/firestore";
import app from ".";
import { WIKI_CONTRIBUTORS_COLLECTION } from "./constants";
import { User, WIKI_CONTRIBUTORS_SCHEMA, WikiContributor } from "./schema";
import { v4 } from "uuid";
import type { DbResult } from "../type";

export async function getWikiContributorsByWikiId(wikiId: string): Promise<DbResult<WikiContributor[]>> {
  const db = getFirestore(app);
  const docRef = query(collection(db, WIKI_CONTRIBUTORS_COLLECTION), where("wikiId", "==", wikiId));
  const docs = await getDocs(docRef);
  if (docs.empty) {
    return {
      success: false,
      error: { message: "Wiki contributor not found" },
    };
  }
  return {
    success: true,
    data: docs.docs
      .map((doc) => WIKI_CONTRIBUTORS_SCHEMA.safeParse(doc.data()).data)
      .filter((data): data is WikiContributor => data !== undefined),
  };
}

export async function getWikiContributor(id: string): Promise<DbResult<WikiContributor>> {
  const db = getFirestore(app);
  const docRef = doc(db, WIKI_CONTRIBUTORS_COLLECTION, id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const result = WIKI_CONTRIBUTORS_SCHEMA.safeParse(docSnap.data());
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return { success: false, error: result.error };
    }
  } else {
    return {
      success: false,
      error: { message: "Wiki contributor not found" },
    };
  }
}

export async function setWikiContributor(contributor: Omit<WikiContributor, 'id'>): Promise<DbResult<WikiContributor>> {
  const db = getFirestore(app);
  const contributorId = v4(); // Generate a new UUID for the wiki contributor
  const docRef = doc(db, WIKI_CONTRIBUTORS_COLLECTION, contributorId);

  const contributorsData: WikiContributor = {
    id: contributorId,
    ...contributor,
  };
  await setDoc(docRef, contributorsData);
  return { success: true, data: contributorsData };
}

export async function updateWikiContributor(
  id: string,
  data: Partial<Omit<WikiContributor, 'id'>>
): Promise<DbResult<WikiContributor>> {
  const db = getFirestore(app);
  const docRef = doc(db, WIKI_CONTRIBUTORS_COLLECTION, id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const contributorsData = WIKI_CONTRIBUTORS_SCHEMA.safeParse(docSnap.data());
    if (contributorsData.success) {
      const updatedData = { ...contributorsData.data, ...data };
      await setDoc(docRef, updatedData);
      return { success: true, data: updatedData };
    } else {
      return { success: false, error: contributorsData.error };
    }
  } else {
    return { success: false, error: { message: "Wiki contributor not found" } };
  }
}

export async function deleteWikiContributor(id: string): Promise<DbResult<void>> {
  const db = getFirestore(app);
  const docRef = doc(db, WIKI_CONTRIBUTORS_COLLECTION, id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    await deleteDoc(docRef);
    return { success: true, data: undefined };
  } else {
    return { success: false, error: { message: "Wiki contributor not found" } };
  } 
}

export async function deleteWikiContributorsByWikiId(wikiId: string): Promise<DbResult<void>> {
  const db = getFirestore(app);
  const docRef = query(collection(db, WIKI_CONTRIBUTORS_COLLECTION), where("wikiId", "==", wikiId));
  const docs = await getDocs(docRef);
  const batch = writeBatch(db);
  for (const doc of docs.docs) {
    batch.delete(doc.ref);
  }
  await batch.commit();
  return { success: true, data: undefined };
}