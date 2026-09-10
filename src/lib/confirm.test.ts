import { confirmAction, registerConfirmHandler } from './confirm';

describe('confirmAction', () => {
  afterEach(() => {
    registerConfirmHandler(null);
  });

  it('uses the registered in-app handler (web-safe)', () => {
    const onConfirm = jest.fn();
    const handler = jest.fn();
    registerConfirmHandler(handler);
    confirmAction({
      title: 'Sign out',
      message: 'Sign out of this device?',
      confirmLabel: 'Sign out',
      destructive: true,
      onConfirm,
    });
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0]![0].title).toBe('Sign out');
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
