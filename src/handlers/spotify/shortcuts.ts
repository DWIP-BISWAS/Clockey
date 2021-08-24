import { get } from 'svelte/store';
import { SpotifyClient } from '../../lib/spotify/SpotifyClient';
import { notifications } from '../../stores/notifications';
import { shortcuts } from '../../stores/rooster';
import { spotifyPlayerState } from '../../stores/spotify';
import type { RoosterArgument, RoosterExample, RoosterExampleImageSize, RoosterExamples, RoosterShortcut } from '../../types';
import { device_id } from './player';

type searchType = 'album'| 'playlist' | 'track' | 'search' | 'artist';

let oldRes;
async function loadSearch(query: string, type: searchType): Promise<RoosterExamples> {
    let toQueue = false; let res;
    
    if (!query || query.length < 2) return {};
    else if (query.endsWith('>>') || query.endsWith('>')) {
        toQueue = true; 
        query = query.replace(/>+$/g, '');
        if (oldRes) res = oldRes;
    }
    
    const seachTy: searchType[] = type === 'search' ? ['album', 'track', 'artist'] : [type];
    // @ts-ignore
    if (!res) res = await SpotifyClient.search(query, seachTy, { limit: type === 'search' ? 2 : 5 });

    let examples: RoosterExamples = {};
    let exampleList = [];
    
    for (const key of (Object.keys(res))) {
        const list: RoosterExample[] = res[key].items.map((item) => {
            let tip = ''; let size: RoosterExampleImageSize = 'sm';
            if (key === 'tracks') {
                item.artists.forEach(a => tip += ` ${a.name}`);
            }
            
            else if (key === 'artists') {
                tip = '[Artist]';
                size = 'md';
            }
            
            else if (key === 'albums') {
                tip = `[Album${item.release_date ? (' - ' + item.release_date) : ''}]`;
            }

            else if (key === 'playlists') {
                if (item?.owner?.display_name) tip = 'by ' + item?.owner?.display_name;
            }
            
            const images =  item?.album?.images ? item.album.images : item.images;
            const image = images.length ? images[images.length - 1].url : '';
            return {'example': item.name, tip, image, 'selectable': true, 'id': (toQueue ? `>>${item.name}<<` : '') + item.uri, size};
        });

        exampleList.push(...list);
    }
    
    examples.group = exampleList.reverse().sort((a, b) => b.size === 'md' ? 1 : -1);
    examples.namespace = type;
    oldRes = res;

    return examples;
}

async function loadQueue(): Promise<RoosterExamples> {
    const playerState = get(spotifyPlayerState);

    if (playerState.track_window?.next_tracks.length) {
        return {
            'namespace': 'Queue',
            'group': playerState.track_window.next_tracks.map((el, i) => {
                return {
                    'argument': '#' + (i + 1).toString(),
                    'example': el.name,
                    'selectable': false,
                    'size': 'sm',
                    'image': el?.album?.images[0]?.url || '',
                }
            })
        }
    } else {
        return {'group': [], 'namespace': 'Queue'};
    }
}

export function createShortcuts() {
    let args: {[key: string]: RoosterArgument} = {};
    ['search','album','playlist', 'track'].forEach(el => {
        args[el] = {
            async callback(p, id: string) {
                try {
                    const isQueue = />>(.*)<</.exec(id);
                    
                    if (isQueue) {
                        await SpotifyClient.queue(id.replace(isQueue[0], ''));
                        notifications.create({'title': 'Added to queue', 'content': isQueue[1], 'icon': 'fab fa-spotify'});
                    } else {
                        let params: SpotifyApi.PlayParameterObject = {device_id};
                        id.match("spotify:track:") ? params.uris = [id] : params.context_uri = id; 
                        await SpotifyClient.play(params);
                    }
                    
                    return true;
                } catch(err) {
                    console.log(err);
                    return false;
                }
            }
        }
    });

    args.search.quickLaunch = 'l';
    args.track.quickLaunch = 't';

    shortcuts.set('spotify', {
        background: process.env.SPOTIFY_COLOR,
        color: process.env.BACKGROUND_DARK,
        arguments: {
            ...args,
            pause: {
                async callback() {
                    try { await SpotifyClient.pause({device_id}); return true;}
                    catch(e) { console.error(e); return false;}
                }
            },
            queue: {
                async callback() {
                    return false;
                }
            }
        }, 
        async examples(arg, params) {
            if (['search','album','playlist', 'track'].find(a => a === arg)) {
                //@ts-ignore
                return loadSearch(params, arg);
            }

            else if (arg === 'queue') {
                return loadQueue();
            }

            return null;
        }
    })
}
