import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CommentsModule } from './comments/comments.module';
import {
  authConfig,
  databaseConfig,
  redisConfig,
  storageConfig,
  validateEnvironment,
} from './config';
import { LikesModule } from './likes/likes.module';
import { PostsModule } from './posts/posts.module';
import { PrismaModule } from './prisma/prisma.module';
import { StorageModule } from './storage/storage.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, authConfig, redisConfig, storageConfig],
      envFilePath: '.env',
      validate: validateEnvironment,
    }),
    // Global rate-limit baseline on every route, with tighter per-route
    // overrides on auth endpoints via @Throttle(). In dev, the web app and
    // api share localhost, so every request keys to the same loopback IP —
    // Stories, sidebars, feed, hot-reload re-renders all share one bucket
    // and 60/min trips quickly. Raise the dev limit; prod keeps 60/min.
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000,
        limit: process.env.NODE_ENV === 'production' ? 60 : 1000,
      },
    ]),
    ScheduleModule.forRoot(),
    PrismaModule,
    StorageModule,
    UsersModule,
    AuthModule,
    LikesModule,
    PostsModule,
    CommentsModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
