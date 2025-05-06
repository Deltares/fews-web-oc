export interface DocumentDisplay {
    documentDiplay: DocumentDiplay;
}

export interface DocumentDiplay {
    documentDisplayId: string;
    documentBrowser:   DocumentBrowser;
}

export interface DocumentBrowser {
    preview:             boolean;
    viewConfig:          ViewConfig;
    showArchiveProducts: ShowArchiveProduct[];
}

export interface ShowArchiveProduct {
    areaId:     string;
    sourceId:   string;
    attributes: Attribute[];
}

export interface Attribute {
    status: string;
}

export interface ViewConfig {
    type:    string;
    headers: Header[];
}

export interface Header {
    attribute: string;
    title:     string;
    sortable:  boolean;
    sorted:    boolean;
}
