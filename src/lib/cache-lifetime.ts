// A page's own cache inherits this lifetime and sits on top of the data's, so a direct database edit
// can take up to twice this long to show. REQ §5.3 promises one hour: hence half.
export const DATA_CACHE_SECONDS = 1800;
