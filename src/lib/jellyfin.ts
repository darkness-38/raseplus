const JELLYFIN_BASE = "https://app.iloveteto.com";
const JELLYFIN_USER = "rase";
const JELLYFIN_PASS = "rase";

export const LIBRARY_IDS = {
    anime: "0c41907140d802bb58430fed7e2cd79e",
    movies: "f137a2dd21bbc1b99aa5c0f6bf02a805",
    series: "3148cf0701708325a446ec1751b2b64e",
    manga: "5f795ca43204873c9f5c35431248f4c2",
} as const;

export type LibraryType = keyof typeof LIBRARY_IDS;

interface AuthResult {
    AccessToken: string;
    User: { Id: string };
}

interface JellyfinItem {
    Id: string;
    Name: string;
    Overview?: string;
    Type: string;
    ProductionYear?: number;
    OfficialRating?: string;
    CommunityRating?: number;
    Genres?: string[];
    Studios?: { Name: string }[];
    People?: {
        Id: string;
        Name: string;
        Role?: string;
        Type: string;
        PrimaryImageTag?: string;
    }[];
    ImageTags?: Record<string, string>;
    BackdropImageTags?: string[];
    ParentBackdropImageTags?: string[];
    ParentBackdropItemId?: string;
    SeriesId?: string;
    SeriesName?: string;
    IndexNumber?: number;
    ParentIndexNumber?: number;
    MediaStreams?: MediaStream[];
    RunTimeTicks?: number;
    HasSubtitles?: boolean;
    MediaSources?: MediaSource[];
    UserData?: {
        PlaybackPositionTicks?: number;
        PlayedPercentage?: number;
        Played?: boolean;
        PlayCount?: number;
    };
}

interface MediaStream {
    Index: number;
    Type: string;
    Codec: string;
    Language?: string;
    DisplayTitle?: string;
    IsDefault?: boolean;
    Title?: string;
}

interface MediaSource {
    Id: string;
    Name: string;
    MediaStreams: MediaStream[];
}

interface ItemsResponse {
    Items: JellyfinItem[];
    TotalRecordCount: number;
}

class JellyfinService {
    private accessToken: string | null = null;
    private userId: string | null = null;
    private deviceId = "rase-plus-web-client";

    private get headers(): Record<string, string> {
        const auth = `MediaBrowser Client="Rase+", Device="Web", DeviceId="${this.deviceId}", Version="1.0.0"`;
        const h: Record<string, string> = {
            "Content-Type": "application/json",
            "X-Emby-Authorization": this.accessToken
                ? `${auth}, Token="${this.accessToken}"`
                : auth,
        };
        return h;
    }

    public getAuthorizationHeader(): string {
        const auth = `MediaBrowser Client="Rase+", Device="Web", DeviceId="${this.deviceId}", Version="1.0.0"`;
        return this.accessToken
            ? `${auth}, Token="${this.accessToken}"`
            : auth;
    }

    async authenticate(): Promise<boolean> {
        try {
            const res = await fetch(
                `${JELLYFIN_BASE}/Users/AuthenticateByName`,
                {
                    method: "POST",
                    headers: this.headers,
                    body: JSON.stringify({
                        Username: JELLYFIN_USER,
                        Pw: JELLYFIN_PASS,
                    }),
                }
            );
            if (!res.ok) throw new Error("Jellyfin auth failed");
            const data: AuthResult = await res.json();
            this.accessToken = data.AccessToken;
            this.userId = data.User.Id;
            return true;
        } catch (e) {
            console.error("Jellyfin auth error:", e);
            return false;
        }
    }

    isAuthenticated(): boolean {
        return !!this.accessToken && !!this.userId;
    }

    async getLibraryItems(
        libraryId: string,
        options?: {
            limit?: number;
            startIndex?: number;
            sortBy?: string;
            sortOrder?: string;
            fields?: string;
            filters?: string;
        }
    ): Promise<ItemsResponse> {
        const params = new URLSearchParams({
            ParentId: libraryId,
            Limit: String(options?.limit ?? 30),
            StartIndex: String(options?.startIndex ?? 0),
            SortBy: options?.sortBy ?? "SortName",
            SortOrder: options?.sortOrder ?? "Ascending",
            Fields: options?.fields ?? "PrimaryImageAspectRatio,BasicSyncInfo,Overview,Genres,People,Studios,MediaStreams,CommunityRating,UserData",
            Recursive: "true",
            IncludeItemTypes: "Movie,Series,BoxSet,Book",
            ImageTypeLimit: "1",
            EnableImageTypes: "Primary,Backdrop,Logo",
        });
        if (options?.filters) params.set("Filters", options.filters);

        const res = await fetch(
            `${JELLYFIN_BASE}/Users/${this.userId}/Items?${params}`,
            { headers: this.headers }
        );
        return res.json();
    }

