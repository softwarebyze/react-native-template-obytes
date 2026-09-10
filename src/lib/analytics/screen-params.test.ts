import { pickApprovedScreenParams } from './screen-params';

describe('pickApprovedScreenParams', () => {
  it('keeps allowlisted keys and drops unapproved deep-link params', () => {
    expect(pickApprovedScreenParams({
      id: '42',
      token: 'secret',
      code: 'oauth-code',
      email: 'user@example.com',
      url: 'https://example.com/callback?token=secret',
    })).toEqual({ id: '42' });
  });

  it('uses the first string when Expo Router supplies an array', () => {
    expect(pickApprovedScreenParams({ id: ['7', '8'] })).toEqual({ id: '7' });
  });

  it('omits empty or non-string allowlisted values', () => {
    expect(pickApprovedScreenParams({ id: '' })).toEqual({});
    expect(pickApprovedScreenParams({ id: 12 })).toEqual({});
    expect(pickApprovedScreenParams({})).toEqual({});
  });
});
