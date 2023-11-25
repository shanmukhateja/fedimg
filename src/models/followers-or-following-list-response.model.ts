export interface UserFollowingOrFollowersListModel {
    "@context":   string;
    id:           string;
    type:         string;
    totalItems:   number;
    next:         string;
    partOf:       string;
    orderedItems: string[];
}