    async getLatestItems(libraryId: string, limit = 16): Promise<JellyfinItem[]> {
        const params = new URLSearchParams({
            ParentId: libraryId,
            Limit: String(limit),
            Fields: "PrimaryImageAspectRatio,Overview,Genres,People",
            EnableImageTypes: "Primary,Backdrop,Logo",
            ImageTypeLimit: "1",
        });

        const res = await fetch(
            `${JELLYFIN_BASE}/Users/${this.userId}/Items/Latest?${params}`,
            { headers: this.headers }
        );
        return res.json();
    }

    async getItem(itemId: string): Promise<JellyfinItem> {
        const params = new URLSearchParams({
            Fields:
                "Overview,Genres,People,Studios,MediaStreams,MediaSources,CommunityRating,OfficialRating,UserData",
        });
        const res = await fetch(
            `${JELLYFIN_BASE}/Users/${this.userId}/Items/${itemId}?${params}`,
            { headers: this.headers }
        );
        return res.json();
    }

    async getSeasons(seriesId: string): Promise<JellyfinItem[]> {
        const params = new URLSearchParams({
            Fields: "PrimaryImageAspectRatio,Overview",
            EnableImageTypes: "Primary,Backdrop",
            UserId: this.userId!,
        });
        const res = await fetch(
            `${JELLYFIN_BASE}/Shows/${seriesId}/Seasons?${params}`,
            { headers: this.headers }
        );
        const data: ItemsResponse = await res.json();
        return data.Items;
    }

    async getEpisodes(
        seriesId: string,
        seasonId: string
    ): Promise<JellyfinItem[]> {
        const params = new URLSearchParams({
            SeasonId: seasonId,
            Fields: "Overview,PrimaryImageAspectRatio,MediaStreams,MediaSources,UserData",
            EnableImageTypes: "Primary,Screenshot",
            UserId: this.userId!,
        });
        const res = await fetch(
            `${JELLYFIN_BASE}/Shows/${seriesId}/Episodes?${params}`,
            { headers: this.headers }
        );
        const data: ItemsResponse = await res.json();
        return data.Items;
    }

    async getPages(bookId: string): Promise<number> {
        const res = await fetch(
            `${JELLYFIN_BASE}/Items/${bookId}/Pages`,
            { headers: this.headers }
        );
        // Returns total page count - we construct page image URLs from this
        try {
            const text = await res.text();
            // Jellyfin returns page count or page list
            const parsed = JSON.parse(text);
            if (Array.isArray(parsed)) return parsed.length;
            return parsed?.PageCount ?? 0;
        } catch {
            return 0;
        }
    }

    getPageImageUrl(bookId: string, pageIndex: number): string {
        return `${JELLYFIN_BASE}/Items/${bookId}/Pages/${pageIndex}?api_key=${this.accessToken}`;
    }

    getStreamUrl(
        itemId: string,
        mediaSourceId?: string,
        playSessionId?: string,
        options?: {
            maxBitrate?: number;
            audioStreamIndex?: number;
            subtitleStreamIndex?: number;
            startTimeTicks?: number;
        }
    ): string {
        const hasSubtitles = options?.subtitleStreamIndex !== undefined && options.subtitleStreamIndex !== -1;

        const params = new URLSearchParams({
            UserId: this.userId!,
            DeviceId: this.deviceId,
            PlaySessionId: playSessionId ?? "",
            MaxStreamingBitrate: String(options?.maxBitrate ?? 10000000), // 10 Mbps
            Container: "ts",
            AudioCodec: "mp3",
            VideoCodec: "h264",
            VideoBitrate: "10000000", // 10 Mbps
            AudioBitrate: "320000",
            AudioSampleRate: "48000",
            TranscodingMaxAudioChannels: "2",
            SegmentContainer: "ts",
            StartTimeTicks: "0",
            AllowVideoStreamCopy: "false",
            AllowAudioStreamCopy: "false",
            EnableDirectPlay: "false",
            EnableDirectStream: "false",
            "api_key": this.accessToken!,
        });


        if (mediaSourceId) {
            params.set("MediaSourceId", mediaSourceId);
        }
        if (options?.audioStreamIndex !== undefined) {
            params.set("AudioStreamIndex", String(options.audioStreamIndex));
            // Force transcoding to ensure the selected track is used
            params.set("AllowAudioStreamCopy", "false");
        }
        if (options?.subtitleStreamIndex !== undefined && options.subtitleStreamIndex !== -1) {
            params.set("SubtitleStreamIndex", String(options.subtitleStreamIndex));
            // Force burn-in for subtitles to ensure they appear
            params.set("SubtitleMethod", "Encode");
        }

        // Anti-cache
        params.set("t", String(Date.now()));

        return `${JELLYFIN_BASE}/Videos/${itemId}/master.m3u8?${params}`;
    }

    getDirectStreamUrl(itemId: string): string {
        return `${JELLYFIN_BASE}/Videos/${itemId}/stream?Static=true&api_key=${this.accessToken}`;
    }

