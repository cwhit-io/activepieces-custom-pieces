import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { planningCenterAuth } from '../auth';
import {
	planningCenterClient,
	type PlanningCenterCredentials,
} from '../common/client';
import {
	isSameCalendarDay,
	resolveLatestSundayDate,
} from '../common/dates';
import { planningCenterCommon } from '../common/props';

export const getLatestSundayEpisodeAction = createAction({
	auth: planningCenterAuth,
	name: 'get_latest_sunday_episode',
	displayName: 'Get Latest Sunday Episode',
	description:
		'Returns the sermon episode for the most recent Sunday — today if run on Sunday, otherwise the previous Sunday.',
	audience: 'both',
	aiMetadata: {
		description:
			'Finds the Publishing episode whose live/service date falls on the latest Sunday relative to now in the chosen timezone. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		channel: planningCenterCommon.channelDropdown,
		timezone: planningCenterCommon.timeZone,
	},
	async run(context) {
		const credentials = planningCenterClient.credentialsFromAuthProps(
			context.auth.props,
		);
		const { channel, timezone } = context.propsValue;
		const { sundayDate } = resolveLatestSundayDate({ timeZone: timezone });

		const episodes = await planningCenterClient.paginatedApiCall({
			credentials,
			path: `/publishing/v2/channels/${channel}/episodes`,
			queryParams: {
				order: '-published_live_at',
				per_page: '100',
			},
			maxResults: 100,
		});

		for (const episode of episodes) {
			const publishedLiveAt = episode.attributes?.['published_live_at'];
			if (
				typeof publishedLiveAt === 'string' &&
				isSameCalendarDay({
					isoTimestamp: publishedLiveAt,
					targetDay: sundayDate,
					timeZone: timezone,
				})
			) {
				return await buildSundayEpisodeResult({
					credentials,
					episodeId: episode.id,
					extras: {
						resolved_sunday: sundayDate,
						matched_on: 'published_live_at',
					},
				});
			}
		}

		for (const episode of episodes) {
			const response = await planningCenterClient.apiCall<JsonApiListResponse>({
				credentials,
				method: HttpMethod.GET,
				path: `/publishing/v2/episodes/${episode.id}/episode_times`,
				queryParams: {
					order: '-starts_at',
					per_page: '25',
				},
			});

			const episodeTimes = response.body.data ?? [];
			const matchedTime = episodeTimes.find((time: EpisodeTimeResource) => {
				const startsAt = time.attributes?.starts_at;
				return (
					typeof startsAt === 'string' &&
					isSameCalendarDay({
						isoTimestamp: startsAt,
						targetDay: sundayDate,
						timeZone: timezone,
					})
				);
			});

			if (matchedTime) {
				return await buildSundayEpisodeResult({
					credentials,
					episodeId: episode.id,
					extras: {
						resolved_sunday: sundayDate,
						matched_on: 'episode_times.starts_at',
						matched_episode_time_id: matchedTime.id,
					},
				});
			}
		}

		throw new Error(
			`No sermon episode found for Sunday ${sundayDate} on channel ${channel}. Ensure the episode has a published live date or episode time on that Sunday.`,
		);
	},
});

async function buildSundayEpisodeResult({
	credentials,
	episodeId,
	extras,
}: {
	credentials: PlanningCenterCredentials;
	episodeId: string;
	extras: Record<string, unknown>;
}): Promise<Record<string, unknown>> {
	const response = await planningCenterClient.apiCall<JsonApiEpisodeResponse>({
		credentials,
		method: HttpMethod.GET,
		path: `/publishing/v2/episodes/${episodeId}`,
		queryParams: {
			include: 'episode_resources',
		},
	});

	if (!response.body.data) {
		throw new Error('Episode not found.');
	}

	const included = response.body.included ?? [];
	const episodeResources = planningCenterClient.flattenJsonApiCollection(
		included.filter((resource) => resource.type === 'EpisodeResource'),
	);

	return {
		...planningCenterClient.flattenJsonApiResource(response.body.data),
		episode_resources: episodeResources,
		included,
		...extras,
	};
}

type JsonApiListResponse = {
	data?: Array<{
		type: string;
		id: string;
		attributes?: Record<string, unknown>;
	}>;
};

type EpisodeTimeResource = {
	id: string;
	attributes?: {
		starts_at?: string;
	};
};

type JsonApiEpisodeResponse = {
	data?: {
		type: string;
		id: string;
		attributes?: Record<string, unknown>;
	};
	included?: Array<{
		type: string;
		id: string;
		attributes?: Record<string, unknown>;
	}>;
};