import { protectionMechanism } from "../protectionMechanism";

describe("ProtectionMechanism", () => {
  beforeEach(() => {
    protectionMechanism.reset();
  });

  it("should activate the shield", () => {
    expect(protectionMechanism.isShieldActive()).toBe(false);
    protectionMechanism.activate();
    expect(protectionMechanism.isShieldActive()).toBe(true);
  });

  it("should deactivate the shield", () => {
    protectionMechanism.activate();
    expect(protectionMechanism.isShieldActive()).toBe(true);
    protectionMechanism.deactivate();
    expect(protectionMechanism.isShieldActive()).toBe(false);
  });
});