    getImageUrl(
        itemId: string,
        type: "Primary" | "Backdrop" | "Logo" = "Primary",
        options?: { maxWidth?: number; quality?: number; tag?: string }
    ): string {
        const params = new URLSearchParams({
            maxWidth: String(options?.maxWidth ?? 800),
            quality: String(options?.quality ?? 90),
        });
        if (options?.tag) params.set("tag", options.tag);
        return `${JELLYFIN_BASE}/Items/${itemId}/Images/${type}?${params}`;
    }

    getPersonImageUrl(personId: string, tag?: string): string {
        const params = new URLSearchParams({
            maxWidth: "200",
            quality: "90",
        });
        if (tag) params.set("tag", tag);
        return `${JELLYFIN_BASE}/Items/${personId}/Images/Primary?${params}`;
    }

    async getIntroTimestamps(
        itemId: string
    ): Promise<{ IntroStart?: number; IntroEnd?: number } | null> {
        try {
            const res = await fetch(
                `${JELLYFIN_BASE}/Episode/${itemId}/IntroTimestamps`,
                { headers: this.headers }
            );
            if (!res.ok) return null;
            return res.json();
        } catch {
            return null;
        }
    }

    async getSimilarItems(itemId: string, limit = 12): Promise<JellyfinItem[]> {
        const params = new URLSearchParams({
            Limit: String(limit),
            Fields: "PrimaryImageAspectRatio,Overview",
            UserId: this.userId!,
        });
        const res = await fetch(
            `${JELLYFIN_BASE}/Items/${itemId}/Similar?${params}`,
            { headers: this.headers }
        );
        const data: ItemsResponse = await res.json();
        return data.Items;
    }

    async getResumable(limit = 12): Promise<JellyfinItem[]> {
        const params = new URLSearchParams({
            Limit: String(limit),
            Fields: "PrimaryImageAspectRatio,Overview,UserData",
            MediaTypes: "Video",
            EnableImageTypes: "Primary,Backdrop,Logo",
            ImageTypeLimit: "1",
        });
        const res = await fetch(
            `${JELLYFIN_BASE}/Users/${this.userId}/Items/Resume?${params}`,
            { headers: this.headers }
        );
        const data: ItemsResponse = await res.json();
        return data.Items;
    }

    async searchItems(query: string, limit = 30): Promise<JellyfinItem[]> {
        if (!query.trim()) return [];
        const params = new URLSearchParams({
            SearchTerm: query,
            Limit: String(limit),
            Fields: "PrimaryImageAspectRatio,Overview,Genres,CommunityRating,OfficialRating",
            Recursive: "true",
            IncludeItemTypes: "Movie,Series,BoxSet,Book",
            EnableImageTypes: "Primary,Backdrop,Logo",
            ImageTypeLimit: "1",
        });
        const res = await fetch(
            `${JELLYFIN_BASE}/Users/${this.userId}/Items?${params}`,
            { headers: this.headers }
        );
        const data: ItemsResponse = await res.json();
        return data.Items;
    }

    // Playback reporting
    async startPlayback(itemId: string, mediaSourceId: string): Promise<void> {
        try {
            await fetch(`${JELLYFIN_BASE}/Sessions/Playing`, {
                method: "POST",
                headers: this.headers,
                body: JSON.stringify({ ItemId: itemId, MediaSourceId: mediaSourceId }),
            });
        } catch (e) {
            console.error("startPlayback error:", e);
        }
    }

    async onPlaybackProgress(itemId: string, mediaSourceId: string, positionTicks: number): Promise<void> {
        try {
            await fetch(`${JELLYFIN_BASE}/Sessions/Playing/Progress`, {
                method: "POST",
                headers: this.headers,
                body: JSON.stringify({ ItemId: itemId, MediaSourceId: mediaSourceId, PositionTicks: positionTicks }),
            });
        } catch (e) {
            console.error("onPlaybackProgress error:", e);
        }
    }

    async stopPlayback(itemId: string, mediaSourceId: string, positionTicks: number): Promise<void> {
        try {
            await fetch(`${JELLYFIN_BASE}/Sessions/Playing/Stopped`, {
                method: "POST",
                headers: this.headers,
                body: JSON.stringify({ ItemId: itemId, MediaSourceId: mediaSourceId, PositionTicks: positionTicks }),
            });
        } catch (e) {
            console.error("stopPlayback error:", e);
        }
    }

    async getNextUp(seriesId: string): Promise<JellyfinItem | null> {
        try {
            const params = new URLSearchParams({
                SeriesId: seriesId,
                Fields: "Overview,PrimaryImageAspectRatio,MediaStreams,MediaSources,UserData",
                UserId: this.userId!,
                Limit: "1",
            });
            const res = await fetch(
                `${JELLYFIN_BASE}/Shows/NextUp?${params}`,
                { headers: this.headers }
            );
            const data: ItemsResponse = await res.json();
            return data.Items?.[0] ?? null;
        } catch {
            return null;
        }
    }
}

// Singleton
export const jellyfin = new JellyfinService();
export type { JellyfinItem, MediaStream, MediaSource, ItemsResponse };
