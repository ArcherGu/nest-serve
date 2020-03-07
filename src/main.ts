import { NestFactory } from '@nestjs/core';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { TransformInterceptor, HttpExceptionFilter, logger } from './common/global';
import { AppModule } from './app.module';
import { address } from 'ip';
import helmet from 'helmet';

const ip = address();
const port = 80;
const prefix = '/api';
let host = `http://${ip}`;
if (port !== 80) host += `${host}:${port}`;

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger, cors: true });

  // 设置与安全相关的 HTTP 头
  app.use(helmet());

  // 接口请求前缀
  app.setGlobalPrefix(prefix);

  // 全局使用验证管道，并统一报错处理
  app.useGlobalPipes(
    new ValidationPipe({
      exceptionFactory: ([error]) => {
        throw new BadRequestException(Object.values(error.constraints)[0]);
      },
    })
  );

  // 响应参数统一格式
  app.useGlobalInterceptors(new TransformInterceptor());

  // 报错过滤器
  app.useGlobalFilters(new HttpExceptionFilter());

  // swagger 接口文档
  const options = new DocumentBuilder()
    .setTitle(`接口文档`)
    .setDescription('code:状态码，message:提示信息，data:返回值')
    .addBearerAuth()
    .addServer(prefix)
    .build();
  const document = SwaggerModule.createDocument(app, options, { ignoreGlobalPrefix: true });
  SwaggerModule.setup('swagger', app, document);

  await app.listen(port);

  logger.log(host, '服务地址');
  logger.log(`${host}/swagger`, '接口文档');
}

bootstrap();
