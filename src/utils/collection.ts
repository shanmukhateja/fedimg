export function generateCollectionResponse(data: any[], id: string) {

    return {
        "@context": "https://www.w3.org/ns/activitystreams",
        "id": id,
        "type": "OrderedCollection",
        // FIXME: need to support paginated results
        "totalItems": data.length,
        "first": `${id}?page=1`
    };
}
