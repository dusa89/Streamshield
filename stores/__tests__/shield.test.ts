import { useShieldStore } from '../shield';

describe('useShieldStore', () => {
  beforeEach(() => {
    useShieldStore.setState({
      isShieldActive: false,
      shieldActivatedAt: null,
      shieldDuration: 60,
    });
  });

  it('should toggle shield active state', () => {
    expect(useShieldStore.getState().isShieldActive).toBe(false);
    useShieldStore.getState().toggleShield();
    expect(useShieldStore.getState().isShieldActive).toBe(true);
    useShieldStore.getState().toggleShield();
    expect(useShieldStore.getState().isShieldActive).toBe(false);
  });

  it('should set shield duration', () => {
    useShieldStore.getState().setShieldDuration(120);
    expect(useShieldStore.getState().shieldDuration).toBe(120);
  });
}); 