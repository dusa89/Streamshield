import { protectionMechanism } from '../protectionMechanism';

describe('ProtectionMechanism', () => {
  beforeEach(() => {
    // Ensure shield is deactivated before each test
    protectionMechanism.deactivate();
  });

  it('should activate the shield', () => {
    expect(protectionMechanism.isShieldActive()).toBe(false);
    protectionMechanism.activate();
    expect(protectionMechanism.isShieldActive()).toBe(true);
  });

  it('should deactivate the shield', () => {
    protectionMechanism.activate();
    expect(protectionMechanism.isShieldActive()).toBe(true);
    protectionMechanism.deactivate();
    expect(protectionMechanism.isShieldActive()).toBe(false);
  });
}); 