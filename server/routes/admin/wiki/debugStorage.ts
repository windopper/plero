import type { Wiki, WikiContributor, WikiHistory } from "~/server/db/schema";

export let debugWikis: Wiki[] = [];
export let debugWikiHistories: WikiHistory[] = [];
export let debugContributors: WikiContributor[] = [];

export function clearDebugStorage() {
    debugWikis = [];
    debugWikiHistories = [];
    debugContributors = [];
}

export function pushDebugWiki(wiki: Wiki) {
    debugWikis.push(wiki);
}

export function pushDebugWikiHistory(wikiHistory: WikiHistory) {
    debugWikiHistories.push(wikiHistory);
}

export function pushDebugContributor(contributor: WikiContributor) {        
    debugContributors.push(contributor);
}