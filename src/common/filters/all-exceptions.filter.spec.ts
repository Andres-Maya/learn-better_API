import {
  ArgumentsHost,
  BadRequestException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { AllExceptionsFilter, ErrorResponse } from './all-exceptions.filter';

describe('AllExceptionsFilter', () => {
  let reply: jest.Mock;
  let filter: AllExceptionsFilter;
  const host = {
    switchToHttp: () => ({
      getRequest: () => ({}),
      getResponse: () => ({}),
    }),
  } as unknown as ArgumentsHost;

  beforeEach(() => {
    reply = jest.fn();
    const adapterHost = {
      httpAdapter: { reply, getRequestUrl: () => '/grades' },
    } as unknown as HttpAdapterHost;
    filter = new AllExceptionsFilter(adapterHost);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  function sentBody(): ErrorResponse {
    return reply.mock.calls[0][1] as ErrorResponse;
  }

  it('responde los errores http con su código y mensaje', () => {
    filter.catch(new NotFoundException('Nota no encontrada'), host);

    expect(reply.mock.calls[0][2]).toBe(404);
    expect(sentBody()).toMatchObject({
      statusCode: 404,
      error: 'Not Found',
      message: 'Nota no encontrada',
      path: '/grades',
    });
  });

  it('conserva la lista de errores de validación', () => {
    filter.catch(
      new BadRequestException(['score must not be greater than 5']),
      host,
    );

    expect(sentBody().message).toEqual(['score must not be greater than 5']);
  });

  it('oculta el detalle de los errores inesperados', () => {
    filter.catch(new Error('connection refused at 10.0.0.5'), host);

    expect(reply.mock.calls[0][2]).toBe(500);
    expect(sentBody()).toMatchObject({
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'Error interno del servidor',
    });
  });
});
