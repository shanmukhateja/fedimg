export class PaginationModel {
    page: number = 0;
    limit = 10;
    totalItems = 0;
    showNext = false;
    showPrev = false;

    constructor(page: string| number, limit: string| number, totalItems: number) {
        const _page = typeof page == 'string' ? parseInt(page) : page;
        this.page = _page <= 1 ? 0 : _page;
        this.limit = typeof limit == 'string' ? parseInt(limit) : limit ?? this.limit;
        this.totalItems = totalItems;
    }

}