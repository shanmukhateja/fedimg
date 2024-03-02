import { PaginationModel } from "../models/pagination.model";

export function generateCollectionResponse(id: string, paginationModel: PaginationModel) {

    return {
        "@context": "https://www.w3.org/ns/activitystreams",
        "id": id,
        "type": "OrderedCollection",
        "totalItems": paginationModel.totalItems,
        "first": `${id}?page=1`
    };
}

export function generateCollectionPageResponse<T>(data: T[], id: string, paginationModel: PaginationModel) {

    const url = new URL(id);
    const partOf = `${url.origin}${url.pathname}`;

    const { page, limit, totalItems } = paginationModel;

    // TODO: This definitely has bugs but unable to reproduce it right now.
    paginationModel.showPrev = page > 1 && (page * limit) < totalItems;
    paginationModel.showNext = page > 1 && (page * limit) < totalItems;

    let response = {
        "@context": "https://www.w3.org/ns/activitystreams",
        "id": id,
        "type": "OrderedCollectionPage",
        "totalItems": paginationModel.totalItems,
        "partOf": partOf,
        "orderedItems": data
    }

    if (paginationModel.showPrev) {
        const urlForId = new URL(id);
        urlForId.searchParams.set('page', (page - 1).toString());
        response["prev"] = urlForId.toString();
    }

    if (paginationModel.showNext) {
        // page=0 || page=1 returns next value as page=2
        const nextPageValue = page <= 1 ? 2 : page + 1;
        const urlForId = new URL(id);
        urlForId.searchParams.set('page', nextPageValue.toString());
        response["next"] = urlForId.toString();
    }

    return response
}