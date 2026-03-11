import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ContentType } from '@contentModule/core/enum/content-type.enum';
import { ExternalMovieClient } from '@contentModule/http/rest/client/external-movie-rating/external-movie-rating.client';
import { ContentRepository } from '@contentModule/persistence/repository/content.repository';
import { Content } from '@contentModule/persistence/entity/content.entity';
import { Movie } from '@contentModule/persistence/entity/movie.entity';
import { Video } from '@contentModule/persistence/entity/video.entity';
import { Thumbnail } from '@contentModule/persistence/entity/thumbnail.entity';
import { TvShow } from '@contentModule/persistence/entity/tv-show.entity';
import { Episode } from '@contentModule/persistence/entity/episode.entity';
import { EpisodeRepository } from '@contentModule/persistence/repository/episode.repository';
import { VideoMetadataService } from '@contentModule/core/service/video-metadata.service';
import { VideoProfanityFilterService } from '@contentModule/core/service/video-profanity-filter.service';
import { AgeRecommendationService } from '@contentModule/core/service/age-recommendation.service';
import { CreateEpisodeRequestDto } from '@contentModule/http/rest/dto/request/create-episode-request.dto';

export interface CreateMovieData {
  title: string;
  description: string;
  url: string;
  thumbnailUrl: string;
  sizeInKb: number;
}

@Injectable()
export class ContentManagementService {
  constructor(
    private readonly contentRepository: ContentRepository,
    private readonly externalMovieRatingClient: ExternalMovieClient,
    private readonly episodeRepository: EpisodeRepository,
    private readonly videoMetadataService: VideoMetadataService,
    private readonly videoProfanityFilterService: VideoProfanityFilterService,
    private readonly ageRecommendationService: AgeRecommendationService,
  ) {}

  async createMovie(createMovieData: CreateMovieData): Promise<Content> {
    const externalRating = await this.externalMovieRatingClient.getRating(
      createMovieData.title,
    );
    const contentEntity = new Content({
      title: createMovieData.title,
      description: createMovieData.description,
      type: ContentType.MOVIE,
      movie: new Movie({
        externalRating,
        video: new Video({
          url: createMovieData.url,
          duration: 10,
          sizeInKb: createMovieData.sizeInKb,
        }),
      }),
    });

    if (createMovieData.thumbnailUrl) {
      contentEntity.movie.thumbnail = new Thumbnail({
        url: createMovieData.thumbnailUrl,
      });
    }
    const content = await this.contentRepository.save(contentEntity);

    return content;
  }

  async createTvShow(tvShow: {
    //TODO add userId
    title: string;
    description: string;
    thumbnailUrl?: string;
  }): Promise<Content> {
    const content = new Content({
      title: tvShow.title,
      description: tvShow.description,
      type: ContentType.TV_SHOW,
      tvShow: new TvShow({}),
    });

    if (tvShow.thumbnailUrl && content.tvShow) {
      content.tvShow.thumbnail = new Thumbnail({
        url: tvShow.thumbnailUrl,
      });
    }
    return await this.contentRepository.save(content);
  }

  async createEpisode(
    contentId: string,
    episodeData: CreateEpisodeRequestDto & {
      videoUrl: string;
      videoSizeInKb: number;
    },
  ): Promise<Episode> {
    //Problem: Requires too many repositories
    const content = await this.contentRepository.findOneById(contentId, [
      'tvShow',
    ]);
    if (!content?.tvShow) {
      throw new NotFoundException(
        `TV Show with content id ${contentId} not found`,
      );
    }
    //Domain logic validation
    const episodeWithSameSeasonAndNumber =
      await this.episodeRepository.existsBy({
        season: episodeData.season,
        number: episodeData.number,
        tvShowId: content.tvShow.id,
      });
    if (episodeWithSameSeasonAndNumber) {
      throw new BadRequestException(
        `Episode with season ${episodeData.season} and number ${episodeData.number} already exists`,
      );
    }

    const lastEpisode =
      await this.episodeRepository.findByLastEpisodeByTvShowAndSeason(
        content.tvShow.id,
        episodeData.season,
      );
    if (lastEpisode && lastEpisode.number + 1 !== episodeData.number) {
      throw new BadRequestException(
        `Episode number should be ${lastEpisode.number + 1}`,
      );
    }

    //!Episode cannot be loaded with tvShow because of the number of records
    const episode = new Episode({
      title: episodeData.title,
      description: episodeData.description,
      season: episodeData.season,
      number: episodeData.number,
      tvShow: content.tvShow,
      video: new Video({
        url: episodeData.videoUrl,
        duration: await this.videoMetadataService.getVideoDurantaion(
          episodeData.videoUrl,
        ),
        sizeInKb: episodeData.videoSizeInKb,
      }),
    });

    //assume it's async and will update the video later
    //TODO: implement the video profanity filter save non transactional
    await this.videoProfanityFilterService.filterProfanity(episode.video);

    const ageRecommendation =
      await this.ageRecommendationService.getAgeRecommendationForContent(
        episodeData.videoUrl,
      );

    content.ageRecommendation = ageRecommendation;

    //not transactional
    await this.contentRepository.save(content);
    await this.episodeRepository.save(episode);

    return episode;
  }
}
