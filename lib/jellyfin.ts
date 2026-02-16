// Jellyfin API Service Layer
const JELLYFIN_BASE = 'http://192.168.1.50:8096';

const AUTH_HEADER = 'MediaBrowser Client="RasePlus", Device="Web", DeviceId="raseplus-web-001", Version="1.0.0"';

export interface JellyfinAuth {
    AccessToken: string;
    User: {
        Id: string;
        Name: string;
    };
}

export interface BaseItem {
    Id: string;
    Name: string;
    Type: string;
    Overview?: string;
    Genres?: string[];
    Tags?: string[];
    CommunityRating?: number;
    OfficialRating?: string;
    ProductionYear?: number;
    RunTimeTicks?: number;
    SeriesName?: string;
    SeasonName?: string;
    IndexNumber?: number;
    ParentIndexNumber?: number;
    ImageTags?: Record<string, string>;
    BackdropImageTags?: string[];
    SeriesId?: string;
    SeasonId?: string;
    MediaSources?: MediaSource[];
    UserData?: {
        PlaybackPositionTicks?: number;
        PlayCount?: number;
        IsFavorite?: boolean;
        Played?: boolean;
        UnplayedItemCount?: number;
    };
}

export interface MediaStream {
    Index: number;
    Type: 'Video' | 'Audio' | 'Subtitle' | 'EmbeddedImage';
    Codec?: string;
    Language?: string;
    DisplayTitle?: string;
    Title?: string;
    IsDefault?: boolean;
    IsForced?: boolean;
    IsExternal?: boolean;
    SupportsExternalStream?: boolean;
    DeliveryUrl?: string;
    Height?: number;
    Width?: number;
    BitRate?: number;
    Channels?: number;
    ChannelLayout?: string;
}

export interface MediaSource {
    Id: string;
    Container: string;
    Size?: number;
    Bitrate?: number;
    SupportsDirectPlay?: boolean;
    SupportsDirectStream?: boolean;
    SupportsTranscoding?: boolean;
    MediaStreams?: MediaStream[];
}

export interface ItemsResult {
    Items: BaseItem[];
    TotalRecordCount: number;
}

// ── Authentication ──────────────────────────────────────────────

export async function authenticateByName(username: string, password: string): Promise<JellyfinAuth> {
    const res = await fetch(`${JELLYFIN_BASE}/Users/AuthenticateByName`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Emby-Authorization': AUTH_HEADER,
        },
        body: JSON.stringify({ Username: username, Pw: password }),
    });

    if (!res.ok) throw new Error('Authentication failed');
    return res.json();
}

// ── Helpers ─────────────────────────────────────────────────────

function authHeaders(token: string) {
    return {
        'X-Emby-Authorization': `${AUTH_HEADER}, Token="${token}"`,
    };
}

async function apiGet<T>(path: string, token: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`${JELLYFIN_BASE}${path}`);
    if (params) {
        Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    }
    const res = await fetch(url.toString(), { headers: authHeaders(token) });
    if (!res.ok) throw new Error(`API error: ${res.status} — ${path}`);
    return res.json();
}

// ── Libraries ───────────────────────────────────────────────────

export async function getViews(userId: string, token: string) {
    return apiGet<{ Items: BaseItem[] }>(`/Users/${userId}/Views`, token);
}

// ── Items ───────────────────────────────────────────────────────

export async function getItems(
    userId: string,
    token: string,
    options: {
        parentId?: string;
        includeItemTypes?: string;
        sortBy?: string;
        sortOrder?: string;
        recursive?: boolean;
        fields?: string;
        limit?: number;
        startIndex?: number;
        searchTerm?: string;
        genres?: string;
        years?: string;
        filters?: string;
    } = {}
): Promise<ItemsResult> {
    const params: Record<string, string> = {};
    if (options.parentId) params.ParentId = options.parentId;
    if (options.includeItemTypes) params.IncludeItemTypes = options.includeItemTypes;
    if (options.sortBy) params.SortBy = options.sortBy;
    if (options.sortOrder) params.SortOrder = options.sortOrder;
    if (options.recursive !== undefined) params.Recursive = String(options.recursive);
    if (options.fields) params.Fields = options.fields;
    if (options.limit) params.Limit = String(options.limit);
    if (options.startIndex) params.StartIndex = String(options.startIndex);
    if (options.searchTerm) params.SearchTerm = options.searchTerm;
    if (options.genres) params.Genres = options.genres;
    if (options.years) params.Years = options.years;
    if (options.filters) params.Filters = options.filters;

    return apiGet<ItemsResult>(`/Users/${userId}/Items`, token, params);
}

export async function getLatestItems(
    userId: string,
    token: string,
    options: { includeItemTypes?: string; limit?: number; parentId?: string } = {}
): Promise<BaseItem[]> {
    const params: Record<string, string> = {};
    if (options.includeItemTypes) params.IncludeItemTypes = options.includeItemTypes;
    if (options.limit) params.Limit = String(options.limit);
    if (options.parentId) params.ParentId = options.parentId;
    params.Fields = 'Overview,Genres,Tags,CommunityRating,OfficialRating,ProductionYear,MediaSources';

    return apiGet<BaseItem[]>(`/Users/${userId}/Items/Latest`, token, params);
}

