import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { CommonsModule } from './commons/commons.module';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { SubCategoriesModule } from './sub-categories/sub-categories.module';
import { MulterModule } from '@nestjs/platform-express';
import { IamModule } from './iam/iam.module';
import { BcryptService } from './iam/hashing/bcrypt.service';
import { CartModule } from './cart/cart.module';
import { OrderModule } from './order/order.module';
import { AddressesModule } from './addresses/addresses.module';
import { VariantModule } from './variant/variant.module';
import { TagModule } from './tag/tag.module';
import { WishlistModule } from './wishlist/wishlist.module';
import { ReviewModule } from './review/review.module';
import { PaymentModule } from './payment/payment.module';
import { LoggerMiddleware } from './commons/middlewares/logger.middleware';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { GraphqlLoggingInterceptor } from './commons/interceptors/graphql-logging.interceptor';
import { formatError } from './commons/error-formatters/grapqhl-error.formatter';
import { LoggerService } from './commons/logger.service';
import { DiscountModule } from './discount/discount.module';
import { BrandModule } from './brand/brand.module';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [CommonsModule],
      useFactory: (logger: LoggerService) => ({
        playground: false,
        formatError: formatError(logger),
        plugins: [ApolloServerPluginLandingPageLocalDefault()],
        sortSchema: true,
        autoSchemaFile: 'schema.gql',
        context: ({ req }) => ({ req }),
      }),
      inject: [LoggerService],
    }),
    CommonsModule,
    ProductsModule,
    CategoriesModule,
    SubCategoriesModule,
    MulterModule.register({
      dest: './upload',
    }),
    IamModule,
    CartModule,
    OrderModule,
    AddressesModule,
    VariantModule,
    TagModule,
    WishlistModule,
    ReviewModule,
    PaymentModule,
    DiscountModule,
    BrandModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    BcryptService,
    {
      provide: APP_INTERCEPTOR,
      useClass: GraphqlLoggingInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): any {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
