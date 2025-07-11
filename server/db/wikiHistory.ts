import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  setDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import app from ".";
import { WIKI_HISTORY_COLLECTION } from "./constants";
import { WIKI_HISTORY_SCHEMA, WikiHistory } from "./schema";
import { v4 } from "uuid";
import { getWikiContentHash, getWikiContentSize } from "../../utils/wiki";
import type { DbResult } from "../type";

export async function getWikiHistoriesByWikiId(
  wikiId: string
): Promise<DbResult<WikiHistory[]>> {
  const db = getFirestore(app);
  const docRef = query(
    collection(db, WIKI_HISTORY_COLLECTION),
    where("wikiId", "==", wikiId)
  );
  const docSnap = await getDocs(docRef);
  if (docSnap.size > 0) {
    const histories = docSnap.docs
      .sort((a, b) => b.data().changedAt - a.data().changedAt)
      .map((doc) =>
        WIKI_HISTORY_SCHEMA.safeParse({ id: doc.id, ...doc.data() })
      );
    return {
      success: true,
      data: histories.map((history) => history.data) as WikiHistory[],
    };
  } else {
    return { success: true, data: [] };
  }
}

export async function getWikiHistory(
  id: string
): Promise<DbResult<WikiHistory>> {
  const db = getFirestore(app);
  const docRef = doc(db, WIKI_HISTORY_COLLECTION, id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const result = WIKI_HISTORY_SCHEMA.safeParse(docSnap.data());
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return {
        success: false,
        error: { message: "Invalid wiki history data format" },
      };
    }
  } else {
    return { success: false, error: { message: "Wiki history not found" } };
  }
}

export async function getLatestWikiHistory(
  wikiId: string
): Promise<DbResult<WikiHistory>> {
  const db = getFirestore(app);
  const docRef = query(
    collection(db, WIKI_HISTORY_COLLECTION),
    where("wikiId", "==", wikiId),
    orderBy("changedAt", "desc"),
    limit(1)
  );
  const docSnap = await getDocs(docRef);
  if (docSnap.size > 0) {
    const result = WIKI_HISTORY_SCHEMA.safeParse(docSnap.docs[0].data());
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return {
        success: false,
        error: { message: "Invalid wiki history data format" },
      };
    }
  } else {
    return { success: false, error: { message: "Wiki history not found" } };
  }
}

export async function setWikiHistory(
  data: Omit<WikiHistory, "id">
): Promise<DbResult<WikiHistory>> {
  const db = getFirestore(app);
  const historyId = v4();
  const docRef = doc(db, WIKI_HISTORY_COLLECTION, historyId);
  const historyData: WikiHistory = {
    id: historyId,
    ...data,
  };
  await setDoc(docRef, historyData);
  return { success: true, data: historyData };
}

export async function updateWikiHistory(
  documentId: string,
  data: Partial<Omit<WikiHistory, "id">>
): Promise<DbResult<WikiHistory>> {
  const db = getFirestore(app);
  const docRef = doc(db, WIKI_HISTORY_COLLECTION, documentId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const historyData = WIKI_HISTORY_SCHEMA.safeParse(docSnap.data());
    if (historyData.success) {
      const updatedHistoryData = { ...historyData.data, ...data };
      await setDoc(docRef, updatedHistoryData);
      return { success: true, data: updatedHistoryData };
    } else {
      return { success: false, error: historyData.error };
    }
  } else {
    return { success: false, error: { message: "Wiki history not found" } };
  }
}

export async function deleteWikiHistory(
  documentId: string
): Promise<DbResult<WikiHistory>> {
  const db = getFirestore(app);
  const docRef = doc(db, WIKI_HISTORY_COLLECTION, documentId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    await deleteDoc(docRef);
    const historyData = WIKI_HISTORY_SCHEMA.safeParse(docSnap.data());
    if (historyData.success) {
      return { success: true, data: historyData.data as WikiHistory };
    } else {
      return { success: false, error: historyData.error };
    }
  } else {
    return { success: false, error: { message: "Wiki history not found" } };
  }
}

export async function deleteWikiHistoriesByWikiId(
  wikiId: string
): Promise<DbResult<void>> {
  const db = getFirestore(app);
  const docRef = query(
    collection(db, WIKI_HISTORY_COLLECTION),
    where("wikiId", "==", wikiId)
  );
  const docs = await getDocs(docRef);
  const batch = writeBatch(db);
  for (const doc of docs.docs) {
    batch.delete(doc.ref);
  }
  await batch.commit();
  return { success: true, data: undefined };
}
