import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseFilters,
  UseGuards,
  Logger,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  AuthContextUser,
  AuthGuard,
  OkResponse,
  PagedResult,
  PageOptionsDto,
  PaginatedResponse,
  RequireAnyRoles,
  Role,
  RolesGuard,
  User,
} from 'src/common';
import { GlobalErrorFilter, ErrorResponse } from 'src/common/errors';
import { IEventBus, InjectEventBus } from 'src/common/event-manager';
import { TweetService } from '../services/tweet.service';
import { CreateTweetDto, UpdateTweetDto } from './dto/tweet.dto';
import { TweetResponseDto } from './dto/tweet-response.dto';
import { TweetViewedEvent } from '../entities/events/tweet.events';

@Controller({
  path: 'tweets',
  version: '1',
})
@UseGuards(AuthGuard, RolesGuard)
@UseFilters(GlobalErrorFilter)
@ApiTags('tweets')
@ErrorResponse({})
export class TweetController {
  private readonly logger = new Logger(TweetController.name);

  constructor(
    private readonly tweetService: TweetService,
    @InjectEventBus() private readonly eventBus: IEventBus,
  ) {}

  @Post()
  @RequireAnyRoles(Role.USER)
  @ApiOperation({
    description: 'Create a new tweet',
    summary: 'Create a tweet',
  })
  @OkResponse(TweetResponseDto)
  async createTweet(
    @Body() createTweetDto: CreateTweetDto,
    @AuthContextUser() user: User,
  ): Promise<TweetResponseDto> {
    const tweet = await this.tweetService.createTweet({
      content: createTweetDto.content,
      images: createTweetDto.images || [],
      userId: user.id,
    });

    return {
      id: tweet.id,
      content: tweet.content,
      images: tweet.images,
      createdAt: tweet.createdAt,
      updatedAt: tweet.updatedAt,
      author: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
      },
    };
  }

  @Get()
  @RequireAnyRoles(Role.USER)
  @ApiOperation({
    description: 'Get tweets by user ID',
    summary: 'Get tweets by user',
  })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @PaginatedResponse(TweetResponseDto)
  async getTweets(
    @Query('userId') userId?: string,
    @Query() pageOptions?: PageOptionsDto,
    @AuthContextUser() user?: User,
  ): Promise<PagedResult<TweetResponseDto>> {
    const targetUserId = userId || user.id;
    const pageSize = pageOptions?.pageSize || 10;
    const pageNumber = pageOptions?.pageNumber || 0;

    const options = {
      limit: pageSize,
      offset: pageSize * pageNumber,
      includeArchived: false,
    };

    const [tweets, count] = await Promise.all([
      this.tweetService.getTweetsByUserId(targetUserId, options),
      this.tweetService.countTweetsByUserId(targetUserId),
    ]);

    const tweetDtos = tweets.map((tweet) => ({
      id: tweet.id,
      content: tweet.content,
      images: tweet.images,
      createdAt: tweet.createdAt,
      updatedAt: tweet.updatedAt,
      author: {
        id: targetUserId,
        firstName: user?.firstName || '', // We should fetch user data from user service for non-current users
        lastName: user?.lastName || '',
        avatar: user?.avatar || '',
      },
    }));

    return new PagedResult(tweetDtos, {
      pageSize: options.limit,
      pageNumber: options.offset / options.limit,
      totalItems: count,
      totalPages: Math.ceil(count / options.limit),
      hasNextPage: options.offset + options.limit < count,
      hasPreviousPage: options.offset > 0,
    });
  }

  @Get(':id')
  @RequireAnyRoles(Role.USER)
  @ApiOperation({
    description: 'Get a tweet by ID',
    summary: 'Get a tweet',
  })
  @ApiParam({ name: 'id', type: String })
  @OkResponse(TweetResponseDto)
  async getTweetById(
    @Param('id') id: string,
    @AuthContextUser() user: User,
  ): Promise<TweetResponseDto> {
    const tweet = await this.tweetService.getTweetById(id);

    // Record the view event - this will be handled by a listener in the recommendation module
    try {
      const viewEvent = new TweetViewedEvent({
        tweetId: tweet.id,
        userId: user.id,
        timestamp: Date.now(),
      });

      await this.eventBus.publish(viewEvent);
    } catch (error) {
      this.logger.error('Failed to publish tweet view event:', error);
    }

    // For this simplified version, we're assuming the author data is available
    // In a real implementation, you would fetch user data from a user service
    return {
      id: tweet.id,
      content: tweet.content,
      images: tweet.images,
      createdAt: tweet.createdAt,
      updatedAt: tweet.updatedAt,
      author: {
        id: tweet.userId,
        firstName: user.id === tweet.userId ? user.firstName : '',
        lastName: user.id === tweet.userId ? user.lastName : '',
        avatar: user.id === tweet.userId ? user.avatar : '',
      },
    };
  }

  @Put(':id')
  @RequireAnyRoles(Role.USER)
  @ApiOperation({
    description: 'Update a tweet',
    summary: 'Update a tweet',
  })
  @ApiParam({ name: 'id', type: String })
  @OkResponse(TweetResponseDto)
  async updateTweet(
    @Param('id') id: string,
    @Body() updateTweetDto: UpdateTweetDto,
    @AuthContextUser() user: User,
  ): Promise<TweetResponseDto> {
    const tweet = await this.tweetService.updateTweet(
      id,
      user.id,
      updateTweetDto,
    );

    return {
      id: tweet.id,
      content: tweet.content,
      images: tweet.images,
      createdAt: tweet.createdAt,
      updatedAt: tweet.updatedAt,
      author: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
      },
    };
  }

  @Delete(':id')
  @RequireAnyRoles(Role.USER)
  @ApiOperation({
    description: 'Delete a tweet',
    summary: 'Delete a tweet',
  })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 204, description: 'Tweet deleted successfully' })
  async deleteTweet(
    @Param('id') id: string,
    @AuthContextUser() user: User,
  ): Promise<void> {
    await this.tweetService.deleteTweet(id, user.id);
  }
}