export async function getItem(userId: string, itemId: string, token: string): Promise<BaseItem> {
    return apiGet<BaseItem>(`/Users/${userId}/Items/${itemId}`, token, {
        Fields: 'Overview,Genres,Tags,CommunityRating,OfficialRating,ProductionYear,MediaSources,MediaStreams,People',
    });
}

export async function getSeasons(seriesId: string, userId: string, token: string): Promise<ItemsResult> {
    return apiGet<ItemsResult>(`/Shows/${seriesId}/Seasons`, token, { UserId: userId });
}

export async function getEpisodes(
    seriesId: string,
    seasonId: string,
    userId: string,
    token: string
): Promise<ItemsResult> {
    return apiGet<ItemsResult>(`/Shows/${seriesId}/Episodes`, token, {
        UserId: userId,
        SeasonId: seasonId,
        Fields: 'Overview,MediaSources',
    });
}

export async function getResumeItems(userId: string, token: string): Promise<ItemsResult> {
    return apiGet<ItemsResult>(`/Users/${userId}/Items/Resume`, token, {
        Limit: '12',
        Recursive: 'true',
        Fields: 'Overview,Genres,MediaSources',
        IncludeItemTypes: 'Movie,Episode',
        MediaTypes: 'Video',
    });
}

export async function getSimilarItems(itemId: string, userId: string, token: string): Promise<ItemsResult> {
    return apiGet<ItemsResult>(`/Items/${itemId}/Similar`, token, {
        UserId: userId,
        Limit: '12',
        Fields: 'Overview,Genres',
    });
}

// ── Images ──────────────────────────────────────────────────────

export function getImageUrl(
    itemId: string,
    imageType: 'Primary' | 'Backdrop' | 'Thumb' | 'Logo' | 'Banner' = 'Primary',
    options: { maxWidth?: number; maxHeight?: number; quality?: number; tag?: string } = {}
): string {
    const params = new URLSearchParams();
    if (options.maxWidth) params.set('maxWidth', String(options.maxWidth));
    if (options.maxHeight) params.set('maxHeight', String(options.maxHeight));
    if (options.quality) params.set('quality', String(options.quality));
    if (options.tag) params.set('tag', options.tag);
    return `${JELLYFIN_BASE}/Items/${itemId}/Images/${imageType}?${params.toString()}`;
}

// ── Streaming ───────────────────────────────────────────────────

export function getStreamUrl(itemId: string, token: string, mediaSourceId?: string): string {
    const params = new URLSearchParams({
        static: 'true',
        api_key: token,
    });
    if (mediaSourceId) params.set('MediaSourceId', mediaSourceId);
    return `${JELLYFIN_BASE}/Videos/${itemId}/stream?${params.toString()}`;
}

export function getSubtitleUrl(itemId: string, mediaSourceId: string, streamIndex: number, token: string, format = 'vtt'): string {
    return `${JELLYFIN_BASE}/Videos/${itemId}/${mediaSourceId}/Subtitles/${streamIndex}/0/Stream.${format}?api_key=${token}`;
}

export function getHlsStreamUrl(itemId: string, token: string, options?: { audioStreamIndex?: number; subtitleStreamIndex?: number }): string {
    const params = new URLSearchParams({
        api_key: token,
        DeviceId: 'raseplus-web-001',
        MediaSourceId: itemId,
        VideoCodec: 'h264',
        AudioCodec: 'aac',
        MaxStreamingBitrate: '120000000',
        TranscodingMaxAudioChannels: '2',
        SegmentContainer: 'ts',
        MinSegments: '1',
        BreakOnNonKeyFrames: 'true',
    });
    if (options?.audioStreamIndex !== undefined) params.set('AudioStreamIndex', String(options.audioStreamIndex));
    if (options?.subtitleStreamIndex !== undefined) params.set('SubtitleStreamIndex', String(options.subtitleStreamIndex));
    return `${JELLYFIN_BASE}/Videos/${itemId}/master.m3u8?${params.toString()}`;
}

// ── Search ──────────────────────────────────────────────────────

export async function searchItems(userId: string, token: string, query: string): Promise<ItemsResult> {
    return getItems(userId, token, {
        searchTerm: query,
        recursive: true,
        includeItemTypes: 'Movie,Series,Episode',
        fields: 'Overview,Genres,CommunityRating,ProductionYear',
        limit: 30,
    });
}

// ── Utils ───────────────────────────────────────────────────────

export function ticksToMinutes(ticks?: number): number {
    if (!ticks) return 0;
    return Math.floor(ticks / 600000000);
}

export function ticksToTime(ticks?: number): string {
    if (!ticks) return '0:00';
    const totalSeconds = Math.floor(ticks / 10000000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m ${secs}s`;
}

export function formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
}
