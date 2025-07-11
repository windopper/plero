import { getFirestore, doc, getDoc, setDoc, deleteDoc, Query, getDocs, collection, where, query, limit, startAfter, startAt, endAt, orderBy } from "firebase/firestore";
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
            return { success: false, error: { message: result.error.message } };
        }
    } else {
        return {
            success: false,
            error: { message: "Wiki not found" },
        };
    }
}

export async function getWikiList(options: {query: string, page: number, limit: number}): Promise<DbResult<{wikis: Wiki[], totalCount: number, hasMore: boolean}>> {
    const db = getFirestore(app);
    const { query: searchQuery, page, limit: pageLimit } = options;
    const actualLimit = pageLimit || 10;
    
    // 전체 위키 문서를 가져온 후 클라이언트 사이드에서 필터링
    // Firestore는 전체 텍스트 검색을 지원하지 않으므로 이 방식을 사용
    const allDocsQuery = query(
      collection(db, WIKI_COLLECTION),
      where('title', '>=', searchQuery),
      where('title', '<=', searchQuery + "\uf8ff"),
    );
    const querySnapshot = await getDocs(allDocsQuery);
    
    let allWikis = querySnapshot.docs.map((doc) => doc.data() as Wiki);
    
    // 최신 순으로 정렬
    allWikis.sort((a, b) => b.updatedAt - a.updatedAt);
    
    const totalCount = allWikis.length;
    const startIndex = (page - 1) * actualLimit;
    const endIndex = startIndex + actualLimit;
    const wikis = allWikis.slice(startIndex, endIndex);
    const hasMore = endIndex < totalCount;
    
    return { 
        success: true, 
        data: {
            wikis,
            totalCount,
            hasMore
        }
    };
}

export async function getWikiByTag(tag: string): Promise<DbResult<{wikis: {id: string, title: string}[], totalCount: number}>> {
    const db = getFirestore(app);
    // %20을 공백으로 변환
    const allDocsQuery = query(
        collection(db, WIKI_COLLECTION),
        where('tags', 'array-contains', tag.replace(/%20/g, ' '))
    );
    const querySnapshot = await getDocs(allDocsQuery);
    const wikis = querySnapshot.docs.map((doc) => {
        const wiki = doc.data() as Wiki;
        return {
            id: wiki.id,
            title: wiki.title,
        }
    });
    const totalCount = wikis.length;
    return { success: true, data: { wikis, totalCount } };
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

