import { Modal } from 'react-native';

import { ConfirmDialogHost } from '@/components/ui/confirm-dialog';
import { confirmAction, registerConfirmHandler } from '@/lib/confirm';
import { act, cleanup, render, screen } from '@/lib/test-utils';

afterEach(() => {
  cleanup();
  registerConfirmHandler(null);
});

describe('confirm dialog host', () => {
  it('shows title and buttons immediately without a fade animation', () => {
    render(<ConfirmDialogHost />);
    act(() => {
      confirmAction({
        title: 'Discard draft',
        message: 'Discard this draft? This cannot be undone.',
        confirmLabel: 'Discard',
        cancelLabel: 'Keep editing',
        destructive: true,
        onConfirm: () => {},
      });
    });

    const modal = screen.UNSAFE_getByType(Modal) as { props: { animationType?: string } };
    expect(modal.props.animationType).toBe('none');
    expect(screen.getByText('Discard this draft? This cannot be undone.')).toBeOnTheScreen();
    expect(screen.getByTestId('confirm-dialog-confirm')).toBeOnTheScreen();
  });
});
